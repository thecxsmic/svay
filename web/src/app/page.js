"use client";

import { useState, useEffect } from "react";
import { calculateViralityScore } from "@/lib/ranking/virality";
import VideoCard from "./components/VideoCard";

export default function Home() {
  const [query, setQuery] = useState("");
  const [hoverInfo, setHoverInfo] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeTab, setActiveTab] = useState("intelligence");
  const [filters, setFilters] = useState({
    region: "US",
    lang: "en",
    uploadDate: "",
    duration: "",
    order: "relevance",
    maxResults: 50,
    safeSearch: "moderate",
    hdOnly: false,
    captioned: false,
    disableCache: false,
    vectorOnly: false,
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copying, setCopying] = useState(false);
  const [copyStates, setCopyStates] = useState({});
  const [showMarketAnalysis, setShowMarketAnalysis] = useState(true);
  const [loadingStage, setLoadingStage] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing Scan...");

  const REGION_CONFIG = {
    "US": { rate: 0.004, currency: "USD", symbol: "$", exchange: 1 },
    "GB": { rate: 0.0035, currency: "GBP", symbol: "£", exchange: 0.79 },
    "DE": { rate: 0.0035, currency: "EUR", symbol: "€", exchange: 0.92 },
    "FR": { rate: 0.003, currency: "EUR", symbol: "€", exchange: 0.92 },
    "JP": { rate: 0.004, currency: "JPY", symbol: "¥", exchange: 150 },
    "CA": { rate: 0.003, currency: "CAD", symbol: "CA$", exchange: 1.35 },
    "AU": { rate: 0.003, currency: "AUD", symbol: "A$", exchange: 1.52 },
    "IN": { rate: 0.0008, currency: "INR", symbol: "₹", exchange: 83 },
    "BR": { rate: 0.0012, currency: "BRL", symbol: "R$", exchange: 4.95 },
    "MX": { rate: 0.0015, currency: "MXN", symbol: "Mex$", exchange: 17 },
    "KR": { rate: 0.0035, currency: "KRW", symbol: "₩", exchange: 1330 },
    "SA": { rate: 0.0025, currency: "SAR", symbol: "SR", exchange: 3.75 },
    "ID": { rate: 0.0007, currency: "IDR", symbol: "Rp", exchange: 15600 },
    "NG": { rate: 0.0005, currency: "NGN", symbol: "₦", exchange: 1500 }
  };

  const getEarnings = (views) => {
    const config = REGION_CONFIG[filters.region] || REGION_CONFIG["US"];
    const usdValue = parseInt(views || 0) * config.rate;
    const localValue = usdValue * config.exchange;
    return { usd: usdValue, local: localValue, ...config };
  };

  const copyToClipboard = async () => {
    if (!selectedVideo) return;
    setCopying(true);
    
    const { item, v } = selectedVideo;
    const stats = item.statistics || {};
    const earnings = getEarnings(stats.viewCount);
    const text = `
VIDEO DATA: ${item.snippet.title}
Channel: ${item.snippet.channelTitle}
Link: https://youtube.com/watch?v=${item.id.videoId || item.id}
Published: ${new Date(item.snippet.publishedAt).toLocaleString()}

PERFORMANCE:
- Viral Level: ${v.level} (Score: ${v.score})
- Views/Day: ${formatNumber(v.dailyViews)}
- Engagement: ${v.engagement}%
- Total Views: ${formatNumber(parseInt(stats.viewCount || 0))}
- Likes: ${formatNumber(parseInt(stats.likeCount || 0))}
- Comments: ${formatNumber(parseInt(stats.commentCount || 0))}
- Estimated Earnings: ${earnings.symbol}${formatNumber(earnings.local)} (${filters.region} rate) ${filters.region !== 'US' ? `~ $${formatNumber(earnings.usd)} USD` : ''}

SEARCH MATCH: ${((item.distance ?? 0.95) * 100).toFixed(0)}%

DESCRIPTION:
${item.snippet.description || "No description found."}
    `.trim();

    try {
      await navigator.clipboard.writeText(text);
      setTimeout(() => setCopying(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setCopying(false);
    }
  };

  const copyText = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStates(prev => ({ ...prev, [id]: true }));
      setTimeout(() => setCopyStates(prev => ({ ...prev, [id]: false })), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getHashtags = (text) => {
    if (!text) return [];
    const matches = text.match(/#\w+/g);
    return matches ? Array.from(new Set(matches)) : [];
  };

  useEffect(() => {
    if (selectedVideo) {
      setActiveTab("stats");
    }
  }, [selectedVideo]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setLoadingStage(10);
    setLoadingText("Initializing Neural Scan...");
    setError(null);
    
    // Simulate progress while fetch is running
    const progressInterval = setInterval(() => {
      setLoadingStage(prev => {
        if (prev < 90) {
          const next = prev + Math.random() * 15;
          if (next > 30 && next < 50) setLoadingText("Querying Vector Database...");
          if (next > 50 && next < 70) setLoadingText("Synthesizing Market Data...");
          if (next > 70) setLoadingText("Finalizing Neural Analysis...");
          return next;
        }
        return prev;
      });
    }, 400);

    const params = new URLSearchParams({ q: query, ...filters });
    try {
      const res = await fetch(`/api/youtube/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Search failed");
      setLoadingStage(100);
      setLoadingText("Scan Complete.");
      setTimeout(() => setResults(data.items), 300);
    } catch (err) {
      setError(err.message);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setLoading(false), 800);
    }
  };

  const updateFilter = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    
    setFilters((prev) => {
      const updated = { ...prev, [name]: newValue };
      
      // If we already have results and the changed filter is 'order', sort locally
      if (results && name === 'order') {
        const sorted = [...results].sort((a, b) => {
          if (newValue === 'virality') {
            const vA = calculateViralityScore(a).score;
            const vB = calculateViralityScore(b).score;
            return vB - vA;
          }
          if (newValue === 'date') {
            return new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt);
          }
          if (newValue === 'viewCount') {
            const viewsA = parseInt(a.statistics?.viewCount || 0);
            const viewsB = parseInt(b.statistics?.viewCount || 0);
            return viewsB - viewsA;
          }
          if (newValue === 'relevance') {
            // Use score if available from backend, else distance
            const scoreA = a.score || a.distance || 0;
            const scoreB = b.score || b.distance || 0;
            return scoreB - scoreA;
          }
          return 0;
        });
        setResults(sorted);
      }
      
      return updated;
    });
  };

  const formatNumber = (num) => {
    if (isNaN(num) || num === null || num === undefined) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#ededed] font-sans selection:bg-[#0070f3] selection:text-white pb-24">
      {/* Global Hover Info Overlay */}
      {hoverInfo && !selectedVideo && (
        <div className="fixed bottom-8 right-8 z-[100] w-72 animate-in fade-in slide-in-from-bottom-4 duration-300 hidden md:block">
          <div className="bg-white text-black p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-black mb-1 opacity-50">{hoverInfo.title}</h4>
            <p className="text-xs font-bold leading-relaxed">{hoverInfo.text}</p>
          </div>
        </div>
      )}

      {/* Insights Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 backdrop-blur-xl bg-black/60 animate-in fade-in duration-300">
          <div 
            className="bg-[#000000] border w-full max-w-4xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90dvh]"
            style={{ 
              borderColor: `rgba(${selectedVideo.dominantColor || '0, 112, 243'}, 0.3)`,
              boxShadow: `0 0 100px rgba(${selectedVideo.dominantColor || '0, 112, 243'}, 0.15)`,
              maxHeight: '90dvh'
            }}
          >
            <div className="relative h-40 md:h-64 shrink-0">
              <img src={selectedVideo.item.snippet.thumbnails.high?.url || selectedVideo.item.snippet.thumbnails.medium.url} className="w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/40 to-transparent"></div>
              <button onClick={() => setSelectedVideo(null)} className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10 transition-colors z-10">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="absolute bottom-4 left-6 md:left-8 right-6">
                <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${selectedVideo.v.color} text-white px-3 py-1 rounded-lg font-bold text-[10px] md:text-xs tracking-widest uppercase mb-2 md:mb-3 shadow-2xl`}>
                  <span>{selectedVideo.v.level}</span>
                  <span className="w-px h-3 bg-white/30"></span>
                  <span>{selectedVideo.v.score}</span>
                </div>
                <h2 className="text-lg md:text-2xl font-bold text-white line-clamp-1">{selectedVideo.item.snippet.title}</h2>
              </div>
            </div>
            <div className="flex shrink-0 border-b border-white/10 px-4 md:px-8 overflow-x-auto no-scrollbar bg-black sticky top-0 z-10">
              {['stats', 'performance', 'analytics', 'about'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-4 text-[10px] uppercase tracking-[0.2em] font-black transition-all border-b-2 whitespace-nowrap ${
                    activeTab === tab 
                      ? 'border-[#0070f3] text-white' 
                      : 'border-transparent text-[#666666] hover:text-[#999999]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-6 md:p-8 overflow-y-auto overflow-x-hidden custom-scrollbar flex-1 min-h-0 bg-black">
              {activeTab === 'stats' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-[#666666] mb-4 block">How it's doing</label>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-[#888888]">Viral Score</span>
                            <span className="text-white">{selectedVideo.v.score}%</span>
                          </div>
                          <div className="h-2 w-full bg-[#111111] rounded-full overflow-hidden shadow-inner">
                            <div className={`h-full bg-gradient-to-r ${selectedVideo.v.color} shadow-[0_0_20px_rgba(255,255,255,0.2)]`} style={{ width: `${selectedVideo.v.score}%` }}></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-[#888888]">Engagement</span>
                            <span className="text-white">{selectedVideo.v.engagement}%</span>
                          </div>
                          <div className="h-2 w-full bg-[#111111] rounded-full overflow-hidden shadow-inner">
                            <div 
                              className="h-full transition-all duration-1000" 
                              style={{ 
                                width: `${Math.min(parseFloat(selectedVideo.v.engagement) * 5, 100)}%`,
                                backgroundColor: `rgb(${selectedVideo.dominantColor || '0, 112, 243'})`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className="bg-[#111111] border p-6 rounded-3xl transition-colors duration-700"
                      style={{ borderColor: `rgba(${selectedVideo.dominantColor || '0, 112, 243'}, 0.2)` }}
                    >
                      <label className="text-[10px] uppercase tracking-widest font-bold text-[#666666] mb-3 block text-center">Search Match</label>
                      <div className="flex items-center justify-center gap-4">
                          <span className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                            {((selectedVideo.item.distance ?? 0.95) * 100).toFixed(0)}
                            <span className="text-xl md:text-2xl text-[#0070f3]">%</span>
                          </span>
                          <span className="text-[10px] text-[#888888] font-bold leading-tight uppercase tracking-widest border-l border-white/10 pl-4">Match<br/>level</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center items-center text-center space-y-4 p-8 bg-[#050505] rounded-3xl border border-white/5">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-[#666666] block">Estimated Earnings</label>
                    <div className="flex flex-col items-center">
                        <div className="text-4xl md:text-5xl font-black text-[#00dfd8] tracking-tighter drop-shadow-[0_0_30px_rgba(0,223,216,0.3)]">
                        {getEarnings(selectedVideo.item.statistics?.viewCount).symbol}{formatNumber(getEarnings(selectedVideo.item.statistics?.viewCount).local)}
                        </div>
                        {filters.region !== "US" && (
                            <div className="text-xs font-bold text-[#444444] mt-1">
                                ~ ${formatNumber(getEarnings(selectedVideo.item.statistics?.viewCount).usd)} USD
                            </div>
                        )}
                    </div>
                    <p className="text-[10px] text-[#444444] uppercase font-black tracking-[0.2em]">Est. Earnings ({filters.region})</p>
                    <div className="pt-4 border-t border-white/5 w-full">
                        <p className="text-[9px] text-[#666666] leading-relaxed uppercase tracking-widest">Rough guess based on {filters.region} rates and current exchange.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'performance' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Views per Day', value: `${formatNumber(selectedVideo.v.dailyViews)}` },
                      { label: 'Total Views', value: formatNumber(parseInt(selectedVideo.item.statistics?.viewCount || 0)) },
                      { label: 'Likes', value: formatNumber(parseInt(selectedVideo.item.statistics?.likeCount || 0)) },
                      { label: 'Comments', value: formatNumber(parseInt(selectedVideo.item.statistics?.commentCount || 0)) }
                    ].map((stat) => (
                      <div key={stat.label} className="bg-[#111111] border border-[#222222] p-6 rounded-3xl hover:border-[#444444] transition-colors">
                        <span className="text-[10px] text-[#666666] font-black uppercase block mb-2 tracking-widest">{stat.label}</span>
                        <span className="text-xl md:text-2xl font-black text-white tracking-tighter">{stat.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#111111] border border-[#222222] p-8 rounded-3xl flex flex-col justify-center space-y-8">
                    <div>
                      <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-widest text-[#666666]">
                        <span>Like Percentage</span>
                        <span className="text-white">{((parseInt(selectedVideo.item.statistics?.likeCount || 0) / Math.max(parseInt(selectedVideo.item.statistics?.viewCount || 1), 1)) * 100).toFixed(2)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                        <div className="h-full bg-white opacity-20" style={{ width: `${Math.min((parseInt(selectedVideo.item.statistics?.likeCount || 0) / Math.max(parseInt(selectedVideo.item.statistics?.viewCount || 1), 1)) * 1000, 100)}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-widest text-[#666666]">
                        <span>Comment Percentage</span>
                        <span className="text-white">{((parseInt(selectedVideo.item.statistics?.commentCount || 0) / Math.max(parseInt(selectedVideo.item.statistics?.viewCount || 1), 1)) * 100).toFixed(2)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                        <div className="h-full bg-[#0070f3]" style={{ width: `${Math.min((parseInt(selectedVideo.item.statistics?.commentCount || 0) / Math.max(parseInt(selectedVideo.item.statistics?.viewCount || 1), 1)) * 2000, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="bg-[#080808] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden">
                    <div className="flex items-center justify-between mb-10 relative z-10">
                      <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">Growth Projection</h3>
                        <p className="text-[10px] text-[#666666] font-bold uppercase tracking-[0.2em]">Predicted trajectory for the next 30 days</p>
                      </div>
                      <div className="text-right">
                         <span className="text-3xl font-black text-[#00dfd8] tracking-tighter">+{formatNumber((selectedVideo.v?.dailyViews || 0) * 30)}</span>
                         <p className="text-[9px] text-[#444444] font-black uppercase tracking-widest mt-1">Est. 30D Views</p>
                      </div>
                    </div>
                    
                    <div className="h-56 flex items-end gap-1 md:gap-2 relative z-10">
                       {[...Array(30)].map((_, i) => {
                          const baseHeight = 12;
                          const growth = (i / 29) * 80;
                          const randomBuffer = Math.sin(i * 0.8) * 5;
                          const height = Math.max(10, baseHeight + growth + randomBuffer);
                          const barColor = selectedVideo.dominantColor || '0, 112, 243';
                          return (
                            <div key={i} className="flex-1 h-full flex items-end group relative">
                               <div 
                                className="w-full transition-all duration-700 rounded-t-xl" 
                                style={{ 
                                    height: `${height}%`,
                                    backgroundColor: i === 29 ? `rgb(${barColor})` : `rgba(${barColor}, ${0.1 + (i / 30) * 0.7})`,
                                    boxShadow: i === 29 ? `0 0 30px rgba(${barColor}, 0.5)` : 'none'
                                }}
                               ></div>
                               <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-2xl z-20 border border-black/5">
                                 Day {i+1}: +{formatNumber((selectedVideo.v?.dailyViews || 0) * (i + 1))}
                               </div>
                            </div>
                          )
                       })}
                    </div>
                    <div className="flex justify-between mt-8 text-[10px] font-black text-[#444444] uppercase tracking-[0.3em] border-t border-white/5 pt-6">
                       <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white/10"></div>Origin</span>
                       <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: `rgb(${selectedVideo.dominantColor || '0, 112, 243'})` }}></div>Velocity Target</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="bg-[#080808] border border-white/5 p-10 rounded-[2.5rem] flex flex-col justify-center">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-black text-[#666666] mb-10 block text-center">Audience Resonance</label>
                        <div className="flex items-center justify-center gap-14">
                           <div className="relative w-40 h-40 flex items-center justify-center">
                              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                 <circle cx="50" cy="50" r="44" fill="transparent" stroke="#111111" strokeWidth="8" />
                                 <circle 
                                  cx="50" cy="50" r="44" 
                                  fill="transparent" 
                                  stroke={`rgb(${selectedVideo.dominantColor || '0, 112, 243'})`} 
                                  strokeWidth="8" 
                                  strokeDasharray="276.46" 
                                  strokeDashoffset={276.46 * (1 - Math.min(parseFloat(selectedVideo.v?.engagement || 0) / 10, 1))}
                                  strokeLinecap="round"
                                  className="transition-all duration-1000 ease-out"
                                 />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                 <span className="text-3xl font-black text-white leading-none">{selectedVideo.v?.engagement || 0}%</span>
                                 <span className="text-[10px] text-[#666666] font-bold uppercase tracking-widest mt-2">Rate</span>
                              </div>
                           </div>
                           <div className="space-y-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-4 h-4 rounded-full shadow-2xl" style={{ backgroundColor: `rgb(${selectedVideo.dominantColor || '0, 112, 243'})` }}></div>
                                 <div>
                                    <p className="text-sm text-white font-black leading-none">{formatNumber(selectedVideo.item.statistics?.likeCount)}</p>
                                    <p className="text-[10px] text-[#444444] font-black uppercase tracking-widest mt-1">Likes</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4">
                                 <div className="w-4 h-4 rounded-full bg-white/5 border border-white/10"></div>
                                 <div>
                                    <p className="text-sm text-white font-black leading-none">{formatNumber(selectedVideo.item.statistics?.commentCount)}</p>
                                    <p className="text-[10px] text-[#444444] font-black uppercase tracking-widest mt-1">Comments</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="bg-[#080808] border border-white/5 p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center relative overflow-hidden group">
                        <div 
                            className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-1000"
                            style={{ background: `radial-gradient(circle at center, rgb(${selectedVideo.dominantColor || '0, 112, 243'}), transparent 70%)` }}
                        ></div>
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 relative z-10 border border-white/10 shadow-inner">
                           <svg className="w-12 h-12 transition-all duration-700 group-hover:scale-110 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `rgb(${selectedVideo.dominantColor || '0, 112, 243'})` }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        </div>
                        <h4 className="text-[11px] font-black text-[#666666] uppercase tracking-[0.3em] mb-4 relative z-10">Market Potential</h4>
                        <div className="text-4xl font-black text-white tracking-tighter mb-3 relative z-10">{selectedVideo.v?.level || 'N/A'}</div>
                        <p className="text-[11px] text-[#888888] font-bold leading-relaxed uppercase tracking-[0.1em] max-w-[200px] relative z-10">
                           This video is currently {selectedVideo.v?.level === 'Viral' ? 'outperforming' : 'matching'} {selectedVideo.v?.score || 0}% of similar content in this niche.
                        </p>
                     </div>
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500 h-full">
                  <div className="md:col-span-2 flex flex-col h-full min-h-[200px] md:min-h-0 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-[#666666] shrink-0 block">Video Description</label>
                      <button 
                        onClick={() => copyText('desc', selectedVideo.item.snippet.description)}
                        className={`text-[9px] font-bold px-2 py-1 rounded border transition-all flex items-center gap-1.5 ${
                          copyStates['desc'] ? 'bg-[#0070f3] border-[#0070f3] text-white' : 'border-white/10 text-[#666666] hover:text-white hover:border-white/20'
                        }`}
                      >
                        {copyStates['desc'] ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="bg-[#080808] border border-white/5 p-6 rounded-3xl flex-1 overflow-y-auto text-xs md:text-sm text-[#888888] leading-relaxed whitespace-pre-wrap custom-scrollbar font-medium">
                      {selectedVideo.item.snippet.description || "No description found."}
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-[#666666] mb-2 block">Channel</label>
                      <p className="text-lg font-black text-white truncate">{selectedVideo.item.snippet.channelTitle}</p>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-[#666666] mb-2 block">Date</label>
                      <p className="text-sm font-black text-[#aaaaaa]">
                        {new Date(selectedVideo.item.snippet.publishedAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
                      </p>
                    </div>

                    {(selectedVideo.item.snippet.tags || getHashtags(selectedVideo.item.snippet.description)).length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-[#666666] block">Tags</label>
                          <button 
                            onClick={() => {
                              const tags = selectedVideo.item.snippet.tags || getHashtags(selectedVideo.item.snippet.description);
                              copyText('tags', tags.join(', '));
                            }}
                            className={`text-[9px] font-bold px-2 py-1 rounded border transition-all flex items-center gap-1.5 ${
                              copyStates['tags'] ? 'bg-[#0070f3] border-[#0070f3] text-white' : 'border-white/10 text-[#666666] hover:text-white hover:border-white/20'
                            }`}
                          >
                            {copyStates['tags'] ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 overflow-y-auto custom-scrollbar">
                          {(selectedVideo.item.snippet.tags || getHashtags(selectedVideo.item.snippet.description)).slice(0, 20).map(tag => (
                            <span key={tag} className="text-[9px] uppercase tracking-widest font-black bg-white/5 text-[#888888] border border-white/10 px-3 py-1.5 rounded-lg hover:text-white hover:border-white/20 transition-all cursor-default">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 md:p-8 pt-0 flex gap-3">
              <button 
                onClick={copyToClipboard}
                className={`flex-1 font-bold py-3 md:py-4 rounded-xl md:rounded-2xl transition-all flex items-center justify-center gap-2 text-sm md:text-base border ${
                  copying 
                    ? 'bg-[#0070f3] text-white border-[#0070f3]' 
                    : 'bg-transparent text-white border-white/20 hover:bg-white/5'
                }`}
              >
                {copying ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    Copy Data
                  </>
                )}
              </button>
              <button 
                onClick={() => window.open(`https://youtube.com/watch?v=${selectedVideo.item.id.videoId || selectedVideo.item.id}`, '_blank')} 
                className="flex-1 bg-white text-black font-bold py-3 md:py-4 rounded-xl md:rounded-2xl hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
                style={{ boxShadow: `0 10px 30px rgba(${selectedVideo.dominantColor || '0, 112, 243'}, 0.2)` }}
              >
                Watch Content
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="border-b border-[#333333] sticky top-0 bg-[#000000]/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center"><div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-black border-b-[5px] border-b-transparent ml-0.5"></div></div>
            <span className="font-bold text-xl tracking-tight text-white uppercase">Vyron</span>
          </div>
          <div className="flex gap-4 md:gap-6 text-[10px] md:text-xs font-bold text-[#888888] uppercase tracking-widest">
             <span className="hover:text-white transition-colors cursor-pointer">Intelligence</span>
             <span className="hover:text-white transition-colors cursor-pointer hidden sm:inline">Archive</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 bg-gradient-to-b from-white to-[#666666] bg-clip-text text-transparent uppercase">Video Search</h1>
          <p className="text-[#888888] text-sm md:text-lg max-w-xl mx-auto font-medium leading-relaxed px-4">Find videos and see how they are performing across the platform.</p>
        </div>

        <section className="mb-16">
          <form onSubmit={handleSearch} className="relative group max-w-3xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#0070f3] via-[#00dfd8] to-[#0070f3] rounded-3xl blur-xl opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
            <div className="relative flex items-center bg-[#000000] border border-[#333333] rounded-2xl md:rounded-3xl overflow-hidden focus-within:border-[#0070f3] transition-all duration-500 shadow-2xl">
              <div className="pl-4 md:pl-8 text-[#666666] shrink-0"><svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
              <input type="text" placeholder="Search for videos..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full py-4 md:py-6 px-4 md:px-6 bg-transparent outline-none text-base md:text-xl font-bold placeholder-[#444444] text-white tracking-tight" />
              <button type="submit" disabled={loading} className="mr-2 md:mr-4 bg-white text-black px-4 md:px-10 py-2 md:py-3 rounded-xl md:rounded-2xl font-black hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 md:gap-3 shadow-xl text-xs md:text-base relative overflow-hidden min-w-[120px]">
                SEARCH
              </button>
              {loading && (
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#0070f3] to-[#00dfd8] transition-all duration-500 ease-out shadow-[0_0_10px_#00dfd8]"
                  style={{ width: `${loadingStage}%` }}
                ></div>
              )}
            </div>
          </form>

          <div className="mt-8 flex flex-wrap justify-center gap-3 md:gap-4">
             {['region', 'order', 'uploadDate', 'duration'].map((filter) => (
                <div key={filter} className="flex flex-col gap-1 w-[calc(50%-0.5rem)] md:w-auto">
                   <select name={filter} value={filters[filter]} onChange={updateFilter} className="w-full bg-[#000000] border border-[#333333] hover:border-[#666666] rounded-xl px-3 md:px-4 py-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest outline-none transition-all text-[#888888] hover:text-white">
                      {filter === 'region' && <>
                        <option value="US">🇺🇸 USA</option>
                        <option value="GB">🇬🇧 UK</option>
                        <option value="DE">🇩🇪 Germany</option>
                        <option value="FR">🇫🇷 France</option>
                        <option value="JP">🇯🇵 Japan</option>
                        <option value="CA">🇨🇦 Canada</option>
                        <option value="AU">🇦🇺 Australia</option>
                        <option value="IN">🇮🇳 India</option>
                        <option value="BR">🇧🇷 Brazil</option>
                        <option value="MX">🇲🇽 Mexico</option>
                        <option value="KR">🇰🇷 S. Korea</option>
                        <option value="SA">🇸🇦 Saudi Arabia</option>
                        <option value="ID">🇮🇩 Indonesia</option>
                        <option value="NG">🇳🇬 Nigeria</option>
                      </>}
                      {filter === 'order' && <><option value="relevance">Relevance</option><option value="date">Newest</option><option value="viewCount">Views</option><option value="virality">Virality</option></>}
                      {filter === 'uploadDate' && <><option value="">Anytime</option><option value="today">Today</option><option value="week">Weekly</option><option value="month">Monthly</option></>}
                      {filter === 'duration' && <><option value="">Any Length</option><option value="short">Short</option><option value="medium">Medium</option><option value="long">Long</option></>}
                   </select>
                </div>
             ))}
             <div className="flex gap-4 border-t md:border-t-0 md:border-l border-[#333333] pt-3 md:pt-0 md:pl-4 items-center w-full md:w-auto justify-center md:justify-start">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" name="vectorOnly" checked={filters.vectorOnly} onChange={updateFilter} className="sr-only" />
                  <div className={`w-4 h-4 rounded-md border transition-all ${filters.vectorOnly ? 'bg-[#0070f3] border-[#0070f3] shadow-[0_0_10px_rgba(0,112,243,0.5)]' : 'border-[#333333] group-hover:border-[#666666]'}`}>
                    {filters.vectorOnly && <svg className="w-3 h-3 text-white m-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#666666] group-hover:text-white transition-colors">Vector Search</span>
                </label>
                <div className="w-px h-4 bg-[#333333] hidden md:block"></div>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={showMarketAnalysis} onChange={(e) => setShowMarketAnalysis(e.target.checked)} className="sr-only" />
                  <div className={`w-4 h-4 rounded-md border transition-all ${showMarketAnalysis ? 'bg-[#00dfd8] border-[#00dfd8] shadow-[0_0_10px_rgba(0,223,216,0.5)]' : 'border-[#333333] group-hover:border-[#666666]'}`}>
                    {showMarketAnalysis && <svg className="w-3 h-3 text-black m-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#666666] group-hover:text-white transition-colors">Analysis</span>
                </label>
             </div>
          </div>
        </section>

        {results && results.length > 0 && showMarketAnalysis && (
          <section className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#080808] border border-white/5 p-8 rounded-[2.5rem] flex flex-col justify-between">
                   <div>
                      <p className="text-[10px] font-black text-[#666666] uppercase tracking-[0.2em] mb-4">Market Volume</p>
                      <div className="text-4xl font-black text-white tracking-tighter">
                        {formatNumber(results.reduce((acc, item) => acc + parseInt(item.statistics?.viewCount || 0), 0))}
                      </div>
                      <p className="text-[10px] text-[#444444] font-bold uppercase mt-1">Total Views in Niche</p>
                   </div>
                   <div className="mt-8 pt-6 border-t border-white/5">
                      <div className="flex justify-between items-end">
                         <span className="text-[9px] font-black text-[#00dfd8] uppercase tracking-widest">
                            {results.reduce((acc, item) => acc + parseInt(item.statistics?.viewCount || 0), 0) > 1000000 && results.length > 5 ? 'High Demand' : results.length > 2 ? 'Steady Volume' : 'Micro Niche'}
                         </span>
                         <div className="flex gap-0.5 items-end h-4">
                            {[0.4, 0.6, 0.9, 0.7, 1].map((h, i) => <div key={i} className="w-1 bg-[#00dfd8]" style={{ height: `${h * 100}%` }}></div>)}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-[#080808] border border-white/5 p-8 rounded-[2.5rem] flex flex-col justify-between">
                   <div>
                      <p className="text-[10px] font-black text-[#666666] uppercase tracking-[0.2em] mb-4">Competition</p>
                      <div className="text-4xl font-black text-white tracking-tighter">
                        {results.length > 25 ? 'High' : results.length > 10 ? 'Medium' : results.length > 3 ? 'Low' : 'Minimal'}
                      </div>
                      <p className="text-[10px] text-[#444444] font-bold uppercase mt-1">Niche Saturaton</p>
                   </div>
                   <div className="mt-8 pt-6 border-t border-white/5">
                      <div className="w-full h-1.5 bg-[#111111] rounded-full overflow-hidden">
                         <div 
                          className="h-full bg-white opacity-20" 
                          style={{ width: `${Math.min((results.length / 50) * 100, 100)}%` }}
                         ></div>
                      </div>
                   </div>
                </div>

                <div className="bg-[#080808] border border-white/5 p-8 rounded-[2.5rem] flex flex-col justify-between">
                   <div>
                      <p className="text-[10px] font-black text-[#666666] uppercase tracking-[0.2em] mb-4">Opportunity</p>
                      <div className="text-4xl font-black text-[#0070f3] tracking-tighter">
                        {(() => {
                           const avgVirality = results.reduce((acc, item) => acc + calculateViralityScore(item).score, 0) / results.length;
                           const confidenceFactor = Math.min(results.length / 10, 1); // Penalize low sample size
                           const saturationPenalty = 1 - (results.length / 100);
                           return (avgVirality * saturationPenalty * confidenceFactor).toFixed(0);
                        })()}%
                      </div>
                      <p className="text-[10px] text-[#444444] font-bold uppercase mt-1">Potential for Entry</p>
                   </div>
                   <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[9px] font-black text-[#666666] uppercase tracking-widest">
                        {results.length < 5 ? 'Uncertain Signal' : 'Entry Signal'}
                      </span>
                      <div className="flex gap-2">
                         <div className="w-2 h-2 rounded-full bg-[#0070f3] animate-pulse"></div>
                         <div className="w-2 h-2 rounded-full bg-[#0070f3]/20"></div>
                         <div className="w-2 h-2 rounded-full bg-[#0070f3]/20"></div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="mt-6 bg-[#080808] border border-white/5 p-6 rounded-3xl flex flex-wrap items-center justify-center gap-12">
                <div className="text-center group">
                   <p className="text-[9px] font-black text-[#444444] uppercase tracking-widest mb-2">Avg Performance</p>
                   <div className="flex items-end gap-1 h-8 justify-center mb-2">
                      {[0.3, 0.5, 0.8, 0.6, 0.9, 0.4].map((h, i) => (
                        <div key={i} className="w-1.5 bg-[#0070f3]/30 rounded-t-sm group-hover:bg-[#0070f3] transition-colors" style={{ height: `${h * 100}%` }}></div>
                      ))}
                   </div>
                   <p className="text-xl font-black text-white">{formatNumber(results.reduce((acc, item) => acc + parseInt(item.statistics?.viewCount || 0), 0) / results.length)}</p>
                </div>
                <div className="w-px h-12 bg-white/5 hidden md:block"></div>
                <div className="text-center group">
                   <p className="text-[9px] font-black text-[#444444] uppercase tracking-widest mb-2">Niche Engagement</p>
                   <div className="flex items-center justify-center mb-2">
                      <svg className="w-8 h-8" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#111111" strokeWidth="15" />
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#00dfd8" strokeWidth="15" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - Math.min((results.reduce((acc, item) => acc + parseFloat(calculateViralityScore(item).engagement), 0) / results.length) / 5, 1))} strokeLinecap="round" className="group-hover:stroke-[#00dfd8] transition-all" />
                      </svg>
                   </div>
                   <p className="text-xl font-black text-white">{(results.reduce((acc, item) => acc + parseFloat(calculateViralityScore(item).engagement), 0) / results.length).toFixed(2)}%</p>
                </div>
                <div className="w-px h-12 bg-white/5 hidden md:block"></div>
                <div className="text-center group">
                   <p className="text-[9px] font-black text-[#444444] uppercase tracking-widest mb-2">Unique Channels</p>
                   <div className="flex -space-x-2 justify-center mb-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-[#111111] border border-white/10 flex items-center justify-center">
                          <svg className="w-3 h-3 text-[#666666]" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>
                        </div>
                      ))}
                   </div>
                   <p className="text-xl font-black text-white">{new Set(results.map(i => i.snippet.channelId || i.snippet.channelTitle)).size}</p>
                </div>
             </div>
          </section>
        )}

        {loading && !results && (
          <div className="relative grid grid-cols-1 gap-8 animate-in fade-in duration-500">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#080808]/50 border border-white/5 h-72 rounded-[2rem] overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,223,216,0.03),transparent_70%)] animate-pulse"></div>
                <div className="flex flex-col md:flex-row h-full">
                  <div className="md:w-[24rem] bg-white/5 h-48 md:h-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                  </div>
                  <div className="p-10 flex-1 space-y-4">
                    <div className="h-8 bg-white/5 rounded-lg w-3/4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                    <div className="h-4 bg-white/5 rounded-lg w-1/4"></div>
                    <div className="space-y-2 pt-4">
                      <div className="h-3 bg-white/5 rounded-lg w-full"></div>
                      <div className="h-3 bg-white/5 rounded-lg w-5/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          {results?.map((item) => (
            <VideoCard 
              key={item.id?.videoId || item.id} 
              item={item} 
              setHoverInfo={setHoverInfo} 
              setSelectedVideo={setSelectedVideo} 
              formatNumber={formatNumber} 
            />
          ))}
        </div>
      </main>

      {/* Neural Core Anchor (Bottom Right) */}
      {loading && (
        <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-end gap-3 animate-in fade-in slide-in-from-right-10 duration-1000">
            <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-[#00dfd8]/20 px-5 py-3 rounded-2xl shadow-[0_0_50px_rgba(0,223,216,0.1)]">
                <div className="text-right">
                    <p className="text-[9px] font-black text-[#00dfd8] uppercase tracking-[0.2em] mb-0.5">Neural Uplink</p>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Active Processing</p>
                </div>
                <div className="relative w-10 h-10 flex items-center justify-center">
                    <div className="absolute inset-0 border-2 border-[#00dfd8]/20 rounded-full"></div>
                    <div 
                        className="absolute inset-0 border-2 border-[#00dfd8] rounded-full border-t-transparent animate-spin"
                        style={{ animationDuration: '1.5s' }}
                    ></div>
                    <div className="w-2 h-2 bg-[#00dfd8] rounded-full animate-pulse shadow-[0_0_15px_#00dfd8]"></div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
