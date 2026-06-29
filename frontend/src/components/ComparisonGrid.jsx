import { Copy, Check, Sparkles, FileText, Info, BarChart2 } from "lucide-react";

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
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 transition duration-300">
      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title} Output
        </h3>
        <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-950 dark:text-slate-350">
          {words} words
        </span>
      </div>

      <div className="min-h-[140px] rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350 shadow-inner">
        {!summaryText && (
          <div className="flex flex-col items-center justify-center min-h-[110px] text-slate-400 dark:text-slate-550 gap-1.5 p-3 text-center">
            <FileText className="h-6 w-6 stroke-[1.25]" />
            <p className="text-[10px]">Awaiting summary generation...</p>
          </div>
        )}
        {summaryText && renderBullets && (
          <ul className="list-disc space-y-2 pl-4">
            {bulletLines.map((line, idx) => (
              <li key={`${title}-${idx}`}>{line.replace(/^[-*•]\s*/, "")}</li>
            ))}
          </ul>
        )}
        {summaryText && !renderBullets && <p>{summaryText}</p>}
      </div>

      {summaryText && (
        <div className="mt-3.5 rounded-xl border border-slate-100 bg-slate-50/30 p-3 text-[10px] text-slate-600 dark:border-slate-800/40 dark:bg-slate-950/20 dark:text-slate-400">
          <div className="mb-2 flex items-center justify-between font-semibold">
            <span>Compression Ratio</span>
            <span className="text-indigo-650 dark:text-indigo-400">{compression.toFixed(1)}%</span>
          </div>
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-850">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-700"
              style={{ width: `${Math.max(0, Math.min(100, compression))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[9px] text-slate-500 font-medium">
            <span>Original: {originalWords}w</span>
            <span>Summary: {summaryWords}w</span>
          </div>
        </div>
      )}
    </article>
  );
}

export default function ComparisonGrid({ comparison, error, mode, onCopy, copied, tone, numArticles }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition duration-300">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-3">
        <div>
          <div className="flex items-center gap-1.5 text-slate-850 dark:text-slate-100 font-bold text-sm">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <h2>Length Comparison Workspace</h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-550 dark:text-slate-400">
            Evaluating short, medium, and long summaries side-by-side.
          </p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          disabled={!comparison}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-250 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-850"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-500 font-bold">Copied All</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy All Outputs</span>
            </>
          )}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300 flex items-start gap-2">
          <Info className="h-4.5 w-4.5 shrink-0 text-red-500" />
          <span>{error}</span>
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

