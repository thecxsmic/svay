"use client";

import { useState } from "react";
import { ListOrdered, Copy, Check, Loader2 } from "lucide-react";
import ToolsShell from "../../components/tools/ToolsShell";
import ToolsQuotaBanner from "../../components/tools/ToolsQuotaBanner";
import { useToolsQuota } from "../../components/tools/useToolsQuota";

export default function ChaptersToolPage() {
  const { quota, loading, canRun, runTool } = useToolsQuota("chapters");
  const [chapters, setChapters] = useState(
    "0:00 Intro\n0:45 The problem\n2:10 Solution walkthrough\n5:00 Recap"
  );
  const [totalMinutes, setTotalMinutes] = useState("10");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState("");
  const [copied, setCopied] = useState(false);

  const onRun = async (e) => {
    e.preventDefault();
    if (!canRun || running || !chapters.trim()) return;
    setRunning(true);
    setRunError("");
    try {
      const data = await runTool("chapters", { chapters, totalMinutes });
      setResult(data.result);
    } catch (err) {
      setRunError(err.message);
      setResult(null);
    } finally {
      setRunning(false);
    }
  };

  const copyAll = async () => {
    if (!result?.formatted) return;
    try {
      await navigator.clipboard.writeText(result.formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <ToolsShell
      title="Chapter Timestamps"
      description="YouTube description chapters"
      icon={ListOrdered}
    >
      <p className="text-sm text-zinc-500">
        Format chapter markers for your description. First chapter is forced to 0:00. Need
        3+ for YouTube&apos;s chapter UI.
      </p>

      <ToolsQuotaBanner quota={quota} loading={loading} blockedError={runError} />

      <form onSubmit={onRun} className="space-y-6">
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
          <div className="border-b border-zinc-800/80 px-4 py-3 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Chapters (one per line)
            </p>
          </div>
          <div className="space-y-4 p-4 sm:p-5">
            <textarea
              value={chapters}
              onChange={(e) => setChapters(e.target.value.slice(0, 8000))}
              rows={8}
              placeholder={"0:00 Intro\n1:20 Setup\n3:00 Demo"}
              className="w-full resize-y rounded-md border border-zinc-800 bg-black px-3 py-2.5 font-mono text-sm text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-600"
              required
            />
            <label className="block max-w-xs space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Video length (min) — for auto-timing labels only
              </span>
              <input
                type="number"
                min={1}
                max={180}
                value={totalMinutes}
                onChange={(e) => setTotalMinutes(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-sm font-bold text-white outline-none transition-colors focus:border-zinc-600"
              />
            </label>
          </div>
        </section>

        <button
          type="submit"
          disabled={!canRun || running || loading || !chapters.trim()}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-white py-3 text-[11px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {running ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Formatting…
            </>
          ) : (
            "Format · 1 run"
          )}
        </button>
      </form>

      {result && (
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Output · {result.count} chapters
              {result.youtubeReady ? " · ready" : ""}
            </p>
            <button
              type="button"
              onClick={copyAll}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-800 bg-black px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap px-4 py-4 font-mono text-[12px] leading-relaxed text-zinc-300 sm:px-5">
            {result.formatted}
          </pre>
          {result.warnings?.length > 0 && (
            <ul className="space-y-1 border-t border-zinc-800/80 px-4 py-3 sm:px-5">
              {result.warnings.map((w) => (
                <li key={w} className="text-[11px] text-zinc-500">
                  · {w}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </ToolsShell>
  );
}
