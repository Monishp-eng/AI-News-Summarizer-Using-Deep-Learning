export default function AboutPage() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl transition-colors dark:border-slate-800 dark:bg-slate-900 md:p-10">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-3xl">About This Project</h1>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-colors dark:border-slate-800 dark:bg-slate-950">
            <h2 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-100">Problem</h2>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              News articles can be long and time-consuming to read. Users need quick, accurate summaries
              without missing key context.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-colors dark:border-slate-800 dark:bg-slate-950">
            <h2 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-100">Solution</h2>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              This app uses a trained abstractive summarization model to produce concise summaries from
              full-length news text through an API-backed inference workflow.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-colors dark:border-slate-800 dark:bg-slate-950">
            <h2 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-100">Architecture</h2>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              Encoder-decoder Transformer with T5 for abstractive summarization. Input text is encoded,
              and the decoder generates concise summary sequences token by token.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-colors dark:border-slate-800 dark:bg-slate-950">
            <h2 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-100">Model</h2>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              The summarizer is based on T5 (Text-to-Text Transfer Transformer), fine-tuned for
              abstractive summarization.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-colors dark:border-slate-800 dark:bg-slate-950 md:col-span-2">
            <h2 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-100">Tech Stack</h2>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              Frontend: React + Tailwind CSS + React Router<br />
              Backend: FastAPI<br />
              AI: Hugging Face Transformers (T5)
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
