from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]


@dataclass(slots=True)
class DataConfig:
    dataset_name: str = "gopalkalpande/bbc-news-summary"
    dataset_config: str = ""
    train_split: str = "train"
    validation_split: str = "validation"
    test_split: str = "test"
    sample_size: int | None = None
    use_streaming: bool = True
    validation_ratio: float = 0.1
    max_article_length: int = 1024
    max_summary_length: int = 128


@dataclass(slots=True)
class ExtractiveConfig:
    encoder_name: str = "bert-base-uncased"
    max_sentences: int = 3
    max_sentence_length: int = 128
    position_weight: float = 0.15
    similarity_weight: float = 1.0


@dataclass(slots=True)
class AbstractiveConfig:
    model_name: str = "t5-small"
    checkpoint_dir: Path = field(default_factory=lambda: PROJECT_ROOT / "models" / "abstractive")
    max_input_length: int = 512
    max_target_length: int = 96
    num_beams: int = 4
    min_generation_length: int = 30
    max_generation_length: int = 100
    source_prefix: str = "summarize: "
    length_penalty: float = 2.0
    no_repeat_ngram_size: int = 3
    early_stopping: bool = True


@dataclass(slots=True)
class TrainingConfig:
    output_dir: Path = field(default_factory=lambda: PROJECT_ROOT / "models" / "abstractive")
    batch_size: int = 2
    eval_batch_size: int = 2
    learning_rate: float = 5e-5
    weight_decay: float = 0.01
    epochs: int = 3
    warmup_ratio: float = 0.1
    gradient_clip: float = 1.0
    use_fp16: bool = False
    seed: int = 42
    save_every_epoch: bool = True


@dataclass(slots=True)
class AppConfig:
    data: DataConfig = field(default_factory=DataConfig)
    extractive: ExtractiveConfig = field(default_factory=ExtractiveConfig)
    abstractive: AbstractiveConfig = field(default_factory=AbstractiveConfig)
    training: TrainingConfig = field(default_factory=TrainingConfig)
    output_dir: Path = field(default_factory=lambda: PROJECT_ROOT / "outputs")

    @property
    def extractive_model_dir(self) -> Path:
        return PROJECT_ROOT / "models" / "extractive"

    @property
    def abstractive_model_dir(self) -> Path:
        return self.abstractive.checkpoint_dir


def build_default_config() -> AppConfig:
    return AppConfig()
