export default function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Toggle theme"
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}