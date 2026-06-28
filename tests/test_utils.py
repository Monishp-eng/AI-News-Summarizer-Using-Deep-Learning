from pathlib import Path
import pytest
from unittest.mock import MagicMock, patch
from utils.checkpoints import ensure_directory, save_json, load_json, latest_checkpoint
from utils.url_scraper import scrape_news_article
from utils.metrics import compute_rouge_scores

def test_json_checkpoints(tmp_path):
    subdir = tmp_path / "sub"
    ensure_directory(subdir)
    assert subdir.exists()
    
    file_path = subdir / "data.json"
    payload = {"test": 123}
    save_json(file_path, payload)
    assert file_path.exists()
    
    loaded = load_json(file_path)
    assert loaded == payload

def test_latest_checkpoint(tmp_path):
    assert latest_checkpoint(tmp_path) is None
    
    # Create best directory
    best_dir = tmp_path / "best"
    best_dir.mkdir()
    assert latest_checkpoint(tmp_path) == best_dir
    
    # Remove best, add epoch directories
    best_dir.rmdir()
    epoch1 = tmp_path / "epoch_1"
    epoch2 = tmp_path / "epoch_2"
    epoch1.mkdir()
    epoch2.mkdir()
    assert latest_checkpoint(tmp_path) == epoch2

@patch("requests.get")
def test_scrape_news_article(mock_get):
    mock_response = MagicMock()
    mock_response.text = "<html><head><title>Mock Title</title></head><body><p>This is a long news paragraph that has more than forty characters inside it.</p></body></html>"
    mock_response.status_code = 200
    mock_get.return_value = mock_response
    
    result = scrape_news_article("https://example.com/test-article")
    assert result.title == "Mock Title"
    assert "long news paragraph" in result.text
    assert result.url == "https://example.com/test-article"

def test_compute_rouge_scores():
    preds = ["This is a test summary."]
    refs = ["This is a test summary."]
    scores = compute_rouge_scores(preds, refs)
    assert scores["rouge1"] == 1.0
    assert scores["rouge2"] == 1.0
    assert scores["rougeL"] == 1.0
