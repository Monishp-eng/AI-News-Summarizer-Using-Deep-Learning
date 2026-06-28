import { useEffect, useState } from "react";
import axios from "axios";
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
          setError("Failed to load metrics. Ensure backend server is running and outputs/metrics.json exists.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-8 shadow-2xl shadow-slate-950/30 md:p-10">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-brand-600/20 via-indigo-500/15 to-emerald-500/20 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Analytics Dashboard</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">Model Metrics</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                ROUGE-based evaluation scores for abstractive summarization quality.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-right text-xs text-slate-300 shadow-lg">
              <p className="font-semibold uppercase tracking-[0.12em] text-slate-400">Live Evaluation</p>
              <p className="mt-1 text-sm text-white">Loaded from outputs/metrics.json</p>
            </div>
          </div>

          {loading && (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-300">
              Loading metrics...
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-900 bg-red-950 p-5 text-sm text-red-200">
              {error}
            </div>
          )}

          {!loading && !error && metrics && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <MetricsCard label="ROUGE-1" value={metrics.rouge1} />
              <MetricsCard label="ROUGE-2" value={metrics.rouge2} />
              <MetricsCard label="ROUGE-L" value={metrics.rougeL} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
