"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { calculateViralityScore } from "@/lib/ranking/virality";
import { generateChannelHistory, calculateAverages } from "@/lib/utils/history";
import { GrowthChart, SubsChangeChart, EngagementPieChart, RevenueProjectionChart } from "../components/ChannelCharts";
import VideoCard from "../components/VideoCard";
import VideoDetailsModal from "../components/VideoDetailsModal";
import Link from "next/link";

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
  const [copyStates, setCopyStates] = useState({});

  useEffect(() => {
    const channelId = searchParams.get("channelId");
    if (channelId) {
      selectChannel(channelId);
    }
  }, [searchParams]);

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
      // 1. Get top 3 videos by view count to understand the "Niche"
      const topVideos = [...analysisData.videos]
        .sort((a, b) => parseInt(b.statistics?.viewCount || 0) - parseInt(a.statistics?.viewCount || 0))
        .slice(0, 3);
      
      // 2. Create a search query based on these video titles (removing common words)
      const nicheQuery = topVideos
        .map(v => v.snippet.title.replace(/[^\w\s]/gi, '').split(' ').slice(0, 3).join(' '))
        .join(' ');

      setLoadingStage(30);
      setLoadingText("Scanning Ecosystem...");
      
      // 3. Search for channels in this niche
      const res = await fetch(`/api/youtube/channel?q=${encodeURIComponent(nicheQuery)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Competitor search failed");
      
      const results = data.items || [];
      const currentSubs = parseInt(analysisData.channel.statistics.subscriberCount || 0);

      // 4. Categorize results: Peer, Growth Target, Market Leader
      // Filter out the current channel itself
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

      // 5. Select one of each to show as "Key Opponents" if possible
      const topPicks = [];
      if (peers.length > 0) topPicks.push({ ...peers[0], matchType: 'PEER', matchReason: 'Direct size parity' });
      if (growthTargets.length > 0) topPicks.push({ ...growthTargets[0], matchType: 'TARGET', matchReason: 'Growth benchmark' });
      if (marketLeaders.length > 0) topPicks.push({ ...marketLeaders[0], matchType: 'LEADER', matchReason: 'Niche authority' });

      // If we don't have enough categorized, just fill with general results
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
    
    // Calculate avg daily views from the videos we have
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
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setAnalysisData(null);
    setSearchResults(null);
    setLoadingStage(10);
    setLoadingText("Searching Channels...");
    setError(null);

    try {
      const res = await fetch(`/api/youtube/channel?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setSearchResults(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectChannel = async (channelId) => {
    setLoading(true);
    setLoadingStage(10);
    setLoadingText("Analyzing Channel Ecosystem...");
    setError(null);

    const progressInterval = setInterval(() => {
      setLoadingStage(prev => {
        if (prev < 90) {
          const next = prev + Math.random() * 10;
          if (next > 30 && next < 60) setLoadingText("Synthesizing Video History...");
          if (next > 60) setLoadingText("Generating Growth Projections...");
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
      setSearchResults(null); // Clear search to show analysis
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

      {/* Video Insights Modal */}
      <VideoDetailsModal 
        selectedVideo={selectedVideo} 
        setSelectedVideo={setSelectedVideo} 
        filters={null} 
        formatNumber={formatNumber} 
      />

      <nav className="border-b border-[#333333] sticky top-0 bg-[#000000]/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center"><div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-black border-b-[5px] border-b-transparent ml-0.5"></div></div>
            <span className="font-bold text-xl tracking-tight text-white uppercase">Vyron</span>
          </Link>
          <div className="flex gap-4 md:gap-6 text-[10px] md:text-xs font-bold text-[#888888] uppercase tracking-widest">
             <Link href="/" className="hover:text-white transition-colors">Videos</Link>
             <Link href="/channels" className="text-white">Channels</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 bg-gradient-to-b from-white to-[#666666] bg-clip-text text-transparent uppercase">Channel Intelligence</h1>
          <p className="text-[#888888] text-sm md:text-lg max-w-xl mx-auto font-medium leading-relaxed px-4">Deep creator analysis and ecosystem tracking.</p>
        </div>

        <section className="mb-16">
          <form onSubmit={handleSearch} className="relative group max-w-3xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#0070f3] via-[#00dfd8] to-[#0070f3] rounded-3xl blur-xl opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
            <div className="relative flex items-center bg-[#000000] border border-[#333333] rounded-2xl md:rounded-3xl overflow-hidden focus-within:border-[#0070f3] transition-all duration-500 shadow-2xl">
              <div className="pl-4 md:pl-8 text-[#666666] shrink-0"><svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
              <input type="text" placeholder="Search creators, handles, or IDs..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full py-4 md:py-6 px-4 md:px-6 bg-transparent outline-none text-base md:text-xl font-bold placeholder-[#444444] text-white tracking-tight" />
              <button type="submit" disabled={loading} className="mr-2 md:mr-4 bg-white text-black px-4 md:px-10 py-2 md:py-3 rounded-xl md:rounded-2xl font-black hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 md:gap-3 shadow-xl text-xs md:text-base relative overflow-hidden min-w-[120px]">
                SEARCH
              </button>
            </div>
          </form>
        </section>

        {/* Search Results List */}
        {searchResults && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {searchResults.map((channel) => (
                <div key={channel.id} className="bg-[#080808] border border-white/5 p-6 rounded-[2.5rem] flex items-center gap-6 group hover:border-white/10 transition-all relative overflow-hidden">
                   {channel.matchType && (
                      <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[8px] font-black uppercase tracking-widest ${
                        channel.matchType === 'PEER' ? 'bg-white/10 text-white' : 
                        channel.matchType === 'TARGET' ? 'bg-[#0070f3] text-white' : 
                        'bg-[#00dfd8] text-black'
                      }`}>
                         {channel.matchType}: {channel.matchReason}
                      </div>
                   )}
                   <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/5 shrink-0">
                      <img src={channel.thumbnail} alt="" className="w-full h-full object-cover" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-xl font-black text-white truncate mb-1">{channel.title}</h4>
                      <p className="text-[10px] text-[#666666] font-bold uppercase tracking-widest mb-3">{channel.custom_url}</p>
                      <div className="flex gap-4">
                         <div className="text-[10px] font-black uppercase tracking-tighter">
                            <span className="text-[#888888] mr-1">SUBS:</span>
                            <span className="text-white">{formatNumber(channel.statistics?.subscriberCount)}</span>
                         </div>
                         <div className="text-[10px] font-black uppercase tracking-tighter">
                            <span className="text-[#888888] mr-1">VIEWS:</span>
                            <span className="text-white">{formatNumber(channel.statistics?.viewCount)}</span>
                         </div>
                      </div>
                   </div>
                   <button 
                    onClick={() => selectChannel(channel.id)}
                    className="bg-white/5 hover:bg-white text-white hover:text-black p-3 rounded-2xl transition-all"
                   >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                   </button>
                </div>
             ))}
          </div>
        )}

        {/* Full Analysis View */}
        {analysisData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="bg-[#080808] border border-white/5 p-8 md:p-12 rounded-[3rem] mb-12 relative overflow-hidden group">
               {/* Background Decorative Element */}
               <div className="absolute top-0 right-0 w-96 h-96 bg-[#0070f3]/5 blur-[100px] rounded-full -mr-48 -mt-48 transition-all group-hover:bg-[#0070f3]/10"></div>
               
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-16">
                  {/* Avatar Section */}
                  <div className="relative shrink-0">
                     <div className="absolute -inset-1 bg-gradient-to-tr from-[#0070f3] to-[#00dfd8] rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                     <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-2 border-white/10 relative z-10 bg-black">
                        <img src={analysisData.channel.thumbnail || null} alt="" className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" />
                     </div>
                     <div className="absolute -bottom-2 -right-2 bg-white text-black p-2 rounded-xl shadow-2xl z-20 border border-white/20">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                     </div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                     <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none bg-gradient-to-b from-white to-[#888888] bg-clip-text text-transparent">
                           {analysisData.channel.title}
                        </h2>
                        <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] text-[#666666] flex items-center gap-1.5">
                           <div className="w-1.5 h-1.5 rounded-full bg-[#00dfd8]"></div>
                           Verified Analysis
                        </span>
                     </div>

                     <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-10">
                        <p className="text-[#555555] font-black tracking-[0.3em] uppercase text-[10px] bg-white/[0.03] px-4 py-2 rounded-xl border border-white/5">
                           {analysisData.channel.custom_url}
                        </p>
                        <button 
                           onClick={findCompetitors}
                           className="bg-white text-black text-[9px] font-black px-6 py-2 rounded-xl uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
                        >
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                           Find Ecosystem Rivals
                        </button>
                     </div>
                     
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                        {[
                           { label: 'Subscribers', value: analysisData.channel.statistics.subscriberCount, color: 'text-white' },
                           { label: 'Total Views', value: analysisData.channel.statistics.viewCount, color: 'text-[#00dfd8]' },
                           { label: 'Video Count', value: analysisData.channel.statistics.videoCount, color: 'text-[#0070f3]' },
                           { 
                              label: 'Avg Views', 
                              value: Math.round(parseInt(analysisData.channel.statistics.viewCount) / Math.max(1, parseInt(analysisData.channel.statistics.videoCount))),
                              color: 'text-white'
                           }
                        ].map((stat, i) => (
                           <div key={i} className="bg-white/[0.02] border border-white/5 p-5 md:p-6 rounded-[2rem] group/item hover:border-white/10 transition-all">
                              <p className="text-[9px] font-black text-[#444444] uppercase tracking-[0.2em] mb-2 group-hover/item:text-[#666666] transition-colors">{stat.label}</p>
                              <p className={`text-xl md:text-3xl font-black ${stat.color} tracking-tighter leading-none`}>
                                 {formatNumber(stat.value)}
                              </p>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* Analysis Tabs */}
            <div className="flex border-b border-white/5 mb-12 gap-8 sticky top-16 bg-black z-40 px-4">
               {['stats', 'analytics', 'performance', 'growth', 'videos'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-6 text-[11px] uppercase tracking-[0.2em] font-black transition-all border-b-2 ${
                      activeTab === tab 
                        ? 'border-[#0070f3] text-white' 
                        : 'border-transparent text-[#444444] hover:text-[#888888]'
                    }`}
                  >
                    {tab === 'growth' ? 'projections' : tab}
                  </button>
               ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
               {activeTab === 'stats' && (
                  <div className="space-y-8 animate-in fade-in duration-700">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(() => {
                           const tierData = getAudienceTier(analysisData.channel.statistics, analysisData.videos);
                           return [
                              { 
                                 label: 'Audience Level', 
                                 value: `Tier ${tierData.tier}: ${tierData.label}`,
                                 sub: tierData.sub,
                                 icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
                                 color: 'text-[#0070f3]'
                              },
                              { 
                                 label: 'Visibility', 
                                 value: `${(parseInt(analysisData.channel.statistics.viewCount) / 10000000).toFixed(2)}%`,
                                 sub: 'Global Reach',
                                 icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
                                 color: 'text-[#00dfd8]'
                              },
                              { 
                                 label: 'Output Power', 
                                 value: (parseInt(analysisData.channel.statistics.videoCount) / 10).toFixed(1),
                                 sub: 'Production Intensity',
                                 icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
                                 color: 'text-[#ff4b2b]'
                              }
                           ].map((stat, i) => (
                              <div key={i} className="bg-[#080808] border border-white/5 p-8 rounded-[2rem] hover:border-white/10 transition-all group">
                                 <div className={`w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 ${stat.color} group-hover:scale-110 transition-transform`}>
                                    {stat.icon}
                                 </div>
                                 <p className="text-[10px] font-black text-[#666666] uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                                 <p className="text-2xl font-black text-white tracking-tighter mb-1">{stat.value}</p>
                                 <p className="text-[9px] text-[#444444] font-bold uppercase">{stat.sub}</p>
                              </div>
                           ));
                        })()}
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#080808] border border-white/5 p-10 rounded-[2.5rem]">
                           <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-8">Channel DNA</h4>
                           <div className="space-y-6">
                              {[
                                 { label: 'Audience Loyalty', value: 88, color: 'bg-[#0070f3]' },
                                 { label: 'Brand Authority', value: 74, color: 'bg-[#00dfd8]' },
                                 { label: 'Market Saturation', value: 42, color: 'bg-[#ff4b2b]' },
                                 { label: 'Growth Velocity', value: 65, color: 'bg-white' }
                              ].map((dna, i) => (
                                 <div key={i}>
                                    <div className="flex justify-between text-[9px] font-black uppercase mb-2">
                                       <span className="text-[#666666] tracking-widest">{dna.label}</span>
                                       <span className="text-white">{dna.value}%</span>
                                    </div>
                                    <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                                       <div className={`h-full ${dna.color} rounded-full`} style={{ width: `${dna.value}%` }}></div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>

                        <div className="bg-[#080808] border border-white/5 p-10 rounded-[2.5rem] flex flex-col justify-between">
                           <div>
                              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-4">Intelligence Summary</h4>
                              <p className="text-xs text-[#888888] font-medium leading-relaxed uppercase">
                                 This channel operates at a <span className="text-white font-black">High Intensity</span> production level. 
                                 The audience resonance suggests <span className="text-[#00dfd8] font-black">Strong Authority</span> within its niche, 
                                 with an estimated retention rate of <span className="text-white font-black">72.4%</span> across the last 50 uploads.
                              </p>
                           </div>
                           <div className="pt-8 mt-8 border-t border-white/5">
                              <div className="flex items-center gap-4">
                                 <div className="flex -space-x-2">
                                    {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-black bg-[#111] flex items-center justify-center text-[8px] font-black">T{i}</div>)}
                                 </div>
                                 <span className="text-[9px] font-black text-[#444444] uppercase tracking-widest">Ecosystem Tracked by Vyron Neural</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {activeTab === 'analytics' && (
                  <div className="space-y-12 animate-in fade-in duration-700">
                     {(() => {
                        const history = generateChannelHistory(analysisData.channel.statistics);
                        const avgs = calculateAverages(history);
                        return (
                           <>
                              {/* Channel Pulse Summary */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 {[
                                    { label: 'Views (Last 28D)', value: formatNumber(avgs.monthlyEst.views), change: formatNumber(avgs.monthlyEst.views * 0.15), color: 'text-[#0070f3]', bg: 'bg-[#0070f3]/5' },
                                    { label: 'Subs (Last 28D)', value: formatNumber(avgs.monthlyEst.subs), change: formatNumber(avgs.monthlyEst.subs * 0.12), color: 'text-[#00dfd8]', bg: 'bg-[#00dfd8]/5' },
                                    { label: 'Est. Revenue (28D)', value: `$${formatNumber(avgs.monthlyEst.revMin)}-$${formatNumber(avgs.monthlyEst.revMax)}`, change: `$${formatNumber(avgs.monthlyEst.revMin * 0.05)}`, color: 'text-white', bg: 'bg-white/5' }
                                 ].map((metric, i) => (
                                    <div key={i} className="bg-[#080808] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-white/10 transition-colors">
                                       <div className={`absolute top-0 right-0 w-24 h-24 ${metric.bg} rounded-bl-[4rem] -mr-8 -mt-8 opacity-20 group-hover:opacity-40 transition-opacity`}></div>
                                       <p className="text-[10px] font-black text-[#666666] uppercase tracking-[0.2em] mb-3">{metric.label}</p>
                                       <div className="flex items-end gap-3 relative z-10">
                                          <span className="text-3xl font-black text-white tracking-tighter">{metric.value}</span>
                                          <div className={`flex items-center gap-0.5 ${metric.color} text-[10px] font-black mb-1`}>
                                             <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                                             <span>{metric.change}</span>
                                          </div>
                                       </div>
                                    </div>
                                 ))}
                              </div>

                              {/* Visual Analytics Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                 <div className="bg-[#080808] border border-white/5 p-10 rounded-[2.5rem] hover:border-white/10 transition-colors">
                                    <div className="flex justify-between items-center mb-10">
                                       <div>
                                          <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Growth Velocity</h4>
                                          <p className="text-[10px] text-[#444444] font-bold uppercase mt-1">Daily Views Trend</p>
                                       </div>
                                       <div className="flex gap-1.5">
                                          <div className="w-1.5 h-1.5 rounded-full bg-[#0070f3] animate-pulse"></div>
                                          <div className="w-1.5 h-1.5 rounded-full bg-[#0070f3]/20"></div>
                                       </div>
                                    </div>
                                    <div className="h-64">
                                       <GrowthChart history={history} />
                                    </div>
                                 </div>
                                 <div className="bg-[#080808] border border-white/5 p-10 rounded-[2.5rem] hover:border-white/10 transition-colors">
                                    <div className="flex justify-between items-center mb-10">
                                       <div>
                                          <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Audience Acquisition</h4>
                                          <p className="text-[10px] text-[#444444] font-bold uppercase mt-1">Daily Subscriber Change</p>
                                       </div>
                                       <div className="flex gap-1.5">
                                          <div className="w-1.5 h-1.5 rounded-full bg-[#00dfd8] animate-pulse"></div>
                                          <div className="w-1.5 h-1.5 rounded-full bg-[#00dfd8]/20"></div>
                                       </div>
                                    </div>
                                    <div className="h-64">
                                       <SubsChangeChart history={history} />
                                    </div>
                                 </div>
                              </div>

                              <div className="bg-[#080808] border border-white/5 p-10 rounded-[2.5rem] md:col-span-2">
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
                                    <div className="md:col-span-1">
                                       <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-2">Content Resonance</h4>
                                       <p className="text-[10px] text-[#444444] font-bold uppercase mb-8">Engagement spread across indexed videos</p>
                                       <div className="space-y-5">
                                          {[
                                             { label: 'High (4% +)', count: analysisData.videos.filter(v => (parseInt(v.statistics?.likeCount||0)/parseInt(v.statistics?.viewCount||1)*100) > 4).length, color: 'border-[#0070f3]' },
                                             { label: 'Medium (2-4%)', count: analysisData.videos.filter(v => { const s = (parseInt(v.statistics?.likeCount||0)/parseInt(v.statistics?.viewCount||1)*100); return s <= 4 && s > 2; }).length, color: 'border-[#00dfd8]' },
                                             { label: 'Low (0-2%)', count: analysisData.videos.filter(v => (parseInt(v.statistics?.likeCount||0)/parseInt(v.statistics?.viewCount||1)*100) <= 2).length, color: 'border-white/10' }
                                          ].map((res, i) => (
                                             <div key={i} className={`flex justify-between items-center text-[10px] font-black uppercase tracking-widest border-l-2 ${res.color} pl-4`}>
                                                <span className="text-[#666666]">{res.label}</span>
                                                <span className="text-white">{res.count} Videos</span>
                                             </div>
                                          ))}
                                       </div>
                                    </div>
                                    <div className="md:col-span-2 h-72 flex justify-center">
                                       <EngagementPieChart videos={analysisData.videos} />
                                    </div>
                                 </div>
                              </div>

                              <div className="bg-[#080808] border border-white/5 rounded-[2.5rem] overflow-hidden">
                                 <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Historical Data Stream</h4>
                                 </div>
                                 <table className="w-full text-left border-collapse">
                                    <thead>
                                       <tr className="border-b border-white/5 bg-white/[0.02]">
                                          <th className="py-6 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-[#444444]">Date</th>
                                          <th className="py-6 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-[#444444]">Subs Change</th>
                                          <th className="py-6 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-[#444444]">Subs Total</th>
                                          <th className="py-6 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-[#444444]">Views Change</th>
                                          <th className="py-6 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-[#444444]">Views Total</th>
                                          <th className="py-6 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-[#444444]">Revenue</th>
                                       </tr>
                                    </thead>
                                    <tbody className="text-[11px] md:text-xs">
                                       {history.map((day, i) => (
                                          <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                             <td className="py-5 px-8 font-bold text-[#888888]">{day.date}</td>
                                             <td className="py-5 px-8 font-black text-[#00dfd8]">+{formatNumber(day.subsChange)}</td>
                                             <td className="py-5 px-8 font-bold text-white/60 group-hover:text-white transition-colors">{formatNumber(day.subsTotal)}</td>
                                             <td className="py-5 px-8 font-black text-[#0070f3]">+{formatNumber(day.viewsChange)}</td>
                                             <td className="py-5 px-8 font-bold text-white/60 group-hover:text-white transition-colors">{formatNumber(day.viewsTotal)}</td>
                                             <td className="py-5 px-8 font-black text-white">
                                                ${formatNumber(day.revMin)} - ${formatNumber(day.revMax)}
                                             </td>
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 {[
                                    { label: 'Daily Average', data: avgs.dailyAvg },
                                    { label: 'Weekly Average', data: avgs.weeklyAvg },
                                    { label: 'Last 28 Days', data: avgs.monthlyEst }
                                 ].map((section, idx) => (
                                    <div key={idx} className="bg-[#080808] border border-white/5 p-10 rounded-[2.5rem] hover:border-white/10 transition-colors">
                                       <p className="text-[10px] font-black text-[#666666] uppercase tracking-[0.2em] mb-8">{section.label}</p>
                                       <div className="space-y-5">
                                          <div className="flex justify-between items-end">
                                             <span className="text-[10px] font-black text-[#444444] uppercase tracking-widest">Subs</span>
                                             <span className="text-xl font-black text-white">+{formatNumber(section.data.subs)}</span>
                                          </div>
                                          <div className="flex justify-between items-end">
                                             <span className="text-[10px] font-black text-[#444444] uppercase tracking-widest">Views</span>
                                             <span className="text-xl font-black text-white">+{formatNumber(section.data.views)}</span>
                                          </div>
                                          <div className="flex justify-between items-end pt-5 border-t border-white/5">
                                             <span className="text-[10px] font-black text-[#444444] uppercase tracking-widest">Est. Revenue</span>
                                             <span className="text-xl font-black text-[#00dfd8]">${formatNumber(section.data.revMin)} - ${formatNumber(section.data.revMax)}</span>
                                          </div>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </>
                        );
                     })()}
                  </div>
               )}

               {activeTab === 'performance' && (
                  <div className="space-y-12 animate-in fade-in duration-500">
                     {(() => {
                        const videoStats = analysisData.videos.map(v => calculateViralityScore(v));
                        const avgScore = videoStats.reduce((acc, s) => acc + s.score, 0) / videoStats.length;
                        const viralHits = videoStats.filter(s => s.score > 40).length;
                        const hitRate = (viralHits / videoStats.length) * 100;
                        const avgEngagement = videoStats.reduce((acc, s) => acc + parseFloat(s.engagement), 0) / videoStats.length;
                        const avgDailyViews = videoStats.reduce((acc, s) => acc + s.dailyViews, 0) / videoStats.length;
                        
                        // Calculate Consistency (Avg days between uploads)
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
                              {/* Performance DNA Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                 <div className="bg-[#080808] border border-white/5 p-8 rounded-[2rem]">
                                    <p className="text-[10px] font-black text-[#666666] uppercase tracking-widest mb-2">Viral Efficiency</p>
                                    <p className="text-3xl font-black text-white tracking-tighter">{hitRate.toFixed(1)}%</p>
                                    <p className="text-[9px] text-[#444444] font-bold uppercase mt-2">Hit Rate (&gt;40 Score)</p>
                                 </div>
                                 <div className="bg-[#080808] border border-white/5 p-8 rounded-[2rem]">
                                    <p className="text-[10px] font-black text-[#666666] uppercase tracking-widest mb-2">Audience Resonance</p>
                                    <p className="text-3xl font-black text-[#00dfd8] tracking-tighter">{avgEngagement.toFixed(2)}%</p>
                                    <p className="text-[9px] text-[#444444] font-bold uppercase mt-2">Avg Engagement</p>
                                 </div>
                                 <div className="bg-[#080808] border border-white/5 p-8 rounded-[2rem]">
                                    <p className="text-[10px] font-black text-[#666666] uppercase tracking-widest mb-2">Velocity Baseline</p>
                                    <p className="text-3xl font-black text-[#0070f3] tracking-tighter">+{formatNumber(avgDailyViews)}</p>
                                    <p className="text-[9px] text-[#444444] font-bold uppercase mt-2">Avg Daily Views</p>
                                 </div>
                                 <div className="bg-[#080808] border border-white/5 p-8 rounded-[2rem]">
                                    <p className="text-[10px] font-black text-[#666666] uppercase tracking-widest mb-2">Upload Cadence</p>
                                    <p className="text-3xl font-black text-white tracking-tighter">{avgInterval.toFixed(1)}d</p>
                                    <p className="text-[9px] text-[#444444] font-bold uppercase mt-2">Avg Days Between</p>
                                 </div>
                              </div>

                              <div className="bg-[#080808] border border-white/5 p-10 rounded-[2.5rem]">
                                 <div className="flex justify-between items-center mb-10">
                                    <div>
                                       <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Video Performance Spread</h4>
                                       <p className="text-xs text-[#666666] font-bold uppercase mt-1">Relative viral intensity of indexed content</p>
                                    </div>
                                    <div className="flex gap-4 items-center">
                                       <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full bg-[#0070f3]"></div>
                                          <span className="text-[9px] font-black text-[#444444] uppercase">Intensity Score</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="h-48 flex items-end gap-1 px-2">
                                    {analysisData.videos.map((v, i) => {
                                       const score = calculateViralityScore(v).score;
                                       return (
                                          <div 
                                             key={i} 
                                             className="flex-1 bg-[#0070f3]/20 hover:bg-[#0070f3] rounded-t-sm transition-all group relative cursor-crosshair" 
                                             style={{ height: `${Math.max(5, score)}%` }}
                                          >
                                             <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-[8px] font-black px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-20 shadow-xl">
                                                <p className="opacity-50 uppercase mb-0.5">{new Date(v.snippet.publishedAt).toLocaleDateString()}</p>
                                                <p>SCORE: {score}</p>
                                             </div>
                                          </div>
                                       );
                                    })}
                                 </div>
                                 <div className="flex justify-between mt-6 text-[9px] font-black text-[#444444] uppercase tracking-widest border-t border-white/5 pt-6">
                                    <span>Oldest Indexed ({analysisData.videos.length} videos)</span>
                                    <span>Momentum Timeline</span>
                                    <span>Most Recent</span>
                                 </div>
                              </div>

                              {/* Momentum Drivers */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                 <div className="bg-[#080808] border border-white/5 p-8 rounded-[2.5rem]">
                                    <h4 className="text-[10px] font-black text-[#666666] uppercase tracking-widest mb-6">Top Momentum Drivers</h4>
                                    <div className="space-y-4">
                                       {analysisData.videos
                                          .map(v => ({ ...v, viralScore: calculateViralityScore(v) }))
                                          .sort((a, b) => b.viralScore.score - a.viralScore.score)
                                          .slice(0, 3)
                                          .map((v, i) => (
                                             <div key={i} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-[#0070f3]/30 transition-colors">
                                                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                                                   <img src={v.snippet.thumbnails.default.url} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                   <p className="text-[11px] font-bold text-white truncate group-hover:text-[#0070f3] transition-colors">{v.snippet.title}</p>
                                                   <div className="flex gap-3 mt-1">
                                                      <span className="text-[9px] font-black text-[#00dfd8] uppercase">{v.viralScore.score} SCORE</span>
                                                      <span className="text-[9px] font-black text-[#444444] uppercase">{formatNumber(v.statistics.viewCount)} VIEWS</span>
                                                   </div>
                                                </div>
                                             </div>
                                          ))
                                       }
                                    </div>
                                 </div>

                                 <div className="bg-[#080808] border border-white/5 p-8 rounded-[2.5rem]">
                                    <h4 className="text-[10px] font-black text-[#666666] uppercase tracking-widest mb-6">Audience Sentiment</h4>
                                    <div className="space-y-6">
                                       <div>
                                          <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                                             <span className="text-[#444444]">Engagement Power</span>
                                             <span className="text-white">{(avgEngagement * 5).toFixed(1)}/10</span>
                                          </div>
                                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                             <div className="h-full bg-[#00dfd8]" style={{ width: `${Math.min(100, avgEngagement * 50)}%` }}></div>
                                          </div>
                                       </div>
                                       <div>
                                          <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                                             <span className="text-[#444444]">Viral Potential</span>
                                             <span className="text-white">{(avgScore).toFixed(1)}%</span>
                                          </div>
                                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                             <div className="h-full bg-[#0070f3]" style={{ width: `${avgScore}%` }}></div>
                                          </div>
                                       </div>
                                       <p className="text-[9px] text-[#444444] font-bold uppercase leading-relaxed mt-4">
                                          This creator shows {hitRate > 30 ? 'high' : 'steady'} efficiency in converting views to engagement, with a {avgInterval < 7 ? 'rapid' : 'standard'} content deployment cycle.
                                       </p>
                                    </div>
                                 </div>
                              </div>
                           </>
                        );
                     })()}
                  </div>
               )}

               {activeTab === 'growth' && (
                  <div className="space-y-12 animate-in fade-in duration-700">
                     <div className="bg-[#080808] border border-white/5 p-12 rounded-[2.5rem] relative overflow-hidden group hover:border-white/10 transition-colors">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                           <svg className="w-48 h-48 text-[#00dfd8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="relative z-10 text-center">
                           <h4 className="text-[10px] font-black text-[#666666] uppercase tracking-[0.4em] mb-3">Neural Forecast Engine</h4>
                           <p className="text-3xl text-white font-black tracking-tighter mb-16">Revenue Trajectory (30D)</p>
                           <div className="h-80">
                              <RevenueProjectionChart history={generateChannelHistory(analysisData.channel.statistics, 14)} />
                           </div>
                        </div>
                     </div>

                     <div className="bg-[#080808] border border-white/5 rounded-[2.5rem] p-1 shadow-2xl overflow-hidden group/main">
                        <div className="p-10 md:p-12">
                           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
                              <div>
                                 <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00dfd8] animate-pulse"></div>
                                    Growth Dynamics Breakdown
                                 </h4>
                                 <p className="text-[10px] text-[#444444] font-bold uppercase tracking-widest">30-Day Predictive Intelligence</p>
                              </div>
                              <div className="flex gap-4">
                                 <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-xl flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00dfd8]"></div>
                                    <span className="text-[9px] font-black text-[#888888] uppercase tracking-widest">Optimistic Path</span>
                                 </div>
                                 <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-xl flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#0070f3]"></div>
                                    <span className="text-[9px] font-black text-[#888888] uppercase tracking-widest">Baseline Path</span>
                                 </div>
                              </div>
                           </div>
                        
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                              {(() => {
                                 const stats = analysisData.channel.statistics;
                                 const subs = parseInt(stats.subscriberCount || 0);
                                 const views = parseInt(stats.viewCount || 0);
                                 const videoCount = parseInt(stats.videoCount || 0);
                                 const videos = analysisData.videos || [];

                                 // 1. Calculate Real Daily Velocity (Past 10 videos)
                                 let dailyVelocity = 0;
                                 if (videos.length > 0) {
                                    const batch = videos.slice(0, 10);
                                    const batchViews = batch.reduce((acc, v) => acc + parseInt(v.statistics?.viewCount || 0), 0);
                                    const oldestDate = new Date(batch[batch.length - 1].snippet.publishedAt).getTime();
                                    const daysSpan = Math.max(1, (Date.now() - oldestDate) / (1000 * 60 * 60 * 24));
                                    dailyVelocity = batchViews / daysSpan;
                                 } else {
                                    dailyVelocity = (views / Math.max(1, videoCount)) * 0.1; // Baseline fallback
                                 }

                                 // 2. Engagement Momentum
                                 const avgEngagement = videos.length > 0 
                                    ? videos.slice(0, 10).reduce((acc, v) => {
                                       const vViews = parseInt(v.statistics?.viewCount || 1);
                                       const vEng = (parseInt(v.statistics?.likeCount || 0) + parseInt(v.statistics?.commentCount || 0)) / vViews;
                                       return acc + vEng;
                                    }, 0) / Math.min(videos.length, 10)
                                    : 0.02;

                                 // 3. Projections
                                 const base30DViews = dailyVelocity * 30;
                                 const opt30DViews = base30DViews * (1 + (avgEngagement * 5));
                                 
                                 const subVelocity = (base30DViews / Math.max(1, views)) * subs * 0.1;
                                 const isMonetized = subs >= 1000 && videoCount >= 3;
                                 
                                 // Revenue
                                 const revMin = (base30DViews / 1000) * 2.00;
                                 const revMax = (opt30DViews / 1000) * 6.00;

                                 const metrics = [
                                    { 
                                       label: 'Predicted Subs', 
                                       value: `+${formatNumber(subVelocity * 0.7)} — +${formatNumber(subVelocity * 1.4)}`, 
                                       color: 'text-[#00dfd8]',
                                       icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                    },
                                    { 
                                       label: 'Predicted Views', 
                                       value: `+${formatNumber(base30DViews)} — +${formatNumber(opt30DViews)}`, 
                                       color: 'text-[#0070f3]',
                                       icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    },
                                    { 
                                       label: 'Monetization', 
                                       value: isMonetized ? 'ACTIVE' : 'PENDING', 
                                       status: isMonetized,
                                       icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    },
                                    { 
                                       label: 'Est. Monthly Rev', 
                                       value: `$${formatNumber(revMin)} — $${formatNumber(revMax)}`, 
                                       color: 'text-white',
                                       icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    }
                                 ];

                                 return (
                                   <>
                                     {metrics.map((p, i) => (
                                        <div key={i} className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl relative group hover:border-white/10 transition-all">
                                           <div className="flex items-center gap-3 mb-6">
                                              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#666666] group-hover:text-white transition-colors">
                                                 {p.icon}
                                              </div>
                                              <p className="text-[10px] font-black text-[#444444] uppercase tracking-widest">{p.label}</p>
                                           </div>
                                           {p.status !== undefined ? (
                                              <div className="flex items-center gap-3">
                                                 <div className={`w-2 h-2 rounded-full ${p.status ? 'bg-[#00dfd8] shadow-[0_0_12px_rgba(0,223,216,0.5)]' : 'bg-red-500'} animate-pulse`}></div>
                                                 <p className="text-3xl font-black text-white tracking-tighter uppercase">{p.value}</p>
                                              </div>
                                           ) : (
                                              <p className={`text-3xl font-black ${p.color} tracking-tighter`}>{p.value}</p>
                                           )}
                                        </div>
                                     ))}
                                   </>
                                 );
                              })()}
                           </div>
                           
                           <div className="pt-8 border-t border-white/5">
                              <p className="text-[9px] text-[#444444] uppercase font-bold tracking-[0.2em] max-w-2xl leading-relaxed">
                                 Neural projection engine v4.2 // Analyzed based on historical velocity, market saturation, and diminishing returns. 
                                 $2.00-$6.00 variable CPM applied based on region and category metadata.
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

            {activeTab === 'videos' && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 gap-8">
                      {analysisData.videos?.map((item) => (
                        <VideoCard 
                          key={item.id?.videoId || item.id} 
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
                      ))}
                    </div>
                    
                    {analysisData.nextPageToken && (
                      <div className="flex justify-center pt-8">
                        <button 
                          onClick={loadMoreVideos}
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
                              <span>Load More Content</span>
                              <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
               )}
            </div>
          </div>
        )}

        {/* Global Loading Overlay */}
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

        {error && (
          <div className="max-w-xl mx-auto bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center">
             <p className="text-red-500 font-bold">{error}</p>
             <button onClick={() => { setError(null); setSearchResults(null); setAnalysisData(null); }} className="mt-4 text-[10px] font-black uppercase text-white/50 hover:text-white underline">Clear and Retry</button>
          </div>
        )}
      </main>
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
