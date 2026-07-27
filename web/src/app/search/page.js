"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { calculateViralityScore } from "@/lib/ranking/virality";
import VideoCard from "../components/VideoCard";
import VideoDetailsModal from "../components/VideoDetailsModal";
import { Search, Zap, BarChart3, TrendingUp, Target, Users, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingToast } from "../components/dashboard/ui";

export default function SearchPage() {
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("query") || "");
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

  const runSearch = useCallback(async (q, currentFilters) => {
    if (!q) return;
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

    const params = new URLSearchParams({ q, ...currentFilters });
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
  }, []);

  /* Auto-search when ?query= is in the URL on mount */
  useEffect(() => {
    const q = searchParams.get("query");
    if (q) {
      setQuery(q);
      runSearch(q, filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    runSearch(query, filters);
  };

  const updateFilter = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFilters((prev) => {
      const updated = { ...prev, [name]: newValue };
      if (results && name === 'order') {
        const sorted = [...results].sort((a, b) => {
          if (newValue === 'virality') {
            return calculateViralityScore(b).score - calculateViralityScore(a).score;
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
    <div className="mx-auto min-h-full w-full min-w-0 max-w-full overflow-x-hidden bg-black pb-24 text-white selection:bg-geist-success">
      <VideoDetailsModal
        selectedVideo={selectedVideo}
        setSelectedVideo={setSelectedVideo}
        filters={filters}
        formatNumber={formatNumber}
      />

      <div className={`transition-all duration-500 ease-out ${hasSearched ? 'pt-0' : 'flex min-h-[55vh] flex-col justify-center pt-6 md:min-h-[50vh] md:pt-10'}`}>
        <section className={`z-[45] w-full min-w-0 max-w-full transition-all duration-500 ${hasSearched ? 'sticky top-0 border-b border-white/[0.06] bg-black/80 px-4 py-3 backdrop-blur-xl sm:px-6' : 'mx-auto max-w-2xl border-transparent px-4 sm:px-6'}`}>
          <form onSubmit={handleSearch} className={`relative group mx-auto w-full min-w-0 transition-all duration-500 ${hasSearched ? 'max-w-full md:max-w-[1600px]' : 'w-full'}`}>
            {!hasSearched && (
              <div className="mb-8 flex justify-center sm:mb-10" aria-hidden>
                <div className="h-[72px] w-[72px] rounded-full bg-gradient-to-tr from-geist-success via-[#00f0ff] to-geist-success animate-logo-gradient shadow-[0_0_32px_rgba(0,112,243,0.45)] sm:h-20 sm:w-20 sm:shadow-[0_0_40px_rgba(0,112,243,0.5)]" />
              </div>
            )}
            <div className="relative flex items-center overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950/60 transition-all duration-300 focus-within:border-white/20">
              {hasSearched && (
                <div className="relative z-10 shrink-0 pl-3.5 sm:pl-4" aria-hidden>
                  <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-geist-success via-[#00f0ff] to-geist-success animate-logo-gradient shadow-[0_0_12px_rgba(0,112,243,0.35)]" />
                </div>
              )}
              <input
                type="text"
                placeholder="Search a topic or keyword..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={`relative z-10 w-full bg-transparent py-3.5 text-sm font-medium text-white outline-none placeholder-zinc-600 sm:py-4 sm:text-base ${hasSearched ? 'px-3' : 'px-4 sm:px-5'}`}
              />
              <div className="relative z-10 flex items-center gap-2 pr-2">
                {hasSearched && (
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`rounded-xl p-2 transition-all ${showFilters ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-black transition-all hover:bg-zinc-200 active:scale-95 sm:px-5 sm:text-sm"
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
                <span className="text-[10px] font-bold uppercase tracking-wider text-accents-4 group-hover:text-white transition-colors">Stats</span>
              </label>
            </div>
          </motion.div>
        </section>

        <div className="mx-auto mt-12 w-full min-w-0 max-w-full px-4 md:max-w-[1600px] md:px-10">
          <AnimatePresence mode="wait">
            {results && results.length > 0 && showAnalysis && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-12 space-y-6"
              >
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                  {[
                    { label: 'Total views', value: formatNumber(results.reduce((acc, item) => acc + parseInt(item.statistics?.viewCount || 0), 0)), sub: 'All results', icon: BarChart3, tone: 'text-white' },
                    { label: 'Topic heat', value: results.length > 25 ? 'High' : 'Steady', sub: 'How busy this topic is', icon: TrendingUp, tone: 'text-[#00f0ff]' },
                    { label: 'Room to grow', value: `${((results.reduce((acc, item) => acc + calculateViralityScore(item).score, 0) / results.length) * (1 - (results.length / 100))).toFixed(0)}%`, sub: 'Chance for new videos', icon: Target, tone: 'text-emerald-400' },
                    { label: 'Average views', value: formatNumber(results.reduce((acc, item) => acc + parseInt(item.statistics?.viewCount || 0), 0) / results.length), sub: 'Per video', icon: Zap, tone: 'text-zinc-200' },
                    { label: 'Engagement', value: `${(results.reduce((acc, item) => acc + parseFloat(calculateViralityScore(item).engagement), 0) / results.length).toFixed(2)}%`, sub: 'Likes + comments', icon: TrendingUp, tone: 'text-orange-400' },
                    { label: 'Channels', value: new Set(results.map(i => i.snippet.channelId || i.snippet.channelTitle)).size, sub: 'Different creators', icon: Users, tone: 'text-zinc-200' },
                  ].map((stat, i) => (
                    <div key={i} className="rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-600">{stat.label}</p>
                          <p className={`mt-1.5 font-display text-xl tracking-tight sm:text-2xl ${stat.tone}`}>{stat.value}</p>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600">{stat.sub}</p>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-black/40">
                          <stat.icon className={`h-3.5 w-3.5 ${stat.tone}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <motion.div layout className="grid grid-cols-1 gap-6">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center mt-12">
              <button
                disabled={loadingMore}
                className="bg-white/5 hover:bg-white/10 text-white font-bold text-xs tracking-wider uppercase px-10 py-3.5 rounded-xl border border-white/10 transition-all flex items-center gap-3 disabled:opacity-50"
              >
                Load More <Zap className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <LoadingToast show={loading} label={loadingText} progress={loadingStage} />
    </div>
  );
}
