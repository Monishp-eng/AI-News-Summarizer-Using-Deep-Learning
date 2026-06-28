import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from backend.api import app, METRICS_PATH

def test_health():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

def test_metrics():
    # Setup a dummy metrics file
    METRICS_PATH.parent.mkdir(parents=True, exist_ok=True)
    dummy_data = {
        "abstractive": {
            "average": {
                "rouge1": 0.45,
                "rouge2": 0.22,
                "rougeL": 0.38
            }
        }
    }
    
    METRICS_PATH.write_text(json.dumps(dummy_data), encoding="utf-8")
    
    try:
        with TestClient(app) as client:
            response = client.get("/metrics")
            assert response.status_code == 200
            data = response.json()
            assert data["rouge1"] == 0.45
            assert data["rouge2"] == 0.22
            assert data["rougeL"] == 0.38
    finally:
        # Clean up
        if METRICS_PATH.exists():
            METRICS_PATH.unlink()

def test_summarize_success():
    with TestClient(app) as client:
        payload = {
            "text": "This is a long news article text that needs to be summarized by our T5 model.",
            "length": "medium",
            "mode": "normal",
            "tone": "formal",
            "compare_all": False
        }
        response = client.post("/summarize", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert data["original_words"] > 0
        assert data["summary_words"] > 0
        assert "compression" in data

def test_summarize_compare_all():
    with TestClient(app) as client:
        payload = {
            "text": "This is a long news article text that needs to be summarized by our T5 model.",
            "length": "medium",
            "mode": "normal",
            "tone": "formal",
            "compare_all": True
        }
        response = client.post("/summarize", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "comparison" in data
        assert "short" in data["comparison"]
        assert "medium" in data["comparison"]
        assert "long" in data["comparison"]

def test_summarize_bullet_points():
    with TestClient(app) as client:
        payload = {
            "text": "This is a sentence. This is another sentence. This is a third sentence.",
            "length": "medium",
            "mode": "bullet",
            "tone": "simple",
            "compare_all": False
        }
        response = client.post("/summarize", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "-" in data["summary"]

def test_summarize_empty_input():
    with TestClient(app) as client:
        payload = {
            "text": "",
            "texts": []
        }
        response = client.post("/summarize", json=payload)
        assert response.status_code == 400

def test_summarize_too_long_input():
    with TestClient(app) as client:
        # Exceeds default limit of 10000 chars
        payload = {
            "text": "A" * 10001
        }
        response = client.post("/summarize", json=payload)
        assert response.status_code == 400
        assert "limit" in response.json()["detail"].lower()
