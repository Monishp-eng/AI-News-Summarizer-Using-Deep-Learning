from __future__ import annotations

from dataclasses import dataclass

import requests
from bs4 import BeautifulSoup

from src.preprocessing import clean_text


@dataclass(slots=True)
class ScrapedArticle:
    url: str
    title: str
    text: str


def scrape_news_article(url: str, timeout: int = 15) -> ScrapedArticle:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/123.0 Safari/537.36"
        )
    }
    response = requests.get(url, headers=headers, timeout=timeout)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    title = soup.title.get_text(" ", strip=True) if soup.title else url
    paragraphs = [
        paragraph.get_text(" ", strip=True)
        for paragraph in soup.find_all("p")
    ]
    paragraphs = [paragraph for paragraph in paragraphs if len(paragraph) > 40]

    if not paragraphs:
        body_text = soup.get_text(" ", strip=True)
        paragraphs = [body_text]

    article_text = clean_text(" ".join(paragraphs), lowercase=False)
    if not article_text:
        raise ValueError(f"Could not extract readable article content from {url}")

    return ScrapedArticle(url=url, title=title, text=article_text)
