"use client";

import { ArrowRight, Play, Zap } from "lucide-react";
import { Globe } from "@/registry/magicui/globe";

export function GoCta({ onStartTrial, onLaunchDemo }) {
  return (
    <section className="relative w-full overflow-hidden px-4 pb-6 pt-4 sm:px-6 sm:pb-8 md:pb-10">
      <div className="relative mx-auto max-w-7xl">
        <div
          className="landing-nav-border group relative overflow-hidden rounded-[1.75rem] px-6 py-14 text-center sm:px-10 sm:py-16 md:px-16 md:py-20"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 10% 0%, rgba(96,165,250,0.1), transparent 50%), radial-gradient(ellipse 70% 50% at 100% 100%, rgba(147,197,253,0.04), transparent 55%), #06060a",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-blue-400/[0.08] blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-blue-300/[0.05] blur-3xl"
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[min(55%,320px)] items-center justify-center overflow-hidden sm:h-[min(60%,380px)]">
            <span className="bg-gradient-to-b from-white/10 to-white/[0.02] bg-clip-text text-center font-display text-[5.5rem] font-semibold leading-none tracking-tighter text-transparent sm:text-[7rem] md:text-[8rem]">
              GO
            </span>
            <Globe className="top-16 sm:top-20 md:top-28" />
            <div className="absolute inset-0 h-full bg-[radial-gradient(circle_at_50%_200%,rgba(0,0,0,0.45),rgba(6,6,10,0))]" />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1">
              <Zap className="size-3 text-blue-400/80" />
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
                Ready when you are
              </span>
            </div>

            <h2 className="mt-6 max-w-2xl font-display text-3xl leading-[1.08] tracking-tight text-white sm:text-4xl md:text-5xl">
              Stop guessing.
              <span className="mt-1.5 block bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent sm:mt-1">
                Start publishing with intel.
              </span>
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/45 sm:text-base">
              Your niche moves fast. Get trend signals, competitor benchmarks,
              and breakout alerts — then hit publish with confidence.
            </p>

            <div className="mt-9 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={onStartTrial}
                className="group inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full border border-white/85 bg-gradient-to-b from-white to-[#e8f2ff] px-8 text-sm font-bold text-[#030308] shadow-[0_12px_40px_-16px_rgba(96,165,250,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_56px_-8px_rgba(96,165,250,0.55)] active:scale-[0.98] sm:w-auto"
              >
                Go — start free trial
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
              <button
                type="button"
                onClick={onLaunchDemo}
                className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full border border-white/12 bg-white/[0.04] px-8 text-sm font-bold text-white backdrop-blur-md transition-all duration-300 hover:border-blue-400/35 hover:bg-blue-400/10 active:scale-[0.98] sm:w-auto"
              >
                <Play className="size-3.5 fill-white/80 text-white/80" />
                Launch demo
              </button>
            </div>

            <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.16em] text-white/25">
              7-day free trial · No card required to explore demo
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}