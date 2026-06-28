import { useState } from "react";
import axios from "axios";
import LoadingSpinner from "../components/LoadingSpinner";
import InputTabs from "../components/InputTabs";
import SummaryCard from "../components/SummaryCard";
import ComparisonGrid from "../components/ComparisonGrid";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/summarize";

async function extractTextFromUrl(url) {
  const target = url.trim();
  if (!target) {
    return "";
  }

  const normalized = target.replace(/^https?:\/\//i, "");
  const proxyUrl = `https://r.jina.ai/http://${normalized}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error("Could not fetch article from URL. Try pasting content in Text tab.");
  }
  return response.text();
}

export default function DemoPage() {
  const [inputType, setInputType] = useState("text");
  const [articleInputs, setArticleInputs] = useState([""]);
  const [bulkPasteText, setBulkPasteText] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [fileText, setFileText] = useState("");
  const [fileName, setFileName] = useState("");
  const [summaryLength, setSummaryLength] = useState("medium");
  const [mode, setMode] = useState("normal");
  const [tone, setTone] = useState("formal");
  const [compareAll, setCompareAll] = useState(false);
  const [copied, setCopied] = useState(false);
  const [comparisonCopied, setComparisonCopied] = useState(false);
  const [lastInputType, setLastInputType] = useState("text");
  const [summary, setSummary] = useState("");
  const [comparison, setComparison] = useState(null);
  const [summaryStats, setSummaryStats] = useState({
    originalWords: 0,
    summaryWords: 0,
    compression: 0,
    numArticles: 1,
    tone: "formal",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentInputText =
    inputType === "text" ? articleInputs.join("\n\n") : inputType === "url" ? urlInput : fileText;
  const charCount = currentInputText.length;

  const handleArticleChange = (index, value) => {
    setArticleInputs((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };

  const handleAddArticle = () => {
    setArticleInputs((prev) => [...prev, ""]);
  };

  const handleSplitBulkText = () => {
    const blocks = bulkPasteText
      .split(/\n\s*\n+/)
      .map((block) => block.trim())
      .filter(Boolean);

    if (!blocks.length) {
      setError("Paste multiple articles separated by blank lines first.");
      return;
    }

    setArticleInputs(blocks);
    setInputType("text");
    setError("");
  };

  const handleRemoveArticle = (index) => {
    setArticleInputs((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const onFilePicked = async (file) => {
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      setFileText(text);
      setFileName(file.name);
      setInputType("file");
      setError("");
    } catch {
      setError("Failed to read the selected file.");
    }
  };

  const handleClear = () => {
    const hasContent =
      articleInputs.some((item) => item.trim()) ||
      bulkPasteText.trim() ||
      urlInput.trim() ||
      fileText.trim() ||
      summary;

    if (hasContent && !window.confirm("Are you sure you want to clear your current inputs and results?")) {
      return;
    }

    setArticleInputs([""]);
    setBulkPasteText("");
    setUrlInput("");
    setFileText("");
    setFileName("");
    setSummary("");
    setComparison(null);
    setSummaryStats({
      originalWords: 0,
      summaryWords: 0,
      compression: 0,
      numArticles: 1,
      tone: "formal",
    });
    setError("");
    setCopied(false);
    setComparisonCopied(false);
    setLastInputType(inputType);
  };

  const handleCopy = async () => {
    if (!summary) {
      return;
    }
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const handleCopyComparison = async () => {
    if (!comparison) {
      return;
    }

    const getSummaryText = (entry) => (typeof entry === "string" ? entry : entry?.summary || "");
    const joined = [
      "SHORT",
      getSummaryText(comparison.short),
      "",
      "MEDIUM",
      getSummaryText(comparison.medium),
      "",
      "LONG",
      getSummaryText(comparison.long),
    ]
      .filter(Boolean)
      .join("\n");
    await navigator.clipboard.writeText(joined);
    setComparisonCopied(true);
    setTimeout(() => setComparisonCopied(false), 1400);
  };

  const handleSummarize = async () => {
    setCopied(false);
    let payloadText = "";
    let payloadTexts = [];

    if (inputType === "text") {
      payloadTexts = articleInputs.map((item) => item.trim()).filter(Boolean);
      payloadText = payloadTexts.join(" ");
    } else if (inputType === "url") {
      const urlValue = urlInput.trim();
      if (!urlValue) {
        setError("Please provide a URL or switch to Text tab.");
        return;
      }
      // URL validation
      try {
        const checkUrl = urlValue.startsWith("http") ? urlValue : `http://${urlValue}`;
        new URL(checkUrl);
      } catch {
        setError("Please enter a valid website URL (e.g. https://bbc.com/news).");
        return;
      }
      setLoading(true);
      setError("");
      try {
        payloadText = (await extractTextFromUrl(urlValue)).trim();
        payloadTexts = payloadText ? [payloadText] : [];
      } catch (extractError) {
        setLoading(false);
        setError(extractError.message || "URL extraction failed. Paste article content in Text tab.");
        return;
      }
    } else {
      payloadText = fileText.trim();
      payloadTexts = payloadText ? [payloadText] : [];
    }

    const trimmed = payloadText;
    if (!trimmed) {
      setError("Please provide article content before generating a summary.");
      setLoading(false);
      return;
    }

    const charLimit = 10000;
    if (trimmed.length > charLimit) {
      setError(`Input content length (${trimmed.length} characters) exceeds the maximum limit of ${charLimit}.`);
      setLoading(false);
      return;
    }

    if (!loading) {
      setLoading(true);
    }
    setError("");

    try {
      const response = await axios.post(
        API_URL,
        {
          text: trimmed,
          texts: payloadTexts,
          length: summaryLength,
          mode,
          tone,
          compare_all: compareAll,
        },
        { timeout: 45000 }
      );
      const rawSummary = response.data.summary || "No summary returned.";
      setSummary(rawSummary);
      setComparison(response.data.comparison || null);
      setSummaryStats({
        originalWords: response.data.original_words || 0,
        summaryWords: response.data.summary_words || 0,
        compression: response.data.compression || 0,
        numArticles: response.data.num_articles || payloadTexts.length || 1,
        tone: response.data.tone || tone,
      });
      setLastInputType(inputType);
    } catch (err) {
      let message = "Failed to generate summary. Please check backend server.";
      if (err.code === "ECONNABORTED") {
        message = "Summarization request timed out. The server took too long to reply.";
      } else if (err?.response?.data?.detail) {
        message = err.response.data.detail;
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      setSummary("");
      setComparison(null);
      setSummaryStats((prev) => ({ ...prev, originalWords: 0, summaryWords: 0, compression: 0 }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl transition-colors dark:border-slate-800 dark:bg-slate-900 md:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Demo Workspace</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Generate high-quality summaries from text, URL, or file input.</p>
        </header>

        <InputTabs
          inputType={inputType}
          setInputType={setInputType}
          articleInputs={articleInputs}
          onArticleChange={handleArticleChange}
          onAddArticle={handleAddArticle}
          onRemoveArticle={handleRemoveArticle}
          bulkPasteText={bulkPasteText}
          setBulkPasteText={setBulkPasteText}
          onSplitBulkText={handleSplitBulkText}
          urlInput={urlInput}
          setUrlInput={setUrlInput}
          fileName={fileName}
          fileCharCount={fileText.length}
          onFilePicked={onFilePicked}
          charCount={charCount}
        />

        {charCount > 10000 && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800 dark:border-amber-950/40 dark:bg-amber-950/20 dark:text-amber-300">
            ⚠️ <strong>Length Warning:</strong> Current input has {charCount.toLocaleString()} characters.
            The maximum supported limit is 10,000 characters. Please shorten it.
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={handleSummarize}
            disabled={loading || charCount > 10000}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:from-brand-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading && <LoadingSpinner />}
            {loading ? "Generating summary..." : "Generate Summary"}
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Clear
          </button>

          <label className="ml-auto flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            Summary Length
            <select
              value={summaryLength}
              onChange={(event) => setSummaryLength(event.target.value)}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </label>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Summary Mode</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setMode("normal")}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  mode === "normal"
                    ? "bg-brand-600 text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => setMode("bullet")}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  mode === "bullet"
                    ? "bg-brand-600 text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                Bullet Points
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
            <label className="flex items-center justify-between gap-4 text-sm text-slate-700 dark:text-slate-200">
              <span className="font-medium">Compare All Lengths</span>
              <button
                type="button"
                disabled={loading}
                onClick={() => setCompareAll((prev) => !prev)}
                className={`relative h-7 w-14 rounded-full transition ${compareAll ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-700"}`}
                aria-pressed={compareAll}
                aria-label="Toggle comparison"
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${compareAll ? "left-8" : "left-1"}`}
                />
              </button>
            </label>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Generate Short, Medium, and Long summaries side-by-side.
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
          <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
            <span className="font-medium">Tone</span>
            <select
              value={tone}
              onChange={(event) => setTone(event.target.value)}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="formal">Formal</option>
              <option value="simple">Simple</option>
              <option value="beginner">Beginner-friendly</option>
            </select>
          </label>
        </div>

        <div className="mt-5">
          {compareAll ? (
            <ComparisonGrid
              comparison={comparison}
              error={error}
              mode={mode}
              onCopy={handleCopyComparison}
              copied={comparisonCopied}
              tone={summaryStats.tone}
              numArticles={summaryStats.numArticles}
            />
          ) : (
            <SummaryCard
              summary={summary}
              error={error}
              inputType={lastInputType}
              onCopy={handleCopy}
              copied={copied}
              usedLength={summaryLength}
              mode={mode}
              tone={summaryStats.tone}
              numArticles={summaryStats.numArticles}
              originalWords={summaryStats.originalWords}
              summaryWords={summaryStats.summaryWords}
              compression={summaryStats.compression}
            />
          )}
        </div>
      </div>
    </section>
  );
}
