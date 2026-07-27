'use client';

import { Star, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import RevealOnScroll from '../ui/RevealOnScroll';
import SectionBadge from '../ui/SectionBadge';
import { PRICING_FEATURES } from '../data/landingPricing';

/**
 * Countdown timer display block.
 *
 * @param {{ timeLeft: { days: number; hours: number; minutes: number; seconds: number } }} props
 */
function CountdownTimer({ timeLeft }) {
  const units = [
    { value: timeLeft.days, label: 'days', className: 'text-brand-volt text-glow-volt' },
    { value: timeLeft.hours, label: 'hours', className: 'text-brand-volt text-glow-volt' },
    { value: timeLeft.minutes, label: 'mins', className: 'text-brand-volt text-glow-volt' },
    { value: timeLeft.seconds, label: 'secs', className: 'text-brand-rose font-black animate-pulse' },
  ];

  return (
    <div className="flex items-center gap-4 bg-black/40 border border-white/[0.06] p-3 md:p-4 rounded-2xl shrink-0 w-full lg:w-auto justify-between lg:justify-start shadow-inner backdrop-blur-md">
      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
        Offer ends in
      </span>
      <div className="flex items-center gap-3 font-mono font-bold text-sm">
        {units.map((unit, i) => (
          <span key={unit.label} className="contents">
            <div className="flex flex-col items-center min-w-[28px]">
              <span className={`text-base md:text-lg ${unit.className} leading-none`}>
                {String(unit.value).padStart(2, '0')}
              </span>
              <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-wider mt-1.5">
                {unit.label}
              </span>
            </div>
            {i < units.length - 1 && (
              <span className="text-zinc-700 font-sans text-sm pb-3.5 leading-none select-none">:</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Pricing section.
 *
 * @param {{
 *   billingInterval: 'monthly' | 'yearly';
 *   setBillingInterval: (v: 'monthly' | 'yearly') => void;
 *   priceDisplay: number;
 *   timeLeft: { days: number; hours: number; minutes: number; seconds: number };
 *   onStartTrial: () => void;
 * }} props
 */
export default function LandingPricing({
  billingInterval,
  setBillingInterval,
  priceDisplay,
  timeLeft,
  onStartTrial,
}) {
  return (
    <section id="pricing" className="relative z-10 py-20 px-4 md:px-8 max-w-5xl mx-auto scroll-mt-20">
      {/* Header */}
      <RevealOnScroll>
        <div className="text-center mb-12">
          <SectionBadge icon={<Star className="w-3.5 h-3.5 fill-brand-volt" />} label="Simple Pricing" />
          <h2 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight text-white mb-4">
            One simple plan. Full access.
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto mb-8">
            Try it free for 7 days. Cancel with a single click at any time.
          </p>

          {/* Billing toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-zinc-950/60 border border-zinc-800/80 p-1.5 rounded-2xl inline-flex gap-1 relative backdrop-blur-md shadow-inner">
              {(['monthly', 'yearly'] ).map((interval) => (
                <button
                  key={interval}
                  onClick={() => setBillingInterval(interval)}
                  className={`py-2.5 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 relative z-10 flex items-center gap-2 cursor-pointer ${
                    billingInterval === interval ? 'text-zinc-950' : 'text-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  {interval.charAt(0).toUpperCase() + interval.slice(1)}
                  {interval === 'yearly' && (
                    <span
                      className={`text-[8px] font-black px-1.5 py-0.5 rounded tracking-wide transition-colors ${
                        billingInterval === 'yearly'
                          ? 'bg-zinc-950/10 text-zinc-950'
                          : 'bg-brand-rose/15 text-brand-rose border border-brand-rose/20'
                      }`}
                    >
                      Save 30%
                    </span>
                  )}
                  {billingInterval === interval && (
                    <motion.div
                      layoutId="activeBillingPill"
                      className="absolute inset-0 bg-brand-volt rounded-xl -z-10 shadow-[0_4px_20px_rgba(0,240,255,0.25)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </RevealOnScroll>

      {/* Early adopter banner */}
      <RevealOnScroll delay={0.1}>
        <div className="rounded-3xl border border-white/[0.08] bg-zinc-950/60 backdrop-blur-xl overflow-hidden relative mb-8 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="absolute -left-16 -top-16 w-36 h-36 bg-brand-rose/8 rounded-full filter blur-3xl pointer-events-none" />
          <div className="absolute -right-16 -bottom-16 w-36 h-36 bg-brand-volt/5 rounded-full filter blur-3xl pointer-events-none" />

          <div className="p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="bg-brand-rose/10 border border-brand-rose/25 text-brand-rose text-[9px] font-black tracking-widest px-3 py-1.5 rounded-full uppercase flex items-center gap-1.5 shrink-0 select-none shadow-[0_0_15px_rgba(255,79,109,0.1)]">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-rose animate-pulse" />
                <span>Launch Offer</span>
              </div>
              <div className="text-left">
                <h3 className="font-display font-extrabold text-xl md:text-2xl text-white tracking-tight uppercase leading-tight">
                  Lock in early adopter pricing for life
                </h3>
                <p className="text-xs text-zinc-400 mt-2 max-w-xl font-normal leading-relaxed">
                  Secure your <strong className="text-white font-extrabold">{billingInterval}</strong> rate before
                  we introduce multi-tier pricing. Your rate will never increase, even as features are added.
                </p>
              </div>
            </div>
            <CountdownTimer timeLeft={timeLeft} />
          </div>
        </div>
      </RevealOnScroll>

      {/* Pricing card */}
      <RevealOnScroll delay={0.2}>
        <div className="rounded-3xl border border-brand-volt/20 bg-zinc-950/70 backdrop-blur-md overflow-hidden relative grid grid-cols-1 md:grid-cols-12 gap-8 p-8 md:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.8),0_0_50px_rgba(0,240,255,0.02)]">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-volt to-brand-mint" />

          {/* Left panel — price */}
          <div className="md:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <div className="flex items-center gap-2 text-brand-volt font-black uppercase text-[10px] tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-volt" />
                  Svay Pro {billingInterval === 'yearly' ? 'Yearly' : 'Monthly'}
                </div>
                <span className="bg-brand-volt/10 border border-brand-volt/20 text-brand-volt font-black text-[8px] px-2 py-0.5 rounded-full tracking-wide uppercase select-none">
                  Early Adopter Rate Lock
                </span>
              </div>

              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="font-display font-extrabold text-3xl text-zinc-500">₹</span>
                <span className="font-display font-extrabold text-6xl md:text-7.5xl text-white tracking-tighter transition-all">
                  {priceDisplay}
                </span>
                <span className="font-mono text-zinc-500 text-xs font-bold">/ month</span>
              </div>

              <div className="flex flex-col gap-1.5 mb-6 text-left">
                <div className="flex items-center gap-2">
                  {billingInterval === 'monthly' ? (
                    <>
                      <span className="text-zinc-500 line-through text-sm font-bold">₹1,499/mo</span>
                      <span className="bg-brand-rose/15 text-brand-rose border border-brand-rose/25 font-black text-[9px] px-2 py-0.5 rounded tracking-wide uppercase">
                        SAVE 33%
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-zinc-500 line-through text-sm font-bold">₹999/mo</span>
                      <span className="bg-brand-rose/15 text-brand-rose border border-brand-rose/25 font-black text-[9px] px-2 py-0.5 rounded tracking-wide uppercase">
                        SAVE 30%
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 font-semibold tracking-wide leading-relaxed">
                  Subscription plan. Rate locked-in for life. Your price will never increase.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-extrabold text-brand-mint mb-8">
                <Check className="w-4 h-4" /> Start your 7-day free trial · Cancel anytime
              </div>
            </div>

            <div>
              <button
                onClick={onStartTrial}
                className="w-full py-4.5 bg-brand-volt hover:bg-[#33f3ff] text-black font-extrabold text-sm uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_35px_rgba(0,240,255,0.3)] hover:shadow-[0_0_50px_rgba(0,240,255,0.55)] hover:-translate-y-0.5 cursor-pointer"
              >
                Start Trial
              </button>
              <p className="text-[10px] text-zinc-500 text-center mt-3 font-semibold tracking-wide">
                {billingInterval === 'yearly'
                  ? 'Billed annually at ₹8,388/year (₹699/mo) · Cancel at any time · Secure checkout powered by Razorpay'
                  : 'Thereafter ₹999/month · Cancel at any time · Secure checkout powered by Razorpay'}
              </p>
            </div>
          </div>

          {/* Right panel — features list */}
          <div className="md:col-span-6 border-t md:border-t-0 md:border-l border-zinc-900 pt-8 md:pt-0 md:pl-8 flex flex-col justify-center">
            <ul className="space-y-3.5 text-xs text-zinc-300">
              {PRICING_FEATURES.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-brand-volt font-bold shrink-0 mt-0.5">→</span>
                  <span className="font-normal">{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
