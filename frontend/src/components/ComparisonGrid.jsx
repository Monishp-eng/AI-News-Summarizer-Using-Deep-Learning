function SummaryComparisonCard({ title, content, mode }) {
  const summaryText = typeof content === "string" ? content : content?.summary || "";
  const words = summaryText?.trim() ? summaryText.trim().split(/\s+/).length : 0;
  const bulletLines = summaryText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-") || line.startsWith("*") || line.startsWith("•"));
  const renderBullets = mode === "bullet" && bulletLines.length > 0;
  const originalWords = typeof content === "object" && content ? content.original_words || 0 : 0;
  const summaryWords = typeof content === "object" && content ? content.summary_words || words : words;
  const compression = typeof content === "object" && content ? content.compression || 0 : 0;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{title}</h3>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {words} words
        </span>
      </div>

      <div className="min-h-[130px] rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
        {!summaryText && "Summary unavailable."}
        {summaryText && renderBullets && (
          <ul className="list-disc space-y-2 pl-5">
            {bulletLines.map((line, idx) => (
              <li key={`${title}-${idx}`}>{line.replace(/^[-*•]\s*/, "")}</li>
            ))}
          </ul>
        )}
        {summaryText && !renderBullets && <p>{summaryText}</p>}
      </div>

      {summaryText && (
        <div className="mt-3 rounded-xl border border-slate-100 bg-white p-3 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Compression</span>
            <span>{compression.toFixed(2)}%</span>
          </div>
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-brand-500 to-indigo-500 transition-all duration-700 ease-out"
              style={{ width: `${Math.max(0, Math.min(100, compression))}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span>Original: {originalWords} words</span>
            <span>Summary: {summaryWords} words</span>
          </div>
        </div>
      )}
    </article>
  );
}

export default function ComparisonGrid({ comparison, error, mode, onCopy, copied, tone, numArticles }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Length Comparison</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Compare short, medium, and long summaries side-by-side.</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">Tone: {(tone || "formal").toUpperCase()}</span>
            <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">Articles: {numArticles || 1}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onCopy}
          disabled={!comparison}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {copied ? "Copied" : "Copy All"}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryComparisonCard title="Short" content={comparison?.short || ""} mode={mode} />
          <SummaryComparisonCard title="Medium" content={comparison?.medium || ""} mode={mode} />
          <SummaryComparisonCard title="Long" content={comparison?.long || ""} mode={mode} />
        </div>
      )}
    </section>
  );
}
