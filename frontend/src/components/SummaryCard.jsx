import { useEffect, useState } from "react";
import { Copy, Check, Sparkles, FileText, Info, BarChart2 } from "lucide-react";

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
    }, 12);

    return () => clearInterval(timer);
  }, [summary, error]);

  const words = summary.trim() ? summary.trim().split(/\s+/).length : 0;
  const bulletLines = typedSummary
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-") || line.startsWith("*") || line.startsWith("•"));
  const shouldRenderBullets = mode === "bullet" && bulletLines.length > 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all duration-300">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-100 font-bold text-sm">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <h2>Generated Abstractive Summary</h2>
        </div>
        <button
          type="button"
          onClick={onCopy}
          disabled={!summary}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-250 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-850"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300 flex items-start gap-2">
          <Info className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="relative min-h-[160px] whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-xs leading-6 text-slate-750 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 shadow-inner">
          {!summary && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-1.5 p-4 text-center">
              <FileText className="h-8 w-8 stroke-[1.25]" />
              <p>Inference outputs will be generated here.</p>
            </div>
          )}
          {typedSummary && shouldRenderBullets && (
            <ul className="list-disc space-y-2.5 pl-5">
              {bulletLines.map((line, idx) => (
                <li key={`${line}-${idx}`}>{line.replace(/^[-*•]\s*/, "")}</li>
              ))}
            </ul>
          )}
          {typedSummary && !shouldRenderBullets && <p>{typedSummary}</p>}
        </div>
      )}

      {/* Metadata Badges */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-450 border-t border-slate-100 dark:border-slate-800/60 pt-3">
        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 dark:bg-slate-950">SRC: {inputType.toUpperCase()}</span>
        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 dark:bg-slate-950">LAYOUT: {(mode || "normal").toUpperCase()}</span>
        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 dark:bg-slate-950">LEN: {(usedLength || "medium").toUpperCase()}</span>
        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 dark:bg-slate-950">TONE: {(tone || "formal").toUpperCase()}</span>
        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 dark:bg-slate-950">DOCS: {numArticles || 1}</span>
      </div>

      {/* Compression Dashboard */}
      {!error && summary && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center gap-1.5 mb-2.5">
            <BarChart2 className="h-4 w-4 text-indigo-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400">
              Compression Metrics
            </h3>
          </div>
          
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-500 dark:text-slate-400">Text Volume Reduction</span>
              <span className="text-indigo-600 dark:text-indigo-400">{(compression || 0).toFixed(1)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                style={{ width: `${Math.max(0, Math.min(100, compression || 0))}%` }}
              />
            </div>
          </div>

          <div className="grid gap-3 grid-cols-3 text-center">
            <div className="rounded-lg bg-white dark:bg-slate-900 p-2 shadow-xs border border-slate-100 dark:border-slate-800/40">
              <p className="text-[10px] text-slate-500">Original</p>
              <p className="mt-0.5 text-xs font-bold text-slate-700 dark:text-white">{originalWords || 0}</p>
            </div>
            <div className="rounded-lg bg-white dark:bg-slate-900 p-2 shadow-xs border border-slate-100 dark:border-slate-800/40">
              <p className="text-[10px] text-slate-500">Summary</p>
              <p className="mt-0.5 text-xs font-bold text-slate-700 dark:text-white">{summaryWords || 0}</p>
            </div>
            <div className="rounded-lg bg-white dark:bg-slate-900 p-2 shadow-xs border border-slate-100 dark:border-slate-800/40">
              <p className="text-[10px] text-slate-500">Remaining</p>
              <p className="mt-0.5 text-xs font-bold text-slate-700 dark:text-white">
                {(100 - (compression || 0)).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}