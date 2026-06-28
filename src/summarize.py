from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any, Iterable

from .config import AppConfig, build_default_config
from .models.abstractive import AbstractiveSummarizer
from .models.extractive import ExtractiveSummarizer
from .preprocessing import clean_text
from utils.checkpoints import latest_checkpoint
from utils.url_scraper import scrape_news_article


def read_inputs_from_file(file_path: str | Path) -> list[str]:
    path = Path(file_path)
    text = path.read_text(encoding="utf-8")
    blocks = [block.strip() for block in text.split("\n\n") if block.strip()]
    if len(blocks) <= 1:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        return lines
    return blocks


def _format_result_block(item: dict[str, str]) -> str:
    lines = ["-----------------------------------", "INPUT:", item.get("input", ""), ""]
    if "abstractive" in item:
        lines.extend(["GENERATED SUMMARY:", item["abstractive"], ""])
    if "extractive" in item:
        lines.extend(["EXTRACTIVE SUMMARY:", item["extractive"], ""])
    lines.append("-----------------------------------")
    return "\n".join(lines)


class SummarizationService:
    def __init__(
        self,
        config: AppConfig | None = None,
        checkpoint_path: str | Path | None = None,
    ) -> None:
        self.config = config or build_default_config()
        abstractive_checkpoint = checkpoint_path or latest_checkpoint(self.config.abstractive_model_dir)
        if abstractive_checkpoint is None:
            abstractive_checkpoint = self.config.abstractive.model_name
        self.abstractive = AbstractiveSummarizer(
            config=self.config.abstractive,
            checkpoint_path=abstractive_checkpoint,
        )
        self._extractive: ExtractiveSummarizer | None = None

    @property
    def extractive(self) -> ExtractiveSummarizer:
        if self._extractive is None:
            self._extractive = ExtractiveSummarizer(self.config.extractive)
        return self._extractive

    def summarize_text(self, text: str, mode: str = "both", max_sentences: int | None = None) -> dict[str, str]:
        cleaned_text = clean_text(text, lowercase=False)
        result = {"input": cleaned_text}
        if mode in ("extractive", "both"):
            result["extractive"] = self.extractive.summarize(cleaned_text, max_sentences=max_sentences)
        if mode in ("abstractive", "both"):
            result["abstractive"] = self.abstractive.summarize(cleaned_text)
        return result

    def summarize_batch(
        self,
        texts: Iterable[str],
        mode: str = "abstractive",
        max_sentences: int | None = None,
    ) -> list[dict[str, str]]:
        return [
            self.summarize_text(text, mode=mode, max_sentences=max_sentences)
            for text in texts
            if text and text.strip()
        ]

    def summarize_url(self, url: str, mode: str = "both", max_sentences: int | None = None) -> dict[str, str]:
        scraped = scrape_news_article(url)
        result = self.summarize_text(scraped.text, mode=mode, max_sentences=max_sentences)
        result["title"] = scraped.title
        result["url"] = scraped.url
        return result

    def compare(self, text: str, max_sentences: int | None = None) -> dict[str, str]:
        return self.summarize_text(text, mode="both", max_sentences=max_sentences)


def save_results(results: list[dict[str, str]], output_path: str | Path) -> Path:
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    content = "\n\n".join(_format_result_block(item) for item in results)
    output.write_text(content + "\n", encoding="utf-8")
    return output


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="AI News Summarizer",
        description="CLI for extractive and abstractive news summarization.",
    )
    parser.add_argument("--text", type=str, help="Raw news article text")
    parser.add_argument("--url", type=str, help="News article URL to scrape")
    parser.add_argument("--input-file", type=str, help="File containing multiple input articles")
    parser.add_argument(
        "--mode",
        choices=["extractive", "abstractive", "both"],
        default="both",
        help="Which summarization mode to run",
    )
    parser.add_argument("--sentences", type=int, default=3, help="Number of sentences for extractive summarization")
    parser.add_argument("--output-file", type=str, default="outputs/results.txt", help="Output file for saved summaries")
    parser.add_argument(
        "--checkpoint",
        type=str,
        default=None,
        help="Optional path to a fine-tuned abstractive checkpoint",
    )
    parser.add_argument(
        "--show-original",
        action="store_true",
        help="Print the cleaned input article before summaries",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if not args.text and not args.url and not args.input_file:
        parser.print_help()
        return 1

    config = build_default_config()
    if args.checkpoint:
        config.abstractive.checkpoint_dir = Path(args.checkpoint).parent
    service = SummarizationService(config)

    if args.url:
        result = service.summarize_url(args.url, mode=args.mode, max_sentences=args.sentences)
        results = [result]
    elif args.input_file:
        inputs = read_inputs_from_file(args.input_file)
        results = service.summarize_batch(inputs, mode=args.mode, max_sentences=args.sentences)
        result = results[0] if results else {"input": "", "abstractive": ""}
    else:
        result = service.summarize_text(args.text, mode=args.mode, max_sentences=args.sentences)
        results = [result]

    output_path = save_results(results, args.output_file)

    if args.show_original and "input" in result:
        print("\nORIGINAL ARTICLE:\n")
        print(result["input"])

    print("\nSUMMARY OUTPUT:\n")
    if "title" in result:
        print(f"Title: {result['title']}")
        print(f"URL: {result['url']}\n")
    if "extractive" in result:
        print("[Extractive]")
        print(result["extractive"])
        print()
    if "abstractive" in result:
        print("[Abstractive]")
        print(result["abstractive"])
        print()
    print(f"Saved {len(results)} result(s) to: {output_path}")
    return 0
