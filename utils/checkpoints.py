from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def ensure_directory(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_json(path: Path, payload: Any) -> Path:
    ensure_directory(path.parent)
    with path.open("w", encoding="utf-8") as file_handle:
        json.dump(payload, file_handle, indent=2, ensure_ascii=True)
    return path


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as file_handle:
        return json.load(file_handle)


def latest_checkpoint(directory: Path) -> Path | None:
    if not directory.exists():
        return None
    best_checkpoint = directory / "best"
    if best_checkpoint.exists():
        return best_checkpoint
    checkpoints = sorted(directory.glob("epoch_*"))
    return checkpoints[-1] if checkpoints else None
