from __future__ import annotations

import html
import re
from functools import lru_cache
from typing import Iterable, List

from bs4 import BeautifulSoup
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import sent_tokenize, word_tokenize

STOPWORD_LANGUAGE = "english"
_HTML_TAG_RE = re.compile(r"<[^>]+>")
_URL_RE = re.compile(r"https?://\S+|www\.\S+")
_NON_TEXT_RE = re.compile(r"[^A-Za-z0-9.,!?;:'\"()\-\s]")
_MULTI_SPACE_RE = re.compile(r"\s+")


@lru_cache(maxsize=1)
def ensure_nltk_resources() -> None:
    resources = [
        ("tokenizers/punkt", "punkt"),
        ("corpora/stopwords", "stopwords"),
    ]
    for resource_path, download_name in resources:
        try:
            nltk.data.find(resource_path)
        except LookupError:
            nltk.download(download_name, quiet=True)


def strip_html(text: str) -> str:
    if not text:
        return ""
    soup = BeautifulSoup(text, "html.parser")
    return soup.get_text(" ", strip=True)


def clean_text(text: str, lowercase: bool = True) -> str:
    if not text:
        return ""

    text = html.unescape(text)
    text = strip_html(text)
    text = _URL_RE.sub(" ", text)
    text = _HTML_TAG_RE.sub(" ", text)
    text = _NON_TEXT_RE.sub(" ", text)
    text = _MULTI_SPACE_RE.sub(" ", text).strip()
    if lowercase:
        text = text.lower()
    return text


def sentence_tokenize_text(text: str) -> List[str]:
    ensure_nltk_resources()
    cleaned = clean_text(text, lowercase=False)
    try:
        sentences = sent_tokenize(cleaned)
    except LookupError:
        sentences = re.split(r"(?<=[.!?])\s+", cleaned)
    return [sentence.strip() for sentence in sentences if sentence.strip()]


def tokenize_words(text: str) -> List[str]:
    ensure_nltk_resources()
    cleaned = clean_text(text, lowercase=True)
    try:
        tokens = word_tokenize(cleaned)
    except LookupError:
        tokens = re.findall(r"\b\w+\b", cleaned)
    return [token for token in tokens if token.strip()]


def remove_stopwords(tokens: Iterable[str], language: str = STOPWORD_LANGUAGE) -> List[str]:
    ensure_nltk_resources()
    try:
        stop_words = set(stopwords.words(language))
    except LookupError:
        stop_words = set()
    return [token for token in tokens if token.lower() not in stop_words]


def normalize_article(text: str) -> str:
    return clean_text(text, lowercase=False)


def normalize_for_extractive_scoring(text: str) -> List[str]:
    return remove_stopwords(tokenize_words(text))


def limit_sentences(sentences: List[str], max_sentences: int) -> List[str]:
    if max_sentences <= 0:
        return []
    return sentences[:max_sentences]


def truncate_text_by_words(text: str, max_words: int) -> str:
    if max_words <= 0:
        return ""
    tokens = tokenize_words(text)
    return " ".join(tokens[:max_words])
