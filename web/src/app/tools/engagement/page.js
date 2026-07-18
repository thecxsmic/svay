"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import ToolsShell from "../../components/tools/ToolsShell";
import ToolsQuotaBanner from "../../components/tools/ToolsQuotaBanner";
import { useToolsQuota } from "../../components/tools/useToolsQuota";

export default function EngagementToolPage() {
  const { quota, loading, canRun, runTool } = useToolsQuota("engagement");
  const [views, setViews] = useState("100000");
  const [likes, setLikes] = useState("4500");
  const [comments, setComments] = useState("320");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState("");

  const onRun = async (e) => {
    e.preventDefault();
    if (!canRun || running) return;
    setRunning(true);
    setRunError("");
    try {
      const data = await runTool("engagement", { views, likes, comments });
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
      title="Engagement Rate"
      description="Likes · comments · views"
      icon={Heart}
    >
      <p className="text-sm text-zinc-500">
        Measure how hard a video is working per view. Weighted score counts comments more
        heavily.
      </p>

      <ToolsQuotaBanner quota={quota} loading={loading} blockedError={runError} />

      <form onSubmit={onRun} className="space-y-6">
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
          <div className="border-b border-zinc-800/80 px-4 py-3 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Video stats
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3 sm:p-5">
            {[
              { label: "Views", value: views, set: setViews },
              { label: "Likes", value: likes, set: setLikes },
              { label: "Comments", value: comments, set: setComments },
            ].map(({ label, value, set }) => (
              <label key={label} className="block space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {label}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={value}
                  onChange={(e) => set(e.target.value.replace(/[^\d]/g, ""))}
                  className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-sm font-bold text-white outline-none transition-colors focus:border-zinc-600"
                  required
                />
              </label>
            ))}
          </div>
        </section>

        <button
          type="submit"
          disabled={!canRun || running || loading}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-white py-3 text-[11px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {running ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Calculating…
            </>
          ) : (
            "Calculate · 1 run"
          )}
        </button>
      </form>

      {result && (
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Result
            </p>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              {result.level}
            </span>
          </div>
          <div className="p-4 sm:p-5">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold tracking-tight text-white tabular-nums">
                {result.engagement}
              </span>
              <span className="mb-1 text-xs font-bold text-zinc-500">%</span>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">{result.tip}</p>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-zinc-800/80 pt-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                  Like rate
                </p>
                <p className="mt-1 text-sm font-bold text-zinc-200">{result.likeRate}%</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                  Comment rate
                </p>
                <p className="mt-1 text-sm font-bold text-zinc-200">
                  {result.commentRate}%
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-zinc-800/80 px-4 py-3 sm:px-5">
            <p className="text-[11px] leading-relaxed text-zinc-600">
              Formula: (likes + comments × 2) ÷ views × 100. Benchmarks vary by niche.
            </p>
          </div>
        </section>
      )}
    </ToolsShell>
  );
}
