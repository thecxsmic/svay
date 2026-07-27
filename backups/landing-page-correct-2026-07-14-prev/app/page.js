"use client";

import { useState, useEffect } from "react";
import { calculateViralityScore } from "@/lib/ranking/virality";
import VideoCard from "./components/VideoCard";
import VideoDetailsModal from "./components/VideoDetailsModal";
import { Search, Zap, BarChart3, TrendingUp, Target, LayoutDashboard, Users, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [query, setQuery] = useState("");
  const [hoverInfo, setHoverInfo] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
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
  });
  const [results, setResults] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [loadingStage, setLoadingStage] = useState(0);
  const [loadingText, setLoadingText] = useState("Searching...");

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoading(true);
    setHasSearched(true);
    setLoadingStage(10);
    setLoadingText("Connecting...");
    setError(null);
    
    const progressInterval = setInterval(() => {
      setLoadingStage(prev => {
        if (prev < 90) {
          const next = prev + Math.random() * 15;
          if (next > 40 && next < 70) setLoadingText("Analyzing...");
          if (next > 70) setLoadingText("Finalizing...");
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
      setLoadingText("Ready.");
      setTimeout(() => {
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

  const updateFilter = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    
    setFilters((prev) => {
      const updated = { ...prev, [name]: newValue };
      if (results && name === 'order') {
        const sorted = [...results].sort((a, b) => {
          if (newValue === 'virality') {
            const vA = calculateViralityScore(a).score;
            const vB = calculateViralityScore(b).score;
            return vB - vA;
          }
          if (newValue === 'date') return new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt);
          if (newValue === 'viewCount') return parseInt(b.statistics?.viewCount || 0) - parseInt(a.statistics?.viewCount || 0);
          return 0;
        });
        setResults(sorted);
      }
      return updated;
    });
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  return (
    <div className="min-h-full bg-black text-white selection:bg-geist-success pb-24">
      <VideoDetailsModal 
        selectedVideo={selectedVideo} 
        setSelectedVideo={setSelectedVideo} 
        filters={filters} 
        formatNumber={formatNumber} 
      />

      <div className={`transition-all duration-700 ease-in-out ${hasSearched ? 'pt-0' : 'pt-20 md:pt-32'}`}>
        <header className={`max-w-5xl mx-auto text-center transition-all duration-700 ${hasSearched ? 'opacity-0 h-0 overflow-hidden mb-0' : 'opacity-100 mb-16'}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-geist-success" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-accents-4">Dashboard</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-6xl tracking-tight mb-4 text-white uppercase"
          >
            Content Insights
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-accents-5 text-base md:text-lg max-w-2xl mx-auto font-medium"
          >
            Discover high-performing content and track market trends in real-time.
          </motion.p>
        </header>

        <section className={`sticky top-0 z-[45] transition-all duration-700 border-b ${hasSearched ? 'w-full bg-black/80 backdrop-blur-md border-white/5 py-4 px-6 md:px-10' : 'max-w-2xl mx-auto px-6 border-transparent'}`}>
          <form onSubmit={handleSearch} className={`relative group mx-auto transition-all duration-700 ${hasSearched ? 'max-w-[1600px]' : 'w-full'}`}>
            <div className="relative flex items-center bg-black border border-white/10 rounded-2xl overflow-hidden focus-within:border-white/20 transition-all duration-300 shadow-2xl">
              <div className="absolute inset-0 opacity-[0.03] group-focus-within:opacity-[0.08] transition-opacity bg-gradient-to-r from-geist-success via-[#00f0ff] to-geist-success animate-logo-gradient pointer-events-none" />
              <div className="pl-6 text-accents-4 shrink-0 relative z-10"><Search className="w-5 h-5" /></div>
              <input 
                type="text" 
                placeholder="Search keywords or topics..." 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                className="w-full py-4 px-4 bg-transparent outline-none text-base font-medium placeholder-accents-3 text-white relative z-10" 
              />
              <div className="flex items-center gap-2 pr-2 relative z-10">
                {hasSearched && (
                  <button 
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-xl transition-all ${showFilters ? 'bg-white/10 text-white' : 'text-accents-4 hover:text-white'}`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="bg-white text-black px-6 py-2 rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all text-sm"
                >
                  Search
                </button>
              </div>
            </div>
            <AnimatePresence>
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute -bottom-1 left-4 right-4 h-0.5 bg-white/5 rounded-full overflow-hidden"
                >
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${loadingStage}%` }}
                    className="h-full bg-gradient-to-r from-geist-success to-[#00f0ff] animate-logo-gradient"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <motion.div 
            initial={false}
            animate={{ 
              opacity: (!hasSearched || showFilters) ? 1 : 0, 
              height: (!hasSearched || showFilters) ? 'auto' : 0,
              marginTop: (!hasSearched || showFilters) ? (hasSearched ? 16 : 32) : 0,
              maxWidth: hasSearched ? '1600px' : 'none'
            }}
            className={`flex flex-wrap justify-center gap-3 overflow-hidden ${hasSearched ? 'mx-auto' : ''}`}
          >
             {['region', 'order', 'uploadDate', 'duration'].map((filter) => (
                <div key={filter} className="w-[calc(50%-0.4rem)] md:w-auto">
                   <select 
                    name={filter} 
                    value={filters[filter]} 
                    onChange={updateFilter} 
                    className="w-full bg-black border border-white/10 hover:border-white/20 rounded-xl px-4 py-2 text-[11px] font-bold uppercase tracking-wider outline-none transition-all text-accents-4 hover:text-white cursor-pointer appearance-none"
                   >
                      {filter === 'region' && <><option value="US">USA</option><option value="GB">UK</option><option value="IN">India</option></>}
                      {filter === 'order' && <><option value="relevance">Relevance</option><option value="date">Newest</option><option value="viewCount">Views</option><option value="virality">Growth</option></>}
                      {filter === 'uploadDate' && <><option value="">Anytime</option><option value="today">Today</option><option value="week">Weekly</option><option value="month">Monthly</option></>}
                      {filter === 'duration' && <><option value="">Any Length</option><option value="short">Short</option><option value="medium">Medium</option><option value="long">Long</option></>}
                   </select>
                </div>
             ))}
             <div className="flex gap-6 items-center md:pl-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={showAnalysis} onChange={(e) => setShowAnalysis(e.target.checked)} className="sr-only" />
                  <div className={`w-4 h-4 rounded border transition-all ${showAnalysis ? 'bg-white border-white' : 'border-white/20 group-hover:border-white/40'}`}>
                    {showAnalysis && <Search className="w-3 h-3 text-black m-auto" />}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accents-4 group-hover:text-white transition-colors">Insights</span>
                </label>
             </div>
          </motion.div>
        </section>

        <div className="max-w-[1600px] mx-auto px-6 md:px-10 mt-12">
          <AnimatePresence mode="wait">
            {results && results.length > 0 && showAnalysis && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-12 space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Market Volume', value: formatNumber(results.reduce((acc, item) => acc + parseInt(item.statistics?.viewCount || 0), 0)), sub: 'Total views in niche', icon: BarChart3, color: 'text-white' },
                    { label: 'Growth Trend', value: results.length > 25 ? 'High' : 'Steady', sub: 'Content momentum', icon: TrendingUp, color: 'text-[#00f0ff]' },
                    { label: 'Opportunity', value: `${((results.reduce((acc, item) => acc + calculateViralityScore(item).score, 0) / results.length) * (1 - (results.length / 100))).toFixed(0)}%`, sub: 'Viral potential', icon: Target, color: 'text-geist-success' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <stat.icon className="w-12 h-12" />
                      </div>
                      <p className="text-[10px] font-bold text-accents-4 uppercase tracking-wider mb-2">{stat.label}</p>
                      <div className={`text-3xl font-bold tracking-tight mb-1 ${stat.color}`}>{stat.value}</div>
                      <p className="text-[10px] text-accents-3 font-medium">{stat.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl flex items-center justify-between group">
                    <div>
                      <p className="text-[10px] font-bold text-accents-4 uppercase tracking-wider mb-1">Avg Performance</p>
                      <div className="text-xl font-bold text-white">{formatNumber(results.reduce((acc, item) => acc + parseInt(item.statistics?.viewCount || 0), 0) / results.length)}</div>
                    </div>
                    <div className="flex items-end gap-1 h-8 opacity-40 group-hover:opacity-100 transition-opacity">
                      {[0.3, 0.6, 0.4, 0.8, 0.5].map((h, i) => <div key={i} className="w-1 bg-geist-success rounded-t-sm" style={{ height: `${h * 100}%` }}></div>)}
                    </div>
                  </div>

                  <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl flex items-center justify-between group">
                    <div>
                      <p className="text-[10px] font-bold text-accents-4 uppercase tracking-wider mb-1">Niche Engagement</p>
                      <div className="text-xl font-bold text-white">{(results.reduce((acc, item) => acc + parseFloat(calculateViralityScore(item).engagement), 0) / results.length).toFixed(2)}%</div>
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-white/10 flex items-center justify-center relative">
                      <div className="absolute inset-0 border-2 border-[#00f0ff] rounded-full border-t-transparent group-hover:rotate-180 transition-transform duration-1000"></div>
                      <Zap className="w-3 h-3 text-[#00f0ff]" />
                    </div>
                  </div>

                  <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl flex items-center justify-between group">
                    <div>
                      <p className="text-[10px] font-bold text-accents-4 uppercase tracking-wider mb-1">Unique Channels</p>
                      <div className="text-xl font-bold text-white">{new Set(results.map(i => i.snippet.channelId || i.snippet.channelTitle)).size}</div>
                    </div>
                    <div className="flex -space-x-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-white/10 border border-black flex items-center justify-center text-[8px] font-bold text-white uppercase">
                          <Users className="w-3 h-3" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <motion.div 
            layout
            className="grid grid-cols-1 gap-6"
          >
            {results?.map((item, i) => (
              <motion.div
                key={item.id?.videoId || item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <VideoCard 
                  item={item} 
                  setHoverInfo={setHoverInfo} 
                  setSelectedVideo={setSelectedVideo} 
                  formatNumber={formatNumber} 
                />
              </motion.div>
            ))}
          </motion.div>

          {nextPageToken && results && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center mt-12"
            >
              <button 
                onClick={() => {}} // loadMore would be wired here
                disabled={loadingMore}
                className="bg-white/5 hover:bg-white/10 text-white font-bold text-xs tracking-wider uppercase px-10 py-3.5 rounded-xl border border-white/10 transition-all flex items-center gap-3 disabled:opacity-50"
              >
                Load More
                <Zap className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 z-[100]"
          >
            <div className="flex items-center gap-3 bg-black border border-white/10 px-5 py-3 rounded-full shadow-2xl backdrop-blur-md">
              <div className="w-3 h-3 rounded-full bg-geist-success animate-pulse" />
              <span className="text-[10px] font-bold text-accents-4 uppercase tracking-wider">{loadingText}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
