"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
import {
  Check,
  Copy,
  DollarSign,
  LayoutDashboard,
  Loader2,
  Megaphone,
  RefreshCw,
  Users,
  Wallet,
  Calendar,
  Link2,
  Mail,
  Infinity,
  TrendingUp,
  Clock,
  ChevronRight,
  Home,
  CalendarClock,
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

/** Shared top nav — visible on every state. */
function TopNav({ isSignedIn }) {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-black/80 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between gap-4">
        {/* Wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="size-5 rounded-full bg-gradient-to-tr from-white/80 via-white/50 to-white/20 shadow-[0_0_12px_rgba(255,255,255,0.1)]" />
          <span className="font-logo text-base tracking-tight text-white">SVAY</span>
          <span className="text-[9px] font-black tracking-widest px-2 py-0.5 rounded bg-brand-volt/10 text-brand-volt border border-brand-volt/20 uppercase">Affiliate</span>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-white hover:bg-white/[0.04] transition-all"
          >
            <Home className="w-3 h-3" /> Landing
          </Link>
          {isSignedIn && (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <LayoutDashboard className="w-3 h-3" /> Dashboard
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function AffiliatePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

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
    if (!isSignedIn) { setLoading(false); return; }
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
          commissionType: "lifetime",
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

  /* ── Loading ── */
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <TopNav isSignedIn={false} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-volt animate-spin" />
        </div>
      </div>
    );
  }

  /* ── Signed out ── */
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-black text-[#ededed] flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-1/3 w-[500px] h-[500px] bg-brand-volt/4 rounded-full filter blur-[140px] pointer-events-none" />
        <TopNav isSignedIn={false} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-4">

            <div className="bg-zinc-950 border border-white/[0.06] rounded-3xl p-7 sm:p-8 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center shrink-0">
                  <Megaphone className="w-5 h-5 text-brand-volt" />
                </div>
                <div>
                  <h1 className="font-display text-xl font-extrabold text-white uppercase tracking-tight leading-tight">
                    Svay Affiliate Program
                  </h1>
                  <p className="text-zinc-500 text-xs mt-0.5">Earn 10% lifetime on every referral</p>
                </div>
              </div>

              {/* Rate hero */}
              <div className="flex items-center gap-4 py-4 px-4 rounded-2xl border border-brand-mint/20 bg-brand-mint/5">
                <Infinity className="w-6 h-6 text-brand-mint shrink-0" />
                <div>
                  <p className="font-display text-3xl font-extrabold text-brand-mint tabular-nums leading-none">10%</p>
                  <p className="text-zinc-400 text-xs mt-0.5">Lifetime commission · No expiry</p>
                </div>
              </div>

              <p className="text-zinc-400 text-sm leading-relaxed">
                Share your referral link. When a creator subscribes through it, you earn{" "}
                <strong className="text-white">10% of every payment they make — forever</strong>. Monthly plans pay each billing cycle; yearly plans pay once on the annual charge.
              </p>

              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <CalendarClock className="w-3.5 h-3.5 text-brand-volt shrink-0" />
                <span className="text-[11px] text-zinc-500 font-semibold">Payouts via PayPal · 20th – 30th of every month</span>
              </div>

              <SignInButton mode="modal">
                <button
                  type="button"
                  className="w-full py-3.5 bg-brand-volt hover:bg-brand-volt/90 text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-[0_0_28px_rgba(0,240,255,0.2)]"
                >
                  Sign in to join the program
                </button>
              </SignInButton>


            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Authenticated ── */
  return (
    <div className="min-h-screen bg-black text-[#ededed] relative overflow-hidden">
      <div className="absolute top-0 right-1/3 w-[500px] h-[500px] bg-brand-volt/4 rounded-full filter blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-brand-mint/4 rounded-full filter blur-[120px] pointer-events-none" />

      <TopNav isSignedIn={true} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-7 pb-20 space-y-5 relative z-10">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Account</p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight leading-none mt-0.5">
              Affiliate
            </h1>
          </div>
          {data?.enrolled && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-mint/30 bg-brand-mint/10 text-[9px] font-black uppercase tracking-wider text-brand-mint">
              <Infinity className="w-2.5 h-2.5" /> 10% · Lifetime
            </div>
          )}
        </div>


        {/* Alerts */}
        {error && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" /> {message}
          </div>
        )}

        {/* ════════════════════════════════════ */}
        {/* NOT ENROLLED */}
        {/* ════════════════════════════════════ */}
        {!data?.enrolled ? (
          <div className="space-y-5">
            {/* Hero intro */}
            <div className="bg-zinc-950/60 border border-white/[0.06] rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]">
                  <TrendingUp className="w-5 h-5 text-brand-volt" />
                </div>
                <div>
                  <h2 className="font-display font-extrabold text-base text-white uppercase">
                    Creator Affiliate Program
                  </h2>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    Earn commissions for every creator you send to Svay.
                  </p>
                </div>
              </div>

              {/* Rate card */}
              <div className="flex items-center gap-4 py-5 px-5 rounded-2xl border border-brand-mint/20 bg-brand-mint/5 mb-5">
                <Infinity className="w-8 h-8 text-brand-mint shrink-0" />
                <div>
                  <p className="font-display text-5xl font-extrabold text-brand-mint tabular-nums leading-none">10%</p>
                  <p className="text-zinc-400 text-sm mt-1">Lifetime commission — no expiry, ever</p>
                </div>
              </div>

              <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
                Share your unique referral link. When a creator subscribes through your link, you earn{" "}
                <strong className="text-white">10% of every payment they make — forever</strong>.
                Monthly plans pay each billing cycle; yearly plans pay once on the annual charge.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <CalendarClock className="w-3.5 h-3.5 text-brand-volt shrink-0" />
                  <span className="text-[11px] text-zinc-500 font-semibold">Payouts via PayPal · 20th – 30th of every month</span>
                </div>
              </div>
            </div>

            {/* Enrollment form */}
            <div className="bg-zinc-950/60 border border-white/[0.06] rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl border border-white/[0.06] bg-white/[0.03]">
                  <Mail className="w-4 h-4 text-brand-mint" />
                </div>
                <div>
                  <h2 className="font-display font-extrabold text-sm text-white uppercase">
                    Your payout details
                  </h2>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    Commissions sent to your PayPal between the 20th–30th of each month.
                  </p>
                </div>
              </div>

              <form onSubmit={saveProfile} className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                    Display name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your creator name"
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-volt/50 focus:bg-zinc-900 transition-colors placeholder:text-zinc-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                    PayPal email <span className="text-brand-volt">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    placeholder="you@paypal.com"
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-volt/50 focus:bg-zinc-900 transition-colors placeholder:text-zinc-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                    Custom code <span className="text-zinc-600">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))
                    }
                    placeholder="e.g. YOURNAME"
                    maxLength={24}
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-brand-volt/50 focus:bg-zinc-900 transition-colors placeholder:text-zinc-700"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-4 pt-1">
                  <button
                    type="submit"
                    disabled={saving || !paypalEmail.trim()}
                    className="inline-flex items-center gap-2 px-7 py-3 bg-brand-volt hover:bg-brand-volt/90 text-black font-black text-xs uppercase tracking-wider rounded-xl disabled:opacity-40 cursor-pointer transition-all shadow-[0_0_24px_rgba(0,240,255,0.15)] hover:shadow-[0_0_32px_rgba(0,240,255,0.25)]"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>Join &amp; get my link <ChevronRight className="w-3.5 h-3.5" /></>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

        ) : (
          /* ════════════════════════════════════ */
          /* ENROLLED DASHBOARD */
          /* ════════════════════════════════════ */
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  label: "This month",
                  value: usd(data.stats?.thisMonthCents),
                  icon: Calendar,
                  accent: "text-brand-volt",
                  glow: "bg-brand-volt",
                },
                {
                  label: "Unpaid (owed)",
                  value: usd(data.stats?.unpaidCents),
                  icon: Wallet,
                  accent: "text-amber-400",
                  glow: "bg-amber-400",
                },
                {
                  label: "Total earned",
                  value: usd(data.stats?.totalCommissionCents),
                  icon: DollarSign,
                  accent: "text-emerald-400",
                  glow: "bg-emerald-400",
                },
                {
                  label: "Active / refs",
                  value: `${data.stats?.activeReferrals || 0} / ${data.stats?.totalReferrals || 0}`,
                  icon: Users,
                  accent: "text-sky-400",
                  glow: "bg-sky-400",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-zinc-950/70 border border-white/[0.06] rounded-2xl p-4 sm:p-5 relative overflow-hidden"
                >
                  <div className={`absolute -top-4 -right-4 w-16 h-16 ${s.glow}/5 rounded-full blur-2xl pointer-events-none`} />
                  <div className="flex items-center gap-2 text-zinc-600 mb-2.5">
                    <s.icon className={`w-3.5 h-3.5 ${s.accent}`} />
                    <span className="text-[9px] font-black uppercase tracking-wider">{s.label}</span>
                  </div>
                  <p className={`font-display text-xl sm:text-2xl font-extrabold tabular-nums ${s.accent}`}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Referral link + payout settings */}
            <div className="grid lg:grid-cols-5 gap-4">
              {/* Commission rate card */}
              <div className="lg:col-span-2 rounded-2xl border border-brand-mint/30 bg-brand-mint/5 p-5 relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-brand-mint/5 rounded-full blur-3xl pointer-events-none" />
                <p className="text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-4">
                  Your commission
                </p>
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2.5 rounded-xl border border-brand-mint/30 bg-brand-mint/10">
                    <Infinity className="w-5 h-5 text-brand-mint" />
                  </div>
                  <div>
                    <p className="font-display text-5xl font-extrabold text-brand-mint tabular-nums leading-none">10%</p>
                    <p className="text-zinc-400 text-xs mt-1">Lifetime · No expiry</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                  You earn 10% of every payment from your referred users — forever, with no time limit.
                </p>
                {/* Payout schedule */}
                <div className="border-t border-white/[0.05] pt-4 space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-wider text-zinc-600">Payout schedule</p>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.06] bg-black/30">
                    <CalendarClock className="w-3.5 h-3.5 text-brand-volt shrink-0" />
                    <span className="text-[10px] text-zinc-500 font-semibold">Via PayPal · 20th – 30th of every month</span>
                  </div>
                </div>
              </div>

              {/* Referral link + payout settings */}
              <div className="lg:col-span-3 flex flex-col gap-4">
                {/* Referral link */}
                <div className="bg-zinc-950/70 border border-white/[0.06] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-brand-mint" />
                    <h2 className="font-display font-extrabold text-sm uppercase text-white">
                      Your referral link
                    </h2>
                    <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-brand-mint/30 bg-brand-mint/10 text-[8px] font-black uppercase tracking-wider text-brand-mint">
                      {data.affiliate?.status}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <code className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-300 break-all font-mono min-w-0">
                      {data.referralLink}
                    </code>
                    <button
                      type="button"
                      onClick={copyLink}
                      className="shrink-0 w-10 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-brand-volt/40 hover:bg-brand-volt/5 cursor-pointer transition-all flex items-center justify-center"
                      title="Copy link"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-zinc-400" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600">Code:</span>
                    <span className="font-mono text-xs font-bold text-brand-mint">
                      {data.affiliate?.code}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    Share on YouTube, Twitter, newsletters, etc. When someone subscribes through your link, you earn 10% commission forever.
                    Yearly plans pay once on the annual charge; monthly plans pay each billing cycle.
                  </p>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <CalendarClock className="w-3.5 h-3.5 text-brand-volt shrink-0" />
                    <span className="text-[10px] text-zinc-500 font-semibold">Payouts via PayPal · 20th – 30th of every month</span>
                  </div>
                </div>

                {/* Payout settings */}
                <div className="bg-zinc-950/70 border border-white/[0.06] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-brand-mint" />
                    <h2 className="font-display font-extrabold text-sm uppercase text-white">
                      Payout settings
                    </h2>
                  </div>
                  <form onSubmit={saveProfile} className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                        Display name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-volt/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                        PayPal email
                      </label>
                      <input
                        type="email"
                        value={paypalEmail}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                        required
                        className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-volt/50 transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2.5 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer disabled:opacity-40 transition-all"
                      >
                        {saving ? "Saving…" : "Update profile"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Monthly earnings */}
            <div className="bg-zinc-950/70 border border-white/[0.06] rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="font-display font-extrabold text-sm uppercase text-white">
                    Monthly earnings
                  </h2>
                  <p className="text-zinc-600 text-xs mt-0.5">Commission breakdown by month</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setLoading(true); load(); }}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-white cursor-pointer bg-transparent border-none transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {(data.monthly || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-10 h-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center mb-3">
                    <TrendingUp className="w-5 h-5 text-zinc-700" />
                  </div>
                  <p className="text-zinc-500 text-sm font-semibold">No earnings yet</p>
                  <p className="text-zinc-700 text-xs mt-1">Share your link to start earning commissions.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="text-[9px] uppercase tracking-wider text-zinc-600 border-b border-white/[0.05]">
                        <th className="py-2.5 pr-3 font-black">Month</th>
                        <th className="py-2.5 pr-3 font-black">Payments</th>
                        <th className="py-2.5 pr-3 font-black">Gross</th>
                        <th className="py-2.5 pr-3 font-black">Your cut</th>
                        <th className="py-2.5 font-black">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.monthly.map((m) => (
                        <tr key={m.periodMonth} className="border-b border-white/[0.03] text-zinc-300 hover:bg-white/[0.015] transition-colors">
                          <td className="py-3 pr-3 font-mono text-zinc-400">{m.periodMonth}</td>
                          <td className="py-3 pr-3">{m.paymentCount}</td>
                          <td className="py-3 pr-3">{usd(m.grossCents)}</td>
                          <td className="py-3 pr-3 font-semibold text-brand-mint">{usd(m.commissionCents)}</td>
                          <td className="py-3">
                            {m.unpaidCents > 0 ? (
                              <span className="inline-flex items-center gap-1 text-amber-400">
                                <Clock className="w-3 h-3" /> {usd(m.unpaidCents)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-400">
                                <Check className="w-3 h-3" /> Paid
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Referred users */}
            <div className="bg-zinc-950/70 border border-white/[0.06] rounded-2xl p-5 sm:p-6">
              <div className="mb-5">
                <h2 className="font-display font-extrabold text-sm uppercase text-white">
                  Referred users
                </h2>
                <p className="text-zinc-600 text-xs mt-0.5">
                  {data.stats?.totalReferrals || 0} total · {data.stats?.activeReferrals || 0} active
                </p>
              </div>

              {(data.referrals || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-10 h-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center mb-3">
                    <Users className="w-5 h-5 text-zinc-700" />
                  </div>
                  <p className="text-zinc-500 text-sm font-semibold">No referrals yet</p>
                  <p className="text-zinc-700 text-xs mt-1">Your referral link is ready — go share it!</p>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-brand-mint/30 bg-brand-mint/10 text-xs font-black uppercase tracking-wider cursor-pointer transition-all text-brand-mint"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy link
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="text-[9px] uppercase tracking-wider text-zinc-600 border-b border-white/[0.05]">
                        <th className="py-2.5 pr-3 font-black">Joined</th>
                        <th className="py-2.5 pr-3 font-black">Plan</th>
                        <th className="py-2.5 pr-3 font-black">Status</th>
                        <th className="py-2.5 pr-3 font-black">First paid</th>
                        <th className="py-2.5 font-black">Window</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.referrals.map((r) => (
                        <tr key={r.id} className="border-b border-white/[0.03] text-zinc-300 hover:bg-white/[0.015] transition-colors">
                          <td className="py-3 pr-3 text-zinc-500">{formatDate(r.joinedAt)}</td>
                          <td className="py-3 pr-3 capitalize">
                            {r.planType || "—"}
                            {r.planType === "yearly" && <span className="ml-1 text-[9px] text-zinc-600 uppercase">one-time</span>}
                            {r.planType === "monthly" && <span className="ml-1 text-[9px] text-zinc-600 uppercase">recurring</span>}
                          </td>
                          <td className="py-3 pr-3">
                            {r.isActive ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                              </span>
                            ) : (
                              <span className="text-zinc-600">{r.subscriptionStatus || "Inactive"}</span>
                            )}
                          </td>
                          <td className="py-3 pr-3 text-zinc-500">{formatDate(r.firstPaymentAt)}</td>
                          <td className="py-3">
                            {/* Lifetime plan — window is always open */}
                            <span className="text-brand-mint font-semibold">∞</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent commissions */}
            {(data.earnings || []).length > 0 && (
              <div className="bg-zinc-950/70 border border-white/[0.06] rounded-2xl p-5 sm:p-6">
                <div className="mb-5">
                  <h2 className="font-display font-extrabold text-sm uppercase text-white">
                    Recent commissions
                  </h2>
                  <p className="text-zinc-600 text-xs mt-0.5">Last 50 individual earnings</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="text-[9px] uppercase tracking-wider text-zinc-600 border-b border-white/[0.05]">
                        <th className="py-2.5 pr-3 font-black">Date</th>
                        <th className="py-2.5 pr-3 font-black">Month</th>
                        <th className="py-2.5 pr-3 font-black">Plan</th>
                        <th className="py-2.5 pr-3 font-black">Gross</th>
                        <th className="py-2.5 pr-3 font-black">Commission</th>
                        <th className="py-2.5 font-black">Payout</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.earnings.slice(0, 50).map((e) => (
                        <tr key={e.id} className="border-b border-white/[0.03] text-zinc-300 hover:bg-white/[0.015] transition-colors">
                          <td className="py-3 pr-3 text-zinc-500">{formatDate(e.createdAt)}</td>
                          <td className="py-3 pr-3 font-mono text-zinc-500">{e.periodMonth}</td>
                          <td className="py-3 pr-3 capitalize">
                            {e.planType}{e.planType === "yearly" ? " (one-time)" : ""}
                          </td>
                          <td className="py-3 pr-3">{usd(e.grossCents)}</td>
                          <td className="py-3 pr-3 font-semibold text-brand-mint">{usd(e.commissionCents)}</td>
                          <td className="py-3">
                            {e.payoutStatus === "paid" ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400">
                                <Check className="w-3 h-3" /> Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-400">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
