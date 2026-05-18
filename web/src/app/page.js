"use client";

import { useState, useEffect } from "react";
import { calculateViralityScore } from "@/lib/ranking/virality";
import VideoCard from "./components/VideoCard";
import VideoDetailsModal from "./components/VideoDetailsModal";
import Link from "next/link";

export default function Home() {
  const [query, setQuery] = useState("");
  const [hoverInfo, setHoverInfo] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
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
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [showMarketAnalysis, setShowMarketAnalysis] = useState(true);
  const [loadingStage, setLoadingStage] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing Scan...");

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
      setTimeout(() => {
        // Deduplicate initial search results
        const seen = new Set();
        const uniqueItems = (data.items || []).filter(item => {
          const id = item.id?.videoId || item.id;
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        setResults(uniqueItems);
        setNextPageToken(data.nextPageToken);
      }, 300);
    } catch (err) {
      setError(err.message);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setLoading(false), 800);
    }
  };

  const loadMore = async () => {
    if (!nextPageToken || loadingMore) return;
    
    setLoadingMore(true);
    const params = new URLSearchParams({ q: query, ...filters, pageToken: nextPageToken });
    try {
      const res = await fetch(`/api/youtube/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to load more");
      
      setResults(prev => {
        const combined = [...(prev || []), ...(data.items || [])];
        const seen = new Set();
        return combined.filter(item => {
          const id = item.id?.videoId || item.id;
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        });
      });
      setNextPageToken(data.nextPageToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
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
    <div className="min-h-full bg-black text-[#ededed] font-sans selection:bg-[#0070f3] selection:text-white pb-24">
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
      <VideoDetailsModal 
        selectedVideo={selectedVideo} 
        setSelectedVideo={setSelectedVideo} 
        filters={filters} 
        formatNumber={formatNumber} 
      />

      <main className="max-w-6xl mx-auto px-8 py-12">
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
                  className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-[#0070f3] to-[#00dfd8] transition-all duration-500 ease-out"
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

        {nextPageToken && (
          <div className="flex justify-center mt-12">
            <button 
              onClick={loadMore}
              disabled={loadingMore}
              className="bg-white/5 hover:bg-white/10 text-white font-black text-[10px] tracking-[0.3em] uppercase px-12 py-4 rounded-2xl border border-white/10 transition-all flex items-center gap-4 group disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>Load More Videos</span>
                  <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                </>
              )}
            </button>
          </div>
        )}
      </main>

      {/* Minimal Vercel-like Loading (Bottom Right) */}
      {loading && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-3 bg-black/80 backdrop-blur-xl border border-white/5 px-4 py-2.5 rounded-full shadow-2xl">
            <div className="w-3 h-3 relative opacity-40">
              <div className="absolute inset-0 border border-white/20 rounded-full"></div>
              <div className="absolute inset-0 border border-white rounded-full border-t-transparent animate-spin"></div>
            </div>
            <span className="text-[9px] font-bold text-[#444444] uppercase tracking-[0.3em]">{loadingText}</span>
            <span className="text-[9px] font-bold text-[#222222] tabular-nums">{Math.round(loadingStage)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
