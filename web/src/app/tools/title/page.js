"use client";

import { useState } from "react";
import { Type, Check, AlertTriangle, Loader2 } from "lucide-react";
import ToolsShell from "../../components/tools/ToolsShell";
import ToolsQuotaBanner from "../../components/tools/ToolsQuotaBanner";
import { useToolsQuota } from "../../components/tools/useToolsQuota";

export default function TitleToolPage() {
  const { quota, loading, canRun, runTool } = useToolsQuota("title");
  const [title, setTitle] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState("");

  const onRun = async (e) => {
    e.preventDefault();
    if (!canRun || running || !title.trim()) return;
    setRunning(true);
    setRunError("");
    try {
      const data = await runTool("title", { title });
      setAnalysis(data.result);
    } catch (err) {
      setRunError(err.message);
      setAnalysis(null);
    } finally {
      setRunning(false);
    }
  };

  return (
    <ToolsShell title="Title Analyzer" description="Length · hooks · truncation" icon={Type}>
      <p className="text-sm text-zinc-500">
        Paste a draft title and run analysis. Each run uses one free-tool credit.
      </p>

      <ToolsQuotaBanner quota={quota} loading={loading} blockedError={runError} />

      <form onSubmit={onRun} className="space-y-6">
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
          <div className="border-b border-zinc-800/80 px-4 py-3 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Your title
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 120))}
              rows={3}
              placeholder="e.g. I Tested 7 AI Tools for 30 Days — Here's What Actually Worked"
              className="w-full resize-none rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-sm font-medium text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-600"
              required
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              <span>{title.length} / 120 chars</span>
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={!canRun || running || loading || !title.trim()}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-white py-3 text-[11px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {running ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Analyzing…
            </>
          ) : (
            "Analyze · 1 run"
          )}
        </button>
      </form>

      {analysis && (
        <>
          <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
            <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 sm:px-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Score
              </p>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                {analysis.level}
              </span>
            </div>
            <div className="p-4 sm:p-5">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold tracking-tight text-white tabular-nums">
                  {analysis.score}
                </span>
                <span className="mb-1 text-xs font-bold text-zinc-500">/ 100</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-900">
                <div
                  className="h-full rounded-full bg-white transition-all duration-300"
                  style={{ width: `${analysis.score}%` }}
                />
              </div>
              <p className="mt-3 text-[11px] text-zinc-600">
                {analysis.len} chars · {analysis.words} words
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
            <div className="border-b border-zinc-800/80 px-4 py-3 sm:px-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Truncation preview
              </p>
            </div>
            <div className="divide-y divide-zinc-800/80">
              <div className="px-4 py-3.5 sm:px-5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                  Mobile search (~50)
                </p>
                <p className="mt-1 text-sm text-zinc-300">
                  {analysis.mobileCut}
                  {analysis.len > 50 && <span className="text-zinc-600">…</span>}
                </p>
              </div>
              <div className="px-4 py-3.5 sm:px-5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                  Desktop search (~70)
                </p>
                <p className="mt-1 text-sm text-zinc-300">
                  {analysis.desktopCut}
                  {analysis.len > 70 && <span className="text-zinc-600">…</span>}
                </p>
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
              {(analysis.checks || []).map((c) => (
                <li
                  key={c.text}
                  className="flex items-start gap-2.5 px-4 py-3 text-[12px] text-zinc-400 sm:px-5"
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
