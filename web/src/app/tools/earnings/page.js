"use client";

import { useState } from "react";
import { DollarSign, Loader2 } from "lucide-react";
import ToolsShell from "../../components/tools/ToolsShell";
import ToolsQuotaBanner from "../../components/tools/ToolsQuotaBanner";
import { useToolsQuota } from "../../components/tools/useToolsQuota";

function formatMoney(n, symbol = "$") {
  if (!Number.isFinite(n)) return `${symbol}0`;
  if (n >= 1_000_000) return `${symbol}${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${symbol}${(n / 1_000).toFixed(1)}K`;
  return `${symbol}${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function EarningsToolPage() {
  const { quota, regions, loading, canRun, runTool } = useToolsQuota("earnings");
  const [views, setViews] = useState("100000");
  const [region, setRegion] = useState("US");
  const [customRpm, setCustomRpm] = useState("");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState("");

  const onRun = async (e) => {
    e.preventDefault();
    if (!canRun || running) return;
    setRunning(true);
    setRunError("");
    try {
      const data = await runTool("earnings", {
        views,
        region,
        customRpm,
      });
      setResult(data.result);
    } catch (err) {
      setRunError(err.message);
      setResult(null);
    } finally {
      setRunning(false);
    }
  };

  const regionOptions =
    regions.length > 0
      ? regions
      : [{ code: "US", rpm: 4, currency: "USD" }];

  return (
    <ToolsShell
      title="Earnings Calculator"
      description="Estimate ad revenue from views"
      icon={DollarSign}
    >
      <p className="text-sm text-zinc-500">
        Rough CPM-based estimate for planning. Each calculation uses one free-tool run.
      </p>

      <ToolsQuotaBanner quota={quota} loading={loading} blockedError={runError} />

      <form onSubmit={onRun} className="space-y-6">
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
          <div className="border-b border-zinc-800/80 px-4 py-3 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Inputs
            </p>
          </div>
          <div className="space-y-4 p-4 sm:p-5">
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Views
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={views}
                onChange={(e) => setViews(e.target.value.replace(/[^\d,]/g, ""))}
                className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-sm font-bold text-white outline-none transition-colors focus:border-zinc-600"
                placeholder="100000"
                required
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Audience region
              </span>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full cursor-pointer rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-sm font-bold text-white outline-none transition-colors focus:border-zinc-600"
              >
                {regionOptions.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.code} · ~${Number(r.rpm).toFixed(2)} RPM
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Custom RPM (optional)
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                max="500"
                value={customRpm}
                onChange={(e) => setCustomRpm(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-sm font-bold text-white outline-none transition-colors focus:border-zinc-600"
                placeholder="Override default RPM"
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
              Calculating…
            </>
          ) : (
            "Calculate · 1 run"
          )}
        </button>
      </form>

      {result && (
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
          <div className="border-b border-zinc-800/80 px-4 py-3 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Estimate
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 sm:p-5">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                USD
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight text-white">
                {formatMoney(result.usd, "$")}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                Local ({result.currency})
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight text-white">
                {formatMoney(result.local, result.symbol)}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                RPM used
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight text-white">
                ${Number(result.rpm).toFixed(2)}
                {result.usedCustom && (
                  <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    custom
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="border-t border-zinc-800/80 px-4 py-3 sm:px-5">
            <p className="text-[11px] leading-relaxed text-zinc-600">
              Formula: views × RPM ÷ 1000. Assumes monetized views only.
            </p>
          </div>
        </section>
      )}
    </ToolsShell>
  );
}
