export default function MetricsCard({ label, value }) {
  const percentage = Math.max(0, Math.min(100, value * 100));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value.toFixed(4)}</p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}