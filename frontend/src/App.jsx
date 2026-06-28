import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import AboutPage from "./pages/AboutPage";
import DemoPage from "./pages/DemoPage";
import HomePage from "./pages/HomePage";
import MetricsPage from "./pages/MetricsPage";

const THEME_KEY = "ai-news-theme";

function getInitialTheme() {
  const persisted = localStorage.getItem(THEME_KEY);
  if (persisted === "light" || persisted === "dark") {
    return persisted;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const isDark = useMemo(() => theme === "dark", [theme]);
  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <Navbar isDark={isDark} onToggleTheme={toggleTheme} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/metrics" element={<MetricsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
