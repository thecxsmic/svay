"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { EngagementPieChart, CompetitorRadarChart, VideoPerformanceScatter, CompetitorBarComparison } from "../components/ChannelCharts";

function CompetitorsContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [baseChannel, setBaseChannel] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("matrix");
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    const channelId = searchParams.get("channelId");
    if (channelId) {
      analyzeCompetitors(channelId);
    } else {
      fetchUserChannel();
    }
    fetchSavedAnalyses();
  }, [searchParams]);

  const fetchSavedAnalyses = async () => {
    try {
      const res = await fetch("/api/competitors/save");
      const data = await res.json();
      if (data.success) setSavedAnalyses(data.items);
    } catch (err) {
      console.error("Failed to fetch saved analyses:", err);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!baseChannel || competitors.length === 0 || saveLoading) return;
    setSaveLoading(true);
    try {
      const res = await fetch("/api/competitors/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: baseChannel.id,
          competitorIds: competitors.map(c => c.id),
          title: `Analysis for ${baseChannel.title}`
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchSavedAnalyses();
        alert("Analysis saved successfully!");
      }
    } catch (err) {
      console.error("Failed to save analysis:", err);
    } finally {
      setSaveLoading(false);
    }
  };

  const fetchUserChannel = async () => {
    try {
      const res = await fetch("/api/youtube/channel/user");
      const data = await res.json();
      if (data.success && data.channel) {
        analyzeCompetitors(data.channel.id);
      }
    } catch (err) {
      console.error("Error fetching user channel:", err);
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

  const calculateEngagement = (statistics) => {
    if (!statistics) return 0;
    const views = parseInt(statistics.viewCount || 0);
    const subs = parseInt(statistics.subscriberCount || 0);
    if (subs === 0) return 0;
    return (views / subs).toFixed(2);
  };

  const analyzeCompetitors = async (channelId) => {
    setLoading(true);
    setLoadingStage(10);
    setLoadingText("Extracting Channel DNA...");
    setError(null);
    setCompetitors([]);

    try {
      const res = await fetch(`/api/youtube/channel?channelId=${channelId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch channel data");
      
      const channel = data.channel;
      const baseVideos = data.videos || [];
      setBaseChannel({ ...channel, videos: baseVideos });

      setLoadingStage(30);
      setLoadingText("Identifying Niche Keywords...");

      const topVideos = [...baseVideos]
        .sort((a, b) => parseInt(b.statistics?.viewCount || 0) - parseInt(a.statistics?.viewCount || 0))
        .slice(0, 5);
      
      const nicheQuery = topVideos
        .map(v => v.snippet.title.replace(/[^\w\s]/gi, '').split(' ').slice(0, 3).join(' '))
        .join(' ');

      setLoadingStage(50);
      setLoadingText("Scanning Ecosystem Rivals...");

      const compRes = await fetch(`/api/youtube/channel?q=${encodeURIComponent(nicheQuery)}`);
      const compData = await compRes.json();
      if (!compRes.ok) throw new Error(compData.error || "Competitor search failed");
      
      const initialResults = compData.items || [];
      const currentSubs = parseInt(channel.statistics.subscriberCount || 0);

      setLoadingStage(70);
      setLoadingText("Crunching Rival Metrics...");

      const filtered = initialResults.filter(c => c.id !== channelId).slice(0, 5);
      
      const deepCompetitors = await Promise.all(filtered.map(async (c) => {
        try {
          const detailRes = await fetch(`/api/youtube/channel?channelId=${c.id}`);
          const detailData = await detailRes.json();
          if (detailData.success) {
            return {
              ...detailData.channel,
              videos: detailData.videos || [],
              matchType: getMatchType(parseInt(detailData.channel.statistics.subscriberCount), currentSubs)
            };
          }
          return null;
        } catch (e) {
          return null;
        }
      }));

      const validCompetitors = deepCompetitors.filter(c => c !== null);
      setCompetitors(validCompetitors.sort((a, b) => parseInt(b.statistics.subscriberCount) - parseInt(a.statistics.subscriberCount)));
      setLoadingStage(100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMatchType = (compSubs, baseSubs) => {
    if (compSubs > baseSubs * 10) return "Market Leader";
    if (compSubs > baseSubs * 2) return "Growth Target";
    if (compSubs >= baseSubs * 0.5) return "Direct Peer";
    return "Emerging Rival";
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setError(null);
    setLoadingText("Searching...");
    
    try {
      const res = await fetch(`/api/youtube/channel?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      
      if (data.items && data.items.length > 0) {
        analyzeCompetitors(data.items[0].id);
      } else {
        throw new Error("No channels found");
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Content Analysis Logic
  const contentStats = useMemo(() => {
    if (!baseChannel || competitors.length === 0) return null;
    
    const allChannels = [baseChannel, ...competitors];
    return allChannels.map(ch => {
      const videos = ch.videos || [];
      const avgViews = videos.length > 0 
        ? videos.reduce((acc, v) => acc + parseInt(v.statistics?.viewCount || 0), 0) / videos.length 
        : 0;
      
      // Basic keyword extraction from titles
      const keywords = videos
        .map(v => v.snippet.title.toLowerCase().split(' '))
        .flat()
        .filter(w => w.length > 4)
        .reduce((acc, w) => {
          acc[w] = (acc[w] || 0) + 1;
          return acc;
        }, {});
      
      const topKeywords = Object.entries(keywords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([w]) => w);

      return {
        id: ch.id,
        title: ch.title,
        avgViews,
        topKeywords,
        isBase: ch.id === baseChannel.id
      };
    });
  }, [baseChannel, competitors]);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* Vercel-style Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-black border-b-[5px] border-b-transparent ml-0.5"></div>
            </div>
            <span className="font-bold text-sm uppercase tracking-widest italic">Matrix v2.1</span>
          </div>

          <form onSubmit={handleSearch} className="relative hidden md:block">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Subject..."
              className="bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all w-64"
            />
          </form>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-6 flex gap-8 overflow-x-auto no-scrollbar">
          {[
            { id: "matrix", label: "Overview" },
            { id: "content", label: "Content DNA" },
            { id: "audience", label: "Engagement" },
            { id: "growth", label: "Scale Analysis" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-xs font-medium transition-all relative whitespace-nowrap ${
                activeTab === tab.id ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="py-48 flex flex-col items-center justify-center gap-8">
             <div className="relative">
                <div className="w-20 h-20 border-2 border-zinc-800 rounded-full border-t-white animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-zinc-500">{loadingStage}%</span>
                </div>
             </div>
             <p className="text-zinc-500 font-medium uppercase tracking-[0.3em] text-[10px] animate-pulse">{loadingText}</p>
          </div>
        ) : error ? (
          <div className="max-w-xl mx-auto py-24 text-center">
            <div className="p-12 border border-red-500/20 bg-red-500/5 rounded-2xl">
              <h2 className="text-xl font-bold mb-2">Analysis Interrupted</h2>
              <p className="text-zinc-400 text-sm mb-8">{error}</p>
              <button onClick={() => analyzeCompetitors(baseChannel?.id || searchParams.get('channelId'))} className="bg-white text-black px-6 py-2 rounded-md text-xs font-bold hover:bg-zinc-200 transition-colors">Retry Analysis</button>
            </div>
          </div>
        ) : baseChannel ? (
          <div className="space-y-12">
            {/* Context Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-12 border-b border-zinc-900">
               <div className="flex items-center gap-6">
                  <img src={baseChannel.thumbnail} className="w-20 h-20 rounded-full border border-zinc-800" alt="" />
                  <div>
                    <h1 className="text-4xl font-black tracking-tight uppercase italic">{baseChannel.title}</h1>
                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-1">{baseChannel.custom_url} • {formatNumber(baseChannel.statistics.subscriberCount)} Subscribers</p>
                  </div>
               </div>
               <div className="flex gap-2">
                  <button className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors">Export PDF</button>
                  <button 
                    onClick={handleSaveAnalysis}
                    disabled={saveLoading}
                    className="bg-white text-black px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {saveLoading ? "Saving..." : "Save Analysis"}
                  </button>
               </div>
            </div>

            {/* Saved Analyses Quick Access */}
            {savedAnalyses.length > 0 && (
              <div className="bg-zinc-900/20 border border-zinc-800 rounded-2xl p-6">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Saved Analyses</p>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                   {savedAnalyses.map(analysis => (
                     <button 
                      key={analysis.id}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        params.set("channelId", analysis.subject_id);
                        window.history.pushState({}, '', `?${params.toString()}`);
                        analyzeCompetitors(analysis.subject_id);
                      }}
                      className="shrink-0 flex items-center gap-3 bg-black border border-zinc-800 px-4 py-2 rounded-xl hover:border-zinc-600 transition-all"
                     >
                        <img src={analysis.subject_thumbnail} className="w-6 h-6 rounded-full" alt="" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-tight">{analysis.subject_title}</span>
                        <span className="text-[8px] text-zinc-600 font-mono">{new Date(analysis.created_at).toLocaleDateString()}</span>
                     </button>
                   ))}
                </div>
              </div>
            )}

            {/* Tabbed Content */}
            <div className="min-h-[60vh] animate-in fade-in slide-in-from-bottom-2 duration-500">
              {activeTab === "matrix" && (
                <div className="space-y-8">
                  {/* Radar Chart Snapshot */}
                  <div className="border border-zinc-800 rounded-2xl bg-zinc-950/50 p-8 flex flex-col md:flex-row items-center gap-12">
                    <div className="w-full md:w-1/3 h-64">
                      <CompetitorRadarChart baseChannel={baseChannel} competitors={competitors} />
                    </div>
                    <div className="flex-1 space-y-6">
                      <h3 className="text-xl font-bold uppercase italic tracking-tight">Ecosystem Radar</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        A multi-dimensional neural map comparing your channel's <span className="text-white font-bold">Reach Potential</span>, <span className="text-white font-bold">Scale Authority</span>, and <span className="text-white font-bold">View Efficiency</span> against your top ecosystem rival.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/30">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Top Strength</p>
                          <p className="text-sm font-black text-white">{calculateEngagement(baseChannel.statistics) > 2 ? 'Reach Factor' : 'Output Volume'}</p>
                        </div>
                        <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/30">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Rival Advantage</p>
                          <p className="text-sm font-black text-white">Scale Authority</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3 border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/50">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="bg-zinc-900/50 border-b border-zinc-800">
                            <th className="px-6 py-4 font-bold text-zinc-400 uppercase text-[10px] tracking-widest">Channel</th>
                            <th className="px-6 py-4 font-bold text-zinc-400 uppercase text-[10px] tracking-widest">Tier</th>
                            <th className="px-6 py-4 font-bold text-zinc-400 uppercase text-[10px] tracking-widest">Subs</th>
                            <th className="px-6 py-4 font-bold text-zinc-400 uppercase text-[10px] tracking-widest">Gap</th>
                            <th className="px-6 py-4 font-bold text-zinc-400 uppercase text-[10px] tracking-widest text-right">Reach</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900">
                          {/* Base Channel */}
                          <tr className="bg-zinc-900/20 group">
                            <td className="px-6 py-6 flex items-center gap-4">
                              <img src={baseChannel.thumbnail} className="w-10 h-10 rounded-full border border-zinc-700" alt="" />
                              <div>
                                <p className="font-bold text-white uppercase italic">SUBJECT</p>
                                <p className="text-[10px] text-zinc-500">{baseChannel.custom_url}</p>
                              </div>
                            </td>
                            <td className="px-6 py-6">
                              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[9px] font-bold border border-zinc-700 uppercase tracking-widest">CONTROL</span>
                            </td>
                            <td className="px-6 py-6 font-bold">{formatNumber(baseChannel.statistics.subscriberCount)}</td>
                            <td className="px-6 py-6 text-zinc-500 font-mono text-xs">-</td>
                            <td className="px-6 py-6 text-right font-black text-white">{calculateEngagement(baseChannel.statistics)}x</td>
                          </tr>
                          {/* Competitors */}
                          {competitors.map(comp => (
                            <tr key={comp.id} className="hover:bg-zinc-900/50 transition-colors group">
                              <td className="px-6 py-6 flex items-center gap-4">
                                <img src={comp.thumbnail} className="w-10 h-10 rounded-full border border-zinc-800 grayscale group-hover:grayscale-0 transition-all" alt="" />
                                <div>
                                  <p className="font-bold text-white uppercase italic truncate max-w-[150px]">{comp.title}</p>
                                  <p className="text-[10px] text-zinc-500 truncate max-w-[150px]">{comp.custom_url}</p>
                                </div>
                              </td>
                              <td className="px-6 py-6">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-widest ${
                                  comp.matchType === 'Market Leader' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                  comp.matchType === 'Growth Target' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                  'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                }`}>
                                  {comp.matchType.split(' ')[0]}
                                </span>
                              </td>
                              <td className="px-6 py-6 font-bold">{formatNumber(comp.statistics.subscriberCount)}</td>
                              <td className="px-6 py-6">
                                <div className="flex flex-col gap-1">
                                  <span className={`text-[10px] font-bold ${parseInt(comp.statistics.subscriberCount) > parseInt(baseChannel.statistics.subscriberCount) ? 'text-green-500' : 'text-blue-500'}`}>
                                    {parseInt(comp.statistics.subscriberCount) > parseInt(baseChannel.statistics.subscriberCount) ? '+' : ''}
                                    {formatNumber(parseInt(comp.statistics.subscriberCount) - parseInt(baseChannel.statistics.subscriberCount))}
                                  </span>
                                  <div className="w-12 h-1 bg-zinc-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-zinc-700 w-1/2"></div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-6 text-right font-black text-white">{calculateEngagement(comp.statistics)}x</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Sidebar Stats */}
                    <div className="space-y-6">
                      <div className="p-6 border border-zinc-800 rounded-2xl bg-zinc-950">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Niche Authority</p>
                        <div className="flex items-end gap-2">
                           <span className="text-4xl font-black">7.2</span>
                           <span className="text-zinc-600 font-bold mb-1">/10</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-2 font-medium">Top 12% in your specific niche segment</p>
                      </div>
                      <div className="p-6 border border-zinc-800 rounded-2xl bg-zinc-950">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Ecosystem Match</p>
                        <div className="flex items-center gap-2">
                           <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                              <div className="h-full bg-white w-[88%]"></div>
                           </div>
                           <span className="text-[10px] font-bold">88%</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-4 font-medium leading-relaxed">Subjects share 4/5 core metadata tags.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "content" && (
                <div className="space-y-8">
                   {/* Scatter Plot */}
                   <div className="border border-zinc-800 rounded-2xl p-8 bg-zinc-950/50">
                      <div className="flex items-center justify-between mb-8">
                         <h4 className="text-lg font-bold uppercase italic tracking-tight">Content Performance Scatter</h4>
                         <span className="bg-zinc-900 border border-zinc-800 text-[10px] font-bold px-3 py-1 rounded text-zinc-400 uppercase tracking-widest">Views vs Likes</span>
                      </div>
                      <div className="h-[400px]">
                         <VideoPerformanceScatter videos={baseChannel.videos} competitorVideos={competitors[0]?.videos} />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {contentStats?.map(stat => (
                     <div key={stat.id} className={`p-8 border rounded-2xl transition-all ${stat.isBase ? 'border-zinc-500 bg-zinc-900/20' : 'border-zinc-800 hover:border-zinc-600 bg-zinc-950/50'}`}>
                        <div className="flex justify-between items-start mb-8">
                           <p className="font-bold text-sm uppercase italic tracking-tighter truncate max-w-[150px]">{stat.title}</p>
                           {stat.isBase && <span className="bg-white text-black text-[8px] font-bold px-2 py-0.5 rounded uppercase">Base</span>}
                        </div>
                        <div className="space-y-6">
                           <div>
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Efficiency Rating</p>
                              <p className="text-2xl font-black">{formatNumber(stat.avgViews)} <span className="text-xs text-zinc-600 uppercase">Avg Views</span></p>
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Topic DNA</p>
                              <div className="flex flex-wrap gap-2">
                                 {stat.topKeywords.map(kw => (
                                   <span key={kw} className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-md text-[10px] font-bold text-zinc-400 lowercase">#{kw}</span>
                                 ))}
                              </div>
                           </div>
                           <div className="pt-6 border-t border-zinc-900">
                              <Link href={`/channels?channelId=${stat.id}`} className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">View Deep Content Audit →</Link>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              )}

              {activeTab === "audience" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="border border-zinc-800 rounded-2xl p-8 bg-zinc-950/50">
                      <h4 className="text-lg font-bold mb-8 uppercase italic tracking-tight">Engagement Depth</h4>
                      <div className="h-[300px] relative">
                        {baseChannel.videos && <EngagementPieChart videos={baseChannel.videos} />}
                      </div>
                   </div>
                   <div className="border border-zinc-800 rounded-2xl p-8 bg-zinc-950/50">
                      <h4 className="text-lg font-bold mb-8 uppercase italic tracking-tight">Reach Benchmarks</h4>
                      <div className="space-y-6">
                         {[baseChannel, ...competitors.slice(0, 3)].map(ch => {
                           const reach = calculateEngagement(ch.statistics);
                           const isBase = ch.id === baseChannel.id;
                           return (
                             <div key={ch.id} className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase">
                                   <span className={isBase ? "text-white" : "text-zinc-500"}>{ch.title}</span>
                                   <span>{reach}x</span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                                   <div 
                                    className={`h-full rounded-full ${isBase ? 'bg-white' : 'bg-zinc-700'}`} 
                                    style={{ width: `${Math.min(100, (parseFloat(reach)/10)*100)}%` }}
                                   ></div>
                                </div>
                             </div>
                           )
                         })}
                      </div>
                      <div className="mt-12 p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                         <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Audience Retention Indicator</p>
                         <p className="text-sm font-medium leading-relaxed text-zinc-300">
                           {parseFloat(calculateEngagement(baseChannel.statistics)) > 1.5 
                             ? "Strong community loyalty. Your audience views multiple videos per subscriber. Focus on high-retention formats." 
                             : "Reach is below niche benchmarks. Consider improving your click-through potential through A/B thumbnail testing."}
                         </p>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === "growth" && (
                <div className="space-y-8">
                  <div className="p-12 border border-zinc-800 rounded-2xl bg-zinc-950/50 text-center">
                     <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-8">
                        <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                     </div>
                     <h3 className="text-xl font-bold mb-4 uppercase italic tracking-tight">Scale Projections</h3>
                     <p className="text-zinc-500 text-sm max-w-md mx-auto mb-12">Comparative growth velocity tracking and predictive subscriber scaling benchmarks.</p>
                     <div className="flex flex-wrap justify-center gap-4">
                        <div className="px-8 py-6 border border-zinc-800 rounded-xl bg-zinc-900/30">
                           <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Velocity</p>
                           <p className="text-2xl font-black text-white">STABLE</p>
                        </div>
                        <div className="px-8 py-6 border border-zinc-800 rounded-xl bg-zinc-900/30">
                           <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Scale Potential</p>
                           <p className="text-2xl font-black text-white">HIGH</p>
                        </div>
                     </div>
                     <p className="mt-12 text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em]">Historical Analysis Active</p>
                  </div>

                  <div className="border border-zinc-800 rounded-2xl p-8 bg-zinc-950/50">
                    <h4 className="text-lg font-bold mb-8 uppercase italic tracking-tight">Ecosystem Total Views Comparison</h4>
                    <div className="h-[300px]">
                      <CompetitorBarComparison channels={[baseChannel, ...competitors]} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-64 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-12">
               <svg className="w-10 h-10 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-4">Subject Required</h2>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto mb-12 leading-relaxed font-medium">Connect a subject channel to begin strategic ecosystem benchmarking and DNA analysis.</p>
            
            <form onSubmit={handleSearch} className="w-full max-w-md">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Channel ID or URL..."
                className="w-full bg-zinc-900 border border-zinc-800 px-6 py-4 rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all text-center mb-4"
              />
              <button type="submit" className="w-full bg-white text-black py-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] hover:bg-zinc-200 transition-all">Begin Matrix Scan</button>
            </form>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-900 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-zinc-800 rounded-full"></div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">© 2026 Vyron Intelligence • Strategic Tier</span>
           </div>
           <div className="flex gap-8">
              <Link href="/" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">Documentation</Link>
              <Link href="/" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">API Status</Link>
              <Link href="/" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">Legal</Link>
           </div>
        </div>
      </footer>
    </div>
  );
}

export default function Competitors() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8">
        <div className="w-12 h-12 border border-zinc-800 rounded-full border-t-white animate-spin"></div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.5em]">Initializing V2.1</p>
      </div>
    }>
      <CompetitorsContent />
    </Suspense>
  );
}
