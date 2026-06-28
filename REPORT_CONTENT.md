# NNDL Report Content: AI News Summarizer using Deep Learning

## 1. Introduction
Automatic text summarization is a core Natural Language Processing (NLP) task that helps users process large volumes of news content efficiently. In digital journalism, readers often face information overload because of the high frequency and length of published articles. This project presents an AI News Summarizer that generates concise, readable summaries while preserving the core meaning of the source text.

The final system supports both classical summarization paradigms and a product-level web experience:
- Extractive summarization: selects salient sentences from the source article.
- Abstractive summarization: generates new text using a Transformer-based model.
- Full-stack interface: FastAPI backend with a React + Tailwind frontend.

The implementation is modular, reproducible, and suitable for academic demonstration as well as live presentation.

## 2. Literature Survey (Brief)
Early summarization systems were largely rule-based or extractive and relied on statistical cues such as term frequency, sentence position, and document centrality. Graph-based methods such as TextRank improved sentence ranking by modeling relationships between sentences.

With deep learning, sequence-to-sequence models with attention enabled abstractive generation. Transformer-based encoder-decoder architectures such as T5, BART, and PEGASUS further improved performance by capturing long-range context and semantic dependencies. Pretraining on large corpora followed by task-specific fine-tuning is now the dominant approach for abstractive summarization.

## 3. Proposed Methodology
The project uses a dual-layer architecture:

1. Data Acquisition and Preprocessing
- Dataset: BBC News Summary from Hugging Face.
- Cleaning: HTML removal, whitespace normalization, and text sanitization.
- Input handling: single article, multi-article, URL, and file-based input.

2. Extractive Summarization
- Sentence tokenization.
- Sentence embeddings with BERT.
- Sentence relevance scoring using document-level similarity and positional priors.
- Top-k sentence selection for extractive output.

3. Abstractive Summarization
- Transformer model: T5 (`t5-small` in the final demo setup).
- Prompt conditioning for short, medium, long, bullet, and tone-based summaries.
- Fine-tuning with teacher forcing and cross-entropy loss.

4. Web Application Layer
- FastAPI backend for inference and metrics.
- React + Tailwind frontend for interactive demo workflows.

5. Evaluation
- ROUGE-1, ROUGE-2, and ROUGE-L against reference summaries.
- Compression ratio and summary length metrics for demo analysis.

## 4. Model Architecture
### 4.1 Extractive Model
The extractive branch uses contextual sentence embeddings from BERT:
- Each sentence is encoded using hidden states.
- A document representation is derived from the article embeddings.
- Cosine similarity is used to score sentence relevance.
- Final ranking combines relevance with a sentence-position prior.

### 4.2 Abstractive Model (T5)
T5 is an encoder-decoder Transformer:
- The encoder represents the source article context.
- The decoder generates summary tokens autoregressively.
- Cross-attention connects decoder states to encoder outputs.

Generation controls include:
- Beam search (`num_beams`)
- Length penalty (`length_penalty`)
- N-gram blocking (`no_repeat_ngram_size`)
- Early stopping
- Prompt-based tone and mode conditioning

## 5. Full-Stack System Design
The final project includes the following layers:

### 5.1 Backend
- `POST /summarize`
	- Accepts `text` or `texts[]`
	- Supports `length`, `mode`, `tone`, and `compare_all`
	- Returns summary, article count, word counts, compression, and optional comparison results
- `GET /metrics`
	- Serves ROUGE scores from `outputs/metrics.json`
- `GET /health`
	- Returns backend status

### 5.2 Frontend
- Multi-article input with Add Article and bulk paste helper
- URL and file input modes
- Tone selector: Formal, Simple, Beginner-friendly
- Summary mode selector: Normal or Bullet Points
- Comparison toggle for Short, Medium, and Long summaries
- Typing animation for generated summaries
- Compression ratio cards and per-comparison metrics
- Dark-theme presentation styling

## 6. Training Details
- Framework: PyTorch + Hugging Face Transformers.
- Optimizer: AdamW.
- Loss: sequence-level cross-entropy.
- Scheduler: linear warmup and decay.
- Checkpointing: per-epoch and best checkpoint by validation loss.

Typical configuration used in the final project:
- `model_name = t5-small`
- `max_input_length = 512`
- `max_target_length = 96`
- `num_beams = 4`
- `epochs = 1..3`

## 7. Results and Analysis
The system produces:
- Summaries stored in `outputs/results.txt`
- ROUGE metrics stored in `outputs/metrics.json`

Observed behavior:
- Extractive summaries preserve factual wording and are easy to trace back to the source.
- Abstractive summaries are more fluent and concise, with higher compression and readability.
- Bullet mode improves presentation clarity for demo use.
- Tone controls make the system suitable for different audiences.

Compression analysis:
- Original words are counted from the combined input text.
- Summary words are counted from the generated output.
- Compression is computed as the percentage reduction from source to summary.

## 8. Conclusion
This project demonstrates a complete AI news summarization pipeline from preprocessing and training to inference, evaluation, and a final full-stack web demo. The design combines interpretability from extractive summarization with the fluency of abstractive generation, while the web UI adds practical demo features such as comparison mode, tone control, typing animation, and metrics visualization. The result is suitable for academic submission and final project presentation.

## 9. Future Scope
- Fine-tune on larger multi-domain news corpora.
- Add multilingual summarization with mT5.
- Add factual consistency checks using entailment-based validation.
- Improve comparison analytics with per-mode and per-tone evaluation trends.
- Add attention introspection tools for explainability.
- Perform deeper ablation studies on beam width, max length, tone prompts, and bullet formatting.
