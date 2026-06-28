from __future__ import annotations

from pathlib import Path
from typing import Sequence

import matplotlib.pyplot as plt
import torch

from .checkpoints import ensure_directory


def save_attention_heatmap(
    attention: torch.Tensor,
    input_tokens: Sequence[str],
    output_tokens: Sequence[str],
    output_path: str | Path,
    title: str = "Cross-Attention Map",
) -> Path:
    attention_matrix = attention.detach().cpu().float().numpy()
    output_path = Path(output_path)
    ensure_directory(output_path.parent)

    plt.figure(figsize=(max(8, len(input_tokens) * 0.35), max(6, len(output_tokens) * 0.35)))
    plt.imshow(attention_matrix, aspect="auto", interpolation="nearest", cmap="viridis")
    plt.colorbar(label="Attention Weight")
    plt.xticks(range(len(input_tokens)), input_tokens, rotation=60, ha="right")
    plt.yticks(range(len(output_tokens)), output_tokens)
    plt.title(title)
    plt.tight_layout()
    plt.savefig(output_path, dpi=200)
    plt.close()
    return output_path
