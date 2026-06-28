# AI News Summarizer

Final academic and product-style AI news summarization system with a FastAPI backend, a React + Tailwind frontend, and a T5-based abstractive summarizer.

## Overview
This project turns long news articles into concise summaries and supports multiple demo-friendly capabilities:

- Single-article and multi-article summarization
- Tone-based summarization: Formal, Simple, Beginner-friendly
- Summary mode selection: Normal or Bullet Points
- Comparison mode for Short, Medium, and Long summaries
- Typing animation in the UI
- Compression ratio display and metrics dashboard
- Multi-input support: Text, URL, and File

The model is loaded once at backend startup and reused for all requests.

## Architecture

```text
React + Tailwind UI  ->  FastAPI backend  ->  T5 abstractive summarizer
            |                        |
            |                        +--> /metrics from outputs/metrics.json
            +--> multi-input forms, comparison view, typing effect, dashboard
```

## Key Features

### Backend
- `POST /summarize`
   - Accepts `text` or `texts[]`
   - Supports `length`, `mode`, `tone`, and `compare_all`
   - Returns summary text, article count, word counts, compression, and optional comparison summaries
- `GET /metrics`
   - Serves ROUGE-1, ROUGE-2, and ROUGE-L from `outputs/metrics.json`
- `GET /health`
   - Simple uptime check

### Frontend
- Multi-article input with Add Article and bulk paste helper
- URL and file ingestion
- Tone selector
- Summary mode selector
- Compare All Lengths toggle
- Typing animation after generation
- Compression info card and per-comparison compression metrics
- Dark theme presentation layout


## Dataset and Model
- Default dataset: `gopalkalpande/bbc-news-summary`
- Abstractive model: T5 (`t5-small` used in the demo setup)
- Extractive summarizer: BERT-based sentence scoring
- Evaluation: ROUGE-1, ROUGE-2, ROUGE-L

## Project Structure

```text
project/
│── backend/
│   └── api.py
│── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
│── data/
│── models/
│   ├── abstractive/
│   └── extractive/
│── outputs/
│── src/
│   ├── dataset.py
│   ├── train.py
│   ├── evaluate.py
│   ├── summarize.py
│   ├── config.py
│   └── models/
│       ├── abstractive.py
│       └── extractive.py
│── config.py
│── main.py
│── requirements.txt
│── README.md
│── REPORT_CONTENT.md
```

## Installation

### Backend dependencies
```bash
python -m pip install -r requirements.txt
```

### Frontend dependencies
```bash
cd frontend
npm install
```

### Optional NLTK resources
```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

## Running the App

### 1. Start the backend
From the project root:

```bash
python -m uvicorn backend.api:app --host 127.0.0.1 --port 8000
```

If you are on Windows and using the local virtual environment:

```bash
.venv\Scripts\python.exe -m uvicorn backend.api:app --host 127.0.0.1 --port 8000
```

Backend docs:
- `http://127.0.0.1:8000/docs`

### 2. Start the frontend
In a second terminal:

```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Frontend app:
- `http://127.0.0.1:5173/`

## Training

Default training:
```bash
python main.py train --epochs 3 --batch-size 2 --sample-size 256
```

Custom training example:
```bash
python main.py train --epochs 1 --batch-size 1 --sample-size 16 --dataset-name gopalkalpande/bbc-news-summary --model-name t5-small
```

## CLI Inference

Single article:
```bash
python main.py summarize --text "Your news article..." --mode abstractive --output-file outputs/results.txt
```

URL article:
```bash
python main.py summarize --url "https://example.com/news" --mode both --output-file outputs/results.txt
```

Batch file input:
```bash
python main.py summarize --input-file data/batch_inputs.txt --mode abstractive --output-file outputs/results.txt
```

## Evaluation

Abstractive evaluation:
```bash
python main.py evaluate --max-samples 20
```

With extractive comparison:
```bash
python main.py evaluate --max-samples 20 --include-extractive
```

## API Response Summary

`POST /summarize` returns data like:

```json
{
   "summary": "...",
   "mode": "normal",
   "length": "medium",
   "tone": "formal",
   "num_articles": 2,
   "original_words": 500,
   "summary_words": 80,
   "compression": 84.0,
   "comparison": {
      "short": {
         "summary": "...",
         "original_words": 500,
         "summary_words": 60,
         "compression": 88.0
      },
      "medium": {
         "summary": "...",
         "original_words": 500,
         "summary_words": 80,
         "compression": 84.0
      },
      "long": {
         "summary": "...",
         "original_words": 500,
         "summary_words": 120,
         "compression": 76.0
      }
   }
}
```

## Production Grade Features

### 1. Environment Configurations
The application supports standard environment variables to decouple configuration from code.
- **Backend Env Variables** (see [`.env.example`](file:///c:/Users/Monish%20P/Downloads/AI%20Doc%20Analyzer/.env.example)):
  - `PORT`: Server port (default: 8000).
  - `HOST`: Server host (default: 127.0.0.1).
  - `LOG_LEVEL`: Level of logging (DEBUG, INFO, WARNING, ERROR) (default: INFO).
  - `ALLOWED_ORIGINS`: Comma-separated CORS allowed origins.
  - `DEFAULT_MODEL_NAME`: Model name to fallback on if no trained checkpoints exist (default: t5-small).
  - `MAX_INPUT_CHARS`: Maximum text length limit (default: 10000).
- **Frontend Env Variables** (see [`frontend/.env.example`](file:///c:/Users/Monish%20P/Downloads/AI%20Doc%20Analyzer/frontend/.env.example)):
  - `VITE_API_URL`: Backend endpoint URL (default: http://localhost:8000/summarize).

### 2. Startup Fallbacks & Safety
If no custom checkpoints are found under `models/abstractive/best` during startup, the application logs a warning and automatically falls back to downloading/initializing the base pre-trained model (e.g. `t5-small`), rather than crashing. Max input length limits are enforced to protect server hardware from OOM crashes.

### 3. Testing
A comprehensive test suite of 24 unit and integration tests is located in the [`tests/`](file:///c:/Users/Monish%20P/Downloads/AI%20Doc%20Analyzer/tests) folder. It uses `pytest` and mocks heavy Hugging Face models for fast, offline, and reliable execution.
Run the tests with:
```bash
pytest -v
```

### 4. Dockerization & Orchestration
Run the complete application (backend + frontend) using Docker:
```bash
docker compose up --build
```
- **Backend API**: available at `http://localhost:8000/docs`
- **React Frontend**: available at `http://localhost:3000/`

## Output Artifacts

- `outputs/results.txt`
   - Formatted inputs and generated summaries
- `outputs/metrics.json`
   - ROUGE averages and sample-level evaluation data

## Notes

- The backend loads the summarization model once at startup.
- The frontend uses a dark presentation theme with responsive cards and smooth spacing.
- The project is suitable for final academic submission and live demo presentation.

## Report

The expanded project write-up is available in `REPORT_CONTENT.md`.
