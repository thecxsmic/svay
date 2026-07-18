"use client";

import Link from "next/link";
import {
  DollarSign,
  Type,
  Tags,
  Heart,
  FileText,
  ListOrdered,
  Target,
  SearchCode,
  ArrowRight,
  Wrench,
} from "lucide-react";
import ToolsShell from "../components/tools/ToolsShell";
import ToolsQuotaBanner from "../components/tools/ToolsQuotaBanner";
import { useToolsQuota } from "../components/tools/useToolsQuota";

const TOOLS = [
  {
    href: "/tools/earnings",
    icon: DollarSign,
    title: "Earnings Calculator",
    desc: "Estimate YouTube ad revenue from views and region RPM.",
    badge: "Popular",
    id: "earnings",
  },
  {
    href: "/tools/title",
    icon: Type,
    title: "Title Analyzer",
    desc: "Check length, mobile truncation, and hook strength.",
    badge: null,
    id: "title",
  },
  {
    href: "/tools/tags",
    icon: Tags,
    title: "Tag Generator",
    desc: "Build a clean keyword tag set from a topic or niche.",
    badge: null,
    id: "tags",
  },
  {
    href: "/tools/engagement",
    icon: Heart,
    title: "Engagement Rate",
    desc: "Score likes + comments per view against creator benchmarks.",
    badge: "New",
    id: "engagement",
  },
  {
    href: "/tools/script",
    icon: FileText,
    title: "Script Duration",
    desc: "Convert a draft script into estimated speaking runtime.",
    badge: "New",
    id: "script",
  },
  {
    href: "/tools/chapters",
    icon: ListOrdered,
    title: "Chapter Timestamps",
    desc: "Format YouTube description chapters ready to paste.",
    badge: "New",
    id: "chapters",
  },
  {
    href: "/tools/milestones",
    icon: Target,
    title: "Subscriber Milestones",
    desc: "Project ETA to 10K, 100K, 1M from daily growth.",
    badge: "New",
    id: "milestones",
  },
  {
    href: "/tools/seo",
    icon: SearchCode,
    title: "Keyword SEO Check",
    desc: "Validate keyword placement in title and description.",
    badge: "New",
    id: "seo",
  },
];

export default function ToolsIndexPage() {
  const { quota, tiers, loading } = useToolsQuota();

  return (
    <ToolsShell title="Free Tools" description="Rate-limited · account-aware" icon={Wrench}>
      <div className="space-y-2">
        <p className="text-sm text-zinc-500">
          Lightweight creator utilities with server-side quotas. Each run counts against your
          daily allowance for this account and network.
        </p>
      </div>

      <ToolsQuotaBanner quota={quota} loading={loading} />

      {/* Tier comparison */}
      {tiers && (
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
          <div className="border-b border-zinc-800/80 px-4 py-3 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Account limits
            </p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-zinc-800/80 sm:grid-cols-4">
            {["anonymous", "free", "demo", "pro"].map((id) => {
              const t = tiers[id];
              if (!t) return null;
              const active = quota?.tier === id;
              return (
                <div
                  key={id}
                  className={`bg-zinc-950 px-3 py-3.5 sm:px-4 ${
                    active ? "ring-1 ring-inset ring-white/15" : ""
                  }`}
                >
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                    {t.label}
                    {active && (
                      <span className="ml-1 text-zinc-400">· you</span>
                    )}
                  </p>
                  <p className="mt-1.5 text-sm font-bold text-white">
                    {t.dailyGlobal}
                    <span className="text-[10px] font-bold text-zinc-500"> /day</span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-zinc-600">
                    {t.dailyPerTool}/tool · {t.burstPerMin}/min
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TOOLS.map(({ href, icon: Icon, title, desc, badge, id }) => {
          const toolQuota = quota?.tools?.[id];
          return (
            <Link
              key={href}
              href={href}
              className="group flex flex-col rounded-lg border border-zinc-800 bg-zinc-950/50 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-950"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/5">
                  <Icon className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-white" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  {badge && (
                    <span className="rounded-full border border-zinc-800 bg-black px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                      {badge}
                    </span>
                  )}
                  {toolQuota && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                      {toolQuota.remaining} left
                    </span>
                  )}
                </div>
              </div>
              <h2 className="text-sm font-bold text-white">{title}</h2>
              <p className="mt-1.5 flex-1 text-[12px] leading-relaxed text-zinc-500">
                {desc}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 transition-colors group-hover:text-white">
                Open tool
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>

      <section className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-5 sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Want more?
        </p>
        <h2 className="mt-2 text-sm font-bold text-white">
          Trend radar, competitors, and full channel analytics
        </h2>
        <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-500">
          Pro unlocks real-time viral analysis, competitor matrices, smart search, and growth
          tracking — with a 7-day free trial.
        </p>
        <Link
          href="/sign-in"
          className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200"
        >
          Start free trial
          <ArrowRight className="h-3 w-3" />
        </Link>
      </section>
    </ToolsShell>
  );
}
