'use client';

import RevealOnScroll from '../ui/RevealOnScroll';

/**
 * Bottom call-to-action section.
 */
export default function LandingCta() {
  return (
    <section className="relative z-10 py-16 px-4 md:px-8 max-w-7xl mx-auto">
      <RevealOnScroll>
        <div className="rounded-3xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md p-10 md:p-16 text-center relative overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.9)]">
          {/* Decorative glow */}
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-volt/5 rounded-full filter blur-[80px] pointer-events-none" />

          {/* Huge watermark */}
          <div className="absolute font-logo font-black text-white/[0.015] text-8xl md:text-[160px] leading-none tracking-tighter select-none pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 uppercase">
            SVAY
          </div>

          <div className="relative z-10 max-w-xl mx-auto">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-volt mb-4 block">
              Publish with confidence
            </span>
            <h2 className="font-display font-extrabold text-3.5xl md:text-5xl tracking-tight text-white mb-6">
              Build a content library<br />that stands out.
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-10 font-normal">
              Stop leaving your content strategy to chance. Get real-time competitor insights and
              trend alerts today.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#pricing"
                className="w-full sm:w-auto px-8 py-4 bg-brand-volt hover:bg-[#33f3ff] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_25px_rgba(0,240,255,0.15)] text-center"
              >
                Start Trial
              </a>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all text-center"
              >
                Features
              </a>
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
