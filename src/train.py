from __future__ import annotations

from pathlib import Path
from typing import Any

from .config import AppConfig, build_default_config
from .dataset import make_raw_dataset, prepare_datasets
from .models.abstractive import TrainingResult, train_abstractive_model
from utils.checkpoints import ensure_directory


def train_abstractive_pipeline(config: AppConfig | None = None) -> TrainingResult:
    config = config or build_default_config()
    ensure_directory(config.abstractive.checkpoint_dir)
    train_split, validation_split, columns = prepare_datasets(config.data)
    train_dataset = make_raw_dataset(train_split, columns)
    validation_dataset = make_raw_dataset(validation_split, columns)
    return train_abstractive_model(
        train_dataset=train_dataset,
        validation_dataset=validation_dataset,
        config=config.abstractive,
        training_config=config.training,
    )
