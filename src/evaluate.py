from __future__ import annotations

from pathlib import Path
from typing import Any, Iterable

from .config import AppConfig, build_default_config
from .dataset import make_raw_dataset, prepare_datasets
from .models.abstractive import AbstractiveSummarizer
from .models.extractive import ExtractiveSummarizer
from utils.checkpoints import ensure_directory, save_json
from utils.metrics import compute_rouge_scores


def evaluate_sample_summaries(
    articles: Iterable[str],
    references: Iterable[str],
    abstractive_summarizer: AbstractiveSummarizer,
    extractive_summarizer: ExtractiveSummarizer | None = None,
    max_sentences: int = 3,
) -> dict[str, Any]:
    article_list = list(articles)
    reference_list = list(references)
    abstractive_predictions = [abstractive_summarizer.summarize(article) for article in article_list]
    abstractive_scores = compute_rouge_scores(abstractive_predictions, reference_list)

    report: dict[str, Any] = {
        "abstractive": {
            "average": abstractive_scores,
        },
        "samples": [
            {
                "article": article,
                "reference": reference,
                "generated_summary": abstractive,
            }
            for article, reference, abstractive in zip(
                article_list,
                reference_list,
                abstractive_predictions,
            )
        ],
    }

    if extractive_summarizer is not None:
        extractive_predictions = [
            extractive_summarizer.summarize(article, max_sentences=max_sentences)
            for article in article_list
        ]
        extractive_scores = compute_rouge_scores(extractive_predictions, reference_list)
        report["extractive"] = {
            "average": extractive_scores,
        }
        report["comparisons"] = [
            {
                "article": article,
                "reference": reference,
                "extractive_summary": extractive,
                "abstractive_summary": abstractive,
            }
            for article, reference, extractive, abstractive in zip(
                article_list,
                reference_list,
                extractive_predictions,
                abstractive_predictions,
            )
        ]

    return report


def evaluate_pipeline(
    config: AppConfig | None = None,
    max_samples: int = 20,
    include_extractive: bool = False,
    checkpoint_path: str | Path | None = None,
) -> dict[str, Any]:
    config = config or build_default_config()
    train_split, validation_split, columns = prepare_datasets(config.data)
    validation_dataset = make_raw_dataset(validation_split, columns)

    extractive_summarizer = ExtractiveSummarizer(config.extractive) if include_extractive else None
    if checkpoint_path is not None:
        abstractive_checkpoint: str | Path | None = checkpoint_path
    else:
        best_checkpoint = config.abstractive_model_dir / "best"
        abstractive_checkpoint = best_checkpoint if best_checkpoint.exists() else None
    abstractive_summarizer = AbstractiveSummarizer(
        config=config.abstractive,
        checkpoint_path=abstractive_checkpoint,
    )

    articles = []
    references = []
    for index in range(min(max_samples, len(validation_dataset))):
        sample = validation_dataset[index]
        articles.append(sample["article"])
        references.append(sample["summary"])

    results = evaluate_sample_summaries(
        articles=articles,
        references=references,
        abstractive_summarizer=abstractive_summarizer,
        extractive_summarizer=extractive_summarizer,
        max_sentences=config.extractive.max_sentences,
    )

    output_dir = ensure_directory(config.output_dir)
    save_json(output_dir / "metrics.json", results)
    return results
