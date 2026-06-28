from __future__ import annotations

import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
import gradio as gr

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("gradio-app")

from src.config import build_default_config
from src.summarize import SummarizationService


config = build_default_config()
best_checkpoint = config.abstractive_model_dir / "best"
default_model = os.getenv("DEFAULT_MODEL_NAME", "t5-small")

checkpoint_path = None
if best_checkpoint.exists():
    checkpoint_path = best_checkpoint
    logger.info(f"Gradio loading best checkpoint from: {checkpoint_path}")
else:
    from utils.checkpoints import latest_checkpoint
    latest = latest_checkpoint(config.abstractive_model_dir)
    if latest:
        checkpoint_path = latest
        logger.info(f"Gradio loading latest epoch checkpoint: {checkpoint_path}")
    else:
        checkpoint_path = default_model
        logger.warning(
            f"No trained checkpoints found under '{config.abstractive_model_dir}'. "
            f"Gradio falling back to base pre-trained model: '{default_model}'"
        )

# Load model once at startup for fast repeated inference during demo.
service = SummarizationService(config=config, checkpoint_path=checkpoint_path)


def generate_summary(article_text: str) -> str:
    text = (article_text or "").strip()
    if not text:
        return "Please paste a news article first."

    try:
        token_count = len(service.abstractive.tokenizer.encode(text, add_special_tokens=False))
        result = service.summarize_text(text, mode="abstractive")
        summary = result.get("abstractive", "")

        if token_count > config.abstractive.max_input_length:
            return (
                f"Warning: Input has about {token_count} tokens. "
                f"Model processes up to {config.abstractive.max_input_length} tokens.\n\n"
                f"{summary}"
            )
        return summary
    except Exception as exc:  # pragma: no cover - runtime safety for demos
        return f"Error while generating summary: {exc}"


EXAMPLE_ARTICLE = (
    "The government announced a new renewable energy policy to increase solar and "
    "wind capacity over the next five years. Officials said the plan includes grid "
    "modernization, storage incentives, and support for domestic clean-tech "
    "manufacturing. Analysts expect lower long-term energy costs and reduced carbon "
    "emissions if implementation remains on schedule."
)


def _set_button_loading() -> gr.Button:
    return gr.Button(interactive=False, value="Generating summary...")


def _reset_button() -> gr.Button:
    return gr.Button(interactive=True, value="Generate Summary")


def _load_example() -> str:
    return EXAMPLE_ARTICLE


APP_CSS = """
body {
  background: linear-gradient(180deg, #f7f9fc 0%, #eef3ff 100%);
}

.app-shell {
  max-width: 980px;
  margin: 0 auto;
  padding: 12px 8px 24px 8px;
}

.hero-title {
  text-align: center;
  margin-bottom: 2px;
}

.hero-subtitle {
  text-align: center;
  color: #3f4b63;
  margin-top: 0;
  margin-bottom: 8px;
}

.hero-desc {
  text-align: center;
  color: #5a6782;
  margin-top: 0;
  margin-bottom: 18px;
}

.card {
  background: #ffffff;
  border: 1px solid #e7ecf5;
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 6px 18px rgba(29, 53, 87, 0.06);
}

.meta-card {
  background: #f8fbff;
  border: 1px dashed #cfd9ea;
  border-radius: 12px;
  padding: 10px 14px;
}
"""


with gr.Blocks(
    title="AI News Summarizer (NNDL Project)",
) as demo:
    with gr.Column(elem_classes=["app-shell"]):
        # Header section
        gr.Markdown("## 🧠 AI News Summarizer", elem_classes=["hero-title"])
        gr.Markdown(
            "Transformer-based Abstractive Summarization using T5",
            elem_classes=["hero-subtitle"],
        )
        gr.Markdown(
            "Paste a news article and generate a concise AI summary instantly.",
            elem_classes=["hero-desc"],
        )

        with gr.Row(equal_height=True):
            with gr.Column(scale=3):
                # Input card
                with gr.Group(elem_classes=["card"]):
                    article_input = gr.Textbox(
                        label="Enter News Article",
                        lines=10,
                        placeholder="Paste your news article here...",
                    )

                # Controls row
                with gr.Row():
                    summarize_button = gr.Button("Generate Summary", variant="primary")
                    clear_button = gr.Button("Clear")
                    example_button = gr.Button("Use Example Input")

                # Output card
                with gr.Group(elem_classes=["card"]):
                    summary_output = gr.Textbox(
                        label="Generated Summary",
                        lines=8,
                    )

            with gr.Column(scale=2):
                # Info panel for presentation and academic context
                with gr.Group(elem_classes=["meta-card"]):
                    gr.Markdown(
                        "### Model Details\n"
                        "- **Model:** T5-small\n"
                        "- **Type:** Abstractive Summarization\n"
                        "- **Evaluation:** ROUGE-1, ROUGE-2, ROUGE-L"
                    )

        gr.Examples(
            examples=[[EXAMPLE_ARTICLE]],
            inputs=article_input,
            outputs=summary_output,
            fn=generate_summary,
            cache_examples=False,
        )

        # UX behavior: disable button while generating, then re-enable.
        summarize_event = summarize_button.click(
            fn=_set_button_loading,
            inputs=None,
            outputs=summarize_button,
            queue=False,
        )
        summarize_event = summarize_event.then(
            fn=generate_summary,
            inputs=article_input,
            outputs=summary_output,
            show_progress="full",
        )
        summarize_event.then(
            fn=_reset_button,
            inputs=None,
            outputs=summarize_button,
            queue=False,
        )

        clear_button.click(
            fn=lambda: ("", "", _reset_button()),
            inputs=None,
            outputs=[article_input, summary_output, summarize_button],
            queue=False,
        )
        example_button.click(
            fn=_load_example,
            inputs=None,
            outputs=article_input,
            queue=False,
        )


demo.queue()


if __name__ == "__main__":
    demo.launch(theme=gr.themes.Soft(), css=APP_CSS)
