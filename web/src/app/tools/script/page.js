"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import ToolsShell from "../../components/tools/ToolsShell";
import ToolsQuotaBanner from "../../components/tools/ToolsQuotaBanner";
import { useToolsQuota } from "../../components/tools/useToolsQuota";

export default function ScriptToolPage() {
  const { quota, loading, canRun, runTool } = useToolsQuota("script");
  const [script, setScript] = useState("");
  const [wpm, setWpm] = useState("150");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState("");

  const onRun = async (e) => {
    e.preventDefault();
    if (!canRun || running || !script.trim()) return;
    setRunning(true);
    setRunError("");
    try {
      const data = await runTool("script", { script, wpm });
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
      title="Script Duration"
      description="Words → speaking time"
      icon={FileText}
    >
      <p className="text-sm text-zinc-500">
        Paste a draft script to estimate runtime. Default 150 WPM is a natural talking pace.
      </p>

      <ToolsQuotaBanner quota={quota} loading={loading} blockedError={runError} />

      <form onSubmit={onRun} className="space-y-6">
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
          <div className="border-b border-zinc-800/80 px-4 py-3 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Script
            </p>
          </div>
          <div className="space-y-4 p-4 sm:p-5">
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value.slice(0, 20000))}
              rows={10}
              placeholder="Paste your voiceover or talking points…"
              className="w-full resize-y rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-sm font-medium text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-600"
              required
            />
            <label className="block max-w-xs space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Speaking pace (WPM)
              </span>
              <input
                type="number"
                min={100}
                max={220}
                value={wpm}
                onChange={(e) => setWpm(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-sm font-bold text-white outline-none transition-colors focus:border-zinc-600"
              />
            </label>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              {script.split(/\s+/).filter(Boolean).length} words · {script.length} chars
            </p>
          </div>
        </section>

        <button
          type="submit"
          disabled={!canRun || running || loading || !script.trim()}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-white py-3 text-[11px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {running ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Estimating…
            </>
          ) : (
            "Estimate · 1 run"
          )}
        </button>
      </form>

      {result && (
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Duration
            </p>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              {result.format}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 sm:p-5">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                Spoken
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight text-white">
                {result.duration}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                + B-roll padding
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight text-white">
                {result.withBrollDuration}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                Words @ {result.wpm} WPM
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight text-white">
                {result.words.toLocaleString()}
              </p>
            </div>
          </div>
          {result.tips?.length > 0 && (
            <ul className="space-y-1.5 border-t border-zinc-800/80 px-4 py-3 sm:px-5">
              {result.tips.map((t) => (
                <li key={t} className="text-[11px] leading-relaxed text-zinc-500">
                  · {t}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </ToolsShell>
  );
}
