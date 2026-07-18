"use client";

import { useState } from "react";
import { SearchCode, Check, AlertTriangle, Loader2 } from "lucide-react";
import ToolsShell from "../../components/tools/ToolsShell";
import ToolsQuotaBanner from "../../components/tools/ToolsQuotaBanner";
import { useToolsQuota } from "../../components/tools/useToolsQuota";

export default function SeoToolPage() {
  const { quota, loading, canRun, runTool } = useToolsQuota("seo");
  const [keyword, setKeyword] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState("");

  const onRun = async (e) => {
    e.preventDefault();
    if (!canRun || running || !keyword.trim()) return;
    setRunning(true);
    setRunError("");
    try {
      const data = await runTool("seo", { keyword, title, description });
      setResult(data.result);
    } catch (err) {
      setRunError(err.message);
      setResult(null);
    } finally {
      setRunning(false);
    }
  };

  return (
    <ToolsShell
      title="Keyword SEO Check"
      description="Title · description · density"
      icon={SearchCode}
    >
      <p className="text-sm text-zinc-500">
        Check whether your target keyword is placed well in the title and description —
        without stuffing.
      </p>

      <ToolsQuotaBanner quota={quota} loading={loading} blockedError={runError} />

      <form onSubmit={onRun} className="space-y-6">
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
          <div className="border-b border-zinc-800/80 px-4 py-3 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Metadata
            </p>
          </div>
          <div className="space-y-4 p-4 sm:p-5">
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Target keyword
              </span>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value.slice(0, 80))}
                className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-sm font-medium text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-600"
                placeholder="e.g. faceless youtube channel"
                required
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Title
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-sm font-medium text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-600"
                placeholder="Video title"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Description
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
                rows={5}
                className="w-full resize-y rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-sm font-medium text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-600"
                placeholder="Paste your description…"
              />
            </label>
          </div>
        </section>

        <button
          type="submit"
          disabled={
            !canRun ||
            running ||
            loading ||
            !keyword.trim() ||
            (!title.trim() && !description.trim())
          }
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-white py-3 text-[11px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {running ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Checking…
            </>
          ) : (
            "Check SEO · 1 run"
          )}
        </button>
      </form>

      {result && (
        <>
          <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
            <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 sm:px-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Score
              </p>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                {result.level}
              </span>
            </div>
            <div className="p-4 sm:p-5">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold tracking-tight text-white tabular-nums">
                  {result.score}
                </span>
                <span className="mb-1 text-xs font-bold text-zinc-500">/ 100</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-900">
                <div
                  className="h-full rounded-full bg-white transition-all duration-300"
                  style={{ width: `${result.score}%` }}
                />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-zinc-800/80 pt-4 sm:grid-cols-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                    In title
                  </p>
                  <p className="mt-1 text-sm font-bold text-zinc-200">
                    {result.titleHas ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                    In description
                  </p>
                  <p className="mt-1 text-sm font-bold text-zinc-200">
                    {result.descHas ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                    Density
                  </p>
                  <p className="mt-1 text-sm font-bold text-zinc-200">{result.density}%</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                    Desc hits
                  </p>
                  <p className="mt-1 text-sm font-bold text-zinc-200">{result.descCount}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
            <div className="border-b border-zinc-800/80 px-4 py-3 sm:px-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Checklist
              </p>
            </div>
            <ul className="divide-y divide-zinc-800/80">
              {(result.checks || []).map((c) => (
                <li
                  key={c.text}
                  className="flex items-start gap-2.5 px-4 py-3 text-[12px] sm:px-5"
                >
                  {c.ok ? (
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
                  )}
                  <span className={c.ok ? "text-zinc-300" : "text-zinc-500"}>{c.text}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </ToolsShell>
  );
}
