"use client";

import Link from "next/link";
import {
  ArrowRight,
  DollarSign,
  Type,
  Tags,
  Heart,
  FileText,
  ListOrdered,
  Target,
  SearchCode,
  Wrench,
} from "lucide-react";

const TOOLS = [
  {
    href: "/tools/earnings",
    icon: DollarSign,
    title: "Earnings Calculator",
    desc: "Estimate ad revenue from views and region RPM.",
  },
  {
    href: "/tools/title",
    icon: Type,
    title: "Title Analyzer",
    desc: "Length, hooks, and mobile truncation checks.",
  },
  {
    href: "/tools/tags",
    icon: Tags,
    title: "Tag Generator",
    desc: "Clean keyword tags from a topic or niche.",
  },
  {
    href: "/tools/engagement",
    icon: Heart,
    title: "Engagement Rate",
    desc: "Score likes + comments against benchmarks.",
  },
  {
    href: "/tools/script",
    icon: FileText,
    title: "Script Duration",
    desc: "Convert a draft script into speaking time.",
  },
  {
    href: "/tools/chapters",
    icon: ListOrdered,
    title: "Chapter Timestamps",
    desc: "Format YouTube description chapters.",
  },
  {
    href: "/tools/milestones",
    icon: Target,
    title: "Subscriber Milestones",
    desc: "ETA to 10K, 100K, and 1M from growth rate.",
  },
  {
    href: "/tools/seo",
    icon: SearchCode,
    title: "Keyword SEO Check",
    desc: "Validate keyword placement in metadata.",
  },
];

export function FreeToolsSection() {
  return (
    <section
      id="free-tools"
      className="relative w-full overflow-hidden py-16 sm:py-20 md:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[min(100%,720px)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06),transparent_65%)] blur-2xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 flex flex-col gap-6 sm:mb-12 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1">
              <Wrench className="size-3 text-blue-400/80" />
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
                Free · No account required
              </span>
            </div>
            <h2 className="font-display text-3xl leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
              Creator tools,
              <span className="mt-1 block text-white/35 sm:mt-0">
                free and rate-limited.
              </span>
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/40 sm:text-base">
              Practical utilities for titles, SEO, earnings, and growth — use them
              without Pro. Sign in for higher daily caps.
            </p>
          </div>

          <Link
            href="/tools"
            className="inline-flex h-11 w-fit shrink-0 items-center justify-center gap-2 rounded-full border border-white/70 bg-white px-5 text-xs font-bold text-[#030308] transition-all duration-300 hover:bg-white/90 active:scale-[0.98]"
          >
            Open all tools
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {TOOLS.map(({ href, icon: Icon, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.14] hover:bg-white/[0.04]"
            >
              <div className="mb-4 flex size-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
                <Icon className="size-4 text-white/50 transition-colors group-hover:text-white/80" />
              </div>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="mt-1.5 flex-1 text-[12px] leading-relaxed text-white/40">
                {desc}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/35 transition-colors group-hover:text-white/70">
                Try free
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
