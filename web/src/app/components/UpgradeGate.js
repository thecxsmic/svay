"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  Check,
  Radar,
  Shield,
  Zap,
  BarChart3,
  Search,
  Ticket,
  Crown,
  Wrench,
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
    desc: "Results ranked by virality score",
  },
  {
    icon: Zap,
    title: "7-Day Trial",
    desc: "Full Pro access · cancel in one click",
  },
];

const INCLUDED = [
  "Full Pro suite on day one",
  "Early-adopter rate locked for life",
  "Priority support & future features",
  "Unlimited research notebooks",
];

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
    ? "Update billing"
    : isExpired
      ? "Plan expired"
      : "Upgrade to Pro";

  const subcopy = isHalted
    ? "We couldn't process your payment. Update billing to restore full access."
    : "Unlock trend radar, competitor intel, and growth tools built for serious creators.";

  const setPlan = (plan) => {
    setBillingInterval(plan);
    document.cookie = `selected_plan=${plan}; path=/; max-age=3600;`;
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* Sticky header — same pattern as Billing / Support */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-tr from-geist-success via-[#00f0ff] to-geist-success animate-logo-gradient shadow-[0_0_15px_rgba(0,112,243,0.3)]"
              aria-hidden
            />
            <div>
              <span className="font-logo font-black text-lg tracking-tight text-white uppercase">
                Svay
              </span>
              <p className="hidden text-[10px] font-bold uppercase tracking-widest text-zinc-600 sm:block">
                {isHalted ? "Payment required" : "Pro access"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/tools"
              className="hidden cursor-pointer items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white sm:inline-flex"
            >
              <Wrench className="h-3 w-3" />
              Free tools
            </Link>
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox:
                    "w-8 h-8 ring-1 ring-zinc-800",
                },
              }}
            />
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        {/* Status + headline */}
        <div>
          <div
            className={`mb-3 inline-flex items-center gap-2 rounded-md border px-2.5 py-1 ${
              isHalted
                ? "border-red-500/20 bg-red-500/5"
                : "border-zinc-800 bg-zinc-950/50"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isHalted ? "bg-red-500" : "bg-zinc-500"
              }`}
            />
            <span
              className={`text-[10px] font-bold uppercase tracking-widest ${
                isHalted ? "text-red-400" : "text-zinc-500"
              }`}
            >
              {isHalted ? "Payment required" : isExpired ? "Plan expired" : "Pro only"}
            </span>
          </div>

          <h1 className="font-display text-2xl uppercase tracking-tight text-white sm:text-3xl">
            {headline}
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-500">
            {subcopy}
          </p>
        </div>

        {/* Features */}
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
          <div className="border-b border-zinc-800/80 px-4 py-3 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              What you unlock
            </p>
          </div>
          <ul className="divide-y divide-zinc-800/80">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <li
                key={title}
                className="flex items-start gap-3 px-4 py-3.5 sm:px-5"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/5">
                  <Icon className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">{title}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Pricing card */}
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <Crown className="h-3.5 w-3.5 text-zinc-500" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Svay Pro
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              All features
            </span>
          </div>

          <div className="space-y-5 p-4 sm:p-5">
            {/* Billing toggle */}
            <div className="flex rounded-md border border-zinc-800 bg-black p-1">
              {["monthly", "yearly"].map((interval) => {
                const active = billingInterval === interval;
                return (
                  <button
                    key={interval}
                    type="button"
                    onClick={() => setPlan(interval)}
                    className={`relative flex-1 cursor-pointer rounded-md py-2 text-center text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      active
                        ? "bg-white text-black"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {interval === "yearly" ? "Yearly" : "Monthly"}
                    {interval === "yearly" && (
                      <span
                        className={`ml-1 rounded px-1.5 py-0.5 text-[8px] tracking-wide ${
                          active ? "bg-black/10 text-black/70" : "text-zinc-600"
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
            <div>
              <div className="flex items-end gap-1">
                <span className="mb-1 text-lg text-zinc-600">$</span>
                <span
                  key={price}
                  className="text-4xl font-bold tracking-tight text-white tabular-nums sm:text-5xl"
                >
                  {price}
                </span>
                <span className="mb-1.5 ml-1 text-xs font-bold text-zinc-500">/mo</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm text-zinc-600 line-through">${struck}</span>
                <span className="rounded border border-zinc-800 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                  Save 33%
                </span>
              </div>
              <p className="mt-2 text-[12px] text-zinc-500">{billedAs}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                {effectiveNote}
              </p>
            </div>

            {/* Trial note */}
            <div className="rounded-md border border-zinc-800 bg-black px-3.5 py-3">
              <p className="text-[11px] font-bold text-zinc-300">
                7 days free · then {isYearly ? "$79.99/yr" : "$9.99/mo"}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-600">
                Cancel anytime during trial. No charge today.
              </p>
            </div>

            {/* Included */}
            <div>
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Included
              </p>
              <ul className="space-y-2">
                {INCLUDED.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-[12px] text-zinc-400"
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white">
                      <Check className="h-2.5 w-2.5 text-black" strokeWidth={3.5} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="space-y-3 pt-1">
              <SubscriptionButton
                planType={billingInterval}
                label={
                  isHalted ? "Update payment method" : "Start 7-day free trial"
                }
              />

              <p className="text-center text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                {isHalted
                  ? "Access restricted until resolved"
                  : "Secure checkout via Dodo Payments"}
              </p>

              <div className="relative flex items-center py-0.5">
                <div className="h-px flex-grow bg-zinc-800" />
                <span className="mx-3 text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                  or
                </span>
                <div className="h-px flex-grow bg-zinc-800" />
              </div>

              <DemoLoginButton
                label="Explore demo version"
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-800 bg-transparent py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-white/[0.03] hover:text-white"
              />

              {/* Promo */}
              <div className="pt-1 text-center">
                {!showPromoInput ? (
                  <button
                    type="button"
                    onClick={() => setShowPromoInput(true)}
                    className="inline-flex cursor-pointer items-center gap-1.5 border-none bg-transparent text-[10px] font-bold uppercase tracking-wider text-zinc-600 outline-none transition-colors hover:text-zinc-300"
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
                        className="flex-1 rounded-md border border-zinc-800 bg-black px-3 py-2.5 font-mono text-xs uppercase text-white placeholder:text-zinc-700 outline-none transition-colors focus:border-zinc-600"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isRedeeming}
                        className="cursor-pointer rounded-md bg-white px-4 text-[10px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
                      >
                        {isRedeeming ? "..." : "Redeem"}
                      </button>
                    </div>
                    {promoError && (
                      <p className="pl-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
                        {promoError}
                      </p>
                    )}
                    {promoSuccess && (
                      <p className="pl-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        {promoSuccess}
                      </p>
                    )}
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Trust + links */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-3 w-3" /> 7-day free trial
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Shield className="h-3 w-3" /> Cancel anytime
          </span>
        </div>

        <p className="text-center text-[10px] text-zinc-600">
          Paid but stuck?{" "}
          <Link
            href="/support"
            className="text-zinc-400 underline-offset-2 hover:text-white hover:underline"
          >
            Contact support
          </Link>
          {" · "}
          <Link
            href="/tools"
            className="text-zinc-400 underline-offset-2 hover:text-white hover:underline"
          >
            Free tools
          </Link>
          {" · "}
          <Link
            href="/billing"
            className="text-zinc-400 underline-offset-2 hover:text-white hover:underline"
          >
            Billing
          </Link>
        </p>
      </div>
    </div>
  );
}
