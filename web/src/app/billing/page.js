"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import {
  PageLoader,
  EmptyState,
  DashPage,
  DashToolbar,
  DashBody,
  DashButton,
  DashAlert,
  DashPanel,
  ButtonSpinner,
  MetaChip,
} from "../components/dashboard/ui";

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
    return <PageLoader label="Loading billing…" />;
  }

  return (
    <DashPage>
      <DashToolbar
        left={
          billing?.hasSubscription ? (
            <MetaChip icon={CreditCard}>
              {billing.planName || "Plan"}
            </MetaChip>
          ) : (
            <MetaChip>No active plan</MetaChip>
          )
        }
      >
        <DashButton
          variant="secondary"
          size="sm"
          onClick={() => {
            setLoading(true);
            load();
          }}
          disabled={!!actionLoading || loading}
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </DashButton>
      </DashToolbar>

      <DashBody narrow className="space-y-6">
        {error && <DashAlert variant="error">{error}</DashAlert>}
        {message && <DashAlert variant="success">{message}</DashAlert>}

        {!billing?.hasSubscription ? (
          <EmptyState
            icon={CreditCard}
            title="No active plan"
            description="Subscribe to Pro to unlock the full dashboard."
            compact
            action={
              <Link
                href="/"
                className="inline-flex items-center rounded-xl bg-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200"
              >
                Go to dashboard
              </Link>
            }
          />
        ) : (
          <>
            <DashPanel
              title="Current plan"
              icon={CreditCard}
              action={<StatusLabel billing={billing} />}
              bodyClassName="px-4 py-5 sm:px-5"
            >
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

              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/[0.05] pt-4">
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
                <p className="mt-4 border-t border-white/[0.05] pt-4 text-[11px] leading-relaxed text-yellow-500/90">
                  Scheduled to cancel. Full access until{" "}
                  {formatDate(billing.nextBillingDate || billing.currentPeriodEnd)}.
                </p>
              )}

              {billing.isPromo && (
                <p className="mt-4 border-t border-white/[0.05] pt-4 text-[11px] leading-relaxed text-zinc-500">
                  Promo or admin grant — not billed through Dodo.
                  {billing.currentPeriodEnd
                    ? ` Ends ${formatDate(billing.currentPeriodEnd)}.`
                    : ""}
                </p>
              )}
            </DashPanel>

            {billing.canManage && (
              <DashPanel title="Actions" bodyClassName="">
                <div className="divide-y divide-white/[0.05]">
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
                        <ButtonSpinner />
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
                          <ButtonSpinner />
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
                            <ButtonSpinner />
                          ) : (
                            "Confirm"
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </DashPanel>
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
      </DashBody>
    </DashPage>
  );
}
