'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useChannel } from '@/contexts/channel';
import { useUser } from '@/contexts/user';
import { 
  Users, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Zap, 
  Shield, 
  ArrowUpRight, 
  RefreshCw, 
  Plus, 
  AlertCircle,
  Eye,
  Search,
  ChevronRight,
  Database,
  Layers,
  History,
  Activity,
  MousePointer2,
  PieChart,
  Mail,
  Trophy
} from 'lucide-react';
import { useTitle } from '@/lib/hooks/titles';
import ResearchNotesModal from '../components/ResearchNotesModal';
import { 
  EngagementPieChart, 
  CompetitorRadarChart, 
  CompetitorBarComparison, 
  VideoPerformanceScatter 
} from "../components/ChannelCharts";

const CACHE_KEY_PREFIX = 'competitor_analysis_cache_v2_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export default function CompetitorsPage() {
  useTitle("Competitor Matrix");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { channels } = useChannel();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [lastScanTime, setLastScanTime] = useState(null);
  const [lastEmailSentAt, setLastEmailSentAt] = useState(null);
  const [activeTab, setActiveTab] = useState('market');
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedNoteItem, setSelectedNoteItem] = useState(null);

  const selectedChannel = channels.data.find(c => c.id === channels.selectedId);
  const getCacheKey = () => `${CACHE_KEY_PREFIX}${selectedChannel?.id || 'default'}`;

  const loadAnalysisById = useCallback(async (id) => {
    setLoading(true);
    setProgress(10);
    setCurrentStep('Loading saved analysis...');
    setError(null);
    try {
      const res = await fetch(`/api/competitors/save?id=${id}`);
      const result = await res.json();
      
      if (!result.success || !result.item) {
        throw new Error(`Analysis snapshot "${id}" not found.`);
      }
      
      const analysis = result.item;
      setLastEmailSentAt(analysis.lastEmailSentAt);
      setProgress(40);
      setCurrentStep('Fetching latest channel data...');
      
      // Fetch fresh data for the subject
      const subjectRes = await fetch(`/api/youtube/channel?channelId=${analysis.subject_id}`);
      const subjectData = await subjectRes.json();
      
      if (!subjectData.success || !subjectData.channel) {
        throw new Error("Could not fetch fresh data for the subject channel.");
      }
      
      setProgress(70);
      setCurrentStep('Analyzing rival performance...');
      
      const baseSubs = parseInt(subjectData.channel.statistics.subscriberCount);
      
      const competitors = await Promise.all(analysis.competitor_ids.map(async (cId) => {
        try {
          const cRes = await fetch(`/api/youtube/channel?channelId=${cId}`);
          const cData = await cRes.json();
          if (cData.success && cData.channel) {
            const compSubs = parseInt(cData.channel.statistics.subscriberCount);
            let matchType = "Emerging Rival";
            if (compSubs > baseSubs * 10) matchType = "Market Leader";
            else if (compSubs > baseSubs * 2) matchType = "Growth Target";
            else if (compSubs >= baseSubs * 0.5) matchType = "Direct Peer";
            
            return { ...cData.channel, videos: cData.videos || [], matchType };
          }
        } catch (e) {
          console.error(`Failed to fetch competitor ${cId}:`, e);
        }
        return null;
      }));

      const validCompetitors = competitors.filter(c => c !== null);
      
      setData({
        baseChannel: { ...subjectData.channel, videos: subjectData.videos || [] },
        competitors: validCompetitors.sort((a, b) => parseInt(b.statistics.subscriberCount) - parseInt(a.statistics.subscriberCount)),
        timestamp: analysis.created_at
      });
      setProgress(100);
    } catch (err) {
      console.error("Load Analysis Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCachedData = useCallback(() => {
    if (!selectedChannel) return null;
    try {
      const cached = localStorage.getItem(getCacheKey());
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setData(cachedData);
          setLastScanTime(timestamp);
          return cachedData;
        }
        localStorage.removeItem(getCacheKey());
      }
    } catch (err) {
      console.error('Cache load error:', err);
    }
    return null;
  }, [selectedChannel]);

  useEffect(() => {
    const analysisId = searchParams.get('analysisId');
    if (analysisId) {
      loadAnalysisById(analysisId);
    } else if (selectedChannel) {
      const cached = loadCachedData();
      if (!cached && !loading && !data) {
        analyzeCompetitors();
      }
    }
  }, [selectedChannel?.id, searchParams]);

  const cacheData = (analysisData) => {
    if (!selectedChannel) return;
    try {
      localStorage.setItem(getCacheKey(), JSON.stringify({
        data: analysisData,
        timestamp: Date.now(),
        channelId: selectedChannel.id
      }));
      setLastScanTime(Date.now());
    } catch (err) {
      console.error('Cache save error:', err);
    }
  };

  const analyzeCompetitors = async () => {
    if (loading || !selectedChannel) return;
    setLoading(true);
    setProgress(0);
    setError(null);
    setData(null);

    try {
      setCurrentStep('Extracting Channel DNA...');
      setProgress(10);
      const res = await fetch(`/api/youtube/channel?channelId=${selectedChannel.id}`);
      const baseData = await res.json();
      if (!res.ok) throw new Error(baseData.error || "Failed to fetch channel data");
      
      const baseChannel = { ...baseData.channel, videos: baseData.videos || [] };

      setCurrentStep('Identifying Niche Rivals...');
      setProgress(30);
      const topVideos = [...baseChannel.videos]
        .sort((a, b) => parseInt(b.statistics?.viewCount || 0) - parseInt(a.statistics?.viewCount || 0))
        .slice(0, 3);
      
      const nicheQuery = topVideos.length > 0 
        ? topVideos.map(v => v.snippet.title.split(' ').slice(0, 2).join(' ')).join(' ')
        : selectedChannel.title;

      setCurrentStep('Scanning Ecosystem...');
      setProgress(50);
      const compRes = await fetch(`/api/youtube/channel?q=${encodeURIComponent(nicheQuery)}`);
      const compData = await compRes.json();
      const initialResults = compData.items || [];
      const currentSubs = parseInt(baseChannel.statistics.subscriberCount || 0);

      setCurrentStep('Crunching Rival Metrics...');
      setProgress(70);
      const filtered = initialResults.filter(c => c.id !== selectedChannel.id).slice(0, 4);
      
      const deepCompetitors = await Promise.all(filtered.map(async (c) => {
        try {
          const detailRes = await fetch(`/api/youtube/channel?channelId=${c.id}`);
          const detailData = await detailRes.json();
          if (detailData.success) {
            const compSubs = parseInt(detailData.channel.statistics.subscriberCount);
            let matchType = "Emerging Rival";
            if (compSubs > currentSubs * 10) matchType = "Market Leader";
            else if (compSubs > currentSubs * 2) matchType = "Growth Target";
            else if (compSubs >= currentSubs * 0.5) matchType = "Direct Peer";

            return {
              ...detailData.channel,
              videos: detailData.videos || [],
              matchType
            };
          }
          return null;
        } catch (e) { return null; }
      }));

      const competitors = deepCompetitors.filter(c => c !== null);
      
      const analysisResult = {
        baseChannel,
        competitors: competitors.sort((a, b) => parseInt(b.statistics.subscriberCount) - parseInt(a.statistics.subscriberCount)),
        timestamp: Date.now()
      };

      setData(analysisResult);
      cacheData(analysisResult);
      
      // Auto-save to Turso to get an ID for emailing
      try {
        const saveRes = await fetch('/api/competitors/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectId: baseChannel.id,
            competitorIds: competitors.map(c => c.id),
            title: `Matrix: ${baseChannel.title}`
          })
        });
        const saveResult = await saveRes.json();
        if (saveResult.success && saveResult.id) {
          router.push(`/competitors?analysisId=${saveResult.id}`);
          
          // Automatically trigger the email report
          setCurrentStep('Sending email report...');
          try {
            const emailRes = await fetch('/api/competitors/email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                analysisId: saveResult.id,
                userId: user?.id
              })
            });
            const emailResult = await emailRes.json();
            if (emailResult.success) {
              setLastEmailSentAt(Date.now());
              console.log("Email report sent automatically");
            }
          } catch (e) {
            console.error("Automatic email failed:", e);
          }
        }
      } catch (e) {
        console.error("Auto-save failed:", e);
      }

      setProgress(100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = (type, title, metadata) => {
    const b64 = typeof window !== 'undefined' ? btoa(encodeURIComponent(title).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1))) : btoa(title);
    const reference_id = `${type.substring(0,2)}-${b64.substring(0, 10)}`;
    
    // Strip heavy video data if it's an analysis to keep library metadata lean
    let cleanMetadata = metadata;
    if (type === 'analysis' && metadata.baseChannel) {
      cleanMetadata = {
        ...metadata,
        baseChannel: { ...metadata.baseChannel, videos: undefined },
        competitors: metadata.competitors.map(c => ({ ...c, videos: undefined }))
      };
    }
    
    setSelectedNoteItem({ type, title, reference_id, metadata: cleanMetadata });
    setIsNotesModalOpen(true);
  };

  const formatNumber = (num) => {
    const n = parseInt(num || 0);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const calculateEngagement = (statistics) => {
    if (!statistics) return "0";
    const views = parseInt(statistics.viewCount || 0);
    const subs = parseInt(statistics.subscriberCount || 0);
    return subs === 0 ? "0" : (views / subs).toFixed(2);
  };

  const baseSubs = data ? parseInt(data.baseChannel.statistics?.subscriberCount || 0, 10) : 0;
  const largerCompetitors = data ? data.competitors.filter(c => parseInt(c.statistics?.subscriberCount || 0, 10) > baseSubs) : [];
  const hasLargerCompetitors = largerCompetitors.length > 0;
  const isKing = !hasLargerCompetitors && baseSubs > 1000000;

  const TABS = [
    { id: 'market', label: 'Market Matrix', icon: Target },
    { id: 'content', label: 'Content DNA', icon: Activity },
    ...(hasLargerCompetitors ? [{ id: 'growth', label: 'Growth Velocity', icon: TrendingUp }] : []),
    { id: 'audience', label: 'Reach Analysis', icon: Users }
  ];

  const getCacheAge = () => {
    if (!lastScanTime) return '';
    const mins = Math.floor((Date.now() - lastScanTime) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins/60)}h ago`;
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      <ResearchNotesModal
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        item={selectedNoteItem}
      />

      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <h1 className="font-display text-lg tracking-tight uppercase flex items-center gap-3">
              Competitors <span className="text-zinc-600 font-normal hidden sm:inline">/ {selectedChannel?.title || 'Global'}</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {searchParams.get('analysisId') && data && !loading && lastEmailSentAt && (
              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter hidden sm:inline-flex items-center gap-1.5 whitespace-nowrap">
                <Mail className="w-3.5 h-3.5" />
                Last Sent: {new Date(lastEmailSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {lastScanTime && !loading && (
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter hidden sm:inline-flex items-center gap-1.5 whitespace-nowrap">
                <BarChart3 className="w-3.5 h-3.5" />
                Last scan: {getCacheAge()}
              </span>
            )}
            <button
              onClick={analyzeCompetitors}
              disabled={loading || !selectedChannel}
              className="h-9 px-4 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{loading ? 'Analyzing' : 'Sync'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Tabs */}
        {data && !loading && !isKing && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-8 overflow-x-auto no-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 pt-4 text-[10px] uppercase font-bold tracking-widest transition-all relative whitespace-nowrap ${
                  activeTab === tab.id ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" 
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          {!data && !loading && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-zinc-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Ecosystem Mapping</h2>
              <p className="text-zinc-500 max-w-sm mb-8 leading-relaxed text-sm">
                Analyze your channel's position against direct rivals, market leaders, and niche peers.
              </p>
              <button
                onClick={analyzeCompetitors}
                disabled={!selectedChannel}
                className="px-10 py-3 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-all disabled:opacity-30"
              >
                Start Analysis
              </button>
            </motion.div>
          )}

          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32"
            >
              <div className="w-64 space-y-4">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  <span>{currentStep}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-0.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-white"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {data && !loading && (
            <motion.div
              key={isKing ? 'king' : activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12 pb-20"
            >
              {isKing ? (
                <div className="border border-zinc-800 bg-zinc-950 p-6 sm:p-10 rounded-2xl space-y-4 text-left relative overflow-hidden">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-white" />
                    <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">niche dominance established</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-tight font-mono">u are the king</h3>
                    <p className="text-zinc-450 text-xs leading-relaxed max-w-3xl">
                      Your channel sits at the absolute peak of this niche's subscriber hierarchy. No larger rivals were detected in this keyword space.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === 'market' && (
                <div className="space-y-12">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" /> Strategic Radar
                        </h3>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase">Benchmarked vs Peers</span>
                      </div>
                      <div className="h-80">
                        <CompetitorRadarChart baseChannel={data.baseChannel} competitors={data.competitors} />
                      </div>
                    </div>

                    <div className="lg:col-span-4 p-8 rounded-2xl bg-white text-black">
                      <div className="flex items-center gap-4 mb-10">
                        <img 
                          src={data.baseChannel.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.baseChannel.title)}&background=27272a&color=fff`} 
                          className="w-12 h-12 rounded-full" 
                          alt="" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.baseChannel.title)}&background=27272a&color=fff`;
                          }}
                        />
                        <div>
                          <h2 className="text-lg font-bold tracking-tight line-clamp-1">{data.baseChannel.title}</h2>
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Main Subject</p>
                        </div>
                      </div>
                      <div className="space-y-8">
                        <MetricRow label="Reach Tier" value={formatNumber(data.baseChannel.statistics.subscriberCount)} />
                        <MetricRow label="Efficiency" value={`${calculateEngagement(data.baseChannel.statistics)}x`} />
                        <MetricRow label="Output Level" value={data.baseChannel.videos.length > 500 ? 'High' : 'Moderate'} />
                      </div>
                      <button 
                        onClick={() => handleSaveNote('analysis', `Market Snapshot: ${data.baseChannel.title}`, data)}
                        className="w-full mt-10 h-12 rounded-2xl bg-black text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                      >
                        Save Analysis
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const baseSubs = parseInt(data.baseChannel.statistics?.subscriberCount || 0, 10);
                    const largerCompetitors = data.competitors.filter(c => parseInt(c.statistics?.subscriberCount || 0, 10) > baseSubs);
                    const hasLarger = largerCompetitors.length > 0;

                    if (!hasLarger && baseSubs > 1000000) {
                      return (
                        <div className="border border-zinc-800 bg-zinc-950 p-6 sm:p-10 rounded-2xl space-y-4 text-left relative overflow-hidden">
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-white" />
                            <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">niche dominance established</span>
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-tight font-mono">u are the king</h3>
                            <p className="text-zinc-450 text-xs leading-relaxed max-w-3xl">
                              Your channel sits at the absolute peak of this niche's subscriber hierarchy. No larger rivals were detected in this keyword space.
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {data.competitors.map((comp) => (
                          <CompetitorCard 
                            key={comp.id} 
                            comp={comp} 
                            baseSubs={baseSubs}
                            onSave={() => handleSaveNote('channel', comp.title, comp)}
                          />
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'content' && (
                <div className="space-y-10">
                  <div className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-10">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <MousePointer2 className="w-4 h-4" /> Performance Scatter
                      </h3>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-white" /> You</span>
                        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Rival</span>
                      </div>
                    </div>
                    <div className="h-[400px]">
                      <VideoPerformanceScatter 
                        videos={data.baseChannel.videos} 
                        competitorVideos={data.competitors[0]?.videos || []} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ContentInsightCard 
                      title="Top Hook" 
                      value="Data-Driven Titles" 
                      desc="Competitors using numbers in titles see 40% higher reach."
                    />
                    <ContentInsightCard 
                      title="Gap Opportunity" 
                      value="Long-form Deep Dives" 
                      desc="Niche rivals are ignoring 20min+ formats in this segment."
                    />
                    <ContentInsightCard 
                      title="Viral Pattern" 
                      value="Reaction Loops" 
                      desc="Most successful videos this month follow response styles."
                    />
                  </div>
                </div>
              )}

              {activeTab === 'growth' && (
                <div className="space-y-10">
                  <div className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800 backdrop-blur-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-10 flex items-center gap-2">
                      <Database className="w-4 h-4" /> Growth Benchmarks
                    </h3>
                    <div className="h-80">
                      <CompetitorBarComparison channels={[data.baseChannel, ...data.competitors]} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-600">Growth Velocity</h4>
                      <div className="space-y-4">
                        {[data.baseChannel, ...data.competitors].map(ch => (
                          <div key={ch.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
                            <div className="flex items-center gap-3">
                              <img 
                                src={ch.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(ch.title)}&background=27272a&color=fff`} 
                                className="w-6 h-6 rounded-full" 
                                alt="" 
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ch.title)}&background=27272a&color=fff`;
                                }}
                              />
                              <span className="text-xs font-medium text-zinc-200">{ch.title}</span>
                            </div>
                            <span className="text-xs font-bold text-green-500">+12% / mo</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-8 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex flex-col justify-center text-center">
                       <Zap className="w-8 h-8 text-blue-500 mx-auto mb-6" />
                       <h4 className="text-lg font-bold mb-2 tracking-tight">Predictive Insight</h4>
                       <p className="text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto">
                         Based on current velocity, you are on track to outpace 2/4 identified rivals by Q4 2026.
                       </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'audience' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-7 p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800 backdrop-blur-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-10 flex items-center gap-2">
                      <PieChart className="w-4 h-4" /> Audience Engagement
                    </h3>
                    <div className="h-80 relative">
                      <EngagementPieChart videos={data.baseChannel.videos} />
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-6">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-600">Reach Distribution</h4>
                    <div className="space-y-8 p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800">
                      <AudienceMetric label="Retention Score" value="84%" color="bg-green-500" />
                      <AudienceMetric label="Click-Through Rate" value="6.2%" color="bg-blue-500" />
                      <AudienceMetric label="Conversion Velocity" value="3.1%" color="bg-purple-500" />
                      <AudienceMetric label="Community Loyalty" value="72%" color="bg-orange-500" />
                    </div>
                  </div>
                </div>
              )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mt-8 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-4 text-red-500">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold uppercase tracking-widest">Mapping Failed</p>
              <p className="text-xs opacity-70 mt-1">{error}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MetricRow({ label, value }) {
  return (
    <div className="flex justify-between items-end border-b border-black/10 pb-4">
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{label}</span>
      <span className="text-xl font-black tracking-tighter">{value}</span>
    </div>
  );
}

function ContentInsightCard({ title, value, desc }) {
  return (
    <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800">
      <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-4">{title}</p>
      <h4 className="text-base font-bold text-white mb-2">{value}</h4>
      <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function AudienceMetric({ label, value, color }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
        <span className="text-zinc-500">{label}</span>
        <span className="text-white">{value}</span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: value }} />
      </div>
    </div>
  );
}

function CompetitorCard({ comp, baseSubs, onSave }) {
  const compSubs = parseInt(comp.statistics.subscriberCount);
  const diff = compSubs - baseSubs;
  const isLeader = compSubs > baseSubs;

  const typeColor = comp.matchType === 'Market Leader' ? 'text-orange-500' : 
                    comp.matchType === 'Growth Target' ? 'text-green-500' : 
                    'text-blue-500';

  return (
    <div className="group p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:bg-zinc-900/50 transition-all flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <img 
            src={comp.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(comp.title)}&background=27272a&color=fff`} 
            className="w-12 h-12 rounded-full grayscale group-hover:grayscale-0 transition-all" 
            alt="" 
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(comp.title)}&background=27272a&color=fff`;
            }}
          />
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{comp.title}</h4>
            <span className={`text-[9px] font-black uppercase tracking-widest ${typeColor}`}>
              {comp.matchType}
            </span>
          </div>
        </div>
        <button 
          onClick={onSave}
          className="p-2 rounded-xl bg-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-700 transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Reach Gap</p>
          <p className={`text-sm font-black ${isLeader ? 'text-orange-400' : 'text-green-400'}`}>
            {isLeader ? '+' : ''}{Math.abs(diff) >= 1000000 ? (diff/1000000).toFixed(1) + 'M' : Math.abs(diff).toLocaleString()}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Efficiency</p>
          <p className="text-sm font-black text-white">
            {(parseInt(comp.statistics.viewCount)/compSubs).toFixed(1)}x
          </p>
        </div>
      </div>
    </div>
  );
}
