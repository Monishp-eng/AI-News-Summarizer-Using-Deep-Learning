import { NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/demo", label: "Demo" },
  { to: "/metrics", label: "Metrics" },
  { to: "/about", label: "About" },
];

function getLinkClass(isActive) {
  const base = "rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200";
  const active =
    "bg-gradient-to-r from-brand-500/20 to-indigo-500/20 text-brand-700 shadow-sm dark:from-brand-400/20 dark:to-indigo-400/20 dark:text-brand-200";
  const inactive = "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100";
  return `${base} ${isActive ? active : inactive}`;
}

export default function Navbar({ isDark, onToggleTheme }) {
  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/70 shadow-sm backdrop-blur-xl transition-colors dark:border-slate-800/80 dark:bg-slate-900/70">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <div className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100 md:text-lg">
          AI News Summarizer
        </div>

        <div className="flex items-center gap-2">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => getLinkClass(isActive)}>
              {item.label}
            </NavLink>
          ))}
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
        </div>
      </div>
    </nav>
  );
}
