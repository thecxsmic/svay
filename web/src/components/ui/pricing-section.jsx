"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Check,
  Lock,
  Radar,
  Shield,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PRICING,
  PRICING_FEATURE_GROUPS,
} from "@/app/components/data/landingPricing";

const PLANS = {
  monthly: {
    label: "Monthly",
    price: PRICING.monthly,
    struck: "14.99",
    save: "33%",
    billing: "Billed monthly after trial",
    subtotal: "$9.99/mo",
    note: "Flexible — cancel anytime",
    cta: "Start monthly trial",
  },
  yearly: {
    label: "Yearly",
    price: PRICING.yearly,
    struck: "9.99",
    save: "33%",
    billing: "Billed $79.99/year",
    subtotal: "$6.66/mo effective",
    note: "Best value — ~4 months free",
    cta: "Start yearly trial",
  },
};

const GROUP_ICONS = {
  Intelligence: Radar,
  Tracking: BarChart3,
  Workflow: Workflow,
};

const TRUST = [
  { icon: Zap, label: "7-day free trial" },
  { icon: Shield, label: "Cancel anytime" },
  { icon: Lock, label: "Rate locked for life" },
];

function pad(n) {
  return String(n ?? 0).padStart(2, "0");
}

function Countdown({ timeLeft }) {
  if (!timeLeft) return null;

  const units = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hrs" },
    { value: timeLeft.minutes, label: "Min" },
    { value: timeLeft.seconds, label: "Sec" },
  ];

  return (
    <div className="pricing-countdown shrink-0">
      {units.map((unit, i) => (
        <div key={unit.label} className="contents">
          <div className="pricing-countdown-unit">
            <span className="font-display text-base tabular-nums tracking-tight text-white sm:text-lg">
              {pad(unit.value)}
            </span>
            <span className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-white/28">
              {unit.label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span
              aria-hidden
              className="select-none pb-3 font-mono text-xs text-white/12"
            >
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function Pricing({
  billingInterval,
  setBillingInterval,
  priceDisplay,
  timeLeft,
  onStartTrial,
}) {
  const plan = PLANS[billingInterval];
  const isYearly = billingInterval === "yearly";

  return (
    <section
      id="pricing"
      className="relative w-full scroll-mt-24 overflow-hidden py-16 sm:py-20 md:py-28"
    >
      <div
        aria-hidden
        className="features-grid-bg pointer-events-none absolute inset-0 opacity-40"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/40 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white/70" />
            </span>
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
              Pricing
            </span>
          </div>
          <h2 className="font-display text-3xl leading-[1.08] tracking-tight text-white sm:text-4xl md:text-5xl">
            One plan. Full access.
            <span className="mt-1 block text-white/35">
              No tiers. No upsells.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/40 sm:text-base">
            Every intelligence tool included. Try free for 7 days — lock your
            early-adopter rate for life.
          </p>
        </div>

        {/* Launch offer — monochrome glass */}
        <div className="mx-auto mb-6 max-w-4xl sm:mb-8">
          <div className="pricing-offer relative overflow-hidden rounded-2xl sm:rounded-[1.35rem]">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-16 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-white/[0.03] blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 top-0 h-28 w-28 rounded-full bg-white/[0.025] blur-3xl"
            />

            <div className="relative z-[1] flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-7 sm:py-6">
              <div className="min-w-0 text-left">
                <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-white/55">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/50 opacity-50" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white/80" />
                    </span>
                    Launch offer
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/25">
                    Ends soon
                  </span>
                </div>
                <p className="font-display text-lg leading-snug tracking-tight text-white sm:text-xl">
                  Lock early-adopter pricing for life
                </p>
                <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-white/40">
                  Secure your{" "}
                  <span className="text-white/70">{plan.label.toLowerCase()}</span>{" "}
                  rate before multi-tier pricing. Your price never goes up —
                  even as we ship new features.
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/25 sm:pr-0.5">
                  Offer ends in
                </span>
                <Countdown timeLeft={timeLeft} />
              </div>
            </div>
          </div>
        </div>

        {/* Main pricing card */}
        <div className="pricing-card relative mx-auto max-w-4xl">
          <div className="relative z-[2] grid md:grid-cols-12">
            {/* Left — price & CTA */}
            <div className="flex flex-col border-b border-white/[0.06] p-6 sm:p-8 md:col-span-5 md:border-b-0 md:border-r md:border-white/[0.06]">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">
                  Svay Pro
                </span>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-white/40">
                  All features
                </span>
                {/* Always reserve badge slot so monthly/yearly toggle doesn't shift layout */}
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider transition-opacity duration-200",
                    isYearly
                      ? "border-white/[0.08] bg-white/[0.04] text-white/40 opacity-100"
                      : "border-transparent bg-transparent text-transparent opacity-0 pointer-events-none"
                  )}
                  aria-hidden={!isYearly}
                >
                  Best value
                </span>
              </div>

              {/* Billing toggle */}
              <div className="mb-6 flex">
                <div className="pricing-toggle w-full sm:w-auto">
                  {["monthly", "yearly"].map((interval) => {
                    const active = billingInterval === interval;
                    return (
                      <button
                        key={interval}
                        type="button"
                        onClick={() => setBillingInterval(interval)}
                        className={cn(
                          "relative flex-1 rounded-full px-3.5 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] transition-colors duration-300 sm:flex-none sm:px-4",
                          active
                            ? "text-black"
                            : "text-white/40 hover:text-white/70"
                        )}
                      >
                        {interval === "yearly" ? "Yearly" : "Monthly"}
                        {interval === "yearly" && (
                          <span
                            className={cn(
                              "ml-1.5 rounded-full px-1.5 py-0.5 text-[8px] tracking-wide",
                              active
                                ? "bg-black/10 text-black/65"
                                : "border border-white/[0.1] bg-white/[0.04] text-white/45"
                            )}
                          >
                            −33%
                          </span>
                        )}
                        {active && (
                          <motion.div
                            layoutId="pricingBillingPill"
                            className="absolute inset-0 -z-10 rounded-full bg-white shadow-[0_4px_24px_rgba(255,255,255,0.12)]"
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 30,
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price — fixed-width tabular so 9.99 ↔ 6.66 doesn't jump layout */}
              <div className="flex items-end gap-1 min-h-[4.75rem] sm:min-h-[5.25rem]">
                <span className="mb-2 font-display text-2xl text-white/25 sm:mb-3">
                  $
                </span>
                <span
                  className="font-display text-6xl tabular-nums tracking-tight text-white sm:text-7xl md:text-[4.75rem] md:leading-none min-w-[4.5ch]"
                >
                  {typeof priceDisplay === "number"
                    ? priceDisplay.toFixed(2)
                    : priceDisplay}
                </span>
                <span className="mb-2 ml-1 font-mono text-xs text-white/35 sm:mb-3">
                  /mo
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 min-h-[1.5rem]">
                <span className="font-mono text-sm text-white/25 line-through">
                  ${plan.struck}
                </span>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/45">
                  Save {plan.save}
                </span>
              </div>

              {/* Fixed-height copy block so monthly/yearly text swap doesn't shift CTA */}
              <div className="mt-4 space-y-1 min-h-[2.75rem]">
                <p className="text-xs leading-relaxed text-white/40">
                  {plan.billing}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/30">
                  {plan.subtotal} · {plan.note}
                </p>
              </div>

              <div className="mt-auto pt-8">
                <button
                  type="button"
                  onClick={onStartTrial}
                  className="group inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full border border-white/80 bg-white px-8 text-sm font-bold text-[#030308] shadow-[0_12px_40px_-16px_rgba(255,255,255,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/95 hover:shadow-[0_0_48px_-12px_rgba(255,255,255,0.35)] active:scale-[0.98]"
                >
                  {plan.cta}
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </button>
                <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-wider text-white/25">
                  7-day free · Secure checkout via Dodo Payments
                </p>
              </div>
            </div>

            {/* Right — features */}
            <div className="flex flex-col p-6 sm:p-8 md:col-span-7">
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
                    What&apos;s included
                  </p>
                  <p className="mt-1.5 text-sm text-white/40">
                    Everything below — no feature gates.
                  </p>
                </div>
                <span className="hidden shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-white/30 sm:inline-flex">
                  9 capabilities
                </span>
              </div>

              <div className="grid flex-1 gap-3">
                {PRICING_FEATURE_GROUPS.map((group) => {
                  const Icon = GROUP_ICONS[group.label] || Sparkles;
                  return (
                    <div
                      key={group.label}
                      className="rounded-2xl border border-white/[0.06] bg-white/[0.015] px-3.5 py-3.5 transition-colors duration-300 hover:border-white/[0.1] hover:bg-white/[0.03] sm:px-4"
                    >
                      <div className="mb-2.5 flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.04]">
                          <Icon
                            className="size-3 text-white/50"
                            strokeWidth={1.75}
                          />
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                          {group.label}
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {group.features.map((feat) => (
                          <li key={feat} className="pricing-feature-item !p-0">
                            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04]">
                              <Check
                                className="size-2 text-white/55"
                                strokeWidth={3}
                              />
                            </span>
                            <span className="text-[12.5px] leading-snug text-white/55">
                              {feat}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.06] pt-5">
                {TRUST.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 text-xs text-white/35"
                  >
                    <Icon className="size-3.5 shrink-0 text-white/40" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
