from __future__ import annotations

import argparse

from src.config import build_default_config
from src.evaluate import evaluate_pipeline
from src.summarize import SummarizationService, read_inputs_from_file, save_results
from src.train import train_abstractive_pipeline


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        prog="AI News Summarizer",
        description="CLI for training, evaluation, and summarization.",
    )
    subparsers = parser.add_subparsers(dest="command")

    summarize_parser = subparsers.add_parser("summarize", help="Summarize raw text or a URL")
    summarize_parser.add_argument("--text", type=str, help="Raw news article text")
    summarize_parser.add_argument("--url", type=str, help="News article URL to scrape")
    summarize_parser.add_argument("--input-file", type=str, help="Path to file with multiple articles")
    summarize_parser.add_argument("--output-file", type=str, default="outputs/results.txt")
    summarize_parser.add_argument("--checkpoint", type=str, default=None, help="Checkpoint path or model name")
    summarize_parser.add_argument("--model-name", type=str, default=None, help="Override abstractive model name")
    summarize_parser.add_argument("--max-input-length", type=int, default=None)
    summarize_parser.add_argument("--max-summary-length", type=int, default=None)
    summarize_parser.add_argument("--num-beams", type=int, default=None)
    summarize_parser.add_argument("--length-penalty", type=float, default=None)
    summarize_parser.add_argument(
        "--mode",
        choices=["extractive", "abstractive", "both"],
        default="both",
        help="Which summarization mode to run",
    )
    summarize_parser.add_argument("--sentences", type=int, default=3, help="Number of sentences for extractive summarization")

    train_parser = subparsers.add_parser("train", help="Fine-tune the abstractive summarizer")
    train_parser.add_argument("--epochs", type=int, default=None)
    train_parser.add_argument("--batch-size", type=int, default=None)
    train_parser.add_argument("--sample-size", type=int, default=None)
    train_parser.add_argument("--max-input-length", type=int, default=None)
    train_parser.add_argument("--max-summary-length", type=int, default=None)
    train_parser.add_argument("--dataset-name", type=str, default=None)
    train_parser.add_argument("--dataset-config", type=str, default=None)
    train_parser.add_argument("--no-streaming", action="store_true")
    train_parser.add_argument(
        "--model-name",
        type=str,
        default=None,
        help="Optional Transformer checkpoint to fine-tune during training",
    )

    evaluate_parser = subparsers.add_parser("evaluate", help="Evaluate summarizers using ROUGE")
    evaluate_parser.add_argument("--max-samples", type=int, default=20)
    evaluate_parser.add_argument("--dataset-name", type=str, default=None)
    evaluate_parser.add_argument("--dataset-config", type=str, default=None)
    evaluate_parser.add_argument("--no-streaming", action="store_true")
    evaluate_parser.add_argument("--include-extractive", action="store_true")
    evaluate_parser.add_argument("--model-name", type=str, default=None)

    args = parser.parse_args()
    if args.command is None:
        parser.print_help()
        raise SystemExit(1)

    config = build_default_config()

    if args.command == "summarize":
        if not args.text and not args.url and not args.input_file:
            summarize_parser.print_help()
            raise SystemExit(1)
        if args.model_name is not None:
            config.abstractive.model_name = args.model_name
        if args.max_input_length is not None:
            config.abstractive.max_input_length = args.max_input_length
        if args.max_summary_length is not None:
            config.abstractive.max_generation_length = args.max_summary_length
        if args.num_beams is not None:
            config.abstractive.num_beams = args.num_beams
        if args.length_penalty is not None:
            config.abstractive.length_penalty = args.length_penalty
        service = SummarizationService(config, checkpoint_path=args.checkpoint)
        results: list[dict[str, str]]
        if args.url:
            result = service.summarize_url(args.url, mode=args.mode, max_sentences=args.sentences)
            results = [result]
        elif args.input_file:
            input_path = args.input_file
            texts = read_inputs_from_file(input_path)
            results = service.summarize_batch(texts, mode=args.mode, max_sentences=args.sentences)
            result = results[0] if results else {"input": ""}
        else:
            result = service.summarize_text(args.text, mode=args.mode, max_sentences=args.sentences)
            results = [result]

        output_path = save_results(results, args.output_file)

        if "title" in result:
            print(f"Title: {result['title']}")
            print(f"URL: {result['url']}\n")
        print("SUMMARY OUTPUT:\n")
        if "extractive" in result:
            print("[Extractive]")
            print(result["extractive"])
            print()
        if "abstractive" in result:
            print("[Abstractive]")
            print(result["abstractive"])
            print()
        print(f"Saved {len(results)} result(s) to: {output_path}")
        raise SystemExit(0)

    if args.command == "train":
        if args.epochs is not None:
            config.training.epochs = args.epochs
        if args.batch_size is not None:
            config.training.batch_size = args.batch_size
            config.training.eval_batch_size = args.batch_size
        if args.sample_size is not None:
            config.data.sample_size = args.sample_size
        if args.max_input_length is not None:
            config.abstractive.max_input_length = args.max_input_length
        if args.max_summary_length is not None:
            config.abstractive.max_target_length = args.max_summary_length
            config.abstractive.max_generation_length = args.max_summary_length
        if args.dataset_name is not None:
            config.data.dataset_name = args.dataset_name
            if args.dataset_config is None:
                config.data.dataset_config = ""
        if args.dataset_config is not None:
            config.data.dataset_config = args.dataset_config
        if args.no_streaming:
            config.data.use_streaming = False
        if args.model_name is not None:
            config.abstractive.model_name = args.model_name
        result = train_abstractive_pipeline(config)
        print(f"Best checkpoint saved at: {result.best_checkpoint}")
        for item in result.history:
            print(
                f"Epoch {item.epoch}: train_loss={item.train_loss:.4f}, "
                f"validation_loss={item.validation_loss:.4f}"
            )
        raise SystemExit(0)

    if args.command == "evaluate":
        if args.dataset_name is not None:
            config.data.dataset_name = args.dataset_name
            if args.dataset_config is None:
                config.data.dataset_config = ""
        if args.dataset_config is not None:
            config.data.dataset_config = args.dataset_config
        if args.no_streaming:
            config.data.use_streaming = False
        if args.model_name is not None:
            config.abstractive.model_name = args.model_name

        results = evaluate_pipeline(
            config,
            max_samples=args.max_samples,
            include_extractive=args.include_extractive,
            checkpoint_path=args.model_name,
        )
        print("Abstractive ROUGE:")
        print(results["abstractive"]["average"])
        if "extractive" in results:
            print("\nExtractive ROUGE:")
            print(results["extractive"]["average"])
        print("\nSaved metrics to: outputs/metrics.json")
        raise SystemExit(0)

    parser.print_help()
    raise SystemExit(1)
