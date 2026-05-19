"use client";

import { useState } from "react";
import { 
  Search, Zap, Users, Trophy, BookOpen, BarChart3, 
  Flame, TrendingUp, Layers, Sparkles, Rocket, Video, 
  Eye, Target, Plus, Save, PlaySquare, ChevronRight
} from "lucide-react";

export default function DemoDashboard() {
  const [activeTab, setActiveTab] = useState("radar");
  const [hoverInfo, setHoverInfo] = useState(null);

  const trendData = [
    { topic: "AI Video Editing 2025", viralScore: 98, momentum: "hot", opportunity: "High demand, low competition", estimatedViews: "1.2M", difficulty: "Medium" },
    { topic: "Faceless YouTube Channels", viralScore: 85, momentum: "growing", opportunity: "Steady growth in tech niche", estimatedViews: "850K", difficulty: "Hard" },
    { topic: "YouTube Shorts Strategy", viralScore: 72, momentum: "stable", opportunity: "Evergreen topic", estimatedViews: "500K", difficulty: "Low" },
  ];

  const quickWins = [
    { idea: "Top 5 AI Video Generators", effort: "low", why: "Competitors missing latest tools." },
    { idea: "Faceless Setup Guide", effort: "medium", why: "High search volume, low quality results." }
  ];

  const videoIdeas = [
    { title: "I Tried AI Video Editors for 30 Days", description: "A realistic review of top AI tools in 2025.", predictedViews: "1.2M", difficulty: "Medium" },
    { title: "The TRUTH About Faceless Channels", description: "Breaking down the actual revenue.", predictedViews: "854K", difficulty: "Hard" },
    { title: "My Shorts Strategy That Got 10M Views", description: "Step by step guide to shorts algorithm.", predictedViews: "2.1M", difficulty: "Low" }
  ];

  const videoCards = [
    {
      snippet: {
        title: "I Tried AI Video Editors for 30 Days",
        channelTitle: "Tech Insights",
        publishedAt: "2025-01-10T10:00:00Z",
        description: "Are AI video editors actually worth it? Let's find out.",
        thumbnails: { medium: { url: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&q=80" } }
      },
      stats: { dailyViews: 12500, engagement: 8.4, score: 94, level: "HOT" },
      color: "255, 79, 109"
    },
    {
      snippet: {
        title: "The TRUTH About Faceless Channels",
        channelTitle: "Creator Hub",
        publishedAt: "2025-02-05T10:00:00Z",
        description: "Breaking down the actual revenue and effort required.",
        thumbnails: { medium: { url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80" } }
      },
      stats: { dailyViews: 8500, engagement: 6.2, score: 88, level: "GROWING" },
      color: "200, 241, 53"
    }
  ];

  return (
    <div className="demo-wrapper sr sr-d1">
      <div className="demo-header">
        <div className="demo-dots">
          <span className="dot d-red"></span>
          <span className="dot d-yel"></span>
          <span className="dot d-grn"></span>
        </div>
        <div className="demo-url">app.vyron.ai / dashboard</div>
      </div>
      
      <div className="demo-body flex h-[800px] overflow-hidden bg-black text-white font-sans">
        
        {/* Sidebar */}
        <div className="w-64 border-r border-accents-2 bg-black flex flex-col justify-between shrink-0 h-full overflow-hidden hidden md:flex">
          <div className="p-6">
            <div className="flex items-center gap-3 transition-opacity hover:opacity-80 group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-geist-success via-[#00dfd8] to-geist-success shadow-[0_0_15px_rgba(0,112,243,0.3)] transition-shadow" />
              <span className="font-bold text-xl tracking-tight uppercase">Vyron</span>
            </div>
          </div>

          <nav className="flex-1 px-3 space-y-0.5 mt-2 overflow-y-auto no-scrollbar">
            <div className="pb-2 px-3">
              <p className="text-[10px] font-bold text-accents-4 uppercase tracking-widest">Intelligence</p>
            </div>
            
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all relative group text-accents-4 hover:text-white hover:bg-white/[0.04]">
              <Search className="w-4 h-4 transition-colors" strokeWidth={2} /> Search
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all relative group text-white bg-white/[0.08]">
              <div className="absolute left-0 w-[2px] h-4 bg-white rounded-full" />
              <Zap className="w-4 h-4 transition-colors text-white" strokeWidth={2.5} /> Trends
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all relative group text-accents-4 hover:text-white hover:bg-white/[0.04]">
              <Users className="w-4 h-4 transition-colors" strokeWidth={2} /> Channels
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all relative group text-accents-4 hover:text-white hover:bg-white/[0.04]">
              <Trophy className="w-4 h-4 transition-colors" strokeWidth={2} /> Competitors
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all relative group text-accents-4 hover:text-white hover:bg-white/[0.04]">
              <BarChart3 className="w-4 h-4 transition-colors" strokeWidth={2} /> Analytics
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all relative group text-accents-4 hover:text-white hover:bg-white/[0.04]">
              <BookOpen className="w-4 h-4 transition-colors" strokeWidth={2} /> Library
            </button>
          </nav>

          <div className="h-[88px] p-4 border-t border-accents-2 mt-auto flex items-center">
            <div className="w-full bg-accents-1 border border-accents-2 rounded-lg p-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-full border border-white/10 bg-zinc-800 flex items-center justify-center text-xs font-bold">PRO</div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-white uppercase tracking-tight truncate">Pro Account</p>
                  <p className="text-[8px] text-accents-4 font-bold uppercase tracking-widest">Status: Active</p>
                </div>
            </div>
          </div>
        </div>

        {/* Main Content (Trend Radar Replica) */}
        <div className="flex-1 flex flex-col h-full min-w-0 relative overflow-y-auto bg-black">
          {/* Header */}
          <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-md">
            <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                  <Zap className="w-5 h-5 text-black" />
                </div>
                <h1 className="text-lg font-bold tracking-tight uppercase flex items-center gap-3">
                  Radar <span className="text-zinc-600 font-normal hidden sm:inline">/ Global</span>
                </h1>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter hidden sm:inline-flex items-center gap-1.5 whitespace-nowrap">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Last scan: just now
                </span>
                <button className="h-9 px-4 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span className="hidden sm:inline">Scan</span>
                </button>
              </div>
            </div>
          </nav>

          <main className="px-4 sm:px-6 py-8">
            <div className="space-y-12 pb-20">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Viral Potential</span>
                  </div>
                  <p className="text-3xl font-semibold tracking-tight">High</p>
                </div>
                <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Market Momentum</span>
                  </div>
                  <p className="text-3xl font-semibold tracking-tight">+24%</p>
                </div>
                <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <Layers className="w-4 h-4 text-zinc-400" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Videos Scanned</span>
                  </div>
                  <p className="text-3xl font-semibold tracking-tight">2,485</p>
                </div>
              </div>

              {/* Analysis Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Overview & Trends */}
                <div className="lg:col-span-7 space-y-12">
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Market Summary
                      </h3>
                    </div>
                    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
                      <p className="text-lg leading-relaxed text-zinc-200 font-light">
                        The tech niche is showing strong momentum around AI tools and faceless channel strategies. There's a clear gap for high-quality, real-world comparison videos.
                      </p>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <Rocket className="w-4 h-4" /> Emerging Trends
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {trendData.map((trend, i) => (
                        <div key={i} className="group p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:bg-zinc-900/60 transition-all">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-medium text-white group-hover:text-blue-400 transition-colors">
                                  {trend.topic}
                                </h4>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 uppercase ${trend.momentum === 'hot' ? 'text-red-500' : 'text-blue-500'}`}>
                                  {trend.momentum}
                                </span>
                              </div>
                              <p className="text-sm text-zinc-500 leading-snug">{trend.opportunity}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xl font-bold tracking-tighter text-white">{trend.viralScore}</span>
                                <span className="text-[10px] font-bold text-zinc-600 uppercase">Score</span>
                              </div>
                              <div className="flex gap-2">
                                <button className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all">
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                            <div className="flex items-center gap-1"><Eye className="w-3 h-3" /> {trend.estimatedViews}</div>
                            <div className="flex items-center gap-1"><Target className="w-3 h-3" /> {trend.difficulty}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Right Column: Quick Wins & AI Ideas */}
                <div className="lg:col-span-5 space-y-12">
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Quick Wins
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {quickWins.map((win, i) => (
                        <div key={i} className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col gap-4">
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-1">
                              <h4 className="text-sm font-semibold text-zinc-100">{win.idea}</h4>
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase border ${win.effort === 'low' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                {win.effort} Effort
                              </span>
                            </div>
                            <button className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-white">
                              <Save className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-zinc-500 leading-relaxed italic border-l-2 border-zinc-800 pl-3">
                            "{win.why}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <Video className="w-4 h-4" /> Hot Videos
                      </h3>
                    </div>
                    <div className="space-y-6">
                      {videoCards.map((video, i) => (
                        <div 
                          key={i}
                          className="group relative border flex flex-col min-h-[16rem] rounded-[1.5rem] overflow-hidden transition-all duration-500 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 bg-[rgba(var(--card-color),0.03)] hover:bg-[rgba(var(--card-color),0.12)] border-[rgba(var(--card-color),0.25)] hover:border-[rgba(var(--card-color),0.5)]"
                          style={{ 
                            "--card-color": video.color,
                            boxShadow: `0 0 40px rgba(${video.color}, 0.08)`
                          }}
                        >
                          <div className="relative h-32 flex-shrink-0 overflow-hidden">
                            <img 
                              src={video.snippet.thumbnails.medium.url} 
                              alt="" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                            <div className="absolute bottom-4 left-4">
                               <div className="bg-white text-black px-3 py-1 rounded-lg font-black text-[9px] tracking-widest uppercase shadow-xl">
                                  {video.stats.level}
                               </div>
                            </div>
                          </div>

                          <div className="p-4 flex-1 flex flex-col overflow-hidden relative z-10">
                            <div className="flex-1">
                              <h3 className="font-black text-sm md:text-base tracking-tighter leading-tight line-clamp-2 text-white mb-2">
                                {video.snippet.title}
                              </h3>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-[#666666] mb-3 flex items-center gap-2">
                                <span className="text-zinc-300">{video.snippet.channelTitle}</span>
                                <span className="w-1 h-1 bg-[#333333] rounded-full"></span>
                                <span>2d ago</span>
                              </p>
                            </div>
                            
                            <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                               <div className="flex gap-4">
                                  <div className="flex flex-col">
                                    <span className="text-[8px] text-[#555] font-black uppercase tracking-widest mb-0.5">Views/Day</span>
                                    <span className="text-sm font-black text-white">{video.stats.dailyViews}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[8px] text-[#555] font-black uppercase tracking-widest mb-0.5">Score</span>
                                    <span className="text-sm font-black text-white" style={{ color: `rgba(${video.color}, 1)` }}>{video.stats.score}</span>
                                  </div>
                               </div>
                               <button className="text-[9px] font-black tracking-widest uppercase bg-white text-black px-4 py-2 rounded-xl hover:scale-105 transition-all shadow-xl">
                                 View
                               </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <style jsx>{`
        .demo-wrapper {
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 30px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02);
          display: flex;
          flex-direction: column;
          position: relative;
          background: #000;
        }
        .demo-header {
          height: 48px;
          background: #0a0a0a;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          padding: 0 20px;
          position: relative;
          z-index: 100;
        }
        .demo-dots {
          display: flex;
          gap: 8px;
        }
        .dot { width: 12px; height: 12px; border-radius: 50%; }
        .d-red { background: #ff5f57; }
        .d-yel { background: #febc2e; }
        .d-grn { background: #28c840; }
        
        .demo-url {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.7rem;
          color: var(--muted);
          background: rgba(0,0,0,0.3);
          padding: 6px 16px;
          border-radius: 6px;
          border: 1px solid var(--border);
          letter-spacing: 0.05em;
          font-family: 'DM Mono', monospace;
        }
      `}</style>
    </div>
  );
}
