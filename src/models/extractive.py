from __future__ import annotations

from dataclasses import dataclass
from typing import List, Sequence

import torch
import torch.nn.functional as F
from transformers import AutoModel, AutoTokenizer

from ..config import ExtractiveConfig
from ..preprocessing import sentence_tokenize_text


@dataclass(slots=True)
class SentenceScore:
    index: int
    sentence: str
    score: float


class BertSentenceEmbedder:
    def __init__(self, model_name: str, device: str | None = None) -> None:
        self.model_name = model_name
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name).to(self.device)
        self.model.eval()

    def _mean_pool(self, last_hidden_state: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
        mask = attention_mask.unsqueeze(-1).expand(last_hidden_state.size()).float()
        summed = torch.sum(last_hidden_state * mask, dim=1)
        counts = torch.clamp(mask.sum(dim=1), min=1e-9)
        return summed / counts

    @torch.no_grad()
    def encode_sentences(self, sentences: Sequence[str], max_length: int) -> torch.Tensor:
        encoded = self.tokenizer(
            list(sentences),
            padding=True,
            truncation=True,
            max_length=max_length,
            return_tensors="pt",
        ).to(self.device)
        outputs = self.model(**encoded)
        sentence_embeddings = self._mean_pool(outputs.last_hidden_state, encoded["attention_mask"])
        return F.normalize(sentence_embeddings, p=2, dim=1)


class ExtractiveSummarizer:
    def __init__(self, config: ExtractiveConfig | None = None, device: str | None = None) -> None:
        self.config = config or ExtractiveConfig()
        self.encoder = BertSentenceEmbedder(self.config.encoder_name, device=device)

    def rank_sentences(self, text: str) -> List[SentenceScore]:
        sentences = sentence_tokenize_text(text)
        if not sentences:
            return []
        if len(sentences) == 1:
            return [SentenceScore(index=0, sentence=sentences[0], score=1.0)]

        sentence_embeddings = self.encoder.encode_sentences(sentences, self.config.max_sentence_length)
        document_embedding = sentence_embeddings.mean(dim=0, keepdim=True)
        similarity_scores = F.cosine_similarity(sentence_embeddings, document_embedding, dim=1)

        ranked_sentences: List[SentenceScore] = []
        total_sentences = max(len(sentences), 1)
        for index, sentence in enumerate(sentences):
            position_bonus = 1.0 - (index / total_sentences)
            combined_score = (
                self.config.similarity_weight * similarity_scores[index].item()
                + self.config.position_weight * position_bonus
            )
            ranked_sentences.append(
                SentenceScore(index=index, sentence=sentence, score=combined_score)
            )

        ranked_sentences.sort(key=lambda item: item.score, reverse=True)
        return ranked_sentences

    def summarize(self, text: str, max_sentences: int | None = None) -> str:
        max_sentences = max_sentences or self.config.max_sentences
        sentences = sentence_tokenize_text(text)
        if not sentences:
            return ""
        if len(sentences) <= max_sentences:
            return " ".join(sentences)

        ranked_sentences = self.rank_sentences(text)
        selected = sorted(ranked_sentences[:max_sentences], key=lambda item: item.index)
        return " ".join(sentence.sentence for sentence in selected)

    def summarize_with_scores(self, text: str, max_sentences: int | None = None) -> list[SentenceScore]:
        max_sentences = max_sentences or self.config.max_sentences
        ranked_sentences = self.rank_sentences(text)
        return sorted(ranked_sentences[:max_sentences], key=lambda item: item.index)
