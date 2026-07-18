"use client";

import Link from "next/link";
import { AlertTriangle, Lock, UserPlus, Crown, Loader2 } from "lucide-react";
import { formatReset } from "./useToolsQuota";

/**
 * Account tier + daily remaining + upgrade CTAs for free tools.
 */
export default function ToolsQuotaBanner({ quota, loading, blockedError }) {
  if (loading && !quota) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-[11px] text-zinc-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Checking account limits…
      </div>
    );
  }

  if (!quota) return null;

  const exhausted = !quota.canRun || (blockedError && blockedError.length > 0);
  const tierLabel = quota.tierLabel || quota.tier;
  const remaining = quota.remaining ?? quota.global?.remaining ?? 0;
  const limit = quota.global?.limit ?? 0;

  return (
    <div className="space-y-3">
      <div
        className={`rounded-lg border px-4 py-3 sm:px-5 ${
          exhausted
            ? "border-red-500/20 bg-red-500/5"
            : "border-zinc-800 bg-zinc-950/50"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded border border-zinc-800 bg-black px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
              {tierLabel}
            </span>
            <span className="text-[11px] text-zinc-500">
              <span className="font-bold text-zinc-300">{remaining}</span>
              {" / "}
              {limit} runs left today
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
            Resets in {formatReset(quota.resetsInSeconds)}
          </span>
        </div>

        {quota.tool && (
          <p className="mt-2 text-[11px] text-zinc-600">
            This tool:{" "}
            <span className="font-bold text-zinc-400">
              {quota.tool.remaining}/{quota.tool.limit}
            </span>{" "}
            · Burst {quota.limits?.burstPerMin ?? "—"}/min
          </p>
        )}

        {(blockedError || exhausted) && (
          <div className="mt-3 flex items-start gap-2 border-t border-white/5 pt-3">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
            <p className="text-[12px] leading-relaxed text-red-300/90">
              {blockedError ||
                "Daily free-tool limit reached. Sign in or upgrade for higher caps."}
            </p>
          </div>
        )}
      </div>

      {/* Account CTAs */}
      {(quota.upgrades?.signIn || quota.upgrades?.pro || quota.isDemo) && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {quota.upgrades?.signIn && (
            <Link
              href="/sign-in"
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3.5 transition-colors hover:border-zinc-700 hover:bg-zinc-950"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/5">
                <UserPlus className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white">Create free account</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  Higher daily caps · runs tracked to your account
                </p>
              </div>
            </Link>
          )}

          {(quota.upgrades?.pro || quota.isDemo) && (
            <Link
              href="/sign-in"
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3.5 transition-colors hover:border-zinc-700 hover:bg-zinc-950"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/5">
                <Crown className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white">Upgrade to Pro</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  Highest tool caps + full intelligence dashboard
                </p>
              </div>
            </Link>
          )}

          {quota.tier === "anonymous" && (
            <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3.5 sm:col-span-2">
              <Lock className="h-4 w-4 shrink-0 text-zinc-600" />
              <p className="text-[11px] text-zinc-500">
                Guest sessions are capped and bound to this browser + network (IP). Clearing
                cookies does not reset the network limit.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
