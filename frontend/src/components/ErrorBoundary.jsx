import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-6 text-center dark:bg-slate-950">
          <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-xl dark:border-red-950 dark:bg-slate-900">
            <h1 className="text-xl font-bold text-red-600 dark:text-red-400 font-sans">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              An unexpected error has occurred in the application.
            </p>
            <pre className="mt-4 overflow-auto rounded-lg bg-slate-100 p-3 text-left text-xs text-slate-700 dark:bg-slate-950 dark:text-slate-300 max-h-40">
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
