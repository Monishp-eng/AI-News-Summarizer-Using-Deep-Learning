import { NavLink } from "react-router-dom";
import { Sparkles, BarChart3, HelpCircle, Terminal, Cpu } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { to: "/", label: "Home", icon: Sparkles },
  { to: "/demo", label: "Workspace", icon: Terminal },
  { to: "/metrics", label: "Metrics", icon: BarChart3 },
  { to: "/about", label: "About", icon: HelpCircle },
];

function getLinkClass(isActive) {
  const base = "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200";
  const active =
    "bg-indigo-500/10 text-indigo-600 shadow-sm dark:bg-indigo-400/10 dark:text-indigo-300";
  const inactive = "text-slate-650 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100";
  return `${base} ${isActive ? active : inactive}`;
}

export default function Navbar({ isDark, onToggleTheme }) {
  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200/40 bg-white/80 shadow-sm backdrop-blur-md dark:border-slate-800/40 dark:bg-slate-950/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <NavLink to="/" className="flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900 dark:text-white md:text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20">
            <Cpu className="h-4.5 w-4.5" />
          </div>
          <span>
            AI News <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">Summarizer</span>
          </span>
        </NavLink>

        <div className="flex items-center gap-1.5 md:gap-3">
          <div className="flex items-center gap-1 md:gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => getLinkClass(isActive)}>
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
        </div>
      </div>
    </nav>
  );
}
