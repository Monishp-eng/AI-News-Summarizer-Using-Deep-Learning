const tabClass = (isActive) => {
  const base = "rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200";
  const active = "bg-brand-600 text-white shadow-sm";
  const inactive = "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700";
  return `${base} ${isActive ? active : inactive}`;
};

export default function InputTabs({
  inputType,
  setInputType,
  articleInputs,
  onArticleChange,
  onAddArticle,
  onRemoveArticle,
  bulkPasteText,
  setBulkPasteText,
  onSplitBulkText,
  urlInput,
  setUrlInput,
  fileName,
  fileCharCount,
  onFilePicked,
  charCount,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setInputType("text")} className={tabClass(inputType === "text")}>
          Text
        </button>
        <button type="button" onClick={() => setInputType("url")} className={tabClass(inputType === "url")}>
          URL
        </button>
        <button type="button" onClick={() => setInputType("file")} className={tabClass(inputType === "file")}>
          File
        </button>
      </div>

      {inputType === "text" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                  Bulk paste helper
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Paste multiple articles separated by blank lines, then split them into article cards.
                </p>
              </div>
              <button
                type="button"
                onClick={onSplitBulkText}
                className="rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:from-brand-700 hover:to-indigo-700"
              >
                Split by Blank Lines
              </button>
            </div>
            <textarea
              value={bulkPasteText}
              onChange={(event) => setBulkPasteText(event.target.value)}
              placeholder="Article 1...\n\nArticle 2...\n\nArticle 3..."
              rows={5}
              className="mt-4 w-full resize-y rounded-2xl border border-slate-300 bg-white p-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900"
            />
          </div>

          {articleInputs.map((value, index) => (
            <div key={`article-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                  Article {index + 1}
                </p>
                {articleInputs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveArticle(index)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Remove
                  </button>
                )}
              </div>
              <textarea
                value={value}
                onChange={(event) => onArticleChange(index, event.target.value)}
                placeholder="Paste news article..."
                rows={6}
                className="w-full resize-y rounded-xl border border-slate-300 bg-white p-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={onAddArticle}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Add Article
          </button>
        </div>
      )}

      {inputType === "url" && (
        <div className="space-y-3">
          <input
            type="url"
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            placeholder="Paste article URL..."
            className="w-full rounded-2xl border border-slate-300 bg-white p-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-brand-900"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tip: If URL extraction is blocked by the source site, paste the article in Text tab.
          </p>
        </div>
      )}

      {inputType === "file" && (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center transition hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Drag and drop a text file, or click to upload</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">.txt files recommended</span>
          <input
            type="file"
            accept=".txt,text/plain"
            className="hidden"
            onChange={(event) => onFilePicked(event.target.files?.[0] || null)}
          />
          {fileName && (
            <span className="rounded-lg bg-slate-200 px-3 py-1 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-100">
              {fileName} ({fileCharCount} chars)
            </span>
          )}
        </label>
      )}

      <div className="mt-3 text-right text-xs text-slate-500 dark:text-slate-400">
        Character count:{" "}
        <span className={charCount > 10000 ? "font-bold text-red-500 dark:text-red-400" : ""}>
          {charCount.toLocaleString()}
        </span>{" "}
        / 10,000
      </div>
    </div>
  );
}