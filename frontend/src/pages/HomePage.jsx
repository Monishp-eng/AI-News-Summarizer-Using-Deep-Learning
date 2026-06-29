import { Link } from "react-router-dom";
import { Sparkles, Cpu, FileText, Activity, Layers, ArrowRight, Zap, Target, Sliders } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden bg-slate-50 dark:bg-slate-950 flex-1">
      {/* Background visual graphics */}
      <div className="absolute inset-0 bg-grid-pattern opacity-100" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none h-[500px] w-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl" />
      <div className="absolute top-1/3 left-1/4 pointer-events-none h-[300px] w-[300px] rounded-full bg-violet-500/10 dark:bg-violet-500/5 blur-3xl" />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-6xl px-4 pt-16 pb-12 text-center md:pt-24 md:pb-16">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Next-Generation Abstractive Summarizer</span>
        </div>

        <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-6xl md:leading-[1.1]">
          Compress Long News Into{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
            Actionable Insights
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-650 dark:text-slate-350 md:text-lg">
          Powered by a fine-tuned T5-small transformer model. Ingest articles, customize length and tone,
          and compare abstractive summaries side-by-side.
        </p>

        <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
          <Link
            to="/demo"
            className="group inline-flex items-center gap-2 rounded-xl bg-indigo-650 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Launch Workspace</span>
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
          <Link
            to="/metrics"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/70 px-6 py-3.5 text-sm font-semibold text-slate-700 backdrop-blur-sm hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800 transition hover:-translate-y-0.5"
          >
            <Activity className="h-4 w-4 text-indigo-500" />
            <span>Model Analytics</span>
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="relative mx-auto max-w-6xl px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
            Engineered for Academic & Product Excellence
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Everything you need for comprehensive document digestion.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="group rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/50 hover:border-indigo-500/30 transition duration-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-650 dark:bg-indigo-950/50 dark:text-indigo-400">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Multi-Input Ingestion</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Upload raw text files, parse clean article bodies via URL scraping, or input plain text directly into the sandbox.
            </p>
          </div>

          <div className="group rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/50 hover:border-indigo-500/30 transition duration-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-650 dark:bg-purple-950/50 dark:text-purple-400">
              <Sliders className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Dynamic Control Settings</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Choose your target summary length (Short, Medium, Long) or output bullet points instead of narrative paragraphs.
            </p>
          </div>

          <div className="group rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/50 hover:border-indigo-500/30 transition duration-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-650 dark:bg-pink-950/50 dark:text-pink-400">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Tone Adjustment</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Refine tone outputs instantly. Transition summary structure from Formal and Simple to Beginner-friendly descriptions.
            </p>
          </div>

          <div className="group rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/50 hover:border-indigo-500/30 transition duration-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-655 dark:bg-emerald-950/50 dark:text-emerald-450">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Side-by-Side Comparison</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Toggle Comparison mode to generate and contrast short, medium, and long summaries side-by-side in real-time.
            </p>
          </div>

          <div className="group rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/50 hover:border-indigo-500/30 transition duration-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Compression Statistics</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              View live calculations of compression ratios, visual progress bars, word counts, and metadata evaluations.
            </p>
          </div>

          <div className="group rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/50 hover:border-indigo-500/30 transition duration-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-650 dark:bg-sky-950/50 dark:text-sky-400">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Local Model Deployment</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              The neural net is hosted locally in python, ensuring fast inference speeds, data privacy, and zero API costs.
            </p>
          </div>
        </div>
      </section>

      {/* Model Workflow Section */}
      <section className="relative mx-auto max-w-6xl px-4 py-12 mb-16">
        <div className="rounded-3xl border border-slate-200/50 bg-white/60 p-8 shadow-xl dark:border-slate-800/50 dark:bg-slate-900/60 backdrop-blur-md">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white md:text-2xl text-center mb-8">
            How the Transformer Pipeline Operates
          </h2>
          <div className="grid gap-6 md:grid-cols-3 relative">
            <div className="relative z-10 flex flex-col items-center text-center p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-extrabold shadow-lg shadow-indigo-600/20">1</div>
              <h3 className="mt-4 font-bold text-slate-900 dark:text-white">Input Text Ingestion</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                Articles are parsed and split. Prompts specifying Tone and Length parameters are prefixed to the text.
              </p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white font-extrabold shadow-lg shadow-purple-600/20">2</div>
              <h3 className="mt-4 font-bold text-slate-900 dark:text-white">T5 Abstractive Inference</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                The local T5 model encodes the inputs, executing encoder-decoder attention matrices to output optimized summary tokens.
              </p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-650 text-white font-extrabold shadow-lg shadow-pink-600/20">3</div>
              <h3 className="mt-4 font-bold text-slate-900 dark:text-white">Post-processing & Formatting</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                Prompt echoes are stripped, bullet layouts are structured, and compression analytics are computed for the UI.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
