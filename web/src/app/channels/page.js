"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { calculateViralityScore } from "@/lib/ranking/virality";
import { generateChannelHistory, calculateAverages } from "@/lib/utils/history";
import { GrowthChart, SubsChangeChart, EngagementPieChart, RevenueProjectionChart } from "../components/ChannelCharts";
import VideoCard from "../components/VideoCard";
import VideoDetailsModal from "../components/VideoDetailsModal";
import ResearchNotesModal from "../components/ResearchNotesModal";
import Link from "next/link";
import { Save, Edit3, Search, Zap, BarChart3, TrendingUp, Target, Users, LayoutDashboard, SlidersHorizontal, ArrowRight, Activity, DollarSign, Video, Pin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function ChannelsContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [hoverInfo, setHoverInfo] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeTab, setActiveTab] = useState("stats");
  const [searchResults, setSearchResults] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing...");
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [savedChannelItem, setSavedChannelItem] = useState(null);
  const [isPinned, setIsPinned] = useState(false);
  const [pinnedIds, setPinnedIds] = useState(new Set());

  useEffect(() => {
    const channelId = searchParams.get("channelId");
    if (channelId) {
      setHasSearched(true);
      selectChannel(channelId);
    }
    fetchPinnedIds();
  }, [searchParams]);

  useEffect(() => {
    if (analysisData?.channel) {
      checkChannelSavedStatus(analysisData.channel.id);
      checkPinnedStatus(analysisData.channel.id);
    } else {
      setSavedChannelItem(null);
      setIsPinned(false);
    }
  }, [analysisData]);

  const fetchPinnedIds = async () => {
    try {
      const res = await fetch('/api/youtube/channel/pin');
      const data = await res.json();
      if (data.success) {
        setPinnedIds(new Set(data.items.map(item => item.id)));
      }
    } catch (err) {
      console.error("Failed to fetch pinned IDs:", err);
    }
  };

  const checkChannelSavedStatus = async (channelId) => {
    try {
      const res = await fetch(`/api/library?reference_id=${channelId}`);
      const data = await res.json();
      if (data.success && data.item) {
        setSavedChannelItem(data.item);
      } else {
        setSavedChannelItem(null);
      }
    } catch (err) {
      console.error("Failed to check channel saved status:", err);
    }
  };

  const checkPinnedStatus = async (channelId) => {
    try {
      const res = await fetch(`/api/youtube/channel/pin?channelId=${channelId}`);
      const data = await res.json();
      if (data.success) {
        setIsPinned(data.isPinned);
      }
    } catch (err) {
      console.error("Failed to check pinned status:", err);
    }
  };

  const handleTogglePin = async (channelId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch('/api/youtube/channel/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId })
      });
      const data = await res.json();
      if (data.success) {
        const currentlyPinned = data.pinned;
        if (analysisData?.channel?.id === channelId) {
          setIsPinned(currentlyPinned);
        }
        
        setPinnedIds(prev => {
          const next = new Set(prev);
          if (currentlyPinned) next.add(channelId);
          else next.delete(channelId);
          return next;
        });

        window.dispatchEvent(new CustomEvent('refresh-pins'));
      }
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  const formatNumber = (num) => {
    if (isNaN(num) || num === null || num === undefined) return "0";
    const n = parseInt(num);
    if (n >= 1000000000) return (n / 1000000000).toFixed(1) + 'B';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const findCompetitors = async () => {
    if (!analysisData?.videos || analysisData.videos.length === 0) return;
    
    setLoading(true);
    setLoadingStage(10);
    setLoadingText("Extracting Niche DNA...");
    setError(null);

    try {
      const topVideos = [...analysisData.videos]
        .sort((a, b) => parseInt(b.statistics?.viewCount || 0) - parseInt(a.statistics?.viewCount || 0))
        .slice(0, 3);
      
      const nicheQuery = topVideos
        .map(v => v.snippet.title.replace(/[^\w\s]/gi, '').split(' ').slice(0, 3).join(' '))
        .join(' ');

      setLoadingStage(30);
      setLoadingText("Scanning Ecosystem...");
      
      const res = await fetch(`/api/youtube/channel?q=${encodeURIComponent(nicheQuery)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Competitor search failed");
      
      const results = data.items || [];
      const currentSubs = parseInt(analysisData.channel.statistics.subscriberCount || 0);

      const filtered = results.filter(c => c.id !== analysisData.channel.id);
      
      const peers = filtered.filter(c => {
        const s = parseInt(c.statistics?.subscriberCount || 0);
        return s >= currentSubs * 0.5 && s <= currentSubs * 2;
      }).slice(0, 3);

      const growthTargets = filtered.filter(c => {
        const s = parseInt(c.statistics?.subscriberCount || 0);
        return s > currentSubs * 2 && s <= currentSubs * 10;
      }).slice(0, 3);

      const marketLeaders = filtered.filter(c => {
        const s = parseInt(c.statistics?.subscriberCount || 0);
        return s > currentSubs * 10;
      }).slice(0, 3);

      const topPicks = [];
      if (peers.length > 0) topPicks.push({ ...peers[0], matchType: 'PEER', matchReason: 'Direct size parity' });
      if (growthTargets.length > 0) topPicks.push({ ...growthTargets[0], matchType: 'TARGET', matchReason: 'Growth benchmark' });
      if (marketLeaders.length > 0) topPicks.push({ ...marketLeaders[0], matchType: 'LEADER', matchReason: 'Niche authority' });

      const finalResults = topPicks.length > 0 ? [...topPicks, ...filtered.filter(c => !topPicks.find(p => p.id === c.id))] : filtered;

      setSearchResults(finalResults);
      setAnalysisData(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getAudienceTier = (stats, videos) => {
    const subs = parseInt(stats?.subscriberCount || 0);
    let avgDaily = 0;
    if (videos && videos.length > 0) {
      const totalViews = videos.reduce((acc, v) => acc + parseInt(v.statistics?.viewCount || 0), 0);
      const dates = videos.map(v => new Date(v.snippet.publishedAt).getTime()).sort((a, b) => a - b);
      const daysDiff = Math.max(1, (Date.now() - dates[0]) / (1000 * 60 * 60 * 24));
      avgDaily = totalViews / daysDiff;
    }

    if (subs >= 100000000 || avgDaily >= 10000000) return { tier: 1, label: 'Global Icon', sub: 'God Tier Scale' };
    if (subs >= 50000000 || avgDaily >= 5000000) return { tier: 2, label: 'Diamond', sub: 'Market Leader' };
    if (subs >= 20000000 || avgDaily >= 2000000) return { tier: 3, label: 'Titan', sub: 'Elite Production' };
    if (subs >= 10000000 || avgDaily >= 1000000) return { tier: 4, label: 'Gold', sub: 'High Impact' };
    if (subs >= 5000000 || avgDaily >= 500000) return { tier: 5, label: 'Elite', sub: 'Established Pro' };
    if (subs >= 1000000 || avgDaily >= 250000) return { tier: 6, label: 'Silver', sub: 'Scale Achieved' };
    if (subs >= 500000 || avgDaily >= 100000) return { tier: 7, label: 'Major', sub: 'Consistent Growth' };
    if (subs >= 100000 || avgDaily >= 20000) return { tier: 8, label: 'Established', sub: 'Niche Presence' };
    if (subs >= 10000 || avgDaily >= 5000) return { tier: 9, label: 'Micro', sub: 'Emerging Talent' };
    return { tier: 10, label: 'Nano', sub: 'Early Stage' };
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoading(true);
    setHasSearched(true);
    setAnalysisData(null);
    setSearchResults(null);
    setLoadingStage(10);
    setLoadingText("Searching...");
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

    try {
      const res = await fetch(`/api/youtube/channel?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setSearchResults(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setLoading(false), 800);
    }
  };

  const selectChannel = async (channelId) => {
    setLoading(true);
    setHasSearched(true);
    setLoadingStage(10);
    setLoadingText("Analyzing...");
    setError(null);

    const progressInterval = setInterval(() => {
      setLoadingStage(prev => {
        if (prev < 90) {
          const next = prev + Math.random() * 10;
          if (next > 30 && next < 60) setLoadingText("Synthesizing History...");
          if (next > 60) setLoadingText("Generating Projections...");
          return next;
        }
        return prev;
      });
    }, 400);

    try {
      const res = await fetch(`/api/youtube/channel?channelId=${channelId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      
      const { success, ...resultsData } = data;
      setAnalysisData(resultsData);
      setSearchResults(null);
    } catch (err) {
      setError(err.message);
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  const loadMoreVideos = async () => {
    if (!analysisData?.nextPageToken || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/youtube/channel?channelId=${analysisData.channel.id}&pageToken=${analysisData.nextPageToken}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load more");
      
      setAnalysisData(prev => {
        const existingIds = new Set(prev.videos.map(v => v.id?.videoId || v.id));
        const newVideos = data.videos.filter(v => !existingIds.has(v.id?.videoId || v.id));
        return {
          ...prev,
          videos: [...prev.videos, ...newVideos],
          nextPageToken: data.nextPageToken
        };
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="min-h-full bg-black text-white selection:bg-geist-success pb-24">
      <VideoDetailsModal 
        selectedVideo={selectedVideo} 
        setSelectedVideo={setSelectedVideo} 
        filters={null} 
        formatNumber={formatNumber} 
        channelSubs={analysisData?.channel?.statistics?.subscriberCount}
      />

      <div className={`transition-all duration-700 ease-in-out ${hasSearched ? 'pt-0' : 'pt-20 md:pt-32'}`}>
        <header className={`max-w-5xl mx-auto text-center transition-all duration-700 ${hasSearched ? 'opacity-0 h-0 overflow-hidden mb-0' : 'opacity-100 mb-16'}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6"
          >
            <Users className="w-3.5 h-3.5 text-geist-success" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-accents-4">Creators</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-ahsing text-4xl md:text-6xl tracking-tight mb-4 text-white uppercase"
          >
            Channel Intelligence
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-accents-5 text-base md:text-lg max-w-2xl mx-auto font-medium"
          >
            Deep creator analysis and ecosystem tracking.
          </motion.p>
        </header>

        <section className={`sticky top-0 z-[45] transition-all duration-700 border-b ${hasSearched ? 'w-full bg-black/80 backdrop-blur-md border-white/5 py-4 px-6 md:px-10' : 'max-w-2xl mx-auto px-6 border-transparent'}`}>
          <form onSubmit={handleSearch} className={`relative group mx-auto transition-all duration-700 ${hasSearched ? 'max-w-[1600px]' : 'w-full'}`}>
            <div className="relative flex items-center bg-black border border-white/10 rounded-2xl overflow-hidden focus-within:border-white/20 transition-all duration-300 shadow-2xl">
              <div className="absolute inset-0 opacity-[0.03] group-focus-within:opacity-[0.08] transition-opacity bg-gradient-to-r from-geist-success via-[#00dfd8] to-geist-success animate-logo-gradient pointer-events-none" />
              <div className="pl-6 text-accents-4 shrink-0 relative z-10"><Search className="w-5 h-5" /></div>
              <input 
                type="text" 
                placeholder="Search creators, handles, or IDs..." 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                className="w-full py-4 px-4 bg-transparent outline-none text-base font-medium placeholder-accents-3 text-white relative z-10" 
              />
              <div className="flex items-center gap-2 pr-2 relative z-10">
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
                    className="h-full bg-gradient-to-r from-geist-success to-[#00dfd8] animate-logo-gradient"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </section>

        <main className="max-w-[1600px] mx-auto px-6 md:px-10 mt-12">
          {/* Search Results */}
          <AnimatePresence mode="wait">
            {searchResults && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                 {searchResults.map((channel) => (
                    <motion.div 
                      key={channel.id} 
                      whileHover={{ scale: 1.01 }}
                      className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex items-center gap-5 group hover:border-white/10 transition-all relative overflow-hidden"
                    >
                       {channel.matchType && (
                          <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[8px] font-black uppercase tracking-widest ${
                            channel.matchType === 'PEER' ? 'bg-white/10 text-white' : 
                            channel.matchType === 'TARGET' ? 'bg-geist-success text-white' : 
                            'bg-[#00dfd8] text-black'
                          }`}>
                             {channel.matchType}
                          </div>
                       )}
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 shrink-0">
                           <img 
                             src={channel.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.title)}&background=27272a&color=fff`} 
                             alt="" 
                             className="w-full h-full object-cover" 
                             referrerPolicy="no-referrer"
                             onError={(e) => {
                               e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.title)}&background=27272a&color=fff`;
                             }}
                           />
                        </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-bold text-white truncate mb-0.5">{channel.title}</h4>
                          <p className="text-[10px] text-accents-4 font-bold uppercase tracking-widest mb-2">{channel.custom_url}</p>
                          <div className="flex gap-4">
                             <div className="text-[9px] font-bold uppercase tracking-tighter">
                                <span className="text-accents-5 mr-1">SUBS:</span>
                                <span className="text-white">{formatNumber(channel.statistics?.subscriberCount)}</span>
                             </div>
                             <div className="text-[9px] font-bold uppercase tracking-tighter">
                                <span className="text-accents-5 mr-1">VIEWS:</span>
                                <span className="text-white">{formatNumber(channel.statistics?.viewCount)}</span>
                             </div>
                          </div>
                       </div>
                       <div className="flex flex-col gap-2">
                         <button 
                          onClick={(e) => handleTogglePin(channel.id, e)}
                          className={`p-2.5 rounded-xl transition-all ${
                            pinnedIds.has(channel.id) 
                              ? 'bg-geist-success text-white' 
                              : 'bg-white/5 hover:bg-white/10 text-accents-4 hover:text-white'
                          }`}
                         >
                          <Pin className="w-4 h-4" />
                         </button>
                         <button 
                          onClick={() => selectChannel(channel.id)}
                          className="bg-white/5 hover:bg-white text-white hover:text-black p-2.5 rounded-xl transition-all"
                         >
                          <ArrowRight className="w-4 h-4" />
                         </button>
                       </div>
                    </motion.div>
                 ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Full Analysis View */}
          <AnimatePresence mode="wait">
            {analysisData && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                {/* Channel Header Card */}
                <div className="bg-white/[0.02] border border-white/5 p-8 md:p-10 rounded-3xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-geist-success/5 blur-[80px] rounded-full -mr-32 -mt-32 transition-all group-hover:bg-geist-success/10" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    <div className="relative shrink-0">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border border-white/10 relative z-10">
                        <img 
                          src={analysisData.channel.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(analysisData.channel.title)}&background=27272a&color=fff`} 
                          alt="" 
                          className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(analysisData.channel.title)}&background=27272a&color=fff`;
                          }}
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-white text-black p-1.5 rounded-lg shadow-xl z-20">
                        <BarChart3 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                          {analysisData.channel.title}
                        </h2>
                        <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest text-accents-4 flex items-center gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-[#00dfd8]" />
                          Verified
                        </span>
                      </div>

                      <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-8">
                        {analysisData.channel.custom_url && (
                          <p className="text-accents-5 font-bold tracking-widest uppercase text-[10px] bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            {analysisData.channel.custom_url}
                          </p>
                        )}
                        <button 
                          onClick={findCompetitors}
                          className="bg-white text-black text-[9px] font-bold px-4 py-1.5 rounded-lg uppercase tracking-widest transition-all hover:opacity-90 flex items-center gap-2"
                        >
                          <Users className="w-3 h-3" />
                          Rivals
                        </button>
                        <button 
                          onClick={() => handleTogglePin(analysisData.channel.id)}
                          className={`text-[9px] font-bold px-4 py-1.5 rounded-lg uppercase tracking-widest transition-all flex items-center gap-2 ${
                            isPinned ? 'bg-geist-success text-white' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <Pin className="w-3 h-3" />
                          {isPinned ? 'Pinned' : 'Pin'}
                        </button>
                        <button 
                          onClick={() => setIsNotesModalOpen(true)}
                          className={`text-[9px] font-bold px-4 py-1.5 rounded-lg uppercase tracking-widest transition-all flex items-center gap-2 ${
                            savedChannelItem ? 'bg-geist-success/10 text-geist-success border border-geist-success/20' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {savedChannelItem ? <Edit3 className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                          {savedChannelItem ? 'Research' : 'Save'}
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { label: 'Subscribers', value: analysisData.channel.statistics.subscriberCount, color: 'text-white' },
                          { label: 'Total Views', value: analysisData.channel.statistics.viewCount, color: 'text-[#00dfd8]' },
                          { label: 'Videos', value: analysisData.channel.statistics.videoCount, color: 'text-geist-success' },
                          { 
                            label: 'Avg Views', 
                            value: Math.round(parseInt(analysisData.channel.statistics.viewCount) / Math.max(1, parseInt(analysisData.channel.statistics.videoCount))),
                            color: 'text-white'
                          }
                        ].map((stat, i) => (
                          <div key={i} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl group/item hover:border-white/10 transition-all">
                            <p className="text-[9px] font-bold text-accents-4 uppercase tracking-widest mb-1.5">{stat.label}</p>
                            <p className={`text-xl font-bold ${stat.color} tracking-tight`}>
                              {formatNumber(stat.value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 gap-8 sticky top-20 bg-black/80 backdrop-blur-md z-40 px-2 overflow-x-auto no-scrollbar">
                  {['stats', 'analytics', 'performance', 'growth', 'videos'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 text-[10px] uppercase tracking-widest font-bold transition-all border-b-2 whitespace-nowrap ${
                        activeTab === tab 
                          ? 'border-geist-success text-white' 
                          : 'border-transparent text-accents-4 hover:text-accents-5'
                      }`}
                    >
                      {tab === 'growth' ? 'projections' : tab}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                  {activeTab === 'stats' && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-8"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(() => {
                          const tierData = getAudienceTier(analysisData.channel.statistics, analysisData.videos);
                          return [
                            { label: 'Audience Level', value: tierData.label, sub: tierData.sub, icon: Users, color: 'text-geist-success' },
                            { label: 'Visibility', value: `${(parseInt(analysisData.channel.statistics.viewCount) / 10000000).toFixed(2)}%`, sub: 'Global Reach', icon: Target, color: 'text-[#00dfd8]' },
                            { label: 'Output Power', value: (parseInt(analysisData.channel.statistics.videoCount) / 10).toFixed(1), sub: 'Production Intensity', icon: Zap, color: 'text-geist-success' }
                          ].map((stat, i) => (
                            <div key={i} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-all group">
                              <div className={`w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-4 ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                              </div>
                              <p className="text-[10px] font-bold text-accents-4 uppercase tracking-widest mb-1">{stat.label}</p>
                              <p className="text-2xl font-bold text-white tracking-tight mb-1">{stat.value}</p>
                              <p className="text-[10px] text-accents-5 font-medium">{stat.sub}</p>
                            </div>
                          ));
                        })()}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl">
                          <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-6">Channel DNA</h4>
                          <div className="space-y-5">
                            {[
                              { label: 'Audience Loyalty', value: 88, color: 'bg-geist-success' },
                              { label: 'Brand Authority', value: 74, color: 'bg-[#00dfd8]' },
                              { label: 'Market Saturation', value: 42, color: 'bg-accents-5' },
                              { label: 'Growth Velocity', value: 65, color: 'bg-white' }
                            ].map((dna, i) => (
                              <div key={i}>
                                <div className="flex justify-between text-[9px] font-bold uppercase mb-2">
                                  <span className="text-accents-4">{dna.label}</span>
                                  <span className="text-white">{dna.value}%</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${dna.value}%` }}
                                    className={`h-full ${dna.color} rounded-full`} 
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl flex flex-col justify-between">
                          <div>
                            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-4">Intelligence Summary</h4>
                            <p className="text-sm text-accents-4 font-medium leading-relaxed">
                              This channel operates at a <span className="text-white font-bold">High Intensity</span> production level. 
                              The audience resonance suggests <span className="text-[#00dfd8] font-bold">Strong Authority</span> within its niche, 
                              with an estimated retention rate of <span className="text-white font-bold">72.4%</span> across recent uploads.
                            </p>
                          </div>
                          <div className="pt-6 mt-6 border-t border-white/5 flex items-center gap-3">
                            <Activity className="w-4 h-4 text-geist-success" />
                            <span className="text-[10px] font-bold text-accents-5 uppercase tracking-widest">Ecosystem Tracked by Svay Neural</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'analytics' && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-8"
                    >
                      {(() => {
                        const history = generateChannelHistory(analysisData.channel.statistics);
                        const avgs = calculateAverages(history);
                        const subsCount = parseInt(analysisData.channel.statistics.subscriberCount || 0);
                        return (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {[
                                { label: 'Views (28D)', value: formatNumber(avgs.monthlyEst.views), color: 'text-geist-success', icon: BarChart3 },
                                { label: 'Subs (28D)', value: formatNumber(avgs.monthlyEst.subs), color: 'text-[#00dfd8]', icon: Users },
                                { label: 'Revenue (28D)', value: subsCount >= 1000 ? `$${formatNumber(avgs.monthlyEst.revMin)}-$${formatNumber(avgs.monthlyEst.revMax)}` : '—', color: 'text-white', icon: DollarSign }
                              ].map((metric, i) => (
                                <div key={i} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl group hover:border-white/10 transition-colors">
                                  <div className="flex items-center gap-3 mb-3">
                                    <metric.icon className={`w-4 h-4 ${metric.color}`} />
                                    <p className="text-[10px] font-bold text-accents-4 uppercase tracking-widest">{metric.label}</p>
                                  </div>
                                  <div className="text-2xl font-bold text-white tracking-tight">{metric.value}</div>
                                </div>
                              ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl">
                                <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-8">Growth Velocity</h4>
                                <div className="h-64">
                                  <GrowthChart history={history} />
                                </div>
                              </div>
                              <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl">
                                <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-8">Acquisition</h4>
                                <div className="h-64">
                                  <SubsChangeChart history={history} />
                                </div>
                              </div>
                            </div>

                            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl">
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                                  <div>
                                     <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-2">Content Resonance</h4>
                                     <p className="text-[10px] text-accents-5 font-bold uppercase mb-6">Engagement Spread</p>
                                     <div className="space-y-4">
                                        {[
                                           { label: 'High (4% +)', count: analysisData.videos.filter(v => (parseInt(v.statistics?.likeCount||0)/parseInt(v.statistics?.viewCount||1)*100) > 4).length, color: 'border-geist-success' },
                                           { label: 'Medium (2-4%)', count: analysisData.videos.filter(v => { const s = (parseInt(v.statistics?.likeCount||0)/parseInt(v.statistics?.viewCount||1)*100); return s <= 4 && s > 2; }).length, color: 'border-[#00dfd8]' },
                                           { label: 'Low (0-2%)', count: analysisData.videos.filter(v => (parseInt(v.statistics?.likeCount||0)/parseInt(v.statistics?.viewCount||1)*100) <= 2).length, color: 'border-white/10' }
                                        ].map((res, i) => (
                                           <div key={i} className={`flex justify-between items-center text-[10px] font-bold uppercase tracking-wider border-l-2 ${res.color} pl-4`}>
                                              <span className="text-accents-4">{res.label}</span>
                                              <span className="text-white">{res.count} Videos</span>
                                           </div>
                                        ))}
                                     </div>
                                  </div>
                                  <div className="md:col-span-2 h-64 flex justify-center">
                                     <EngagementPieChart videos={analysisData.videos} />
                                  </div>
                               </div>
                            </div>
                          </>
                        );
                      })()}
                    </motion.div>
                  )}

                  {activeTab === 'performance' && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-8"
                    >
                      {(() => {
                        const videoStats = analysisData.videos.map(v => calculateViralityScore(v));
                        const avgScore = videoStats.reduce((acc, s) => acc + s.score, 0) / videoStats.length;
                        const viralHits = videoStats.filter(s => s.score > 40).length;
                        const hitRate = (viralHits / videoStats.length) * 100;
                        const avgEngagement = videoStats.reduce((acc, s) => acc + parseFloat(s.engagement), 0) / videoStats.length;
                        const avgDailyViews = videoStats.reduce((acc, s) => acc + s.dailyViews, 0) / videoStats.length;
                        
                        const dates = analysisData.videos
                           .map(v => new Date(v.snippet.publishedAt).getTime())
                           .sort((a, b) => b - a);
                        const intervals = [];
                        for (let i = 0; i < dates.length - 1; i++) {
                           intervals.push((dates[i] - dates[i+1]) / (1000 * 60 * 60 * 24));
                        }
                        const avgInterval = intervals.length > 0 
                           ? intervals.reduce((acc, d) => acc + d, 0) / intervals.length 
                           : 0;

                        return (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                               {[
                                 { label: 'Viral Efficiency', value: `${hitRate.toFixed(1)}%`, sub: 'Hit Rate', color: 'text-white' },
                                 { label: 'Engagement', value: `${avgEngagement.toFixed(2)}%`, sub: 'Avg Engagement', color: 'text-[#00dfd8]' },
                                 { label: 'Velocity', value: `+${formatNumber(avgDailyViews)}`, sub: 'Avg Daily Views', color: 'text-geist-success' },
                                 { label: 'Cadence', value: `${avgInterval.toFixed(1)}d`, sub: 'Upload Frequency', color: 'text-white' }
                               ].map((stat, i) => (
                                 <div key={i} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                                    <p className="text-[9px] font-bold text-accents-4 uppercase tracking-widest mb-1">{stat.label}</p>
                                    <p className={`text-2xl font-bold ${stat.color} tracking-tight`}>{stat.value}</p>
                                    <p className="text-[9px] text-accents-5 font-bold uppercase mt-1">{stat.sub}</p>
                                 </div>
                               ))}
                            </div>

                            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl">
                               <div className="flex justify-between items-center mb-10">
                                  <div>
                                     <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Momentum spread</h4>
                                     <p className="text-[10px] text-accents-5 font-bold uppercase mt-1">Relative Viral Intensity</p>
                                  </div>
                               </div>
                               <div className="h-40 flex items-end gap-1 px-2">
                                  {analysisData.videos.map((v, i) => {
                                     const score = calculateViralityScore(v).score;
                                     return (
                                        <div 
                                           key={i} 
                                           className="flex-1 bg-geist-success/20 hover:bg-geist-success rounded-t-sm transition-all group relative cursor-crosshair" 
                                           style={{ height: `${Math.max(8, score)}%` }}
                                        />
                                     );
                                  })}
                               </div>
                               <div className="flex justify-between mt-4 text-[8px] font-bold text-accents-4 uppercase tracking-widest">
                                  <span>Oldest</span>
                                  <span>Timeline</span>
                                  <span>Newest</span>
                                </div>
                            </div>
                          </>
                        );
                      })()}
                    </motion.div>
                  )}

                  {activeTab === 'growth' && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-8"
                    >
                       <div className="bg-white/[0.02] border border-white/5 p-10 rounded-3xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-8 opacity-5">
                             <TrendingUp className="w-40 h-40 text-[#00dfd8]" />
                          </div>
                          <div className="relative z-10 text-center">
                             <h4 className="text-[10px] font-bold text-accents-4 uppercase tracking-widest mb-2">Neural Forecast</h4>
                             <p className="text-2xl text-white font-bold tracking-tight mb-12">Revenue Trajectory (30D)</p>
                             <div className="h-80">
                                <RevenueProjectionChart history={generateChannelHistory(analysisData.channel.statistics, 14)} />
                             </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {(() => {
                             const stats = analysisData.channel.statistics;
                             const subs = parseInt(stats.subscriberCount || 0);
                             const views = parseInt(stats.viewCount || 0);
                             const videoCount = parseInt(stats.videoCount || 0);
                             const videos = analysisData.videos || [];

                             let dailyVelocity = 0;
                             if (videos.length > 0) {
                                const batch = videos.slice(0, 10);
                                const batchViews = batch.reduce((acc, v) => acc + parseInt(v.statistics?.viewCount || 0), 0);
                                const oldestDate = new Date(batch[batch.length - 1].snippet.publishedAt).getTime();
                                const daysSpan = Math.max(1, (Date.now() - oldestDate) / (1000 * 60 * 60 * 24));
                                dailyVelocity = batchViews / daysSpan;
                             } else {
                                dailyVelocity = (views / Math.max(1, videoCount)) * 0.1;
                             }

                             const avgEngagement = videos.length > 0 
                                ? videos.slice(0, 10).reduce((acc, v) => {
                                   const vViews = parseInt(v.statistics?.viewCount || 1);
                                   const vEng = (parseInt(v.statistics?.likeCount || 0) + parseInt(v.statistics?.commentCount || 0)) / vViews;
                                   return acc + vEng;
                                }, 0) / Math.min(videos.length, 10)
                                : 0.02;

                             const base30DViews = dailyVelocity * 30;
                             const opt30DViews = base30DViews * (1 + (avgEngagement * 5));
                             const subVelocity = (base30DViews / Math.max(1, views)) * subs * 0.1;
                             const isMonetized = subs >= 1000;
                             const revMin = isMonetized ? (base30DViews / 1000) * 3.00 : 0;
                             const revMax = isMonetized ? (opt30DViews / 1000) * 10.00 : 0;

                             return [
                                { label: 'Predicted Subs', value: `+${formatNumber(subVelocity * 0.7)} — +${formatNumber(subVelocity * 1.4)}`, color: 'text-[#00dfd8]', icon: Users },
                                { label: 'Predicted Views', value: `+${formatNumber(base30DViews)} — +${formatNumber(opt30DViews)}`, color: 'text-geist-success', icon: Activity },
                                { label: 'Monetization', value: isMonetized ? 'ACTIVE' : 'PENDING', color: 'text-white', icon: DollarSign },
                                { label: 'Est. Revenue', value: `$${formatNumber(revMin)} — $${formatNumber(revMax)}`, color: 'text-white', icon: TrendingUp }
                             ].map((p, i) => (
                                <div key={i} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                                   <div className="flex items-center gap-3 mb-4">
                                      <p className="text-[10px] font-bold text-accents-4 uppercase tracking-widest">{p.label}</p>
                                   </div>
                                   <p className={`text-xl font-bold ${p.color} tracking-tight`}>{p.value}</p>
                                </div>
                             ));
                          })()}
                       </div>
                    </motion.div>
                  )}

                  {activeTab === 'videos' && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6"
                    >
                      {analysisData.videos?.map((item, i) => (
                        <motion.div
                          key={item.id?.videoId || item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02 }}
                        >
                          <VideoCard 
                            item={{
                              ...item,
                              snippet: item.snippet || {
                                title: item.title,
                                thumbnails: { medium: { url: item.thumbnail }, high: { url: item.thumbnail } },
                                publishedAt: item.published_at,
                                channelTitle: analysisData.channel.title
                              }
                            }} 
                            setHoverInfo={setHoverInfo} 
                            setSelectedVideo={setSelectedVideo} 
                            formatNumber={formatNumber} 
                          />
                        </motion.div>
                      ))}
                      
                      {analysisData.nextPageToken && (
                        <div className="flex justify-center pt-8">
                          <button 
                            onClick={loadMoreVideos}
                            disabled={loadingMore}
                            className="bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] tracking-widest uppercase px-10 py-3.5 rounded-xl border border-white/10 transition-all flex items-center gap-3 disabled:opacity-50"
                          >
                            {loadingMore ? 'Loading...' : 'Load More'}
                            <Zap className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
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

      {error && (
        <div className="max-w-xl mx-auto mt-12 bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center">
           <p className="text-red-500 font-bold">{error}</p>
           <button onClick={() => { setError(null); setSearchResults(null); setAnalysisData(null); setHasSearched(false); }} className="mt-4 text-[10px] font-bold uppercase text-white/50 hover:text-white underline">Clear and Retry</button>
        </div>
      )}

      {analysisData?.channel && (
        <ResearchNotesModal 
          isOpen={isNotesModalOpen}
          onClose={() => setIsNotesModalOpen(false)}
          onSave={() => {
            checkChannelSavedStatus(analysisData.channel.id);
            setIsNotesModalOpen(false);
          }}
          item={{
            dbId: savedChannelItem?.id,
            content: savedChannelItem?.content,
            id: analysisData.channel.id,
            type: 'channel',
            title: analysisData.channel.title,
            thumbnail: analysisData.channel.thumbnail,
            metadata: {
              thumbnail: analysisData.channel.thumbnail,
              customUrl: analysisData.channel.custom_url,
              statistics: analysisData.channel.statistics
            }
          }}
        />
      )}
    </div>
  );
}

export default function Channels() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChannelsContent />
    </Suspense>
  );
}
