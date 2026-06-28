from __future__ import annotations

from collections import defaultdict
from typing import Iterable, Sequence

from rouge_score import rouge_scorer


def compute_rouge_scores(predictions: Sequence[str], references: Sequence[str]) -> dict[str, float]:
    if len(predictions) != len(references):
        raise ValueError("predictions and references must have the same length.")

    scorer = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)
    aggregated = defaultdict(list)

    for prediction, reference in zip(predictions, references):
        scores = scorer.score(reference, prediction)
        aggregated["rouge1"].append(scores["rouge1"].fmeasure)
        aggregated["rouge2"].append(scores["rouge2"].fmeasure)
        aggregated["rougeL"].append(scores["rougeL"].fmeasure)

    return {
        metric: (sum(values) / len(values) if values else 0.0)
        for metric, values in aggregated.items()
    }


def format_rouge_scores(scores: dict[str, float]) -> str:
    return " | ".join(
        f"{metric.upper()}: {value:.4f}" for metric, value in sorted(scores.items())
    )
