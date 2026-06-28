from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable, List, Sequence

import torch
from torch.utils.data import Dataset
from datasets import Dataset as HFDataset
from datasets import load_dataset

from .config import DataConfig
from .preprocessing import clean_text

ARTICLE_COLUMN_CANDIDATES = (
    "article",
    "Articles",
    "text",
    "content",
    "body",
)
SUMMARY_COLUMN_CANDIDATES = (
    "highlights",
    "summary",
    "Summaries",
    "target",
    "abstract",
)


@dataclass(slots=True)
class TextColumns:
    article: str
    summary: str


def infer_text_columns(dataset: Any) -> TextColumns:
    column_names = list(dataset.column_names)
    article_column = next((name for name in ARTICLE_COLUMN_CANDIDATES if name in column_names), None)
    summary_column = next((name for name in SUMMARY_COLUMN_CANDIDATES if name in column_names), None)
    if article_column is None or summary_column is None:
        raise ValueError(
            "Could not infer article/summary columns. Available columns: "
            f"{column_names}"
        )
    return TextColumns(article=article_column, summary=summary_column)


def load_news_dataset(data_config: DataConfig, split: str) -> Any:
    dataset_args: dict[str, Any] = {
        "path": data_config.dataset_name,
        "split": split,
    }
    if data_config.dataset_config:
        dataset_args["name"] = data_config.dataset_config

    if data_config.use_streaming:
        try:
            stream = load_dataset(streaming=True, **dataset_args)
        except Exception as exc:  # pragma: no cover - runtime dependency path
            raise RuntimeError(
                f"Failed to stream dataset '{data_config.dataset_name}' with config '{data_config.dataset_config}'."
            ) from exc

        target_size = data_config.sample_size or 512
        rows = list(stream.take(target_size))
        if not rows:
            raise RuntimeError("Streaming dataset returned no rows.")
        return HFDataset.from_list(rows)

    try:
        dataset = load_dataset(**dataset_args)
    except Exception as exc:  # pragma: no cover - runtime dependency path
        raise RuntimeError(
            f"Failed to load dataset '{data_config.dataset_name}' with config '{data_config.dataset_config}'."
        ) from exc

    if data_config.sample_size is not None:
        sample_size = min(data_config.sample_size, len(dataset))
        dataset = dataset.select(range(sample_size))
    return dataset


def build_train_validation_split(dataset: Any, validation_ratio: float, seed: int = 42) -> tuple[Any, Any]:
    if not 0.0 < validation_ratio < 1.0:
        raise ValueError("validation_ratio must be between 0 and 1.")
    split = dataset.train_test_split(test_size=validation_ratio, seed=seed)
    return split["train"], split["test"]


class RawSummarizationDataset(Dataset):
    def __init__(self, dataset: Any, article_column: str, summary_column: str) -> None:
        self.dataset = dataset
        self.article_column = article_column
        self.summary_column = summary_column

    def __len__(self) -> int:
        return len(self.dataset)

    def __getitem__(self, index: int) -> dict[str, str]:
        row = self.dataset[index]
        article = clean_text(str(row[self.article_column]), lowercase=False)
        summary = clean_text(str(row[self.summary_column]), lowercase=False)
        return {"article": article, "summary": summary}


class SummarizationBatchCollator:
    def __init__(self, tokenizer: Any, max_input_length: int, max_target_length: int, source_prefix: str = "") -> None:
        self.tokenizer = tokenizer
        self.max_input_length = max_input_length
        self.max_target_length = max_target_length
        self.source_prefix = source_prefix

    def __call__(self, examples: Sequence[dict[str, str]]) -> dict[str, torch.Tensor]:
        articles = [f"{self.source_prefix}{example['article']}" for example in examples]
        summaries = [example["summary"] for example in examples]

        model_inputs = self.tokenizer(
            articles,
            max_length=self.max_input_length,
            truncation=True,
            padding=True,
            return_tensors="pt",
        )
        labels = self.tokenizer(
            text_target=summaries,
            max_length=self.max_target_length,
            truncation=True,
            padding=True,
            return_tensors="pt",
        )["input_ids"]
        labels = labels.masked_fill(labels == self.tokenizer.pad_token_id, -100)
        model_inputs["labels"] = labels
        return model_inputs


def prepare_datasets(data_config: DataConfig) -> tuple[Any, Any, TextColumns]:
    raw_dataset = load_news_dataset(data_config, data_config.train_split)
    columns = infer_text_columns(raw_dataset)
    train_dataset, validation_dataset = build_train_validation_split(
        raw_dataset,
        validation_ratio=data_config.validation_ratio,
    )
    return train_dataset, validation_dataset, columns


def make_raw_dataset(dataset: Any, columns: TextColumns) -> RawSummarizationDataset:
    return RawSummarizationDataset(dataset, columns.article, columns.summary)
