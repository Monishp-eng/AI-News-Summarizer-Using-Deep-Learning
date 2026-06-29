import { Award } from "lucide-react";

export default function MetricsCard({ label, value }) {
  const percentage = Math.max(0, Math.min(100, value * 100));
  
  // Radial gauge settings
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md dark:border-slate-800 dark:bg-slate-900 transition-all duration-300 hover:border-indigo-500/25 flex items-center justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <Award className="h-4 w-4 text-indigo-500" />
          <p className="text-xs font-bold uppercase tracking-wider">{label}</p>
        </div>
        <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
          {percentage.toFixed(2)}%
        </p>
        <p className="text-[10px] text-slate-500">
          Raw index score: <span className="font-mono">{value.toFixed(4)}</span>
        </p>
      </div>

      {/* Radial SVG Gauge */}
      <div className="relative h-20 w-20 flex items-center justify-center shrink-0">
        <svg className="h-full w-full -rotate-90">
          {/* Track Circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            className="stroke-slate-100 dark:stroke-slate-950 fill-transparent"
            strokeWidth="6"
          />
          {/* Active Circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            className="stroke-indigo-600 dark:stroke-indigo-500 fill-transparent transition-all duration-1000 ease-out"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-[10px] font-bold text-slate-650 dark:text-slate-350">
          ROUGE
        </span>
      </div>
    </div>
  );
}