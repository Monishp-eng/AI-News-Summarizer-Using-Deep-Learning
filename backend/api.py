from __future__ import annotations

import json
import logging
import os
import re
import sys
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Load environment variables
load_dotenv()

# Configure logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("api")


# Ensure the project root is importable when running from the backend folder.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.config import build_default_config  # noqa: E402
from src.summarize import SummarizationService  # noqa: E402


class SummarizeRequest(BaseModel):
    text: str | None = Field(default=None, description="News article text to summarize")
    texts: list[str] | None = Field(default=None, description="Multiple news article texts to summarize together")
    length: Literal["short", "medium", "long"] = "medium"
    mode: Literal["normal", "bullet"] = "normal"
    tone: Literal["formal", "simple", "beginner"] = "formal"
    compare_all: bool = False
    custom_prompt: str | None = None


class ComparisonSummary(BaseModel):
    summary: str
    original_words: int
    summary_words: int
    compression: float


class SummarizeResponse(BaseModel):
    summary: str
    mode: Literal["normal", "bullet"]
    length: Literal["short", "medium", "long"]
    tone: Literal["formal", "simple", "beginner"]
    num_articles: int
    original_words: int
    summary_words: int
    compression: float
    comparison: dict[str, ComparisonSummary] | None = None


class MetricsResponse(BaseModel):
    rouge1: float
    rouge2: float
    rougeL: float


def _split_sentences(text: str) -> list[str]:
    chunks = re.split(r"(?<=[.!?])\s+", text.strip())
    return [chunk.strip() for chunk in chunks if chunk.strip()]


def _strip_prompt_echo(text: str) -> str:
    cleaned_lines: list[str] = []
    for raw_line in text.splitlines() or [text]:
        line = raw_line.strip()
        # Remove common instruction prefixes if the model copies them into output.
        line = re.sub(r"^(summarize[^:]{0,80}:\s*)", "", line, flags=re.IGNORECASE)
        line = re.sub(r"^(explain the news like to a beginner:\s*)", "", line, flags=re.IGNORECASE)
        line = re.sub(r"^(summarize in (a )?formal and professional tone:\s*)", "", line, flags=re.IGNORECASE)
        line = re.sub(r"^(summarize in simple and easy language:\s*)", "", line, flags=re.IGNORECASE)
        if line:
            cleaned_lines.append(line)

    if not cleaned_lines:
        return text.strip()
    return "\n".join(cleaned_lines)


def _enforce_bullets(text: str, max_items: int = 3) -> str:
    # Respect existing bullets if the model already produced them.
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    existing_bullets = [line for line in lines if line.startswith(("-", "*", "•"))]
    if existing_bullets:
        return "\n".join(existing_bullets[:max_items])

    sentences = _split_sentences(text)
    if not sentences:
        return text

    bullet_lines = [f"- {sentence}" for sentence in sentences[:max_items]]
    return "\n".join(bullet_lines)


LENGTH_PROMPTS = {
    "short": "summarize in 2 sentences: ",
    "medium": "summarize: ",
    "long": "summarize in detail: ",
}

LENGTH_MAX_TOKENS = {
    "short": 60,
    "medium": 100,
    "long": 150,
}

BULLET_PROMPT = "Summarize into 5 bullet points: "
MULTI_ARTICLE_PROMPT = "Summarize the following combined news articles into one coherent summary: "
TONE_PROMPTS = {
    "formal": "Summarize in a formal and professional tone: ",
    "simple": "Summarize in simple and easy language: ",
    "beginner": "Explain the news like to a beginner: ",
}
METRICS_PATH = PROJECT_ROOT / "outputs" / "metrics.json"


def _normalize_input_texts(payload: SummarizeRequest) -> tuple[str, int]:
    candidate_texts: list[str] = []
    if payload.texts:
        candidate_texts.extend(payload.texts)
    if payload.text:
        candidate_texts.append(payload.text)

    cleaned = [value.strip() for value in candidate_texts if isinstance(value, str) and value.strip()]
    if not cleaned:
        raise HTTPException(status_code=400, detail="Input text cannot be empty.")

    return " ".join(cleaned), len(cleaned)


def _build_prompt(
    text: str,
    length: Literal["short", "medium", "long"],
    mode: Literal["normal", "bullet"],
    tone: Literal["formal", "simple", "beginner"],
    num_articles: int,
) -> str:
    if num_articles > 1:
        task_prompt = f"{MULTI_ARTICLE_PROMPT}{text}"
    elif mode == "bullet":
        task_prompt = f"{BULLET_PROMPT}{text}"
    else:
        task_prompt = f"{LENGTH_PROMPTS[length]}{text}"

    tone_prefix = TONE_PROMPTS[tone]
    return f"{tone_prefix}{task_prompt}"


def _generate_summary(
    service: SummarizationService,
    text: str,
    length: Literal["short", "medium", "long"],
    mode: Literal["normal", "bullet"],
    tone: Literal["formal", "simple", "beginner"],
    num_articles: int,
    custom_prompt: str | None = None,
) -> str:
    custom = (custom_prompt or "").strip()
    prompted_text = (
        f"{custom}: {text}"
        if custom
        else _build_prompt(text=text, length=length, mode=mode, tone=tone, num_articles=num_articles)
    )
    summary = service.abstractive.summarize(prompted_text, max_length=LENGTH_MAX_TOKENS[length]).strip()
    summary = _strip_prompt_echo(summary)
    if mode == "bullet":
        summary = _enforce_bullets(summary, max_items=5)
    return summary


def _word_count(text: str) -> int:
    stripped = text.strip()
    if not stripped:
        return 0
    return len(stripped.split())


def _compression_percent(original_words: int, summary_words: int) -> float:
    if original_words <= 0:
        return 0.0
    value = ((original_words - summary_words) / original_words) * 100
    return round(max(0.0, value), 2)


app = FastAPI(title="AI News Summarizer API", version="1.0.0")

allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
if allowed_origins_str:
    origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]
else:
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://(localhost|127\\.0\\.0\\.1)(:\\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def load_summarizer() -> None:
    config = build_default_config()
    best_checkpoint = config.abstractive_model_dir / "best"
    default_model = os.getenv("DEFAULT_MODEL_NAME", "t5-small")

    checkpoint_path = None
    if best_checkpoint.exists():
        checkpoint_path = best_checkpoint
        logger.info(f"Loading best checkpoint from: {checkpoint_path}")
    else:
        from utils.checkpoints import latest_checkpoint
        latest = latest_checkpoint(config.abstractive_model_dir)
        if latest:
            checkpoint_path = latest
            logger.info(f"Best checkpoint not found. Loading latest epoch checkpoint: {checkpoint_path}")
        else:
            checkpoint_path = default_model
            logger.warning(
                f"No trained checkpoints found under '{config.abstractive_model_dir}'. "
                f"Falling back to base pre-trained model: '{default_model}'"
            )

    try:
        app.state.summarizer = SummarizationService(config=config, checkpoint_path=checkpoint_path)
        logger.info("Summarization service initialized successfully.")
    except Exception as exc:
        logger.error(f"Failed to load summarizer: {exc}")
        raise RuntimeError(f"Failed to initialize summarization model: {exc}") from exc


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/metrics", response_model=MetricsResponse)
def metrics() -> MetricsResponse:
    if not METRICS_PATH.exists():
        raise HTTPException(status_code=404, detail=f"Metrics file not found at {METRICS_PATH}")

    data = json.loads(METRICS_PATH.read_text(encoding="utf-8"))
    average = data.get("abstractive", {}).get("average", {})

    try:
        rouge1 = float(average["rouge1"])
        rouge2 = float(average["rouge2"])
        rouge_l = float(average["rougeL"])
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=500, detail="Invalid metrics format in outputs/metrics.json") from exc

    return MetricsResponse(rouge1=rouge1, rouge2=rouge2, rougeL=rouge_l)


@app.post("/summarize", response_model=SummarizeResponse)
def summarize(payload: SummarizeRequest) -> SummarizeResponse:
    text, num_articles = _normalize_input_texts(payload)

    max_input_chars = int(os.getenv("MAX_INPUT_CHARS", "10000"))
    if len(text) > max_input_chars:
        logger.warning(f"Input text length ({len(text)}) exceeds maximum character limit of {max_input_chars}.")
        raise HTTPException(
            status_code=400,
            detail=f"Input text exceeds the maximum character limit of {max_input_chars}."
        )

    service: SummarizationService = app.state.summarizer
    requested_length: Literal["short", "medium", "long"] = payload.length or "medium"
    requested_mode: Literal["normal", "bullet"] = payload.mode or "normal"
    requested_tone: Literal["formal", "simple", "beginner"] = payload.tone or "formal"

    summary = _generate_summary(
        service=service,
        text=text,
        length=requested_length,
        mode=requested_mode,
        tone=requested_tone,
        num_articles=num_articles,
        custom_prompt=payload.custom_prompt,
    )

    if not summary:
        raise HTTPException(status_code=500, detail="Failed to generate summary.")

    original_words = _word_count(text)
    summary_words = _word_count(summary)
    compression = _compression_percent(original_words=original_words, summary_words=summary_words)

    comparison: dict[str, ComparisonSummary] | None = None
    if payload.compare_all:
        comparison = {}
        for length in ("short", "medium", "long"):
            current_length = length  # type: ignore[assignment]
            generated = _generate_summary(
                service=service,
                text=text,
                length=current_length,
                mode=requested_mode,
                tone=requested_tone,
                num_articles=num_articles,
                custom_prompt=payload.custom_prompt,
            )
            if not generated:
                raise HTTPException(status_code=500, detail=f"Failed to generate {length} comparison summary.")
            generated_words = _word_count(generated)
            comparison[length] = ComparisonSummary(
                summary=generated,
                original_words=original_words,
                summary_words=generated_words,
                compression=_compression_percent(original_words=original_words, summary_words=generated_words),
            )

    return SummarizeResponse(
        summary=summary,
        mode=requested_mode,
        length=requested_length,
        tone=requested_tone,
        num_articles=num_articles,
        original_words=original_words,
        summary_words=summary_words,
        compression=compression,
        comparison=comparison,
    )
