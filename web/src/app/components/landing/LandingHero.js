'use client';

import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Play, Star } from 'lucide-react';
import AnimatedCounter from '../ui/AnimatedCounter';

/**
 * Hero section avatar stack — inline SVG avatars.
 */
function AvatarStack() {
  return (
    <div className="flex items-center gap-3 select-none pl-1 sm:pl-4 sm:border-l sm:border-zinc-800">
      <div className="flex -space-x-2">
        {/* Avatar 1: Sarah / Tech */}
        <div className="w-7 h-7 rounded-full border-2 border-black overflow-hidden bg-zinc-900 shrink-0 relative z-10">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="avGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff4f6d" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#avGrad1)" />
            <circle cx="50" cy="45" r="18" fill="white" fillOpacity="0.9" />
            <path d="M25 80c0-15 10-22 25-22s25 7 25 22" fill="white" fillOpacity="0.9" />
            <rect x="22" y="38" width="8" height="16" rx="4" fill="#00f0ff" />
            <rect x="70" y="38" width="8" height="16" rx="4" fill="#00f0ff" />
            <path d="M26 38c0-12 10-18 24-18s24 6 24 18" stroke="#00f0ff" strokeWidth="4" fill="none" />
          </svg>
        </div>
        {/* Avatar 2: David / Productivity */}
        <div className="w-7 h-7 rounded-full border-2 border-black overflow-hidden bg-zinc-900 shrink-0 relative z-10">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="avGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" />
                <stop offset="100%" stopColor="#0052ff" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#avGrad2)" />
            <circle cx="50" cy="45" r="16" fill="black" fillOpacity="0.4" />
            <path d="M28 78c0-12 10-18 22-18s22 6 22 18" fill="black" fillOpacity="0.4" />
            <rect x="34" y="40" width="13" height="9" rx="2" stroke="#ff4f6d" strokeWidth="2.5" fill="none" />
            <rect x="53" y="40" width="13" height="9" rx="2" stroke="#ff4f6d" strokeWidth="2.5" fill="none" />
            <line x1="47" y1="44" x2="53" y2="44" stroke="#ff4f6d" strokeWidth="2.5" />
          </svg>
        </div>
        {/* Avatar 3: Orange / Cap */}
        <div className="w-7 h-7 rounded-full border-2 border-black overflow-hidden bg-zinc-900 shrink-0 relative z-10">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="avGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff9900" />
                <stop offset="100%" stopColor="#ff4f6d" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#avGrad3)" />
            <circle cx="50" cy="48" r="16" fill="white" fillOpacity="0.85" />
            <path d="M28 80c0-12 10-18 22-18s22 6 22 18" fill="white" fillOpacity="0.85" />
            <path d="M32 38c0-8 8-12 18-12s18 4 18 12v3H32v-3z" fill="#00f0ff" />
            <circle cx="50" cy="23" r="3" fill="#00f0ff" />
          </svg>
        </div>
        {/* Avatar 4: Purple / Spark */}
        <div className="w-7 h-7 rounded-full border-2 border-black overflow-hidden bg-zinc-900 shrink-0 relative z-10">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="avGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#00f0ff" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#avGrad4)" />
            <circle cx="50" cy="45" r="15" fill="black" fillOpacity="0.3" />
            <path d="M30 76c0-10 8-16 20-16s20 6 20 16" fill="black" fillOpacity="0.3" />
            <polygon
              points="50,15 53,23 61,23 55,28 57,36 50,31 43,36 45,28 39,23 47,23"
              fill="#ff4f6d"
              transform="scale(0.4) translate(75, 40)"
            />
          </svg>
        </div>
      </div>
      <div className="text-left">
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-2.5 h-2.5 text-brand-volt fill-brand-volt" />
          ))}
        </div>
        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5 leading-none">
          Trusted by <span className="text-white font-black">1,200+ creators</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Hero section.
 *
 * @param {{
 *   badgeText: string;
 *   actionWord: string;
 *   scrollY: number;
 *   onEnterDemo: (e?: React.MouseEvent) => void;
 * }} props
 */
export default function LandingHero({ badgeText, actionWord, scrollY, onEnterDemo }) {
  const heroCardRef = useRef(null);

  const handleCardMouseMove = (e) => {
    const card = heroCardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const px = (e.clientX - cx) / (rect.width / 2);
    const py = (e.clientY - cy) / (rect.height / 2);
    card.style.transform = `perspective(1000px) rotateX(${py * -10}deg) rotateY(${px * 10}deg) scale3d(1.02,1.02,1.02)`;
  };

  const handleCardMouseLeave = () => {
    if (heroCardRef.current) {
      heroCardRef.current.style.transform =
        'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    }
  };

  return (
    <section className="relative z-10 pt-32 pb-24 md:pt-40 md:pb-36 px-4 md:px-8 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-6 lg:gap-8 items-center">
      {/* ── LEFT: Hero Copy ── */}
      <div className="md:col-span-6 lg:col-span-7 flex flex-col items-start text-left">
        {/* Typing badge */}
        <div className="inline-flex items-center gap-2 bg-brand-volt/10 border border-brand-volt/20 px-3.5 py-1.5 rounded-full mb-8 shadow-[0_0_15px_rgba(0,240,255,0.03)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-volt opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-volt" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-volt">
            {badgeText}
            <span className="animate-pulse">|</span>
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display font-extrabold text-5xl md:text-4xl lg:text-5xl xl:text-7xl leading-[1.0] tracking-tight text-white mb-4 md:mb-6">
          Know what performs.<br />
          Before you hit<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0052ff] via-[#00d2ff] to-[#7c3aed] drop-shadow-[0_0_15px_rgba(0,240,255,0.1)] text-glow-volt inline-flex min-w-[200px]">
            <AnimatePresence mode="wait">
              <motion.span
                key={actionWord}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {actionWord}
              </motion.span>
            </AnimatePresence>
          </span>
        </h1>

        {/* Description */}
        <p className="text-zinc-400 text-base md:text-xs lg:text-sm xl:text-base leading-relaxed max-w-xl mb-6 md:mb-8 xl:mb-10 font-normal">
          Stop guessing what your audience wants. Svay tracks your competitors' top-performing
          formats, catches breakout topics as they begin to spike, and helps you structure video
          ideas backed by real demand data.
        </p>

        {/* CTA + Social proof */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full">
          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <button
              onClick={() => { window.location.href = '/sign-in'; }}
              className="px-6 md:px-5 lg:px-8 py-3 md:py-2.5 lg:py-4 bg-brand-volt hover:bg-[#33f3ff] text-black font-extrabold text-sm md:text-xs lg:text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_30px_rgba(0,240,255,0.25)] hover:shadow-[0_0_40px_rgba(0,240,255,0.45)] hover:-translate-y-0.5 text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onEnterDemo}
              className="px-6 md:px-5 lg:px-8 py-3 md:py-2.5 lg:py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white font-extrabold text-sm md:text-xs lg:text-sm uppercase tracking-wider rounded-xl transition-all text-center flex items-center justify-center gap-2 hover:-translate-y-0.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" /> See Demo
            </button>
          </div>
          <AvatarStack />
        </div>

        {/* Quick stats */}
        <div className="mt-8 md:mt-4 lg:mt-6 xl:mt-12 pt-6 md:pt-3 lg:pt-4 xl:pt-8 border-t border-zinc-900 w-full grid grid-cols-3 gap-4 md:gap-2 lg:gap-3 xl:gap-6 text-left">
          <div>
            <p className="font-mono text-xl md:text-base lg:text-lg xl:text-2xl font-bold text-white tracking-tight">
              <AnimatedCounter target={48} suffix="K+" />
            </p>
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">High-Growth Channels Monitored</p>
          </div>
          <div>
            <p className="font-mono text-xl md:text-base lg:text-lg xl:text-2xl font-bold text-white tracking-tight">Hourly</p>
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Breakout Trend Scans</p>
          </div>
          <div>
            <p className="font-mono text-xl md:text-base lg:text-lg xl:text-2xl font-bold text-white tracking-tight">
              <AnimatedCounter target={50} suffix="+" />
            </p>
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Content Niches Tracked</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT: 3D Tilt Hero Card ── */}
      <div className="md:col-span-6 lg:col-span-5 flex items-center justify-center relative">
        <div
          ref={heroCardRef}
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
          className="w-full max-w-[360px] lg:max-w-[420px] rounded-3xl p-5 lg:p-6 bg-zinc-950/80 border border-white/[0.08] backdrop-blur-xl relative overflow-hidden transition-all duration-200"
          style={{
            boxShadow:
              '0 30px 80px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 50px rgba(0,240,255,0.04)',
          }}
        >
          {/* Top accent bar */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand-volt to-brand-mint opacity-85" />

          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-900/80">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-volt animate-ping" />
              <span className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Growth Analytics
              </span>
            </div>
            <span className="font-mono text-[9px] font-black text-brand-mint bg-brand-mint/10 border border-brand-mint/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
              LIVE ACTIVE
            </span>
          </div>

          {/* Metric grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-zinc-900/20 border border-zinc-800/60 p-4 rounded-2xl relative overflow-hidden group hover:border-brand-volt/30 transition-all hover:bg-zinc-900/30">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Subscriber Net</p>
              <div>
                <p className="font-display font-extrabold text-2xl text-white">48,250</p>
                <span className="inline-block mt-1.5 text-[8px] font-black font-mono text-brand-volt bg-brand-volt/10 border border-brand-volt/20 px-1.5 py-0.5 rounded">
                  ↑ +2.1%
                </span>
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-brand-volt/[0.02] rounded-tl-2xl" />
            </div>
            <div className="bg-zinc-900/20 border border-zinc-800/60 p-4 rounded-2xl relative overflow-hidden group hover:border-brand-mint/30 transition-all hover:bg-zinc-900/30">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Virality Index</p>
              <div>
                <p className="font-display font-extrabold text-2xl text-white">92.4</p>
                <span className="inline-block mt-1.5 text-[8px] font-black font-mono text-brand-mint bg-brand-mint/10 border border-brand-mint/20 px-1.5 py-0.5 rounded">
                  HOT
                </span>
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-brand-mint/[0.02] rounded-tl-2xl" />
            </div>
          </div>

          {/* Chart simulation */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Weekly View Volume</span>
              <span className="text-[9px] font-mono font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800/40">Total: 3.4M</span>
            </div>
            <div className="h-28 flex items-end justify-between gap-1.5 pt-4 pb-2 relative border-b border-zinc-900/60 overflow-hidden rounded-lg bg-zinc-950/40 px-2">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5 py-4">
                <div className="w-full border-t border-white" />
                <div className="w-full border-t border-white" />
                <div className="w-full border-t border-white" />
              </div>
              {[30, 48, 35, 62, 55, 75, 68, 88, 98, 72, 85, 95].map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative z-10">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-volt text-black text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                    +{val}%
                  </div>
                  <div
                    className="w-full bg-gradient-to-t from-brand-volt/10 via-brand-volt/40 to-brand-volt group-hover:from-brand-volt/20 group-hover:to-[#33f3ff] rounded-t-[3px] transition-all duration-500 cursor-pointer origin-bottom shadow-[0_0_10px_rgba(0,240,255,0.15)] group-hover:shadow-[0_0_15px_rgba(0,240,255,0.35)]"
                    style={{ height: `${val}%`, animationDelay: `${idx * 0.05}s` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Topic velocity alerts */}
          <div className="space-y-2">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Topic Velocity Alerts</p>
            {[
              { emoji: '🔥', title: 'AI Agents 2026', meta: 'Scraped 3m ago · Tech', badge: 'VIRAL', badgeColor: 'text-brand-rose bg-brand-rose/10 border-brand-rose/25' },
              { emoji: '🚀', title: 'Milvus Vector Database', meta: 'Scraped 15m ago · Dev', badge: '+147%', badgeColor: 'text-brand-volt bg-brand-volt/10 border-brand-volt/25' },
            ].map(({ emoji, title, meta, badge, badgeColor }) => (
              <div key={title} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/10 border border-zinc-900 hover:border-zinc-800 transition-all hover:bg-zinc-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xs shadow-inner">{emoji}</div>
                  <div>
                    <p className="text-xs font-black text-white">{title}</p>
                    <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{meta}</p>
                  </div>
                </div>
                <span className={`text-[9px] font-mono font-black ${badgeColor} border px-2.5 py-0.5 rounded-md uppercase tracking-wider`}>{badge}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating metric badge 1 — top right */}
        <div
          className="hidden lg:flex items-center gap-2.5 p-3.5 rounded-full bg-zinc-950/90 border border-brand-volt/20 shadow-[0_15px_30px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)] absolute -top-6 lg:-right-2 xl:-right-16 scale-90 xl:scale-100 z-25 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-brand-volt/40"
          style={{ transform: `translateY(${scrollY * -0.06}px)` }}
        >
          <div className="w-6 h-6 rounded-full bg-brand-volt/10 flex items-center justify-center text-xs">📈</div>
          <div>
            <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest leading-none">Niche Gap</p>
            <p className="text-[10px] font-black text-white leading-none mt-1">+28.4% CPM</p>
          </div>
        </div>

        {/* Floating audit card 2 — bottom right */}
        <div
          className="hidden lg:flex flex-col gap-3 p-4.5 rounded-2xl bg-zinc-950/90 border border-brand-mint/20 shadow-[0_20px_40px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.05)] absolute -bottom-10 lg:-right-2 xl:-right-8 w-52 scale-90 xl:scale-100 z-25 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-brand-mint/40 text-left"
          style={{ transform: `translateY(${scrollY * 0.04}px)` }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Competitor DNA</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-mint animate-pulse" />
          </div>
          <div>
            <p className="text-[8px] text-zinc-500 uppercase font-black tracking-wider leading-none">Velocity Score</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-display font-extrabold text-white">88.2</span>
              <span className="text-[8px] font-bold text-brand-mint">↑ +14%</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[7px] font-mono text-zinc-500 leading-none">
              <span>QUEUE</span><span>94%</span>
            </div>
            <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-brand-mint rounded-full shadow-[0_0_8px_#00ffca]" style={{ width: '94%' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
