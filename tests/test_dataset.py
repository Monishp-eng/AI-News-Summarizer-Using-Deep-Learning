from unittest.mock import MagicMock
import pytest
import torch
from src.dataset import (
    infer_text_columns,
    RawSummarizationDataset,
    SummarizationBatchCollator,
)

def test_infer_text_columns():
    dataset = MagicMock()
    dataset.column_names = ["article", "summary", "id"]
    cols = infer_text_columns(dataset)
    assert cols.article == "article"
    assert cols.summary == "summary"

    dataset.column_names = ["body", "highlights"]
    cols2 = infer_text_columns(dataset)
    assert cols2.article == "body"
    assert cols2.summary == "highlights"

    # Edge case: unavailable columns
    dataset.column_names = ["wrong1", "wrong2"]
    with pytest.raises(ValueError):
        infer_text_columns(dataset)

def test_raw_summarization_dataset():
    raw_data = [
        {"article": "This is article 1", "summary": "Summary 1"},
        {"article": "This is article 2", "summary": "Summary 2"},
    ]
    dataset = RawSummarizationDataset(raw_data, article_column="article", summary_column="summary")
    assert len(dataset) == 2
    item = dataset[0]
    assert item["article"] == "This is article 1"
    assert item["summary"] == "Summary 1"

def test_batch_collator():
    from tests.conftest import MockTokenizer
    tokenizer = MockTokenizer()
    collator = SummarizationBatchCollator(
        tokenizer=tokenizer,
        max_input_length=128,
        max_target_length=64,
        source_prefix="summarize: ",
    )
    
    examples = [
        {"article": "Article text 1", "summary": "Summary text 1"},
        {"article": "Article text 2", "summary": "Summary text 2"},
    ]
    
    batch = collator(examples)
    assert "input_ids" in batch
    assert "attention_mask" in batch
    assert "labels" in batch
    assert batch["input_ids"].shape[0] == 2
    assert batch["labels"].shape[0] == 2
