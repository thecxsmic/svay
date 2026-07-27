'use client';
 
import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Flame, TrendingUp, LineChart } from 'lucide-react';
import AnimatedCounter from '../ui/AnimatedCounter';
 
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
  const [typedActionWord, setTypedActionWord] = useState('');
 
  useEffect(() => {
    let timer;
    let charIdx = 0;
    setTypedActionWord('');
    
    const type = () => {
      if (charIdx <= actionWord.length) {
        setTypedActionWord(actionWord.substring(0, charIdx));
        charIdx++;
        timer = setTimeout(type, 80);
      }
    };
    
    type();
    
    return () => clearTimeout(timer);
  }, [actionWord]);
 
  const handleCardMouseMove = (e) => {
    const card = heroCardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const px = (e.clientX - cx) / (rect.width / 2);
    const py = (e.clientY - cy) / (rect.height / 2);
    card.style.transform = `perspective(1000px) rotateX(${py * -8}deg) rotateY(${px * 8}deg) scale3d(1.01,1.01,1.01)`;
  };
 
  const handleCardMouseLeave = () => {
    if (heroCardRef.current) {
      heroCardRef.current.style.transform =
        'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    }
  };
 
  return (
    <section className="relative z-10 mt-[40px] pt-32 pb-24 md:pt-40 md:pb-36 px-6 md:px-8 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 lg:gap-12 items-center">
      {/* ── LEFT: Hero Copy ── */}
      <div className="md:col-span-6 lg:col-span-7 flex flex-col items-start text-left space-y-6">
        {/* Typing badge */}
        <div className="inline-flex items-center gap-2.5 bg-white/5 border border-white/10 px-3 py-1 rounded-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-volt opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-volt" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-volt">
            Real-Time Creator Intelligence
          </span>
        </div>
 
        {/* Headline */}
        <h1 className="font-display font-extrabold text-5xl md:text-4xl lg:text-5xl xl:text-7xl leading-[1.05] tracking-tight text-white">
          Know what performs.<br />
          Before you hit<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0052ff] via-[#00d2ff] to-[#7c3aed] drop-shadow-[0_4px_12px_rgba(0,240,255,0.05)] text-glow-volt inline-flex min-w-[200px]">
            {typedActionWord}
            <span className="animate-pulse text-[#00d2ff]">|</span>
          </span>
        </h1>
         {/* Description */}
        <p className="text-zinc-400 text-base md:text-xs lg:text-sm xl:text-base leading-relaxed max-w-xl font-normal font-sans">
          Stop guessing what your audience wants. Svay tracks your competitors' top-performing
          formats, catches breakout topics as they begin to spike, and helps you structure video
          ideas backed by real demand data.
        </p>
 
        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full pt-2">
          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <button
              onClick={() => { window.location.href = '/sign-in'; }}
              className="px-6 py-3.5 bg-brand-volt hover:bg-[#33f3ff] text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-all duration-200 ease-out shadow-[0_4px_20px_rgba(0,240,255,0.15)] hover:shadow-[0_4px_30px_rgba(0,240,255,0.3)] hover:-translate-y-0.5 text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
 
        {/* Quick stats */}
        <div className="pt-8 border-t border-white/5 w-full grid grid-cols-3 gap-6 text-left">
          <div>
            <p className="font-mono text-xl md:text-base lg:text-lg xl:text-2xl font-bold text-white tracking-tight">
              <AnimatedCounter target={48} suffix="K+" />
            </p>
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-[0.1em] mt-1.5 leading-none">Monitored Channels</p>
          </div>
          <div>
            <p className="font-mono text-xl md:text-base lg:text-lg xl:text-2xl font-bold text-white tracking-tight">Hourly</p>
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-[0.1em] mt-1.5 leading-none">Trend Scans</p>
          </div>
          <div>
            <p className="font-mono text-xl md:text-base lg:text-lg xl:text-2xl font-bold text-white tracking-tight">
              <AnimatedCounter target={50} suffix="+" />
            </p>
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-[0.1em] mt-1.5 leading-none">Niched Tracked</p>
          </div>
        </div>
      </div>
 
      {/* ── RIGHT: 3D Tilt Hero Card ── */}
      <div className="md:col-span-6 lg:col-span-5 flex items-center justify-center relative">
        <div
          ref={heroCardRef}
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
          className="w-full max-w-[360px] lg:max-w-[420px] rounded-2xl p-6 bg-zinc-950/40 border border-white/[0.08] backdrop-blur-xl relative overflow-hidden transition-all duration-200"
          style={{
            boxShadow: '0 24px 64px rgba(0,0,0,0.85)',
          }}
        >
          {/* Top accent bar */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand-volt to-brand-mint opacity-80" />
 
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-volt animate-pulse" />
              <span className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Growth Analytics
              </span>
            </div>
            <span className="font-mono text-[8px] font-bold text-brand-mint bg-brand-mint/10 border border-brand-mint/20 px-2 py-0.5 rounded uppercase tracking-wider">
              LIVE ACTIVE
            </span>
          </div>
 
          {/* Metric grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl relative overflow-hidden group hover:border-brand-volt/20 transition-all duration-200 ease-out hover:bg-white/[0.04]">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Subscriber Net</p>
              <div>
                <p className="font-display font-extrabold text-2xl text-white">48,250</p>
                <span className="inline-block mt-1.5 text-[8px] font-black font-mono text-brand-volt bg-brand-volt/10 border border-brand-volt/20 px-1.5 py-0.5 rounded-md">
                  ↑ +2.1%
                </span>
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl relative overflow-hidden group hover:border-brand-mint/20 transition-all duration-200 ease-out hover:bg-white/[0.04]">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Virality Index</p>
              <div>
                <p className="font-display font-extrabold text-2xl text-white">92.4</p>
                <span className="inline-block mt-1.5 text-[8px] font-black font-mono text-brand-mint bg-brand-mint/10 border border-brand-mint/20 px-1.5 py-0.5 rounded-md">
                  HOT
                </span>
              </div>
            </div>
          </div>
 
          {/* Chart simulation */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Weekly View Volume</span>
              <span className="text-[9px] font-mono font-bold text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">Total: 3.4M</span>
            </div>
            <div className="h-28 flex items-end justify-between gap-1.5 pt-4 pb-2 relative border-b border-white/5 overflow-hidden rounded-lg bg-black/40 px-2">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5 py-4">
                <div className="w-full border-t border-white" />
                <div className="w-full border-t border-white" />
                <div className="w-full border-t border-white" />
              </div>
              {[30, 48, 35, 62, 55, 75, 68, 88, 98, 72, 85, 95].map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative z-10">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-[8px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out pointer-events-none z-10 whitespace-nowrap shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                    +{val}%
                  </div>
                  <div
                    className="w-full bg-gradient-to-t from-brand-volt/10 via-brand-volt/40 to-brand-volt group-hover:from-brand-volt/20 group-hover:to-[#33f3ff] rounded-t-sm transition-all duration-200 ease-out cursor-pointer origin-bottom shadow-[0_0_8px_rgba(0,240,255,0.1)] group-hover:shadow-[0_0_12px_rgba(0,240,255,0.25)]"
                    style={{ height: `${val}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
 
          {/* Topic velocity alerts */}
          <div className="space-y-2">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Topic Velocity Alerts</p>
            {[
              { icon: Flame, iconColor: 'text-brand-rose', title: 'AI Agents 2026', meta: 'Scraped 3m ago · Tech', badge: 'VIRAL', badgeColor: 'text-brand-rose bg-brand-rose/10 border-brand-rose/25' },
              { icon: TrendingUp, iconColor: 'text-brand-volt', title: 'Milvus Vector Database', meta: 'Scraped 15m ago · Dev', badge: '+147%', badgeColor: 'text-brand-volt bg-brand-volt/10 border-brand-volt/25' },
            ].map(({ icon: Icon, iconColor, title, meta, badge, badgeColor }) => (
              <div key={title} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-200 ease-out hover:bg-white/[0.04] group/alert">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs shadow-inner transition-colors duration-200 ease-out group-hover/alert:border-white/20 ${iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{title}</p>
                    <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{meta}</p>
                  </div>
                </div>
                <span className={`text-[8px] font-mono font-bold ${badgeColor} border px-2 py-0.5 rounded uppercase tracking-wider`}>{badge}</span>
              </div>
            ))}
          </div>
        </div>
 
        {/* Floating metric badge 1 — top right */}
        <div
          className="hidden lg:flex items-center gap-2.5 p-3 rounded-xl bg-zinc-950/60 border border-white/10 shadow-[0_15px_30px_rgba(0,0,0,0.8)] absolute -top-6 lg:-right-2 xl:-right-16 scale-90 xl:scale-100 z-25 backdrop-blur-md transition-all duration-200 ease-out hover:-translate-y-1 hover:border-brand-volt/40"
          style={{ transform: `translateY(${scrollY * -0.06}px)` }}
        >
          <div className="w-6 h-6 rounded-full bg-brand-volt/10 flex items-center justify-center text-brand-volt">
            <LineChart className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider leading-none">Niche Gap</p>
            <p className="text-[10px] font-bold text-white leading-none mt-1">+28.4% CPM</p>
          </div>
        </div>
 
        {/* Floating audit card 2 — bottom right */}
        <div
          className="hidden lg:flex flex-col gap-3 p-4.5 rounded-2xl bg-zinc-950/60 border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.9)] absolute -bottom-10 lg:-right-2 xl:-right-8 w-52 scale-90 xl:scale-100 z-25 backdrop-blur-md transition-all duration-200 ease-out hover:-translate-y-1 hover:border-brand-mint/40 text-left"
          style={{ transform: `translateY(${scrollY * 0.04}px)` }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Competitor DNA</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-mint animate-pulse" />
          </div>
          <div>
            <p className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider leading-none">Velocity Score</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-display font-extrabold text-white">88.2</span>
              <span className="text-[8px] font-bold text-brand-mint">↑ +14%</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[7px] font-mono text-zinc-500 leading-none">
              <span>QUEUE</span><span>94%</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-mint to-brand-volt rounded-full shadow-[0_0_8px_rgba(0,240,255,0.2)]" style={{ width: '94%' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
