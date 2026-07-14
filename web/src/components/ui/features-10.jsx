"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  BarChart3,
  Flame,
  Radar,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

/* ─────────────────────────────────────────────
 * Features — dark bento, mostly mono + soft blue
 * Continuous ambient motion only (no scroll anims)
 * ───────────────────────────────────────────── */

const BLUE = "#3b82f6";

/** Round to 4dp so SSR string and client number match exactly (no hydration mismatch). */
const n = (v) => Math.round(v * 10000) / 10000;

export function Features() {
  return (
    <section
      id="features"
      className="relative w-full overflow-hidden py-16 sm:py-20 md:py-28"
    >
      {/* soft ambient — white + hint of blue */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-[480px] w-[min(100%,800px)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.07),transparent_65%)] blur-2xl"
        style={{ animation: "features-glow-soft 6s ease-in-out infinite" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 max-w-2xl sm:mb-12 md:mb-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400/60 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-400" />
            </span>
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
              Product · Features
            </span>
          </div>
          <h2 className="font-display text-3xl leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
            Intelligence that feels
            <span className="mt-1 block text-white/35 sm:mt-0">
              like a dashboard, not a report.
            </span>
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/40 sm:text-base">
            Real-time channel signals, breakout trends, and competitor intel —
            designed for creators who move fast.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-12">
          <FeatureShell className="md:col-span-7">
            <FeatureMeta
              icon={BarChart3}
              label="01 · Analytics"
              title="Real-time channel tracking"
              description="Views, velocity, and milestones — updated as the niche moves."
            />
            <div className="mt-5 sm:mt-6">
              <AnalyticsDemo />
            </div>
          </FeatureShell>

          <FeatureShell className="md:col-span-5">
            <FeatureMeta
              icon={Radar}
              label="02 · Radar"
              title="Trend Radar"
              description="Catch rising queries before saturation."
            />
            <div className="mt-5 sm:mt-6">
              <TrendRadarDemo />
            </div>
          </FeatureShell>

          <FeatureShell className="md:col-span-4">
            <FeatureMeta
              icon={Flame}
              label="03 · Score"
              title="Virality factor"
              description="Proprietary ranking on every result."
            />
            <div className="mt-5 sm:mt-6">
              <ViralityDemo />
            </div>
          </FeatureShell>

          <FeatureShell className="md:col-span-8">
            <FeatureMeta
              icon={Target}
              label="04 · Intel"
              title="Competitor matrix"
              description="Benchmark formats, cadence, and efficiency against rivals."
            />
            <div className="mt-5 sm:mt-6">
              <CompetitorDemo />
            </div>
          </FeatureShell>

          <FeatureShell className="md:col-span-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10 xl:gap-12">
              <div className="w-full shrink-0 lg:w-[34%] xl:w-[36%]">
                <FeatureMeta
                  icon={Zap}
                  label="05 · Digests"
                  title="Smart alerts, zero noise"
                  description="Competitor moves and viral spikes land in your inbox on a schedule you control."
                />
                <ul className="mt-4 space-y-2 sm:mt-5">
                  {[
                    "Weekly competitor digest",
                    "Breakout tag alerts",
                    "Custom send windows",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-xs text-white/40"
                    >
                      <Sparkles className="size-3 shrink-0 text-blue-400/70" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="min-w-0 flex-1">
                <DigestDemo />
              </div>
            </div>
          </FeatureShell>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
 * Shell / meta
 * ═══════════════════════════════════════════ */

function FeatureShell({ children, className }) {
  return (
    <div
      className={cn(
        "landing-nav-border group relative overflow-hidden rounded-2xl",
        "bg-[#06060a]",
        "p-4 sm:p-5 md:p-6 transition-all duration-500",
        "hover:border-[#1a1a1a]",
        className
      )}
      style={{
        backgroundImage:
          "radial-gradient(ellipse 120% 80% at 100% 0%, rgba(59,130,246,0.05), transparent 55%)",
      }}
    >
      {/* continuous edge shimmer — decorative only, no pointer events */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/3 z-[1] w-1/3 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
        style={{ animation: "features-shimmer 3.6s ease-in-out infinite" }}
      />
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}

function FeatureMeta({ icon: Icon, label, title, description }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-white/35">
        <Icon
          className="size-3.5 shrink-0 text-blue-400/80 transition-colors group-hover:text-blue-300"
          strokeWidth={1.75}
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
          {label}
        </span>
      </div>
      <h3 className="mt-2.5 font-display text-lg tracking-tight text-white sm:mt-3 sm:text-xl md:text-2xl">
        {title}
      </h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-white/38">
        {description}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════
 * Chart helpers
 * ═══════════════════════════════════════════ */

function smoothPath(coords) {
  if (coords.length < 2) return "";
  let d = `M ${coords[0][0]},${coords[0][1]}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const [x0, y0] = coords[i === 0 ? 0 : i - 1];
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[i + 1];
    const [x3, y3] = coords[i + 2] || coords[i + 1];
    const cp1x = x1 + (x2 - x0) / 6;
    const cp1y = y1 + (y2 - y0) / 6;
    const cp2x = x2 - (x3 - x1) / 6;
    const cp2y = y2 - (y3 - y1) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`;
  }
  return d;
}

/* ═══════════════════════════════════════════
 * Analytics
 * ═══════════════════════════════════════════ */

function AnalyticsDemo() {
  const points = useMemo(
    () => [22, 28, 26, 38, 34, 48, 44, 62, 58, 74, 80, 96],
    []
  );
  const bars = useMemo(
    () => [32, 48, 28, 62, 40, 74, 52, 88, 68, 56, 80, 94],
    []
  );

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-black/40 p-3 sm:p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-blue-500/[0.07] blur-3xl"
        style={{ animation: "features-glow-soft 5s ease-in-out infinite" }}
      />

      <div className="relative mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/25">
            Total views · 30d
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <span className="font-display text-2xl tabular-nums text-white sm:text-3xl">
              3.42M
            </span>
            <span
              className="inline-flex items-center gap-0.5 rounded-md border border-blue-400/25 bg-blue-500/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-blue-300"
              style={{ animation: "features-breathe 2.8s ease-in-out infinite" }}
            >
              <ArrowUpRight className="size-3" />
              14.2%
            </span>
          </div>
        </div>
        <div className="flex gap-3 sm:gap-5">
          <MiniStat label="Subs" value="+12.4K" />
          <MiniStat label="Videos" value="28" />
          <MiniStat label="Avg VR" value="8.4" accent />
        </div>
      </div>

      <div className="relative -mx-3 -mb-3 h-36 w-auto sm:-mx-4 sm:-mb-4 sm:h-44 md:h-52">
        <div className="absolute inset-x-0 bottom-0 flex h-[45%] items-end gap-[3px] px-0.5 sm:gap-1">
          {bars.map((h, i) => (
            <div
              key={i}
              className="group/bar relative flex-1 overflow-hidden rounded-t-[3px]"
              style={{
                height: `${h}%`,
                animation: `features-bar-fade ${2.4 + (i % 4) * 0.35}s ease-in-out infinite ${i * 80}ms`,
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(59,130,246,0.22), rgba(255,255,255,0.04))",
                }}
              />
              {/* continuous bar shimmer */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                style={{
                  animation: `features-shimmer ${2.6 + (i % 3) * 0.4}s ease-in-out infinite ${i * 120}ms`,
                }}
              />
              <div className="absolute inset-x-0 top-0 h-px bg-blue-300/40 opacity-60" />
            </div>
          ))}
        </div>
        <PremiumAreaChart points={points} />
        <div className="absolute inset-x-0 bottom-2 flex justify-between px-3 font-mono text-[9px] text-white/20 sm:px-4">
          <span>Mar</span>
          <span className="hidden sm:inline">Apr</span>
          <span>May</span>
          <span>Jun</span>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }) {
  return (
    <div className="text-left sm:text-right">
      <p className="font-mono text-[9px] uppercase tracking-widest text-white/25">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-mono text-xs tabular-nums sm:text-[13px]",
          accent ? "text-blue-300" : "text-white/55"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function PremiumAreaChart({ points }) {
  const id = useId();
  const w = 480;
  const h = 160;
  const padX = 6;
  const padY = 10;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = padX + (i / (points.length - 1)) * (w - padX * 2);
    const y = h - padY - ((p - min) / range) * (h - padY * 2);
    return [x, y];
  });

  const line = smoothPath(coords);
  const last = coords[coords.length - 1];
  const area = `${line} L ${last[0]},${h} L ${coords[0][0]},${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BLUE} stopOpacity="0.28" />
          <stop offset="55%" stopColor={BLUE} stopOpacity="0.06" />
          <stop offset="100%" stopColor={BLUE} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-stroke`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="55%" stopColor={BLUE} stopOpacity="0.95" />
          <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.8" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {[0.2, 0.4, 0.6, 0.8].map((t) => (
        <line
          key={t}
          x1={0}
          x2={w}
          y1={h * t}
          y2={h * t}
          stroke="rgba(255,255,255,0.04)"
          strokeDasharray="3 8"
          style={{ animation: "features-dash 8s linear infinite" }}
        />
      ))}

      <path d={area} fill={`url(#${id}-fill)`}>
        <animate
          attributeName="opacity"
          values="0.85;1;0.85"
          dur="4s"
          repeatCount="indefinite"
        />
      </path>
      <path
        d={line}
        fill="none"
        stroke={BLUE}
        strokeWidth="5"
        strokeOpacity="0.15"
        strokeLinecap="round"
        filter={`url(#${id}-glow)`}
      />
      <path
        d={line}
        fill="none"
        stroke={`url(#${id}-stroke)`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map(([x, y], i) =>
        i === coords.length - 1 || i % 3 === 0 ? (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i === coords.length - 1 ? 4 : 1.75}
            fill={
              i === coords.length - 1 ? BLUE : "rgba(255,255,255,0.45)"
            }
            stroke={i === coords.length - 1 ? "rgba(0,0,0,0.5)" : "none"}
            strokeWidth="1.5"
          >
            {i === coords.length - 1 ? (
              <animate
                attributeName="r"
                values="3.5;5;3.5"
                dur="1.8s"
                repeatCount="indefinite"
              />
            ) : null}
          </circle>
        ) : null
      )}
      <circle
        cx={last[0]}
        cy={last[1]}
        r="8"
        fill="none"
        stroke={BLUE}
        strokeOpacity="0.4"
        style={{
          transformOrigin: `${last[0]}px ${last[1]}px`,
          animation: "features-pulse-ring 2s ease-out infinite",
        }}
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════
 * Trend radar — premium monochrome scope
 * ═══════════════════════════════════════════ */

function TrendRadarDemo() {
  const id = useId();

  const signals = [
    {
      label: "AI agents",
      heat: 94,
      delta: "+147%",
      up: true,
      rank: "01",
      spark: [28, 32, 30, 48, 55, 70, 88, 94],
    },
    {
      label: "Shorts hooks",
      heat: 81,
      delta: "+62%",
      up: true,
      rank: "02",
      spark: [40, 38, 45, 52, 50, 68, 74, 81],
    },
    {
      label: "Niche edits",
      heat: 67,
      delta: "−8%",
      up: false,
      rank: "03",
      spark: [72, 70, 68, 65, 70, 66, 64, 67],
    },
  ];

  // polar blips: angle deg, radius 0–1, strength
  const blips = [
    { a: -38, r: 0.72, s: 1, label: "AI" },
    { a: 48, r: 0.55, s: 0.75, label: "SH" },
    { a: 145, r: 0.62, s: 0.55, label: "NE" },
    { a: 210, r: 0.4, s: 0.45, label: "VO" },
    { a: 300, r: 0.78, s: 0.35, label: "" },
  ];

  const cx = 100;
  const cy = 100;
  const maxR = 78;

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-b from-white/[0.035] to-black/50">
      {/* status bar */}
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.05] px-3 py-2 sm:px-3.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400/50 opacity-50" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-400" />
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">
            Live scan
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[9px] text-white/25">
          <span>12 niches</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">refresh 4s</span>
        </div>
      </div>

      {/* radar stage */}
      <div className="relative px-2 pt-3 sm:px-3 sm:pt-4">
        <div className="relative mx-auto aspect-square w-full max-w-[220px] sm:max-w-[240px]">
          {/* outer glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[8%] rounded-full bg-white/[0.03] blur-2xl"
          />

          <svg
            viewBox="0 0 200 200"
            className="absolute inset-0 size-full"
            aria-hidden
          >
            <defs>
              <radialGradient id={`${id}-core`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={BLUE} stopOpacity="0.1" />
                <stop offset="55%" stopColor={BLUE} stopOpacity="0.02" />
                <stop offset="100%" stopColor={BLUE} stopOpacity="0" />
              </radialGradient>
              <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={BLUE} stopOpacity="0" />
                <stop offset="70%" stopColor={BLUE} stopOpacity="0.3" />
                <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.65" />
              </linearGradient>
              <filter id={`${id}-soft`}>
                <feGaussianBlur stdDeviation="1.2" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* sweep sector as SVG for crisp spin */}
              <mask id={`${id}-ringmask`}>
                <rect width="200" height="200" fill="black" />
                <circle cx={cx} cy={cy} r={maxR} fill="white" />
                <circle cx={cx} cy={cy} r="18" fill="black" />
              </mask>
            </defs>

            {/* core fill */}
            <circle cx={cx} cy={cy} r={maxR} fill={`url(#${id}-core)`} />

            {/* concentric range rings */}
            {[1, 0.75, 0.5, 0.28].map((t, i) => (
              <circle
                key={t}
                cx={cx}
                cy={cy}
                r={maxR * t}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={i === 0 ? 1.25 : 0.9}
                strokeDasharray={i === 0 ? "none" : i === 2 ? "2 4" : "none"}
              />
            ))}

            {/* outer tick marks (every 15°) */}
            {Array.from({ length: 24 }).map((_, i) => {
              const a = ((i * 15 - 90) * Math.PI) / 180;
              const major = i % 2 === 0;
              const r1 = maxR + (major ? 1 : 0);
              const r2 = maxR + (major ? 5 : 3);
              return (
                <line
                  key={i}
                  x1={n(cx + Math.cos(a) * r1)}
                  y1={n(cy + Math.sin(a) * r1)}
                  x2={n(cx + Math.cos(a) * r2)}
                  y2={n(cy + Math.sin(a) * r2)}
                  stroke={
                    major
                      ? "rgba(255,255,255,0.28)"
                      : "rgba(255,255,255,0.12)"
                  }
                  strokeWidth={major ? 1.25 : 0.8}
                />
              );
            })}

            {/* spokes every 45° */}
            {Array.from({ length: 8 }).map((_, i) => {
              const a = ((i * 45 - 90) * Math.PI) / 180;
              return (
                <line
                  key={i}
                  x1={n(cx + Math.cos(a) * 18)}
                  y1={n(cy + Math.sin(a) * 18)}
                  x2={n(cx + Math.cos(a) * maxR)}
                  y2={n(cy + Math.sin(a) * maxR)}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="0.8"
                />
              );
            })}

            {/* cardinal labels */}
            {[
              { t: "N", x: cx, y: cy - maxR - 10 },
              { t: "E", x: cx + maxR + 9, y: cy + 3 },
              { t: "S", x: cx, y: cy + maxR + 14 },
              { t: "W", x: cx - maxR - 9, y: cy + 3 },
            ].map((d) => (
              <text
                key={d.t}
                x={d.x}
                y={d.y}
                textAnchor="middle"
                fill="rgba(255,255,255,0.28)"
                fontSize="7"
                fontFamily="ui-monospace, monospace"
                letterSpacing="0.08em"
              >
                {d.t}
              </text>
            ))}

            {/* rotating sweep beam */}
            <g
              style={{
                transformOrigin: `${cx}px ${cy}px`,
                animation: "features-spin 4.5s linear infinite",
              }}
              mask={`url(#${id}-ringmask)`}
            >
              <path
                d={`M ${cx} ${cy} L ${cx} ${cy - maxR} A ${maxR} ${maxR} 0 0 1 ${cx + maxR * 0.55} ${cy - maxR * 0.84} Z`}
                fill={`url(#${id}-beam)`}
                opacity="0.55"
              />
              {/* hard edge line of beam */}
              <line
                x1={cx}
                y1={cy}
                x2={cx}
                y2={cy - maxR}
                stroke="rgba(147,197,253,0.85)"
                strokeWidth="1.25"
                filter={`url(#${id}-soft)`}
              />
            </g>

            {/* signal blips */}
            {blips.map((b, i) => {
              const rad = ((b.a - 90) * Math.PI) / 180;
              const x = n(cx + Math.cos(rad) * maxR * b.r);
              const y = n(cy + Math.sin(rad) * maxR * b.r);
              const size = 2 + b.s * 2;
              const isPrimary = i === 0;
              return (
                <g key={i} opacity={1}>
                  <circle
                    cx={x}
                    cy={y}
                    r={size + 6}
                    fill="none"
                    stroke={isPrimary ? BLUE : "#fff"}
                    strokeOpacity={0.2 * b.s}
                  >
                    <animate
                      attributeName="r"
                      values={`${size + 2};${size + 10};${size + 2}`}
                      dur={`${1.8 + i * 0.3}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.4;0;0.4"
                      dur={`${1.8 + i * 0.3}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle
                    cx={x}
                    cy={y}
                    r={size}
                    fill={isPrimary ? BLUE : "#fff"}
                    fillOpacity={0.5 + b.s * 0.45}
                    filter={`url(#${id}-soft)`}
                  >
                    <animate
                      attributeName="opacity"
                      values={`${0.6 + b.s * 0.3};${0.3};${0.6 + b.s * 0.3}`}
                      dur={`${1.4 + i * 0.2}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                  {b.label ? (
                    <text
                      x={x + 7}
                      y={y - 6}
                      fill="rgba(255,255,255,0.45)"
                      fontSize="6.5"
                      fontFamily="ui-monospace, monospace"
                    >
                      {b.label}
                    </text>
                  ) : null}
                </g>
              );
            })}

            {/* center hub */}
            <circle
              cx={cx}
              cy={cy}
              r="16"
              fill="rgba(0,0,0,0.65)"
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="1"
            />
            <circle
              cx={cx}
              cy={cy}
              r="5"
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1"
            />
            <circle cx={cx} cy={cy} r="2" fill="#fff" fillOpacity="0.85" />
          </svg>

          {/* floating glass readout over radar bottom */}
          <div className="pointer-events-none absolute inset-x-0 bottom-1 flex justify-center">
            <div className="rounded-full border border-white/10 bg-black/55 px-2.5 py-1 font-mono text-[9px] text-white/50 backdrop-blur-md">
              <span className="text-white/80">3</span> breakouts ·{" "}
              <span className="text-white/80">94</span> peak heat
            </div>
          </div>
        </div>
      </div>

      {/* signal list */}
      <div className="mt-1 space-y-0 border-t border-white/[0.05] px-2 py-2 sm:px-3">
        {signals.map((s, i) => (
          <div
            key={s.label}
            className={cn(
              "group/row flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors",
              "hover:bg-white/[0.035]",
              i < signals.length - 1 && "border-b border-white/[0.04]"
            )}
          >
            <span className="w-5 shrink-0 font-mono text-[9px] tabular-nums text-white/25">
              {s.rank}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-medium text-white/80">
                  {s.label}
                </span>
                <span
                  className={cn(
                    "shrink-0 font-mono text-[10px] tabular-nums",
                    s.up ? "text-white/70" : "text-white/30"
                  )}
                >
                  {s.delta}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-white/20 via-blue-400/50 to-blue-300/80"
                    style={{ width: `${s.heat}%` }}
                  >
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent"
                      style={{
                        animation: `features-shimmer ${2.2 + i * 0.4}s ease-in-out infinite ${i * 200}ms`,
                      }}
                    />
                  </div>
                </div>
                <div className="h-4 w-12 shrink-0 opacity-60">
                  <RadarMiniSpark values={s.spark} />
                </div>
                <span className="w-6 shrink-0 text-right font-mono text-[10px] tabular-nums text-white/40">
                  {s.heat}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RadarMiniSpark({ values }) {
  const w = 48;
  const h = 16;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const d = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - 1.5 - ((v - min) / range) * (h - 3);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" preserveAspectRatio="none">
      <path
        d={d}
        fill="none"
        stroke="rgba(147,197,253,0.75)"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════
 * Virality — clean ring score for narrow card
 * ═══════════════════════════════════════════ */

function ViralityDemo() {
  const [score, setScore] = useState(0);
  const target = 87;
  const id = useId();

  const factors = [
    { label: "Hook", value: 92 },
    { label: "Timing", value: 84 },
    { label: "Niche", value: 79 },
    { label: "Format", value: 88 },
  ];

  // mount-only count-up (not scroll-triggered)
  useEffect(() => {
    let frame;
    const start = performance.now();
    const duration = 1400;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setScore(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // layered ring gauge
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const stroke = 10;
  const r = 68;
  const circ = 2 * Math.PI * r;
  const progress = score / 100;
  const offset = circ * (1 - progress);

  // end-cap position (starts at top, clockwise with -rotate-90 SVG)
  // with -rotate-90, 0 progress is at top; progress moves clockwise in screen space
  const endAngle = -Math.PI / 2 + progress * Math.PI * 2;
  const endX = n(cx + Math.cos(endAngle) * r);
  const endY = n(cy + Math.sin(endAngle) * r);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-black/50">
      {/* soft blue wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 top-0 h-36 w-36 rounded-full bg-blue-500/[0.08] blur-3xl"
        style={{ animation: "features-glow-soft 4.5s ease-in-out infinite" }}
      />

      {/* header */}
      <div className="relative flex items-center justify-between px-3.5 pt-3.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400/50" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-400" />
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">
            Score
          </span>
        </div>
        <span
          className="rounded-full border border-blue-400/25 bg-blue-500/10 px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-blue-300"
          style={{ animation: "features-breathe 2.6s ease-in-out infinite" }}
        >
          Hot · top 8%
        </span>
      </div>

      {/* ring + score */}
      <div className="relative flex justify-center px-3 py-4 sm:py-5">
        <div className="relative size-[168px] sm:size-[180px]">
          {/* ambient bloom behind ring */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[18%] rounded-full bg-blue-500/15 blur-2xl"
            style={{ animation: "features-score-glow 3s ease-in-out infinite" }}
          />

          {/* glass disc under score */}
          <div
            aria-hidden
            className="absolute inset-[22%] rounded-full border border-white/[0.06] bg-gradient-to-b from-white/[0.06] to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          />

          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="absolute inset-0 size-full"
          >
            <defs>
              <linearGradient id={`${id}-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#dbeafe" />
                <stop offset="35%" stopColor="#60a5fa" />
                <stop offset="70%" stopColor={BLUE} />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id={`${id}-track`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0.04" />
              </linearGradient>
              <filter id={`${id}-rg`} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id={`${id}-soft`}>
                <feGaussianBlur stdDeviation="1.5" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id={`${id}-core`} cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.07" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* soft core fill */}
            <circle cx={cx} cy={cy} r={r - 8} fill={`url(#${id}-core)`} />

            {/* outer decorative ring */}
            <circle
              cx={cx}
              cy={cy}
              r={r + 14}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />

            {/* outer ticks */}
            {Array.from({ length: 36 }).map((_, i) => {
              const a = (i / 36) * Math.PI * 2 - Math.PI / 2;
              const major = i % 3 === 0;
              const r1 = r + 16;
              const r2 = r + (major ? 22 : 19);
              return (
                <line
                  key={i}
                  x1={n(cx + Math.cos(a) * r1)}
                  y1={n(cy + Math.sin(a) * r1)}
                  x2={n(cx + Math.cos(a) * r2)}
                  y2={n(cy + Math.sin(a) * r2)}
                  stroke={
                    major
                      ? "rgba(147,197,253,0.35)"
                      : "rgba(255,255,255,0.1)"
                  }
                  strokeWidth={major ? 1.5 : 1}
                  strokeLinecap="round"
                />
              );
            })}

            {/* inner dashed guide */}
            <circle
              cx={cx}
              cy={cy}
              r={r - 14}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
              strokeDasharray="2 6"
            />

            {/* track (thick) */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={`url(#${id}-track)`}
              strokeWidth={stroke}
            />
            {/* track inner edge highlight */}
            <circle
              cx={cx}
              cy={cy}
              r={r - stroke / 2 + 0.5}
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />

            {/* progress glow underlay */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={BLUE}
              strokeWidth={stroke + 6}
              strokeLinecap="round"
              strokeOpacity="0.18"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              filter={`url(#${id}-soft)`}
              style={{ transition: "stroke-dashoffset 80ms linear" }}
            />

            {/* progress ring */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={`url(#${id}-ring)`}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              filter={`url(#${id}-rg)`}
              style={{ transition: "stroke-dashoffset 80ms linear" }}
            />

            {/* thin highlight on progress */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{
                transition: "stroke-dashoffset 80ms linear",
                opacity: 0.5,
              }}
            />

            {/* end cap */}
            {score > 1 && (
              <g filter={`url(#${id}-rg)`}>
                <circle
                  cx={endX}
                  cy={endY}
                  r="7"
                  fill={BLUE}
                  fillOpacity="0.25"
                />
                <circle cx={endX} cy={endY} r="4.5" fill="#dbeafe" />
                <circle cx={endX} cy={endY} r="2" fill="#fff" />
              </g>
            )}
          </svg>

          {/* center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-[3.25rem] tabular-nums leading-none tracking-tight text-white drop-shadow-[0_0_24px_rgba(59,130,246,0.35)]">
              {score}
            </span>
          </div>
        </div>
      </div>

      {/* 2×2 factor tiles */}
      <div className="grid grid-cols-2 gap-px border-t border-white/[0.06] bg-white/[0.04]">
        {factors.map((f, i) => (
          <div key={f.label} className="bg-[#08080c] px-3 py-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[9px] uppercase tracking-wider text-white/35">
                {f.label}
              </span>
              <span className="font-mono text-sm tabular-nums text-white/85">
                {f.value}
              </span>
            </div>
            <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-blue-500/40 to-blue-300"
                style={{ width: `${f.value}%` }}
              >
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  style={{
                    animation: `features-shimmer ${2 + i * 0.35}s ease-in-out infinite ${i * 150}ms`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
 * Competitor matrix
 * ═══════════════════════════════════════════ */

function CompetitorDemo() {
  const rows = [
    { name: "You", subs: "284K", eff: 92, you: true },
    { name: "Rival A", subs: "410K", eff: 71 },
    { name: "Rival B", subs: "198K", eff: 84 },
    { name: "Rising ★", subs: "62K", eff: 96 },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-black/40">
      <div className="grid grid-cols-[minmax(0,1fr)_56px_minmax(0,1.2fr)] gap-2 border-b border-white/[0.05] px-3 py-2.5 font-mono text-[9px] uppercase tracking-widest text-white/25 sm:grid-cols-[minmax(0,1fr)_72px_minmax(0,1.4fr)] sm:gap-3 sm:px-4">
        <span>Channel</span>
        <span className="text-right">Subs</span>
        <span className="truncate">Efficiency</span>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {rows.map((r, i) => (
          <div
            key={r.name}
            className={cn(
              "grid grid-cols-[minmax(0,1fr)_56px_minmax(0,1.2fr)] items-center gap-2 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_72px_minmax(0,1.4fr)] sm:gap-3 sm:px-4 sm:py-3 transition-colors duration-300 hover:bg-white/[0.02]",
              r.you && "bg-blue-500/[0.04]"
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  r.you
                    ? "bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    : "bg-white/35"
                )}
                style={
                  r.you
                    ? { animation: "features-breathe 2s ease-in-out infinite" }
                    : undefined
                }
              />
              <span
                className={cn(
                  "truncate text-xs",
                  r.you ? "font-medium text-white" : "text-white/55"
                )}
              >
                {r.name}
              </span>
            </div>
            <span className="text-right font-mono text-[11px] tabular-nums text-white/40">
              {r.subs}
            </span>
            <div className="flex min-w-0 items-center gap-2">
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.06] sm:h-1.5">
                <div
                  className={cn(
                    "relative h-full overflow-hidden rounded-full",
                    r.you
                      ? "bg-gradient-to-r from-blue-500/40 to-blue-300/90"
                      : "bg-gradient-to-r from-white/25 to-white/65"
                  )}
                  style={{ width: `${r.eff}%` }}
                >
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    style={{
                      animation: `features-shimmer ${2.4 + i * 0.3}s ease-in-out infinite ${i * 180}ms`,
                    }}
                  />
                  <div
                    className={cn(
                      "absolute inset-y-0 right-0 w-0.5 rounded-full",
                      r.you ? "bg-blue-200" : "bg-white/60"
                    )}
                  />
                </div>
              </div>
              <span className="w-6 shrink-0 text-right font-mono text-[10px] tabular-nums text-white/35 sm:w-7">
                {r.eff}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
 * Digests
 * ═══════════════════════════════════════════ */

function DigestDemo() {
  const items = [
    {
      time: "2m ago",
      type: "SPIKE",
      title: "AI Agents format +147% views this week",
      body: "Outline a draft before saturation — 3 rivals already posted.",
      spark: [18, 22, 20, 35, 40, 55, 52, 78, 92],
    },
    {
      time: "1h ago",
      type: "INTEL",
      title: "Rival A shifted to 12-min deep dives",
      body: "Avg retention 62%. Cadence: 3×/week.",
      spark: [40, 42, 48, 45, 55, 58, 62, 60, 68],
    },
    {
      time: "Today",
      type: "DIGEST",
      title: "Weekly matrix ready",
      body: "4 channels tracked · 2 breakout tags · 1 milestone hit.",
      spark: [30, 35, 32, 48, 44, 60, 58, 72, 80],
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
      {items.map((item, i) => (
        <div
          key={item.title}
          className={cn(
            "group/card relative overflow-hidden rounded-xl border border-white/[0.06]",
            "bg-gradient-to-b from-white/[0.03] to-black/40 p-3.5 sm:p-4",
            "transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.1]",
            i === 2 && "sm:col-span-2 lg:col-span-1"
          )}
          style={{
            animation: `features-float ${3.2 + i * 0.45}s ease-in-out infinite ${i * 0.35}s`,
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent"
            style={{
              animation: `features-shimmer ${3 + i * 0.5}s ease-in-out infinite ${i * 0.4}s`,
            }}
          />
          <div className="relative mb-2.5 flex items-center justify-between gap-2">
            <span
              className="rounded border border-blue-400/20 bg-blue-500/10 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-blue-300/90"
              style={{
                animation: `features-breathe ${2.4 + i * 0.3}s ease-in-out infinite`,
              }}
            >
              {item.type}
            </span>
            <span className="font-mono text-[9px] text-white/25">{item.time}</span>
          </div>
          <p className="relative text-xs font-medium leading-snug text-white/85">
            {item.title}
          </p>
          <p className="relative mt-1.5 text-[11px] leading-relaxed text-white/32">
            {item.body}
          </p>
          <div className="relative -mx-3.5 -mb-3.5 mt-4 h-16 sm:-mx-4 sm:-mb-4 sm:h-20">
            <MiniSparkArea values={item.spark} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniSparkArea({ values }) {
  const id = useId();
  const w = 160;
  const h = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const coords = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - 3 - ((v - min) / range) * (h - 6);
    return [x, y];
  });
  const line = smoothPath(coords);
  const area = `${line} L ${w},${h} L 0,${h} Z`;
  const last = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-full w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`${id}-af`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BLUE} stopOpacity="0.22" />
          <stop offset="100%" stopColor={BLUE} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-as`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="100%" stopColor={BLUE} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id}-af)`} />
      <path
        d={line}
        fill="none"
        stroke={`url(#${id}-as)`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r="4"
        fill={BLUE}
        fillOpacity="0.25"
      >
        <animate
          attributeName="r"
          values="3;7;3"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.45;0;0.45"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={last[0]} cy={last[1]} r="2" fill={BLUE} fillOpacity="0.9" />
    </svg>
  );
}
