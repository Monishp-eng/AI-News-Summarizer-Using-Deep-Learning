import { useState } from "react";
import axios from "axios";
import { Terminal, Sliders, Play, RotateCcw, AlertTriangle } from "lucide-react";
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
    <div className="relative flex-1 bg-slate-50 dark:bg-slate-950">
      <div className="absolute inset-0 bg-grid-pattern opacity-100 pointer-events-none" />
      <section className="relative mx-auto w-full max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-650 dark:text-indigo-400">
              <Terminal className="h-5 w-5" />
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-2xl">
                AI Inference Workspace
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Scrape articles, parse files, customize hyperparameters, and perform semantic summarization.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-350">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>T5-Small Model Active</span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left Column: Input Sandbox & Configurations */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400 flex items-center gap-1.5">
                <span>1. Ingestion Sandbox</span>
              </h2>

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
                <div className="mt-4 flex gap-2 rounded-xl border border-amber-250 bg-amber-50/50 p-3.5 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-amber-600" />
                  <div>
                    <strong>Length limit reached:</strong> Current input has {charCount.toLocaleString()} characters.
                    The maximum supported limit is 10,000. Please truncate.
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400 flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-indigo-500" />
                <span>2. Parameter Settings</span>
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                    Summary Length
                  </label>
                  <select
                    value={summaryLength}
                    onChange={(event) => setSummaryLength(event.target.value)}
                    disabled={loading || compareAll}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950 transition duration-200"
                  >
                    <option value="short">Short (approx. 2 sentences)</option>
                    <option value="medium">Medium (standard)</option>
                    <option value="long">Long (comprehensive)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                    Response Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(event) => setTone(event.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950 transition duration-200"
                  >
                    <option value="formal">Formal & Technical</option>
                    <option value="simple">Simple Language</option>
                    <option value="beginner">Beginner-friendly</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 grid gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Format</p>
                    <p className="text-[10px] text-slate-500">Paragraph layout vs bullet lists</p>
                  </div>
                  <div className="flex gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setMode("normal")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        mode === "normal"
                          ? "bg-white text-indigo-650 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-250"
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("bullet")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        mode === "bullet"
                          ? "bg-white text-indigo-650 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-250"
                      }`}
                    >
                      Bullets
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Compare Lengths</p>
                    <p className="text-[10px] text-slate-500">Run Short, Medium & Long side-by-side</p>
                  </div>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setCompareAll((prev) => !prev)}
                    className={`relative h-6 w-11 rounded-full transition duration-300 ${compareAll ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"}`}
                    aria-pressed={compareAll}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition duration-300 ${compareAll ? "left-5.5" : "left-0.5"}`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Run Operations */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSummarize}
                disabled={loading || charCount > 10000}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-650 to-violet-650 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none"
              >
                {loading ? <LoadingSpinner /> : <Play className="h-4 w-4 fill-white" />}
                <span>{loading ? "Inference Processing..." : "Execute Summary"}</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-250 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition hover:-translate-y-0.5"
                title="Clear Workspace"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>

          {/* Right Column: Output & Evaluation Sandbox */}
          <div className="lg:col-span-7">
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
    </div>
  );
}
