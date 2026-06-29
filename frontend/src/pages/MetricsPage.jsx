import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart3, TrendingUp, Info, HelpCircle, Activity, CheckCircle, ShieldAlert } from "lucide-react";
import MetricsCard from "../components/MetricsCard";

const METRICS_API_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("/summarize", "/metrics")
  : "http://localhost:8000/metrics";

export default function MetricsPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await axios.get(METRICS_API_URL, { timeout: 15000 });
        setMetrics(response.data);
      } catch (err) {
        if (err.code === "ECONNABORTED") {
          setError("Failed to load metrics: request timed out.");
        } else {
          setError("Failed to load metrics. Ensure the backend server is running and outputs/metrics.json exists.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="relative overflow-hidden bg-slate-50 dark:bg-slate-950 flex-1">
      <div className="absolute inset-0 bg-grid-pattern opacity-100 pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 pointer-events-none h-[400px] w-[400px] rounded-full bg-violet-500/5 blur-3xl" />

      <section className="relative mx-auto w-full max-w-6xl px-4 py-8 space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/50 pb-5">
          <div>
            <div className="flex items-center gap-2 text-indigo-650 dark:text-indigo-400">
              <BarChart3 className="h-5 w-5" />
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-2xl">
                Model Evaluation Analytics
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-650 dark:text-slate-400">
              ROUGE performance indices computed against human-written ground truth summaries.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-indigo-50/50 border border-indigo-200 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-950 dark:bg-indigo-950/40 dark:text-indigo-400">
            <Activity className="h-3.5 w-3.5" />
            <span>BBC-News Benchmark Suite</span>
          </div>
        </header>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-center gap-3">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <span className="text-xs font-medium text-slate-650 dark:text-slate-350">
              Fetching dataset metrics...
            </span>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-55/20 p-5 dark:border-red-950/20 dark:bg-red-950/10 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-red-800 dark:text-red-300">Data Fetch Conflict</p>
              <p className="text-[11px] text-red-650 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && metrics && (
          <div className="space-y-6">
            {/* Primary Scores Grid */}
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricsCard label="ROUGE-1" value={metrics.rouge1} />
              <MetricsCard label="ROUGE-2" value={metrics.rouge2} />
              <MetricsCard label="ROUGE-L" value={metrics.rougeL} />
            </div>

            {/* Explanatory Context */}
            <div className="grid gap-6 md:grid-cols-12">
              <div className="md:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h2 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-1.5">
                  <TrendingUp className="h-4.5 w-4.5 text-indigo-550" />
                  <span>Evaluation Reference Guide</span>
                </h2>
                
                <div className="space-y-4 text-xs leading-relaxed text-slate-650 dark:text-slate-350">
                  <div className="grid gap-1 border-l-2 border-indigo-500 pl-3">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">ROUGE-1 (Unigram Overlap)</p>
                    <p className="text-slate-600 dark:text-slate-400">
                      Measures the overlap of individual words between the model summary and human reference. High scores indicate key vocabulary extraction.
                    </p>
                  </div>
                  
                  <div className="grid gap-1 border-l-2 border-purple-500 pl-3">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">ROUGE-2 (Bigram Overlap)</p>
                    <p className="text-slate-600 dark:text-slate-400">
                      Measures the overlap of two-word word pairs. Evaluates grammatical fluency, word sequencing, and local phrase generation quality.
                    </p>
                  </div>

                  <div className="grid gap-1 border-l-2 border-pink-500 pl-3">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">ROUGE-L (Longest Common Subsequence)</p>
                    <p className="text-slate-600 dark:text-slate-400">
                      Evaluates structure by measuring the longest shared sequence of words. Captures global sentence structure similarity and sequence consistency.
                    </p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h2 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-1.5">
                    <HelpCircle className="h-4.5 w-4.5 text-indigo-550" />
                    <span>Metadata Summary</span>
                  </h2>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    Evaluation runs automatically download dataset splits from Hugging Face, run batch inference in memory, and calculate ROUGE values using local metrics packages.
                  </p>
                </div>
                
                <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-100 dark:border-slate-850/60 flex items-center gap-2">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span className="text-[10px] font-semibold text-slate-500">
                    Metrics synchronized: <strong>Live from outputs/metrics.json</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
