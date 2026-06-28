from src.preprocessing import (
    clean_text,
    strip_html,
    sentence_tokenize_text,
    tokenize_words,
    remove_stopwords,
    limit_sentences,
    truncate_text_by_words,
)

def test_strip_html():
    html_text = "<p>Hello <b>World</b>!</p>"
    assert strip_html(html_text) == "Hello World !"

def test_clean_text():
    text = "Check this out https://google.com <br> hello!   WORLD."
    # We expect clean_text to strip html, strip url, remove special characters, and lowercase by default
    cleaned = clean_text(text, lowercase=True)
    assert "google" not in cleaned
    assert "hello" in cleaned
    assert "world" in cleaned
    
    cleaned_case = clean_text(text, lowercase=False)
    assert "WORLD" in cleaned_case

def test_sentence_tokenize_text():
    text = "First sentence. Second sentence! Third sentence?"
    sentences = sentence_tokenize_text(text)
    assert len(sentences) == 3
    assert sentences[0] == "First sentence."
    assert sentences[1] == "Second sentence!"
    assert sentences[2] == "Third sentence?"

def test_tokenize_words():
    text = "Hello World."
    tokens = tokenize_words(text)
    assert "hello" in tokens
    assert "world" in tokens

def test_remove_stopwords():
    tokens = ["the", "quick", "brown", "fox", "and", "the", "lazy", "dog"]
    filtered = remove_stopwords(tokens)
    assert "the" not in filtered
    assert "and" not in filtered
    assert "quick" in filtered

def test_limit_sentences():
    arr = ["s1", "s2", "s3"]
    assert limit_sentences(arr, 2) == ["s1", "s2"]
    assert limit_sentences(arr, 0) == []
    assert limit_sentences(arr, 10) == arr

def test_truncate_text_by_words():
    text = "One two three four five"
    assert truncate_text_by_words(text, 3) == "one two three"
