import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl transition-colors dark:border-slate-800 dark:bg-slate-900 md:p-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-indigo-500/20 blur-3xl" />

        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">AI Summarization Suite</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl">
          Summarize News with AI
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
          Transformer-based abstractive summarization using T5. Generate concise, readable summaries
          from long-form articles in seconds.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/demo"
            className="rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-3 text-sm font-medium text-white transition hover:from-brand-700 hover:to-indigo-700"
          >
            Try Now
          </Link>
          <Link
            to="/metrics"
            className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            View Metrics
          </Link>
        </div>
      </div>
    </section>
  );
}
