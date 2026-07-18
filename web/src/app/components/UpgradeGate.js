"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  Check,
  Lock,
  Radar,
  Shield,
  Zap,
  BarChart3,
  Search,
  Ticket,
  Crown,
} from "lucide-react";
import SubscriptionButton from "./SubscriptionButton";
import DemoLoginButton from "./DemoLoginButton";

const FEATURES = [
  {
    icon: Radar,
    title: "Trend Radar",
    desc: "Real-time viral analysis & breakout alerts",
  },
  {
    icon: BarChart3,
    title: "Growth Matrix",
    desc: "Creator benchmarks & velocity tracking",
  },
  {
    icon: Search,
    title: "Smart Search",
    desc: "Query ranked by virality score matching",
  },
  {
    icon: Zap,
    title: "7-Day Trial",
    desc: "Full Pro access · cancel in one click",
  },
];

const INCLUDED = [
  "Full Pro suite unlocked on day one",
  "Early-adopter rate locked for life",
  "Priority support & all future features",
  "Unlimited research notebooks",
];

const TRUST = [
  { icon: Zap, label: "7-day free trial" },
  { icon: Shield, label: "Cancel anytime" },
  { icon: Lock, label: "Secure checkout" },
];

/** Gradient stroke icon only — no box fill, matches logo gradient */
function GradientIcon({ icon: Icon, className = "h-5 w-5" }) {
  return (
    <Icon
      className={className}
      strokeWidth={2.25}
      stroke="url(#svayIconGrad)"
      color="url(#svayIconGrad)"
      aria-hidden
    />
  );
}

export default function UpgradeGate({
  billingInterval,
  setBillingInterval,
  initialSubscription,
  promoCode,
  setPromoCode,
  showPromoInput,
  setShowPromoInput,
  isRedeeming,
  promoError,
  promoSuccess,
  onRedeemPromo,
}) {
  const isHalted = initialSubscription?.isHalted;
  const isExpired = initialSubscription?.isExpired;
  const isYearly = billingInterval === "yearly";
  const price = isYearly ? "6.66" : "9.99";
  const struck = isYearly ? "9.99" : "14.99";
  const billedAs = isYearly ? "$79.99 billed yearly" : "Billed monthly after trial";
  const effectiveNote = isYearly
    ? "≈ $6.66/mo · ~4 months free"
    : "$9.99/mo after trial";

  const headline = isHalted
    ? "Update Billing."
    : isExpired
      ? "Plan Expired."
      : "Upgrade to Pro.";

  const subcopy = isHalted
    ? "We couldn't process your payment. Update billing to restore full access."
    : "Unlock real-time viral analysis, competitor intel, and growth tools built for serious creators.";

  const setPlan = (plan) => {
    setBillingInterval(plan);
    document.cookie = `selected_plan=${plan}; path=/; max-age=3600;`;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030308] text-white">
      {/* Shared SVG gradient defs for icons */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <linearGradient id="svayIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0070f3" />
            <stop offset="50%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#0070f3" />
          </linearGradient>
        </defs>
      </svg>

      {/* Atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,240,255,0.1),transparent)]" />
        <div className="absolute top-[-10%] left-[-10%] h-[42rem] w-[42rem] rounded-full bg-brand-volt/[0.05] blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] h-[36rem] w-[36rem] rounded-full bg-[#0070f3]/[0.07] blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
          }}
        />
      </div>

      {/* Top bar — official gradient logo dot (icon only, no glyph) */}
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-tr from-geist-success via-[#00f0ff] to-geist-success animate-logo-gradient shadow-[0_0_18px_rgba(0,112,243,0.4)]"
            aria-hidden
          />
          <span className="font-logo font-black text-xl tracking-tight text-white uppercase">
            Svay
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-[10px] font-bold uppercase tracking-widest text-zinc-500 sm:inline">
            Account
          </span>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox:
                  "w-8 h-8 ring-1 ring-white/15 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
              },
            }}
          />
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4 pb-16 pt-2 sm:px-6 sm:pt-6 md:pb-24">
        <div className="grid w-full grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12 lg:items-center">
          {/* ── Left: story ── */}
          <div className="flex flex-col lg:col-span-5">
            <div
              className={`mb-5 inline-flex w-fit items-center gap-2 rounded-full border px-3.5 py-1.5 backdrop-blur-sm ${
                isHalted
                  ? "border-brand-rose/25 bg-brand-rose/10"
                  : "border-white/[0.1] bg-white/[0.03]"
              }`}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${
                    isHalted ? "bg-brand-rose" : "bg-brand-volt"
                  }`}
                />
                <span
                  className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                    isHalted ? "bg-brand-rose" : "bg-brand-volt"
                  }`}
                />
              </span>
              <span
                className={`text-[10px] font-black uppercase tracking-[0.18em] ${
                  isHalted ? "text-brand-rose" : "text-white/55"
                }`}
              >
                {isHalted ? "Payment Required" : "Pro Access Only"}
              </span>
            </div>

            <h1 className="font-display text-4xl font-normal leading-[0.95] tracking-tight text-white sm:text-5xl md:text-[3.25rem]">
              {headline}
            </h1>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
              {subcopy}
            </p>

            {/* Feature list — gradient icons only (no boxes) */}
            <ul className="mt-8 divide-y divide-white/[0.05]">
              {FEATURES.map(({ icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3.5 py-3.5 first:pt-0 last:pb-0">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center">
                    <GradientIcon icon={icon} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-white">{title}</p>
                    <p className="mt-0.5 text-[12px] leading-snug text-zinc-500">
                      {desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Trust — desktop */}
            <div className="mt-8 hidden flex-wrap items-center gap-x-5 gap-y-2 lg:flex">
              {TRUST.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500"
                >
                  <Icon className="h-3 w-3 text-zinc-600" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: pricing ── */}
          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.1] bg-gradient-to-b from-zinc-900/90 via-zinc-950/95 to-black shadow-[0_40px_100px_-30px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:rounded-[2rem]">
              {/* Top gradient rail */}
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#0070f3] via-brand-volt to-[#0070f3] animate-logo-gradient"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-brand-volt/[0.08] blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-[#0070f3]/[0.08] blur-3xl"
              />

              {/* Split layout on larger screens */}
              <div className="relative grid md:grid-cols-12">
                {/* Price column */}
                <div className="flex flex-col border-b border-white/[0.06] p-6 sm:p-8 md:col-span-5 md:border-b-0 md:border-r md:border-white/[0.06]">
                  <div className="mb-5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/60">
                      <Crown className="h-3 w-3 text-brand-volt" strokeWidth={2.25} />
                      Svay Pro
                    </span>
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-white/40">
                      All features
                    </span>
                  </div>

                  {/* Billing toggle */}
                  <div className="mb-6 flex rounded-full border border-white/[0.08] bg-black/40 p-1">
                    {["monthly", "yearly"].map((interval) => {
                      const active = billingInterval === interval;
                      return (
                        <button
                          key={interval}
                          type="button"
                          onClick={() => setPlan(interval)}
                          className={`relative flex-1 rounded-full py-2 text-center font-mono text-[10px] font-medium uppercase tracking-[0.12em] transition-all cursor-pointer ${
                            active
                              ? "bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.14)]"
                              : "text-white/40 hover:text-white/70"
                          }`}
                        >
                          {interval === "yearly" ? "Yearly" : "Monthly"}
                          {interval === "yearly" && (
                            <span
                              className={`ml-1 rounded-full px-1.5 py-0.5 text-[8px] tracking-wide ${
                                active
                                  ? "bg-black/10 text-black/65"
                                  : "border border-white/10 bg-white/[0.04] text-white/45"
                              }`}
                            >
                              −33%
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Price */}
                  <div className="flex items-end gap-1">
                    <span className="mb-2 font-display text-2xl text-white/25">$</span>
                    <span
                      key={price}
                      className="font-display text-6xl tabular-nums tracking-tight text-white sm:text-[4.25rem] sm:leading-none"
                    >
                      {price}
                    </span>
                    <span className="mb-2.5 ml-1 font-mono text-xs text-white/35">
                      /mo
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm text-white/25 line-through">
                      ${struck}
                    </span>
                    <span className="rounded-full border border-brand-volt/20 bg-brand-volt/10 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-brand-volt">
                      Save 33%
                    </span>
                  </div>

                  <div className="mt-4 space-y-1">
                    <p className="text-xs leading-relaxed text-white/40">
                      {billedAs}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-white/30">
                      {effectiveNote}
                    </p>
                  </div>

                  {/* Trial callout */}
                  <div className="mt-6 rounded-2xl border border-brand-volt/15 bg-brand-volt/[0.06] px-3.5 py-3">
                    <p className="text-[11px] font-bold text-brand-volt">
                      7 days free · then {isYearly ? "$79.99/yr" : "$9.99/mo"}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-snug text-white/35">
                      Cancel anytime during trial. No charge today.
                    </p>
                  </div>
                </div>

                {/* Features + CTA column */}
                <div className="flex flex-col p-6 sm:p-8 md:col-span-7">
                  <div className="mb-5">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
                      What&apos;s included
                    </p>
                    <p className="mt-1 text-sm text-white/40">
                      Everything below — no feature gates.
                    </p>
                  </div>

                  <ul className="mb-7 grid gap-2.5 sm:grid-cols-1">
                    {INCLUDED.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-[12px] font-medium text-zinc-300"
                      >
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#0070f3] via-brand-volt to-[#0070f3] animate-logo-gradient">
                          <Check className="h-2.5 w-2.5 text-black" strokeWidth={3.5} />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto space-y-3.5">
                    <SubscriptionButton
                      planType={billingInterval}
                      label={
                        isHalted
                          ? "Update Payment Method"
                          : "Start 7-Day Free Trial"
                      }
                    />

                    <p className="text-center font-mono text-[9px] uppercase tracking-wider text-white/25">
                      {isHalted
                        ? "Access restricted until resolved"
                        : "Secure checkout via Dodo Payments"}
                    </p>

                    <div className="relative flex items-center py-0.5">
                      <div className="h-px flex-grow bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      <span className="mx-3 font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">
                        or
                      </span>
                      <div className="h-px flex-grow bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>

                    <DemoLoginButton
                      label="Explore Demo Version"
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] py-3.5 text-xs font-extrabold uppercase tracking-wider text-zinc-400 transition-all hover:-translate-y-0.5 hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white"
                    />

                    {/* Promo */}
                    <div className="pt-0.5 text-center">
                      {!showPromoInput ? (
                        <button
                          type="button"
                          onClick={() => setShowPromoInput(true)}
                          className="inline-flex cursor-pointer items-center gap-1.5 border-none bg-transparent text-[10px] font-black uppercase tracking-wider text-zinc-500 outline-none transition-colors hover:text-brand-volt"
                        >
                          <Ticket className="h-3 w-3" />
                          Have a promo code?
                        </button>
                      ) : (
                        <form onSubmit={onRedeemPromo} className="space-y-2 text-left">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="ENTER CODE"
                              value={promoCode}
                              onChange={(e) =>
                                setPromoCode(e.target.value.toUpperCase())
                              }
                              disabled={isRedeeming}
                              className="flex-1 rounded-xl border border-zinc-800 bg-black/50 px-4 py-3 font-mono text-xs uppercase text-white placeholder:text-zinc-600 outline-none transition-all focus:border-brand-volt/50"
                              required
                            />
                            <button
                              type="submit"
                              disabled={isRedeeming}
                              className="cursor-pointer rounded-xl bg-white px-5 text-xs font-black uppercase tracking-wider text-black transition-all hover:bg-white/90 disabled:opacity-50"
                            >
                              {isRedeeming ? "..." : "Redeem"}
                            </button>
                          </div>
                          {promoError && (
                            <p className="pl-1 text-[10px] font-bold uppercase tracking-wider text-brand-rose">
                              {promoError}
                            </p>
                          )}
                          {promoSuccess && (
                            <p className="pl-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                              {promoSuccess}
                            </p>
                          )}
                        </form>
                      )}
                    </div>

                    <p className="pt-1 text-center text-[10px] text-zinc-600">
                      Paid but stuck?{" "}
                      <Link href="/support" className="text-zinc-400 underline-offset-2 hover:text-white hover:underline">
                        Contact support
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust — mobile */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 lg:hidden">
              {TRUST.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500"
                >
                  <Icon className="h-3 w-3 text-zinc-600" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
