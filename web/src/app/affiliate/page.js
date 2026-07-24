"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
import {
  ArrowLeft,
  Check,
  Copy,
  DollarSign,
  Loader2,
  Megaphone,
  RefreshCw,
  Users,
  Wallet,
  Calendar,
  Link2,
  Mail,
} from "lucide-react";

function usd(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function formatDate(unix) {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AffiliatePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  // Enroll / edit form
  const [paypalEmail, setPaypalEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/affiliate");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setData(json);
      if (json.enrolled && json.affiliate) {
        setPaypalEmail(json.affiliate.paypalEmail || "");
        setDisplayName(json.affiliate.displayName || "");
      } else if (user) {
        setDisplayName(
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.username ||
            ""
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    load();
  }, [isLoaded, isSignedIn, load]);

  const saveProfile = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/affiliate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paypalEmail,
          displayName,
          code: data?.enrolled ? undefined : code || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");
      setData(json);
      setMessage(json.message || "Saved.");
      if (json.affiliate) {
        setPaypalEmail(json.affiliate.paypalEmail || "");
        setDisplayName(json.affiliate.displayName || "");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    if (!data?.referralLink) return;
    navigator.clipboard.writeText(data.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-volt animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-black text-[#ededed] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-950 border border-white/[0.06] rounded-3xl p-8 text-center space-y-6">
          <Megaphone className="w-12 h-12 text-brand-volt mx-auto" />
          <div>
            <h1 className="font-display text-2xl font-extrabold text-white uppercase tracking-tight">
              Svay Affiliate
            </h1>
            <p className="text-zinc-400 text-sm mt-2">
              Sign in to join the creator affiliate program and earn 15% for 6
              months on every user you refer.
            </p>
          </div>
          <SignInButton mode="modal">
            <button
              type="button"
              className="w-full py-3 bg-brand-volt hover:bg-brand-volt/90 text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
            >
              Sign in to continue
            </button>
          </SignInButton>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-white"
          >
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
        </div>
      </div>
    );
  }

  const program = data?.program || {
    commissionRate: 0.15,
    commissionMonths: 6,
  };
  const ratePct = Math.round((program.commissionRate || 0.15) * 100);

  return (
    <div className="min-h-screen bg-black text-[#ededed] pb-16 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-volt/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-brand-mint/5 rounded-full filter blur-[120px] pointer-events-none" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 space-y-6 sm:space-y-8 relative z-10">
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-wider text-zinc-500 hover:text-white transition-all"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-logo font-black text-sm text-white tracking-widest uppercase">
              SVAY
            </span>
            <span className="text-[9px] font-black tracking-widest px-2 py-0.5 rounded bg-brand-volt/10 text-brand-volt border border-brand-volt/20 uppercase">
              Affiliate
            </span>
          </div>
        </div>

        <header className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight">
            Creator Affiliate Program
          </h1>
          <p className="text-zinc-400 text-sm max-w-2xl">
            Promote Svay with your link. You earn{" "}
            <strong className="text-white">{ratePct}%</strong> of revenue from
            each referred user for{" "}
            <strong className="text-white">
              {program.commissionMonths || 6} months
            </strong>{" "}
            after they join. Monthly plans pay each month they stay active;
            yearly plans pay <strong className="text-white">once</strong> on the
            annual charge. Payouts are sent manually via PayPal.
          </p>
        </header>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        )}

        {!data?.enrolled ? (
          <section className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-volt/10 rounded-xl border border-brand-volt/20">
                <Megaphone className="w-5 h-5 text-brand-volt" />
              </div>
              <div>
                <h2 className="font-display font-extrabold text-lg text-white uppercase">
                  Join the program
                </h2>
                <p className="text-zinc-500 text-xs mt-0.5">
                  Add your PayPal email so we can send monthly payouts.
                </p>
              </div>
            </div>

            <form onSubmit={saveProfile} className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                  Display name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your creator name"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-volt"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                  PayPal email *
                </label>
                <input
                  type="email"
                  required
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="you@paypal.com"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-volt"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                  Custom code (optional)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))
                  }
                  placeholder="e.g. YOURNAME"
                  maxLength={24}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-brand-volt"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={saving || !paypalEmail.trim()}
                  className="w-full sm:w-auto px-8 py-3 bg-brand-volt hover:bg-brand-volt/90 text-black font-black text-xs uppercase tracking-wider rounded-xl disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Join & get my link"
                  )}
                </button>
              </div>
            </form>
          </section>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                {
                  label: "This month",
                  value: usd(data.stats?.thisMonthCents),
                  icon: Calendar,
                  accent: "text-brand-volt",
                },
                {
                  label: "Unpaid (owed)",
                  value: usd(data.stats?.unpaidCents),
                  icon: Wallet,
                  accent: "text-amber-400",
                },
                {
                  label: "Total earned",
                  value: usd(data.stats?.totalCommissionCents),
                  icon: DollarSign,
                  accent: "text-emerald-400",
                },
                {
                  label: "Active / total refs",
                  value: `${data.stats?.activeReferrals || 0} / ${data.stats?.totalReferrals || 0}`,
                  icon: Users,
                  accent: "text-sky-400",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl p-4 sm:p-5"
                >
                  <div className="flex items-center gap-2 text-zinc-500 mb-2">
                    <s.icon className={`w-3.5 h-3.5 ${s.accent}`} />
                    <span className="text-[9px] font-black uppercase tracking-wider">
                      {s.label}
                    </span>
                  </div>
                  <p className="font-display text-xl sm:text-2xl font-extrabold text-white tabular-nums">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Referral link + profile */}
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              <section className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-brand-volt" />
                  <h2 className="font-display font-extrabold text-sm uppercase text-white">
                    Your referral link
                  </h2>
                </div>
                <div className="flex gap-2">
                  <code className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-zinc-200 break-all font-mono">
                    {data.referralLink}
                  </code>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="shrink-0 px-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-brand-volt/40 cursor-pointer"
                    title="Copy link"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Code:{" "}
                  <span className="font-mono text-brand-volt font-bold">
                    {data.affiliate?.code}
                  </span>
                  {" · "}
                  Status:{" "}
                  <span className="uppercase font-bold text-zinc-300">
                    {data.affiliate?.status}
                  </span>
                </p>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Share on YouTube, Twitter, newsletters, etc. When someone
                  signs up and pays through your link, you earn {ratePct}% for{" "}
                  {program.commissionMonths} months (yearly = one commission on
                  the yearly charge).
                </p>
              </section>

              <section className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-mint" />
                  <h2 className="font-display font-extrabold text-sm uppercase text-white">
                    Payout settings
                  </h2>
                </div>
                <form onSubmit={saveProfile} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                      Display name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-volt"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                      PayPal email
                    </label>
                    <input
                      type="email"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      required
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-volt"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Update profile"}
                  </button>
                </form>
              </section>
            </div>

            {/* Monthly breakdown */}
            <section className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display font-extrabold text-sm uppercase text-white">
                  Monthly earnings
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    load();
                  }}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-white cursor-pointer bg-transparent border-none"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
              {(data.monthly || []).length === 0 ? (
                <p className="text-zinc-500 text-sm">
                  No earnings yet. Share your link to start earning.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="text-[9px] uppercase tracking-wider text-zinc-500 border-b border-white/5">
                        <th className="py-2 pr-3 font-black">Month</th>
                        <th className="py-2 pr-3 font-black">Payments</th>
                        <th className="py-2 pr-3 font-black">Gross</th>
                        <th className="py-2 pr-3 font-black">Your cut</th>
                        <th className="py-2 font-black">Unpaid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.monthly.map((m) => (
                        <tr
                          key={m.periodMonth}
                          className="border-b border-white/[0.03] text-zinc-300"
                        >
                          <td className="py-2.5 pr-3 font-mono">
                            {m.periodMonth}
                          </td>
                          <td className="py-2.5 pr-3">{m.paymentCount}</td>
                          <td className="py-2.5 pr-3">{usd(m.grossCents)}</td>
                          <td className="py-2.5 pr-3 text-white font-semibold">
                            {usd(m.commissionCents)}
                          </td>
                          <td className="py-2.5">
                            {m.unpaidCents > 0 ? (
                              <span className="text-amber-400">
                                {usd(m.unpaidCents)}
                              </span>
                            ) : (
                              <span className="text-emerald-400">Paid</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Referrals */}
            <section className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-4">
              <h2 className="font-display font-extrabold text-sm uppercase text-white">
                Referred users
              </h2>
              {(data.referrals || []).length === 0 ? (
                <p className="text-zinc-500 text-sm">No referrals yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="text-[9px] uppercase tracking-wider text-zinc-500 border-b border-white/5">
                        <th className="py-2 pr-3 font-black">Joined</th>
                        <th className="py-2 pr-3 font-black">Plan</th>
                        <th className="py-2 pr-3 font-black">Status</th>
                        <th className="py-2 pr-3 font-black">First paid</th>
                        <th className="py-2 font-black">Window</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.referrals.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-white/[0.03] text-zinc-300"
                        >
                          <td className="py-2.5 pr-3">{formatDate(r.joinedAt)}</td>
                          <td className="py-2.5 pr-3 capitalize">
                            {r.planType || "—"}
                            {r.planType === "yearly" && (
                              <span className="ml-1 text-[9px] text-zinc-500 uppercase">
                                one-time cut
                              </span>
                            )}
                            {r.planType === "monthly" && (
                              <span className="ml-1 text-[9px] text-zinc-500 uppercase">
                                recurring
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 pr-3">
                            {r.isActive ? (
                              <span className="text-emerald-400 font-semibold">
                                Active
                              </span>
                            ) : (
                              <span className="text-zinc-500">
                                {r.subscriptionStatus || "Inactive"}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 pr-3">
                            {formatDate(r.firstPaymentAt)}
                          </td>
                          <td className="py-2.5">
                            {r.commissionWindowOpen ? (
                              <span className="text-brand-volt">Open</span>
                            ) : (
                              <span className="text-zinc-500">Ended</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Recent commissions */}
            {(data.earnings || []).length > 0 && (
              <section className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-4">
                <h2 className="font-display font-extrabold text-sm uppercase text-white">
                  Recent commissions
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="text-[9px] uppercase tracking-wider text-zinc-500 border-b border-white/5">
                        <th className="py-2 pr-3 font-black">Date</th>
                        <th className="py-2 pr-3 font-black">Month</th>
                        <th className="py-2 pr-3 font-black">Plan</th>
                        <th className="py-2 pr-3 font-black">Gross</th>
                        <th className="py-2 pr-3 font-black">Commission</th>
                        <th className="py-2 font-black">Payout</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.earnings.slice(0, 50).map((e) => (
                        <tr
                          key={e.id}
                          className="border-b border-white/[0.03] text-zinc-300"
                        >
                          <td className="py-2.5 pr-3">
                            {formatDate(e.createdAt)}
                          </td>
                          <td className="py-2.5 pr-3 font-mono">
                            {e.periodMonth}
                          </td>
                          <td className="py-2.5 pr-3 capitalize">
                            {e.planType}
                            {e.planType === "yearly" ? " (one-time)" : ""}
                          </td>
                          <td className="py-2.5 pr-3">{usd(e.grossCents)}</td>
                          <td className="py-2.5 pr-3 text-white font-semibold">
                            {usd(e.commissionCents)}
                          </td>
                          <td className="py-2.5 capitalize">
                            {e.payoutStatus === "paid" ? (
                              <span className="text-emerald-400">Paid</span>
                            ) : (
                              <span className="text-amber-400">Unpaid</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
