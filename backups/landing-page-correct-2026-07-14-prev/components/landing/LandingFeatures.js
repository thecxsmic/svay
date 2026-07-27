'use client';

import { Cpu } from 'lucide-react';
import RevealOnScroll from '../ui/RevealOnScroll';
import SectionBadge from '../ui/SectionBadge';
import FeatureTag from '../ui/FeatureTag';
import { FEATURE_CARDS } from '../data/landingFeatures';

/**
 * Renders a single feature bento card.
 *
 * @param {{ card: import('../data/landingFeatures').FeatureCard; delay: number }} props
 */
function FeatureCard({ card, delay }) {
  const Icon = card.icon;
  const isWide = card.colSpan.includes('col-span-2') || card.colSpan.includes('col-span-3');

  return (
    <RevealOnScroll delay={delay}>
      <div
        className={`interactive-card group relative p-8 rounded-3xl bg-zinc-950/60 border border-white/[0.08] hover:border-${card.accentColor}/30 transition-all duration-300 hover:-translate-y-1 ${card.colSpan} overflow-hidden flex flex-col justify-between shadow-[0_15px_35px_rgba(0,0,0,0.8)]`}
      >
        <div
          className={`absolute top-0 right-0 ${isWide ? 'w-64 h-64' : 'w-32 h-32'} bg-${card.accentColor}/5 rounded-bl-full pointer-events-none group-hover:bg-${card.accentColor}/8 transition-all duration-500 filter ${isWide ? 'blur-2xl' : 'blur-xl'}`}
        />

        <div>
          <span
            className={`font-mono text-[9px] font-extrabold text-zinc-500 group-hover:text-${card.accentColor} transition-colors uppercase tracking-widest block mb-4`}
          >
            {card.code}
          </span>

          {isWide ? (
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              <div className="space-y-3 flex-1 text-left">
                <div
                  className={`w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl group-hover:border-${card.accentColor}/30 group-hover:bg-zinc-950 transition-colors`}
                >
                  <Icon className={`w-5 h-5 text-${card.accentColor}`} />
                </div>
                <h3 className="font-display font-extrabold text-xl text-white">{card.title}</h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-normal">{card.description}</p>
              </div>

              {/* Card-specific inline mockups for wide cards */}
              {card.id === 'analytics' && (
                <div className="w-full lg:w-48 bg-black/40 border border-zinc-900 rounded-xl p-3.5 space-y-2 shrink-0 text-[8px] font-mono text-left">
                  <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                    <span className="text-zinc-500 uppercase font-black">Velocity Stat</span>
                    <span className="text-brand-volt font-black">ACTIVE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total Views</span>
                    <span className="text-white font-extrabold">3.4M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Net Growth</span>
                    <span className="text-brand-volt font-extrabold">+14.2%</span>
                  </div>
                  <div className="h-1 bg-zinc-900 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-brand-volt rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>
              )}

              {card.id === 'digests' && (
                <div className="w-full lg:w-64 bg-black/40 border border-zinc-900 rounded-xl p-3.5 space-y-2 shrink-0 text-left font-sans shadow-inner">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-1.5 text-[8px] font-mono text-zinc-500">
                    <span>From: intelligence@svay.space</span>
                    <span>Just now</span>
                  </div>
                  <h4 className="text-[10px] font-extrabold text-white">Weekly Competitor Matrix Alert</h4>
                  <p className="text-[8px] text-zinc-400 leading-normal">
                    🔥 <span className="text-brand-rose font-bold">AI Agents</span> format has spiked by{' '}
                    <strong>+147%</strong> views this week. We recommend outlining a draft immediately.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div
                className={`w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl mb-6 group-hover:border-${card.accentColor}/30 group-hover:bg-zinc-950 transition-colors`}
              >
                <Icon className={`w-5 h-5 text-${card.accentColor}`} />
              </div>
              <h3 className="font-display font-extrabold text-xl text-white mb-3 text-left">{card.title}</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-normal text-left">{card.description}</p>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-6">
          {card.tags.map((tag) => (
            <FeatureTag key={tag} label={tag} />
          ))}
        </div>
      </div>
    </RevealOnScroll>
  );
}

/**
 * Features bento grid section.
 */
export default function LandingFeatures() {
  return (
    <section id="features" className="relative z-10 py-24 px-4 md:px-8 max-w-7xl mx-auto scroll-mt-20">
      <RevealOnScroll>
        <div className="max-w-3xl mb-16 text-left">
          <SectionBadge icon={<Cpu className="w-3.5 h-3.5" />} label="Core Capabilities" />
          <h2 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight text-white mb-6">
            Find your next viral topic.<br />
            Backed by <em className="text-brand-volt not-italic text-glow-volt">performance data</em>.
          </h2>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-lg">
            Move past basic view counters. Svay maps the actual momentum, formatting, and keyword
            relationships driving successful channels in your space.
          </p>
        </div>
      </RevealOnScroll>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {FEATURE_CARDS.map((card, i) => (
          <FeatureCard key={card.id} card={card} delay={i * 0.1} />
        ))}
      </div>
    </section>
  );
}
