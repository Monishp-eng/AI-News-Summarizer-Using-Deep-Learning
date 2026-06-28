from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List

import torch
from torch.optim import AdamW
from torch.utils.data import DataLoader
from tqdm.auto import tqdm
from transformers import (
    AutoModelForSeq2SeqLM,
    AutoTokenizer,
    get_linear_schedule_with_warmup,
)

from ..config import AbstractiveConfig, TrainingConfig
from ..preprocessing import clean_text
from ..dataset import SummarizationBatchCollator
from utils.checkpoints import ensure_directory, save_json


@dataclass(slots=True)
class TrainingHistoryItem:
    epoch: int
    train_loss: float
    validation_loss: float


@dataclass(slots=True)
class TrainingResult:
    best_checkpoint: Path
    history: list[TrainingHistoryItem]


class AbstractiveSummarizer:
    def __init__(
        self,
        config: AbstractiveConfig | None = None,
        checkpoint_path: str | Path | None = None,
        device: str | None = None,
    ) -> None:
        self.config = config or AbstractiveConfig()
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))
        model_source = str(checkpoint_path or self.config.model_name)
        self.tokenizer = AutoTokenizer.from_pretrained(model_source)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(model_source).to(self.device)
        self.model.eval()

    @torch.no_grad()
    def summarize(
        self,
        text: str,
        max_length: int | None = None,
        min_length: int | None = None,
        num_beams: int | None = None,
        length_penalty: float | None = None,
        early_stopping: bool | None = None,
    ) -> str:
        cleaned = clean_text(text, lowercase=False)
        prefixed_input = f"{self.config.source_prefix}{cleaned}" if self.config.source_prefix else cleaned
        inputs = self.tokenizer(
            prefixed_input,
            max_length=self.config.max_input_length,
            truncation=True,
            return_tensors="pt",
        ).to(self.device)

        # Beam search explores multiple candidate sequences before choosing the best summary.
        generated = self.model.generate(
            **inputs,
            num_beams=num_beams or self.config.num_beams,
            min_length=min_length or self.config.min_generation_length,
            max_length=max_length or self.config.max_generation_length,
            length_penalty=length_penalty if length_penalty is not None else self.config.length_penalty,
            no_repeat_ngram_size=self.config.no_repeat_ngram_size,
            early_stopping=self.config.early_stopping if early_stopping is None else early_stopping,
        )
        return self.tokenizer.decode(generated[0], skip_special_tokens=True).strip()

    @torch.no_grad()
    def summarize_batch(self, texts: List[str], **generation_kwargs: Any) -> List[str]:
        return [self.summarize(text, **generation_kwargs) for text in texts]


def _move_batch_to_device(batch: Dict[str, torch.Tensor], device: torch.device) -> Dict[str, torch.Tensor]:
    return {key: value.to(device) for key, value in batch.items() if torch.is_tensor(value)}


def _evaluate_loss(model: AutoModelForSeq2SeqLM, data_loader: DataLoader, device: torch.device) -> float:
    model.eval()
    total_loss = 0.0
    total_batches = 0
    with torch.no_grad():
        for batch in data_loader:
            inputs = _move_batch_to_device(batch, device)
            outputs = model(**inputs)
            total_loss += float(outputs.loss.item())
            total_batches += 1
    if total_batches == 0:
        return 0.0
    return total_loss / total_batches


def train_abstractive_model(
    train_dataset: Any,
    validation_dataset: Any,
    config: AbstractiveConfig,
    training_config: TrainingConfig,
) -> TrainingResult:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    ensure_directory(config.checkpoint_dir)

    tokenizer = AutoTokenizer.from_pretrained(config.model_name)
    model = AutoModelForSeq2SeqLM.from_pretrained(config.model_name).to(device)
    collator = SummarizationBatchCollator(
        tokenizer=tokenizer,
        max_input_length=config.max_input_length,
        max_target_length=config.max_target_length,
        source_prefix=config.source_prefix,
    )
    train_loader = DataLoader(
        train_dataset,
        batch_size=training_config.batch_size,
        shuffle=True,
        collate_fn=collator,
    )
    validation_loader = DataLoader(
        validation_dataset,
        batch_size=training_config.eval_batch_size,
        shuffle=False,
        collate_fn=collator,
    )

    optimizer = AdamW(model.parameters(), lr=training_config.learning_rate, weight_decay=training_config.weight_decay)
    total_training_steps = max(len(train_loader) * training_config.epochs, 1)
    warmup_steps = int(total_training_steps * training_config.warmup_ratio)
    scheduler = get_linear_schedule_with_warmup(
        optimizer=optimizer,
        num_warmup_steps=warmup_steps,
        num_training_steps=total_training_steps,
    )

    history: list[TrainingHistoryItem] = []
    best_validation_loss = float("inf")
    best_checkpoint = config.checkpoint_dir / "best"
    ensure_directory(best_checkpoint)

    for epoch in range(1, training_config.epochs + 1):
        model.train()
        total_train_loss = 0.0
        total_train_batches = 0

        progress_bar = tqdm(train_loader, desc=f"Epoch {epoch}/{training_config.epochs}", leave=False)
        for batch in progress_bar:
            batch = _move_batch_to_device(batch, device)
            outputs = model(**batch)
            loss = outputs.loss
            # Seq2seq training minimizes token-level cross-entropy between predicted and reference summary tokens.
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), training_config.gradient_clip)
            optimizer.step()
            scheduler.step()
            optimizer.zero_grad(set_to_none=True)

            total_train_loss += float(loss.item())
            total_train_batches += 1
            progress_bar.set_postfix(loss=f"{loss.item():.4f}")

        average_train_loss = total_train_loss / max(total_train_batches, 1)
        validation_loss = _evaluate_loss(model, validation_loader, device)
        history.append(
            TrainingHistoryItem(
                epoch=epoch,
                train_loss=average_train_loss,
                validation_loss=validation_loss,
            )
        )

        epoch_dir = config.checkpoint_dir / f"epoch_{epoch}"
        if training_config.save_every_epoch:
            ensure_directory(epoch_dir)
            model.save_pretrained(epoch_dir)
            tokenizer.save_pretrained(epoch_dir)
            save_json(epoch_dir / "training_metrics.json", asdict(history[-1]))

        if validation_loss <= best_validation_loss:
            best_validation_loss = validation_loss
            ensure_directory(best_checkpoint)
            model.save_pretrained(best_checkpoint)
            tokenizer.save_pretrained(best_checkpoint)
            save_json(
                best_checkpoint / "training_history.json",
                [asdict(item) for item in history],
            )

    save_json(
        config.checkpoint_dir / "training_summary.json",
        {
            "best_checkpoint": str(best_checkpoint),
            "history": [asdict(item) for item in history],
            "best_validation_loss": best_validation_loss,
        },
    )
    return TrainingResult(best_checkpoint=best_checkpoint, history=history)
