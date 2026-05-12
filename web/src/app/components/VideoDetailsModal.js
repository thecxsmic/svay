"use client";

import { useState } from "react";
import { getEarnings } from "@/lib/utils/earnings";
import Link from "next/link";

export default function VideoDetailsModal({ selectedVideo, setSelectedVideo, filters, formatNumber }) {
  const [activeTab, setActiveTab] = useState("stats");
  const [copying, setCopying] = useState(false);
  const [copyStates, setCopyStates] = useState({});

  if (!selectedVideo) return null;

  const earnings = getEarnings(selectedVideo.item.statistics?.viewCount, filters?.region || "US");

  const copyToClipboard = async () => {
    setCopying(true);
    const { item, v } = selectedVideo;
    const stats = item.statistics || {};
    const text = `
VIDEO DATA: ${item.snippet?.title || item.title}
Channel: ${item.snippet?.channelTitle || item.channelTitle}
Link: https://youtube.com/watch?v=${item.id.videoId || item.id}
Published: ${new Date(item.snippet?.publishedAt || item.publishedAt).toLocaleString()}

PERFORMANCE:
- Viral Level: ${v.level} (Score: ${v.score})
- Views/Day: ${formatNumber(v.dailyViews)}
- Engagement: ${v.engagement}%
- Total Views: ${formatNumber(parseInt(stats.viewCount || 0))}
- Likes: ${formatNumber(parseInt(stats.likeCount || 0))}
- Comments: ${formatNumber(parseInt(stats.commentCount || 0))}
- Estimated Earnings: ${earnings.symbol}${formatNumber(earnings.local)} (${filters?.region || 'US'} rate)

SEARCH MATCH: ${((item.distance ?? 0.95) * 100).toFixed(0)}%

DESCRIPTION:
${item.snippet?.description || item.description || "No description found."}
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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 backdrop-blur-xl bg-black/60 animate-in fade-in duration-300">
      <div 
        className="bg-[#000000] border w-full max-w-4xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90dvh]"
        style={{ 
          borderColor: `rgba(${selectedVideo.dominantColor || '0, 112, 243'}, 0.3)`,
          boxShadow: `0 0 100px rgba(${selectedVideo.dominantColor || '0, 112, 243'}, 0.15)`,
        }}
      >
        <div className="relative h-40 md:h-64 shrink-0">
          <img src={selectedVideo.item.thumbnail || selectedVideo.item.snippet?.thumbnails?.high?.url || selectedVideo.item.snippet?.thumbnails?.medium?.url} className="w-full h-full object-cover" alt="" />
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
            <h2 className="text-lg md:text-2xl font-bold text-white line-clamp-1">{selectedVideo.item.title || selectedVideo.item.snippet?.title}</h2>
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
                    {parseInt(selectedVideo.item.statistics?.viewCount || 0) < 10000 ? (
                      <div className="text-4xl md:text-5xl font-black text-[#444444] tracking-tighter uppercase">
                        No Data
                      </div>
                    ) : (
                      <>
                        <div className="text-4xl md:text-5xl font-black text-[#00dfd8] tracking-tighter drop-shadow-[0_0_30px_rgba(0,223,216,0.3)]">
                        {earnings.symbol}{formatNumber(earnings.local)}
                        </div>
                        {(filters?.region && filters.region !== "US") && (
                            <div className="text-xs font-bold text-[#444444] mt-1">
                                ~ ${formatNumber(earnings.usd)} USD
                            </div>
                        )}
                      </>
                    )}
                </div>
                <p className="text-[10px] text-[#444444] uppercase font-black tracking-[0.2em]">Est. Earnings ({filters?.region || 'US'})</p>
                <div className="pt-4 border-t border-white/5 w-full">
                    <p className="text-[9px] text-[#666666] leading-relaxed uppercase tracking-widest">
                      {parseInt(selectedVideo.item.statistics?.viewCount || 0) < 10000 
                        ? "Data is statistically insignificant for videos under 10k views."
                        : `Rough guess based on ${filters?.region || 'US'} rates and current exchange.`}
                    </p>
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
                {(() => {
                  const stats = selectedVideo.item.statistics || {};
                  const views = parseInt(stats.viewCount || 0);
                  const publishedAt = new Date(selectedVideo.item.snippet?.publishedAt || selectedVideo.item.publishedAt).getTime();
                  const ageInDays = (Date.now() - publishedAt) / (1000 * 60 * 60 * 24);
                  
                  const dailyViews = selectedVideo.v?.dailyViews || 0;
                  
                  // NEW: Archive detection for older videos that have lost momentum
                  const isStagnantNewVideo = ageInDays <= 30 && views < 3000;
                  const isDeadArchive = ageInDays > 60 && dailyViews < 250;
                  const isLowSustainability = dailyViews < 250 || isStagnantNewVideo || isDeadArchive;
                  
                  // Calculate 30D projection
                  let est30DViews = 0;
                  // decayRate: 0 for dead archive (null growth), 0.7 for stagnant new, 0.92 for standard decay
                  const decayRate = isDeadArchive ? 0 : (isStagnantNewVideo ? 0.70 : 0.92); 
                  
                  if (isLowSustainability) {
                    if (isDeadArchive) {
                      est30DViews = 0;
                    } else {
                      for(let i=1; i<=30; i++) est30DViews += dailyViews * Math.pow(decayRate, i);
                    }
                  } else {
                    est30DViews = dailyViews * 30;
                  }

                  return (
                    <>
                      <div className="flex items-center justify-between mb-10 relative z-10">
                        <div>
                          <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">Growth Projection</h3>
                          <p className="text-[10px] text-[#666666] font-bold uppercase tracking-[0.2em]">
                            {isDeadArchive 
                              ? 'Archive State: Zero Growth Predicted'
                              : isStagnantNewVideo 
                                ? 'Critical Warning: Stagnant Momentum' 
                                : isLowSustainability 
                                  ? 'Sustainability Warning: Low Momentum' 
                                  : 'Predicted trajectory for the next 30 days'}
                          </p>
                        </div>
                        <div className="text-right">
                           <span className={`text-3xl font-black tracking-tighter ${isLowSustainability ? 'text-[#ff4b2b]' : 'text-[#00dfd8]'}`}>
                             +{formatNumber(Math.round(est30DViews))}
                           </span>
                           <p className="text-[9px] text-[#444444] font-black uppercase tracking-widest mt-1">Est. 30D Views</p>
                        </div>
                      </div>
                      
                      <div className="h-56 flex items-end gap-1 md:gap-2 relative z-10">
                         {[...Array(30)].map((_, i) => {
                            const baseHeight = 12;
                            let height = 0;
                            
                            if (isLowSustainability) {
                              if (isDeadArchive) {
                                height = baseHeight;
                              } else {
                                height = baseHeight + (Math.pow(decayRate, i) * 60);
                              }
                            } else {
                              const growth = (i / 29) * 80;
                              const randomBuffer = Math.sin(i * 0.8) * 5;
                              height = Math.max(10, baseHeight + growth + randomBuffer);
                            }

                            const barColor = isLowSustainability ? '255, 75, 43' : (selectedVideo.dominantColor || '0, 112, 243');
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
                                   Day {i+1}: +{formatNumber(Math.round(isDeadArchive ? 0 : (isLowSustainability ? Math.max(isStagnantNewVideo ? 1 : 0, dailyViews * Math.pow(decayRate, i)) : dailyViews)))}
                                 </div>
                              </div>
                            )
                         })}
                      </div>
                    </>
                  );
                })()}
                <div className="flex justify-between mt-8 text-[10px] font-black text-[#444444] uppercase tracking-[0.3em] border-t border-white/5 pt-6">
                   <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white/10"></div>Origin</span>
                   <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedVideo.v?.dailyViews < 250 ? '#ff4b2b' : `rgb(${selectedVideo.dominantColor || '0, 112, 243'})` }}></div>Velocity Target</span>
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
                    onClick={() => copyText('desc', selectedVideo.item.snippet?.description || selectedVideo.item.description || "")}
                    className={`text-[9px] font-bold px-2 py-1 rounded border transition-all flex items-center gap-1.5 ${
                      copyStates['desc'] ? 'bg-[#0070f3] border-[#0070f3] text-white' : 'border-white/10 text-[#666666] hover:text-white hover:border-white/20'
                    }`}
                  >
                    {copyStates['desc'] ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="bg-[#080808] border border-white/5 p-6 rounded-3xl flex-1 overflow-y-auto text-xs md:text-sm text-[#888888] leading-relaxed whitespace-pre-wrap custom-scrollbar font-medium">
                  {selectedVideo.item.snippet?.description || selectedVideo.item.description || "No description found."}
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-[#666666] mb-2 block">Channel</label>
                  <Link 
                    href={`/channels?channelId=${selectedVideo.item.snippet?.channelId || selectedVideo.item.channelId}`}
                    onClick={() => setSelectedVideo(null)}
                    className="text-lg font-black text-white truncate hover:text-[#0070f3] transition-colors flex items-center gap-2 group"
                  >
                    {selectedVideo.item.snippet?.channelTitle || selectedVideo.item.channelTitle}
                    <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </Link>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-[#666666] mb-2 block">Date</label>
                  <p className="text-sm font-black text-[#aaaaaa]">
                    {new Date(selectedVideo.item.snippet?.publishedAt || selectedVideo.item.publishedAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
                  </p>
                </div>

                {((selectedVideo.item.snippet?.tags || getHashtags(selectedVideo.item.snippet?.description || selectedVideo.item.description))).length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-[#666666] block">Tags</label>
                      <button 
                        onClick={() => {
                          const tags = selectedVideo.item.snippet?.tags || getHashtags(selectedVideo.item.snippet?.description || selectedVideo.item.description);
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
                      {(selectedVideo.item.snippet?.tags || getHashtags(selectedVideo.item.snippet?.description || selectedVideo.item.description)).slice(0, 20).map(tag => (
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
  );
}
