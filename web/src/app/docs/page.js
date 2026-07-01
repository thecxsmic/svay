"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from "@clerk/nextjs";
import { Search, Zap, Trophy, BookOpen, BarChart3, ArrowLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DocsPage() {
  const { isSignedIn } = useAuth();
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    setIsDemo(document.cookie.includes("demo_mode=true"));
  }, []);

  const isUserLoggedIn = isSignedIn || isDemo;

  const docSections = [
    {
      id: "search",
      title: "Content Scorer & Search",
      shortTitle: "Content Scorer",
      icon: Search,
      desc: "Analyze search terms and calculate real-time audience demand metrics.",
      howItWorks: "Queries digital query matrices to identify high-performing content assets. It calculates a customized 'Virality Score' based on the ratio of views to a channel's overall subscriber count, combined with comment-to-view interaction frequency. This filters out outlier viral videos from small channels.",
      howToUse: "Type any keyword or topic in the main dashboard search bar. Apply filters for geographical region, upload dates, or video duration. Look at the Opportunity indicator—a high percentage suggests low saturation with strong viewer demand, marking a prime entry window."
    },
    {
      id: "trends",
      title: "Trend Radar",
      shortTitle: "Trend Radar",
      icon: Zap,
      desc: "Spot high-velocity topics before they saturate the market.",
      howItWorks: "Continuously tracks sudden spikes in query velocity across distinct categories. By comparing daily average volume against historical standard deviation limits, the Radar identifies breakout concepts before they reach mainstream feed pages.",
      howToUse: "Open the Trends tab to see current high-growth queries. Pay attention to the momentum tag ('Hot' vs. 'Spike'). Integrate these rising search terms or format hooks into your script drafts."
    },
    {
      id: "competitors",
      title: "Competitor Benchmarking",
      shortTitle: "Competitors",
      icon: Trophy,
      desc: "Compare subscriber velocity and format benchmarks against rival channels.",
      howItWorks: "Monitors custom sets of tracking IDs to profile their upload frequency, view density, and audience retention indicators. This lets you see the baseline performance required to rank in your target niche.",
      howToUse: "Add competitor handles in the Competitors module. Look at the format benchmarks to find recurring themes, length structures, or thumbnail hooks that successfully capture traffic."
    },
    {
      id: "library",
      title: "Library & Outliner",
      shortTitle: "Library",
      icon: BookOpen,
      desc: "Organize research notes, format references, and scripts in one unified space.",
      howItWorks: "Stores references, drafts, and outline logs in a secure, sandboxed container. Outlines are linked directly to performance data, so you build scripts backed by real statistical hooks.",
      howToUse: "Save top-performing references to your Library from any search result. Open the library outline editor to draft scripts, take notes, and structure videos alongside reference material."
    },
    {
      id: "analytics",
      title: "Channel Analytics",
      shortTitle: "Analytics",
      icon: BarChart3,
      desc: "Track subscriber growth velocities, reach index, and authority stats.",
      howItWorks: "Aggregates performance snapshots into interactive charts. It measures Subscriber Net gain, Virality Indices, and Audience Resonance metrics to grade your vertical authority.",
      howToUse: "Review the Analytics dashboard to check weekly momentum. Use the Subscriber Net charts to correlate specific upload formats with subscriber milestones."
    }
  ];

  const [activeTab, setActiveTab] = useState("search");

  const activeIndex = docSections.findIndex(s => s.id === activeTab);
  const activeContent = docSections[activeIndex];
  const prevContent = activeIndex > 0 ? docSections[activeIndex - 1] : null;
  const nextContent = activeIndex < docSections.length - 1 ? docSections[activeIndex + 1] : null;

  return (
    <div className="min-h-screen w-full bg-black text-zinc-300 flex flex-col font-sans selection:bg-brand-volt selection:text-black overflow-x-hidden">

      {/* ── TOP NAVBAR ── */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-900 bg-black/80 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link 
            href="/" 
            className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white bg-zinc-950 hover:bg-zinc-900 transition-all cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-brand-volt via-[#00b0ff] to-brand-mint shrink-0" />
            <span className="font-display font-extrabold text-sm text-white tracking-tight uppercase shrink-0">SVAY</span>
            <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-widest pl-2 border-l border-zinc-800 shrink-0">Docs</span>
          </div>
        </div>

        <Link 
          href="/" 
          className="text-zinc-400 hover:text-white transition-colors uppercase tracking-wider text-[10px] font-bold shrink-0"
        >
          {isUserLoggedIn ? "Dashboard →" : "Home →"}
        </Link>
      </header>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-2 flex flex-col min-w-0">

        {/* Tab navigation — horizontal scroll on mobile, vertical on md+ */}
        <nav className="flex md:hidden gap-1.5 overflow-x-auto no-scrollbar pb-4 border-b border-zinc-900/60 -mx-4 px-4">
          {docSections.map((sect) => {
            const Icon = sect.icon;
            const isActive = activeTab === sect.id;
            return (
              <button
                key={sect.id}
                onClick={() => setActiveTab(sect.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                  isActive 
                    ? 'bg-zinc-900/60 border-zinc-800 text-white' 
                    : 'border-transparent text-zinc-500 hover:text-white hover:bg-zinc-950'
                }`}
              >
                <Icon className={`w-3 h-3 ${isActive ? 'text-brand-volt' : 'text-zinc-600'}`} />
                {sect.shortTitle}
              </button>
            );
          })}
        </nav>

        {/* Desktop layout: sidebar + content */}
        <div className="flex-1 flex flex-col md:grid md:grid-cols-12 gap-6 pt-4 md:pt-6 min-w-0">
          
          {/* Desktop sidebar */}
          <aside className="hidden md:flex md:col-span-3 flex-col gap-1 border-r border-zinc-900/60 pr-6 sticky top-[60px] self-start">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-3">Documentation</p>
            {docSections.map((sect) => {
              const Icon = sect.icon;
              const isActive = activeTab === sect.id;
              return (
                <button
                  key={sect.id}
                  onClick={() => setActiveTab(sect.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-left transition-all cursor-pointer border ${
                    isActive 
                      ? 'bg-zinc-900/60 border-zinc-800 text-white font-extrabold' 
                      : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-950'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-volt' : 'text-zinc-500'}`} />
                  {sect.shortTitle}
                </button>
              );
            })}
          </aside>

          {/* Content panel */}
          <main className="md:col-span-9 flex flex-col min-w-0 min-h-[350px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.12 }}
                className="space-y-5 min-w-0"
              >
                <div className="min-w-0">
                  <h2 className="font-display font-extrabold text-xl sm:text-2xl md:text-3xl text-white uppercase tracking-tight leading-tight break-words">{activeContent.title}</h2>
                  <p className="text-zinc-400 text-xs sm:text-sm mt-1.5 leading-relaxed">{activeContent.desc}</p>
                </div>

                {/* Info cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-900">
                  
                  <div className="border border-zinc-900 bg-zinc-950/30 p-4 sm:p-5 rounded-xl min-w-0">
                    <div className="inline-flex items-center gap-1 bg-[#0052ff]/10 border border-[#0052ff]/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest text-[#0052ff] mb-3">
                      How It Works
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed break-words">{activeContent.howItWorks}</p>
                  </div>

                  <div className="border border-zinc-900 bg-zinc-950/30 p-4 sm:p-5 rounded-xl min-w-0">
                    <div className="inline-flex items-center gap-1 bg-[#00f0ff]/10 border border-[#00f0ff]/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest text-[#00f0ff] mb-3">
                      How To Use
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed break-words">{activeContent.howToUse}</p>
                  </div>

                </div>
              </motion.div>
            </AnimatePresence>

            {/* Prev / Next navigation */}
            <div className="border-t border-zinc-900 pt-6 mt-8 flex items-stretch justify-between gap-3 min-w-0">
              {prevContent ? (
                <button
                  onClick={() => setActiveTab(prevContent.id)}
                  className="flex flex-col items-start gap-0.5 p-3 rounded-lg border border-zinc-900 hover:border-zinc-800 bg-zinc-950/20 hover:bg-zinc-950/50 transition-all text-left group cursor-pointer min-w-0 flex-1 max-w-[48%]"
                >
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Previous</span>
                  <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors truncate w-full">{prevContent.shortTitle}</span>
                </button>
              ) : (
                <div className="flex-1" />
              )}

              {nextContent ? (
                <button
                  onClick={() => setActiveTab(nextContent.id)}
                  className="flex flex-col items-end gap-0.5 p-3 rounded-lg border border-zinc-900 hover:border-zinc-800 bg-zinc-950/20 hover:bg-zinc-950/50 transition-all text-right group cursor-pointer min-w-0 flex-1 max-w-[48%]"
                >
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Next</span>
                  <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors truncate w-full">{nextContent.shortTitle}</span>
                </button>
              ) : (
                <div className="flex-1" />
              )}
            </div>

          </main>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-900 px-4 py-3 text-center text-[9px] font-mono text-zinc-600 font-bold uppercase tracking-widest bg-black shrink-0">
        © 2026 Svay Intelligence Platform
      </footer>

    </div>
  );
}
