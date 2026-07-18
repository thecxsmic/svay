"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

function formatDate(isoOrUnix) {
  if (!isoOrUnix) return "—";
  const d =
    typeof isoOrUnix === "number"
      ? new Date(isoOrUnix * 1000)
      : new Date(isoOrUnix);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusLabel({ billing }) {
  if (!billing?.hasSubscription) {
    return <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">None</span>;
  }
  if (billing.cancelAtNextBillingDate) {
    return <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">Canceling</span>;
  }
  if (billing.isActive) {
    return <span className="text-[10px] font-bold uppercase tracking-widest text-geist-success">Active</span>;
  }
  if (billing.status === "on_hold") {
    return <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">On hold</span>;
  }
  return (
    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 capitalize">
      {billing.status || "Unknown"}
    </span>
  );
}

export default function BillingPage() {
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/billing");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load billing");
      setBilling(data.billing);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (action, extra = {}) => {
    setActionLoading(action);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      if (action === "portal" && data.portalUrl) {
        window.location.href = data.portalUrl;
        return;
      }

      if (data.billing) setBilling(data.billing);
      if (data.message) setMessage(data.message);
      setConfirmCancel(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !billing) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <RefreshCw className="mb-4 h-8 w-8 animate-spin text-geist-success" />
        <p className="text-xs font-bold uppercase tracking-widest text-accents-4">
          Loading Billing...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* Sticky header — same pattern as Library / Analytics */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
              <CreditCard className="h-5 w-5 text-black" />
            </div>
            <h1 className="font-display text-lg uppercase tracking-tight">
              Billing
            </h1>
          </div>

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              load();
            }}
            disabled={!!actionLoading || loading}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-xs text-red-400">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        {message && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-xs text-emerald-400">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>{message}</p>
          </div>
        )}

        {!billing?.hasSubscription ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
              <CreditCard className="h-5 w-5 text-zinc-500" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              No active plan
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-xs text-zinc-500">
              Subscribe to Pro to unlock the full dashboard.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center rounded-md bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200"
            >
              Go to dashboard
            </Link>
          </div>
        ) : (
          <>
            {/* Plan card */}
            <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
              <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 sm:px-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Current plan
                </p>
                <StatusLabel billing={billing} />
              </div>

              <div className="px-4 py-5 sm:px-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-white">
                    {billing.planName}
                  </h2>
                  {billing.amountDisplay && (
                    <span className="text-xs font-bold text-zinc-400">
                      {billing.amountDisplay}
                    </span>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                      {billing.cancelAtNextBillingDate ? "Access until" : "Next billing"}
                    </p>
                    <p className="mt-1 text-xs font-bold text-zinc-200">
                      {formatDate(billing.nextBillingDate || billing.currentPeriodEnd)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                      Type
                    </p>
                    <p className="mt-1 text-xs font-bold text-zinc-200">
                      {billing.isPromo
                        ? "Promo / grant"
                        : billing.isDodo
                          ? "Paid (Dodo)"
                          : "Subscription"}
                    </p>
                  </div>
                </div>

                {billing.cancelAtNextBillingDate && (
                  <p className="mt-4 border-t border-white/5 pt-4 text-[11px] leading-relaxed text-yellow-500/90">
                    Scheduled to cancel. Full access until{" "}
                    {formatDate(billing.nextBillingDate || billing.currentPeriodEnd)}.
                  </p>
                )}

                {billing.isPromo && (
                  <p className="mt-4 border-t border-white/5 pt-4 text-[11px] leading-relaxed text-zinc-500">
                    Promo or admin grant — not billed through Dodo.
                    {billing.currentPeriodEnd
                      ? ` Ends ${formatDate(billing.currentPeriodEnd)}.`
                      : ""}
                  </p>
                )}
              </div>
            </section>

            {/* Actions */}
            {billing.canManage && (
              <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
                <div className="border-b border-zinc-800/80 px-4 py-3 sm:px-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Actions
                  </p>
                </div>

                <div className="divide-y divide-zinc-800/80">
                  <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                      <p className="text-xs font-bold text-white">Payment method</p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        Update card, invoices, billing email via Dodo portal
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => runAction("portal")}
                      disabled={!!actionLoading}
                      className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
                    >
                      {actionLoading === "portal" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          Manage
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                      <p className="text-xs font-bold text-white">Subscription</p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        {billing.cancelAtNextBillingDate
                          ? "Resume to keep renewing after the current period"
                          : "Cancel at period end — keep access until then"}
                      </p>
                    </div>

                    {billing.cancelAtNextBillingDate ? (
                      <button
                        type="button"
                        onClick={() => runAction("resume")}
                        disabled={!!actionLoading}
                        className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-zinc-700 bg-transparent px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/5 disabled:opacity-50"
                      >
                        {actionLoading === "resume" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Resume"
                        )}
                      </button>
                    ) : !confirmCancel ? (
                      <button
                        type="button"
                        onClick={() => setConfirmCancel(true)}
                        disabled={!!actionLoading || !billing.isActive}
                        className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-zinc-800 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 transition-colors hover:border-red-500/30 hover:text-red-400 disabled:opacity-40"
                      >
                        Cancel
                      </button>
                    ) : (
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmCancel(false)}
                          disabled={!!actionLoading}
                          className="cursor-pointer rounded-md border border-zinc-800 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white disabled:opacity-50"
                        >
                          Keep
                        </button>
                        <button
                          type="button"
                          onClick={() => runAction("cancel")}
                          disabled={!!actionLoading}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-red-600 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-red-500 disabled:opacity-50"
                        >
                          {actionLoading === "cancel" ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Confirm"
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            <p className="text-center text-[10px] text-zinc-600">
              <Link href="/support" className="hover:text-zinc-400">
                Need help? Contact support
              </Link>
              {" · "}
              <Link href="/refund" className="hover:text-zinc-400">
                Refund policy
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
