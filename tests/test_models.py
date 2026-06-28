from unittest.mock import MagicMock, patch
import pytest
from src.config import AbstractiveConfig, ExtractiveConfig, TrainingConfig
from src.models.abstractive import AbstractiveSummarizer, train_abstractive_model
from src.models.extractive import ExtractiveSummarizer

def test_abstractive_summarizer():
    config = AbstractiveConfig()
    summarizer = AbstractiveSummarizer(config=config)
    summary = summarizer.summarize("This is a long news article about something very interesting.")
    assert isinstance(summary, str)
    assert len(summary) > 0
    
    batch = summarizer.summarize_batch(["Text 1", "Text 2"])
    assert len(batch) == 2
    assert all(isinstance(s, str) for s in batch)

def test_extractive_summarizer():
    config = ExtractiveConfig()
    summarizer = ExtractiveSummarizer(config=config)
    
    text = (
        "FastAPI is a modern web framework for Python. It is based on standard Python type hints. "
        "It is extremely fast compared to NodeJS and Go. It has automated docs generation built-in. "
        "We can use it for machine learning model deployments."
    )
    
    summary = summarizer.summarize(text, max_sentences=2)
    assert isinstance(summary, str)
    assert len(summary) > 0
    
    scores = summarizer.summarize_with_scores(text, max_sentences=2)
    assert len(scores) <= 2
    assert all(hasattr(s, 'score') for s in scores)

def test_train_abstractive_model(mock_bbc_dataset):
    from src.dataset import make_raw_dataset, TextColumns
    from src.models.abstractive import train_abstractive_model
    from pathlib import Path
    import tempfile
    
    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)
        config = AbstractiveConfig(checkpoint_dir=tmp_path / "checkpoints")
        training_config = TrainingConfig(
            output_dir=tmp_path / "checkpoints",
            epochs=1,
            batch_size=2,
            eval_batch_size=2,
            save_every_epoch=False
        )
        
        # Prepare datasets
        columns = TextColumns(article="article", summary="summary")
        train_dataset = make_raw_dataset(mock_bbc_dataset, columns)
        val_dataset = make_raw_dataset(mock_bbc_dataset, columns)
        
        result = train_abstractive_model(
            train_dataset=train_dataset,
            validation_dataset=val_dataset,
            config=config,
            training_config=training_config
        )
        
        assert result.best_checkpoint.exists()
        assert len(result.history) == 1
        assert result.history[0].train_loss >= 0
