import { useEffect, useState } from "react";

export default function SummaryCard({
  summary,
  error,
  inputType,
  onCopy,
  copied,
  usedLength,
  mode,
  tone,
  numArticles,
  originalWords,
  summaryWords,
  compression,
}) {
  const [typedSummary, setTypedSummary] = useState("");

  useEffect(() => {
    if (!summary || error) {
      setTypedSummary(summary || "");
      return;
    }

    setTypedSummary("");
    let cursor = 0;
    const timer = setInterval(() => {
      cursor += 1;
      setTypedSummary(summary.slice(0, cursor));
      if (cursor >= summary.length) {
        clearInterval(timer);
      }
    }, 14);

    return () => clearInterval(timer);
  }, [summary, error]);

  const words = summary.trim() ? summary.trim().split(/\s+/).length : 0;
  const bulletLines = typedSummary
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-") || line.startsWith("*") || line.startsWith("•"));
  const shouldRenderBullets = mode === "bullet" && bulletLines.length > 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Generated Summary</h2>
        <button
          type="button"
          onClick={onCopy}
          disabled={!summary}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      ) : (
        <div className={`min-h-[140px] whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-700 transition dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 ${summary ? "animate-fade-in" : ""}`}>
          {!summary && "Your generated summary will appear here."}
          {typedSummary && shouldRenderBullets && (
            <ul className="list-disc space-y-2 pl-5">
              {bulletLines.map((line, idx) => (
                <li key={`${line}-${idx}`}>{line.replace(/^[-*•]\s*/, "")}</li>
              ))}
            </ul>
          )}
          {typedSummary && !shouldRenderBullets && <p>{typedSummary}</p>}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">Input type: {inputType.toUpperCase()}</span>
        <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">Mode: {(mode || "normal").toUpperCase()}</span>
        <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">Length: {(usedLength || "medium").toUpperCase()}</span>
        <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">Tone: {(tone || "formal").toUpperCase()}</span>
        <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">Articles: {numArticles || 1}</span>
        <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">Word count: {words}</span>
      </div>

      {!error && summary && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Compression Ratio</p>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-brand-500 to-indigo-500 transition-all duration-700 ease-out"
              style={{ width: `${Math.max(0, Math.min(100, compression || 0))}%` }}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <p>
              <span className="font-medium">Original:</span> {originalWords || 0} words
            </p>
            <p>
              <span className="font-medium">Summary:</span> {summaryWords || 0} words
            </p>
            <p>
              <span className="font-medium">Reduction:</span> {(compression || 0).toFixed(2)}%
            </p>
          </div>
        </div>
      )}
    </section>
  );
}