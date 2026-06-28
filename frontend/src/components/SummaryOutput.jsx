export default function SummaryOutput({ summary, error }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-800">Generated Summary</h2>
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : (
        <div className="min-h-[120px] whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          {summary || "Your generated summary will appear here."}
        </div>
      )}
    </section>
  );
}
