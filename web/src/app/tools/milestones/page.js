"use client";

import { useState } from "react";
import { Target, Loader2 } from "lucide-react";
import ToolsShell from "../../components/tools/ToolsShell";
import ToolsQuotaBanner from "../../components/tools/ToolsQuotaBanner";
import { useToolsQuota } from "../../components/tools/useToolsQuota";

export default function MilestonesToolPage() {
  const { quota, loading, canRun, runTool } = useToolsQuota("milestones");
  const [current, setCurrent] = useState("12500");
  const [dailyGain, setDailyGain] = useState("45");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState("");

  const onRun = async (e) => {
    e.preventDefault();
    if (!canRun || running) return;
    setRunning(true);
    setRunError("");
    try {
      const data = await runTool("milestones", { current, dailyGain });
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
      title="Subscriber Milestones"
      description="ETA to 10K · 100K · 1M"
      icon={Target}
    >
      <p className="text-sm text-zinc-500">
        Project when you&apos;ll hit the next public milestones at your current daily net
        growth rate.
      </p>

      <ToolsQuotaBanner quota={quota} loading={loading} blockedError={runError} />

      <form onSubmit={onRun} className="space-y-6">
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
          <div className="border-b border-zinc-800/80 px-4 py-3 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Growth inputs
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5">
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Current subscribers
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={current}
                onChange={(e) => setCurrent(e.target.value.replace(/[^\d]/g, ""))}
                className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-sm font-bold text-white outline-none transition-colors focus:border-zinc-600"
                required
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Daily net growth
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={dailyGain}
                onChange={(e) =>
                  setDailyGain(e.target.value.replace(/[^\d.]/g, ""))
                }
                className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-sm font-bold text-white outline-none transition-colors focus:border-zinc-600"
                placeholder="e.g. 45"
                required
              />
            </label>
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
              Projecting…
            </>
          ) : (
            "Project · 1 run"
          )}
        </button>
      </form>

      {result && (
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
          <div className="border-b border-zinc-800/80 px-4 py-3 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Projections
            </p>
          </div>

          {result.next && (
            <div className="border-b border-zinc-800/80 px-4 py-4 sm:px-5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                Next milestone
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-white">
                {result.next.targetLabel}
              </p>
              <p className="mt-1 text-[12px] text-zinc-500">
                {result.next.days != null
                  ? `~${result.next.days.toLocaleString()} days · ETA ${result.next.eta}`
                  : "Enter daily growth for an ETA"}
              </p>
            </div>
          )}

          <div className="divide-y divide-zinc-800/80">
            {(result.projections || []).map((p) => (
              <div
                key={p.target}
                className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
              >
                <div>
                  <p className="text-xs font-bold text-white">{p.targetLabel}</p>
                  <p className="text-[11px] text-zinc-600">
                    {p.remaining.toLocaleString()} remaining
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-zinc-300">
                    {p.days != null ? `${p.days.toLocaleString()}d` : "—"}
                  </p>
                  <p className="text-[10px] text-zinc-600">{p.eta || ""}</p>
                </div>
              </div>
            ))}
          </div>

          {result.tip && (
            <div className="border-t border-zinc-800/80 px-4 py-3 sm:px-5">
              <p className="text-[11px] leading-relaxed text-zinc-500">{result.tip}</p>
            </div>
          )}
          {result.note && (
            <div className="border-t border-zinc-800/80 px-4 py-3 sm:px-5">
              <p className="text-[11px] text-zinc-500">{result.note}</p>
            </div>
          )}
        </section>
      )}
    </ToolsShell>
  );
}
