'use client';

import { Zap, Monitor, Check } from 'lucide-react';
import RevealOnScroll from '../ui/RevealOnScroll';
import SectionBadge from '../ui/SectionBadge';
import { SANDBOX_FEATURES } from '../data/landingContent';

/**
 * Live demo / sandbox preview section.
 *
 * @param {{ onEnterDemo: (e?: React.MouseEvent) => void }} props
 */
export default function LandingDemo({ onEnterDemo }) {
  return (
    <section id="demo" className="relative z-10 py-24 px-4 md:px-8 max-w-5xl mx-auto scroll-mt-20">
      <RevealOnScroll>
        <div className="rounded-[2.5rem] border border-white/[0.08] bg-zinc-950/60 shadow-[0_24px_80px_rgba(0,0,0,0.9)] overflow-hidden p-8 md:p-14 relative group">
          {/* Accent lighting */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand-volt to-transparent opacity-70" />
          <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-volt/5 rounded-full filter blur-[80px] pointer-events-none group-hover:bg-brand-volt/10 transition-colors duration-700" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
            {/* Info side */}
            <div className="md:col-span-7 text-left space-y-6">
              <SectionBadge
                icon={<Zap className="w-3.5 h-3.5" />}
                label="Zero-friction preview"
              />

              <h2 className="font-display font-extrabold text-3.5xl md:text-5.5xl tracking-tight text-white leading-none uppercase">
                Test-drive the<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0052ff] via-[#00d2ff] to-[#7c3aed] text-glow-volt">
                  <span className="font-logo">Svay</span> Workspace.
                </span>
              </h2>

              <p className="text-zinc-400 text-sm leading-relaxed max-w-lg font-normal">
                See the intelligence engine in action without sharing credentials or linking your
                account. Launch our interactive sandbox instantly to explore competitor insights,
                query real-time trend scoring, and see how reports are structured.
              </p>

              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  What's in the sandbox:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SANDBOX_FEATURES.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs text-zinc-350">
                      <div className="w-4 h-4 rounded-full bg-brand-volt/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-brand-volt" />
                      </div>
                      <span className="font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={onEnterDemo}
                  className="px-8 py-4 bg-brand-volt hover:bg-[#33f3ff] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_30px_rgba(0,240,255,0.15)] hover:shadow-[0_0_40px_rgba(0,240,255,0.35)] hover:-translate-y-0.5 text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Monitor className="w-4 h-4" /> Enter Sandbox
                </button>
                <a
                  href="#pricing"
                  className="px-8 py-4 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all text-center flex items-center justify-center gap-2 hover:-translate-y-0.5"
                >
                  Pro Plans
                </a>
              </div>
            </div>

            {/* Graphic side — Console mockup */}
            <div className="md:col-span-5 relative flex items-center justify-center">
              <div
                className="w-full aspect-[4/3] rounded-2xl border border-white/[0.08] bg-zinc-950/80 p-5 flex flex-col justify-between relative overflow-hidden group/console backdrop-blur-xl"
                style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)' }}
              >
                {/* Window bar */}
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5 mr-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    </div>
                    <span className="font-mono text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                      demo@svay.space:~
                    </span>
                  </div>
                  <span className="text-[8px] font-bold text-zinc-650 uppercase tracking-widest font-mono">
                    Console V3.0
                  </span>
                </div>

                {/* Metric cells */}
                <div className="flex-1 space-y-4 text-left">
                  <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-900 flex items-center justify-between hover:border-brand-volt/20 transition-all">
                    <div>
                      <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Subscriber count</p>
                      <p className="font-mono text-xl font-extrabold text-white">124,500</p>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-brand-mint bg-brand-mint/10 border border-brand-mint/20 px-2 py-0.5 rounded-md">
                      +1.8K today
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-900 space-y-2.5 hover:border-brand-volt/20 transition-all">
                    <div className="flex justify-between items-center">
                      <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Active Radar Scans</p>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-volt opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-volt" />
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden p-[1px] border border-zinc-900">
                      <div
                        className="h-full bg-gradient-to-r from-brand-volt to-brand-mint rounded-full animate-pulse shadow-[0_0_8px_#00f0ff]"
                        style={{ width: '75%' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Status badges */}
                <div className="pt-4 border-t border-zinc-900 flex items-center justify-between text-[8px] font-mono text-zinc-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5 bg-zinc-900/40 px-2.5 py-1 rounded-lg border border-zinc-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-volt shadow-[0_0_6px_#00f0ff]" />
                    <span>Sandbox Connection</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-zinc-900/40 px-2.5 py-1 rounded-lg border border-zinc-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-mint animate-pulse shadow-[0_0_6px_#00ffca]" />
                    <span>System Active</span>
                  </div>
                </div>

                {/* Border glow */}
                <div className="absolute inset-0 border border-brand-volt/0 group-hover/console:border-brand-volt/10 rounded-2xl transition-colors duration-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
