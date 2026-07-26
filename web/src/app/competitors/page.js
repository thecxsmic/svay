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
  RefreshCw, 
  Plus, 
  AlertCircle,
  Eye,
  Search,
  Activity,
  PieChart,
  Mail,
  Trophy,
  Clock,
  Filter,
  ExternalLink,
  Video,
  Heart,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Save,
} from 'lucide-react';
import { useTitle } from '@/lib/hooks/titles';
import ResearchNotesModal from '../components/ResearchNotesModal';
import { 
  EngagementPieChart, 
  CompetitorRadarChart, 
  CompetitorBarComparison, 
  CompetitorShareChart,
  VideoPerformanceScatter 
} from "../components/ChannelCharts";
import {
  ProgressLoader,
  EmptyState,
  DashPage,
  DashToolbar,
  DashBody,
  DashButton,
  MetaChip,
  DashKpi,
  DashPanel,
  DashChip,
  DashAlert,
} from '../components/dashboard/ui';

const CACHE_KEY_PREFIX = 'competitor_analysis_cache_v2_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export default function CompetitorsPage() {
  useTitle("Compare competitors");
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
  const [activeTab, setActiveTab] = useState('overview');
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedNoteItem, setSelectedNoteItem] = useState(null);
  const [sortBy, setSortBy] = useState('subs'); // subs | views | efficiency | eng
  const [typeFilter, setTypeFilter] = useState('all');
  const [barMetric, setBarMetric] = useState('views');
  const [rivalId, setRivalId] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState(null);

  const selectedChannel = channels.data.find(c => c.id === channels.selectedId);
  const getCacheKey = () => `${CACHE_KEY_PREFIX}${selectedChannel?.id || 'default'}`;

  const handleSendEmail = async () => {
    const analysisId = searchParams.get('analysisId');
    if (!analysisId || sendingEmail) return;
    setSendingEmail(true);
    setEmailSuccessMsg(null);
    setError(null);
    try {
      const res = await fetch('/api/competitors/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          userId: user?.id,
          email: user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress
        })
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to send email');
      }
      setLastEmailSentAt(Date.now());
      setEmailSuccessMsg(json.message || 'Report emailed successfully!');
      setTimeout(() => setEmailSuccessMsg(null), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingEmail(false);
    }
  };

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
      setCurrentStep('Checking how rivals are doing...');
      
      const baseSubs = parseInt(subjectData.channel.statistics.subscriberCount);
      
      const competitors = await Promise.all(analysis.competitor_ids.map(async (cId) => {
        try {
          const cRes = await fetch(`/api/youtube/channel?channelId=${cId}`);
          const cData = await cRes.json();
          if (cData.success && cData.channel) {
            const compSubs = parseInt(cData.channel.statistics.subscriberCount);
            let matchType = "Rising channel";
            if (compSubs > baseSubs * 10) matchType = "Top channel";
            else if (compSubs > baseSubs * 2) matchType = "Bigger channel";
            else if (compSubs >= baseSubs * 0.5) matchType = "Similar size";
            
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
      setCurrentStep('Learning about your channel...');
      setProgress(10);
      const res = await fetch(`/api/youtube/channel?channelId=${selectedChannel.id}`);
      const baseData = await res.json();
      if (!res.ok) throw new Error(baseData.error || "Failed to fetch channel data");
      
      const baseChannel = { ...baseData.channel, videos: baseData.videos || [] };

      setCurrentStep('Finding rival channels...');
      setProgress(30);
      const topVideos = [...baseChannel.videos]
        .sort((a, b) => parseInt(b.statistics?.viewCount || 0) - parseInt(a.statistics?.viewCount || 0))
        .slice(0, 3);
      
      const nicheQuery = topVideos.length > 0 
        ? topVideos.map(v => v.snippet.title.split(' ').slice(0, 2).join(' ')).join(' ')
        : selectedChannel.title;

      setCurrentStep('Searching similar creators...');
      setProgress(50);
      const compRes = await fetch(`/api/youtube/channel?q=${encodeURIComponent(nicheQuery)}`);
      const compData = await compRes.json();
      const initialResults = compData.items || [];
      const currentSubs = parseInt(baseChannel.statistics.subscriberCount || 0);

      setCurrentStep('Comparing their stats...');
      setProgress(70);
      const filtered = initialResults.filter(c => c.id !== selectedChannel.id).slice(0, 4);
      
      const deepCompetitors = await Promise.all(filtered.map(async (c) => {
        try {
          const detailRes = await fetch(`/api/youtube/channel?channelId=${c.id}`);
          const detailData = await detailRes.json();
          if (detailData.success) {
            const compSubs = parseInt(detailData.channel.statistics.subscriberCount);
            let matchType = "Rising channel";
            if (compSubs > currentSubs * 10) matchType = "Top channel";
            else if (compSubs > currentSubs * 2) matchType = "Bigger channel";
            else if (compSubs >= currentSubs * 0.5) matchType = "Similar size";

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
            title: `Compare: ${baseChannel.title}`
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
    const n = parseInt(num || 0, 10);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const deriveStats = (ch) => {
    if (!ch) return null;
    const views = parseInt(ch.statistics?.viewCount || 0, 10);
    const subs = parseInt(ch.statistics?.subscriberCount || 0, 10);
    const videos = parseInt(ch.statistics?.videoCount || 0, 10);
    const recent = ch.videos || [];
    const recentViews = recent.map((v) => parseInt(v.statistics?.viewCount || 0, 10));
    const avgRecent =
      recentViews.length > 0
        ? recentViews.reduce((a, b) => a + b, 0) / recentViews.length
        : views / Math.max(1, videos);
    const engRates = recent.map((v) => {
      const vv = Math.max(1, parseInt(v.statistics?.viewCount || 1, 10));
      const likes = parseInt(v.statistics?.likeCount || 0, 10);
      const comments = parseInt(v.statistics?.commentCount || 0, 10);
      return ((likes + comments) / vv) * 100;
    });
    const avgEng =
      engRates.length > 0
        ? engRates.reduce((a, b) => a + b, 0) / engRates.length
        : 0;
    const topTitle = [...recent]
      .sort(
        (a, b) =>
          parseInt(b.statistics?.viewCount || 0, 10) -
          parseInt(a.statistics?.viewCount || 0, 10)
      )[0]?.snippet?.title;
    return {
      views,
      subs,
      videos,
      avgRecent,
      avgEng,
      viewsPerSub: views / Math.max(1, subs),
      viewsPerVideo: views / Math.max(1, videos),
      topTitle,
    };
  };

  const insights = useMemo(() => {
    if (!data?.baseChannel) return null;
    const you = deriveStats(data.baseChannel);
    const rivals = (data.competitors || []).map((c) => ({
      ...c,
      stats: deriveStats(c),
    }));
    const all = [{ id: 'you', title: data.baseChannel.title, isYou: true, stats: you }, ...rivals.map((r) => ({ ...r, isYou: false }))];
    const bySubs = [...all].sort((a, b) => b.stats.subs - a.stats.subs);
    const rank = bySubs.findIndex((x) => x.isYou) + 1;
    const larger = rivals.filter((r) => r.stats.subs > you.subs);
    const smaller = rivals.filter((r) => r.stats.subs <= you.subs);
    const bestEff = [...all].sort((a, b) => b.stats.viewsPerSub - a.stats.viewsPerSub)[0];
    const bestEng = [...all].sort((a, b) => b.stats.avgEng - a.stats.avgEng)[0];
    const bestAvg = [...all].sort((a, b) => b.stats.avgRecent - a.stats.avgRecent)[0];
    const avgRivalSubs =
      rivals.length > 0
        ? rivals.reduce((a, r) => a + r.stats.subs, 0) / rivals.length
        : 0;
    const gapToLeader =
      larger.length > 0
        ? Math.min(...larger.map((r) => r.stats.subs)) - you.subs
        : 0;
    const share =
      all.reduce((a, x) => a + x.stats.subs, 0) > 0
        ? (you.subs / all.reduce((a, x) => a + x.stats.subs, 0)) * 100
        : 0;

    // Content pattern heuristics from titles
    const allTitles = [
      ...(data.baseChannel.videos || []),
      ...rivals.flatMap((r) => r.videos || []),
    ].map((v) => v.snippet?.title || '');
    const withNumbers = allTitles.filter((t) => /\d/.test(t)).length;
    const withHow = allTitles.filter((t) => /how to|how i|guide/i.test(t)).length;
    const withVs = allTitles.filter((t) => /\bvs\b|versus|react/i.test(t)).length;

    return {
      you,
      rivals,
      all,
      bySubs,
      rank,
      larger,
      smaller,
      bestEff,
      bestEng,
      bestAvg,
      avgRivalSubs,
      gapToLeader,
      share,
      isKing: larger.length === 0 && you.subs > 1000000,
      contentHints: {
        withNumbers,
        withHow,
        withVs,
        total: allTitles.length || 1,
      },
    };
  }, [data]);

  useEffect(() => {
    if (data?.competitors?.length && !rivalId) {
      setRivalId(data.competitors[0].id);
    }
  }, [data?.competitors, rivalId]);

  const filteredRivals = useMemo(() => {
    if (!insights) return [];
    let list = [...insights.rivals];
    if (typeFilter !== 'all') {
      list = list.filter((r) => r.matchType === typeFilter);
    }
    list.sort((a, b) => {
      if (sortBy === 'views') return b.stats.views - a.stats.views;
      if (sortBy === 'efficiency') return b.stats.viewsPerSub - a.stats.viewsPerSub;
      if (sortBy === 'eng') return b.stats.avgEng - a.stats.avgEng;
      return b.stats.subs - a.stats.subs;
    });
    return list;
  }, [insights, sortBy, typeFilter]);

  const selectedRival =
    data?.competitors?.find((c) => c.id === rivalId) || data?.competitors?.[0];

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Gauge },
    { id: 'rivals', label: 'Rivals', icon: Users, count: data?.competitors?.length },
    { id: 'content', label: 'Content', icon: Activity },
    { id: 'growth', label: 'Benchmarks', icon: TrendingUp },
    { id: 'audience', label: 'Engagement', icon: PieChart },
  ];

  const getCacheAge = () => {
    if (!lastScanTime) return '';
    const mins = Math.floor((Date.now() - lastScanTime) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const typeColor = (t) =>
    t === 'Top channel'
      ? 'text-orange-400 border-orange-500/25 bg-orange-500/10'
      : t === 'Bigger channel'
        ? 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10'
        : t === 'Similar size'
          ? 'text-sky-400 border-sky-500/25 bg-sky-500/10'
          : 'text-zinc-400 border-white/10 bg-white/5';

  return (
    <DashPage>
      <ResearchNotesModal
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        item={selectedNoteItem}
      />

      <DashToolbar
        left={
          <>
            {selectedChannel && <MetaChip>{selectedChannel.title}</MetaChip>}
            {lastScanTime && !loading && (
              <MetaChip icon={Clock}>Scanned {getCacheAge()}</MetaChip>
            )}
            {data && !loading && insights && (
              <MetaChip icon={Trophy}>
                Rank #{insights.rank} of {insights.all.length}
              </MetaChip>
            )}
          </>
        }
        mobileLeft={
          data && !loading ? (
            <>
              {selectedChannel && (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                    Channel
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-white">
                    {selectedChannel.title}
                  </p>
                </div>
              )}
              {lastScanTime && (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                    Last scan
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-white">
                    {getCacheAge()}
                  </p>
                </div>
              )}
              {insights && (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                    Rank
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-white">
                    #{insights.rank} of {insights.all.length}
                  </p>
                </div>
              )}
            </>
          ) : null
        }
        tabItems={data && !loading ? TABS : undefined}
        tabValue={activeTab}
        onTabChange={setActiveTab}
      >
        {data && !loading && (
          <DashButton
            variant="secondary"
            size="sm"
            onClick={() =>
              handleSaveNote(
                'analysis',
                `Competitor report: ${data.baseChannel.title}`,
                data
              )
            }
            className="!h-9 !px-2.5 sm:!px-3.5"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save</span>
          </DashButton>
        )}
        <DashButton
          size="sm"
          onClick={analyzeCompetitors}
          disabled={loading || !selectedChannel}
          className="!h-9 !px-2.5 sm:!px-3.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {loading ? 'Analyzing' : data ? 'Rescan' : 'Scan'}
          </span>
        </DashButton>
      </DashToolbar>

      <DashBody className="space-y-6 pb-20">
        {emailSuccessMsg && (
          <DashAlert variant="success">
            <p className="font-bold uppercase tracking-wider">Email sent</p>
            <p className="mt-0.5 opacity-80">{emailSuccessMsg}</p>
          </DashAlert>
        )}
        {error && (
          <DashAlert variant="error">
            <p className="font-bold uppercase tracking-wider">Could not compare channels</p>
            <p className="mt-0.5 opacity-80">{error}</p>
          </DashAlert>
        )}

        <AnimatePresence mode="wait">
          {!data && !loading && (
            <EmptyState
              key="empty"
              icon={Search}
              title="Compare your rivals"
              description="See how you stack up on size, views, and likes."
              action={
                <DashButton
                  onClick={analyzeCompetitors}
                  disabled={!selectedChannel}
                  size="lg"
                >
                  Start compare
                </DashButton>
              }
            />
          )}

          {loading && (
            <ProgressLoader
              key="loading"
              progress={progress}
              step={currentStep || 'Analyzing…'}
            />
          )}

          {data && !loading && insights && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* ── OVERVIEW ───────────────────────────────────────── */}
              {activeTab === 'overview' && (
                <>
                  {insights.isKing && (
                    <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-5 sm:p-6">
                      <div className="flex items-start gap-3">
                        <Trophy className="mt-0.5 h-5 w-5 text-amber-400" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-400/80">
                            You lead this group
                          </p>
                          <h3 className="mt-1 font-display text-lg uppercase tracking-tight text-white">
                            You have the most fans
                          </h3>
                          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-400">
                            You have more subscribers than the rivals we found. Keep posting often and keep views strong.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                    <DashKpi
                      label="Rank"
                      value={`#${insights.rank}`}
                      icon={Trophy}
                      tone="text-amber-400"
                      sub={`${insights.all.length} tracked`}
                      className="!p-3 sm:!p-5"
                    />
                    <DashKpi
                      label="Subs"
                      value={formatNumber(insights.you.subs)}
                      icon={Users}
                      tone="text-[#00f0ff]"
                      sub={
                        insights.gapToLeader > 0
                          ? `${formatNumber(insights.gapToLeader)} to lead`
                          : 'Leading'
                      }
                      className="!p-3 sm:!p-5"
                    />
                    <DashKpi
                      label="Share"
                      value={`${insights.share.toFixed(0)}%`}
                      icon={Target}
                      tone="text-violet-400"
                      sub="Of this group"
                      className="!p-3 sm:!p-5"
                    />
                    <DashKpi
                      label="Views / fan"
                      value={insights.you.viewsPerSub.toFixed(1) + 'x'}
                      icon={Zap}
                      tone="text-orange-400"
                      sub={insights.bestEff?.isYou ? 'Best here' : 'Views per fan'}
                      className="!p-3 sm:!p-5"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    <DashPanel
                      title="Strengths chart"
                      icon={BarChart3}
                      className="lg:col-span-7"
                      bodyClassName="h-80 p-4 sm:p-5"
                    >
                      <CompetitorRadarChart
                        baseChannel={data.baseChannel}
                        competitors={data.competitors}
                        maxRivals={4}
                      />
                    </DashPanel>

                    <DashPanel
                      title="Your share of this group"
                      icon={PieChart}
                      className="lg:col-span-5"
                      bodyClassName="h-80 p-4 sm:p-5"
                    >
                      <CompetitorShareChart
                        channels={[data.baseChannel, ...data.competitors]}
                      />
                    </DashPanel>
                  </div>

                  <DashPanel
                    title="Leaderboard"
                    icon={Trophy}
                    action={
                      <button
                        type="button"
                        onClick={() => setActiveTab('rivals')}
                        className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white"
                      >
                        All rivals →
                      </button>
                    }
                    bodyClassName="divide-y divide-white/[0.04]"
                  >
                    {insights.bySubs.map((row, i) => (
                      <div
                        key={row.id || row.title}
                        className={`flex items-center gap-3 px-4 py-3.5 sm:px-5 ${
                          row.isYou ? 'bg-[#00f0ff]/[0.04]' : ''
                        }`}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] font-display text-xs text-zinc-400">
                          {i + 1}
                        </span>
                        <Avatar ch={row.isYou ? data.baseChannel : row} size={8} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">
                            {row.isYou ? `You · ${row.title}` : row.title}
                          </p>
                          {!row.isYou && row.matchType && (
                            <span
                              className={`mt-0.5 inline-flex rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${typeColor(
                                row.matchType
                              )}`}
                            >
                              {row.matchType}
                            </span>
                          )}
                        </div>
                        <div className="hidden text-right sm:block">
                          <p className="text-xs font-bold tabular-nums text-zinc-200">
                            {formatNumber(row.stats.subs)}
                          </p>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                            subs
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold tabular-nums text-zinc-300">
                            {row.stats.viewsPerSub.toFixed(1)}x
                          </p>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                            views/fan
                          </p>
                        </div>
                      </div>
                    ))}
                  </DashPanel>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <InsightCard
                      title="Best views per fan"
                      value={insights.bestEff?.isYou ? 'You' : insights.bestEff?.title}
                      desc={`${(insights.bestEff?.stats?.viewsPerSub || 0).toFixed(1)}x views for each subscriber`}
                      icon={Zap}
                    />
                    <InsightCard
                      title="Best engagement"
                      value={insights.bestEng?.isYou ? 'You' : insights.bestEng?.title}
                      desc={`${(insights.bestEng?.stats?.avgEng || 0).toFixed(2)}% avg on recent uploads`}
                      icon={Heart}
                    />
                    <InsightCard
                      title="Best recent views"
                      value={
                        insights.bestAvg?.isYou
                          ? 'You lead'
                          : insights.bestAvg?.title
                      }
                      desc={`${formatNumber(insights.bestAvg?.stats?.avgRecent || 0)} avg on last videos`}
                      icon={Eye}
                    />
                  </div>
                </>
              )}

              {/* ── RIVALS ─────────────────────────────────────────── */}
              {activeTab === 'rivals' && (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                      <Filter className="h-3 w-3" /> Sort
                    </span>
                    {[
                      { id: 'subs', label: 'Subs' },
                      { id: 'views', label: 'Views' },
                      { id: 'efficiency', label: 'Views per fan' },
                      { id: 'eng', label: 'Engagement' },
                    ].map((s) => (
                      <DashChip
                        key={s.id}
                        active={sortBy === s.id}
                        onClick={() => setSortBy(s.id)}
                      >
                        {s.label}
                      </DashChip>
                    ))}
                    <span className="mx-1 hidden h-4 w-px bg-white/10 sm:inline" />
                    {['all', 'Top channel', 'Bigger channel', 'Similar size', 'Rising channel'].map(
                      (t) => (
                        <DashChip
                          key={t}
                          active={typeFilter === t}
                          onClick={() => setTypeFilter(t)}
                        >
                          {t === 'all' ? 'All types' : t}
                        </DashChip>
                      )
                    )}
                  </div>

                  {filteredRivals.length === 0 ? (
                    <p className="py-16 text-center text-sm text-zinc-600">
                      No rivals match this filter.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {filteredRivals.map((comp) => (
                        <CompetitorCard
                          key={comp.id}
                          comp={comp}
                          you={insights.you}
                          formatNumber={formatNumber}
                          typeColor={typeColor}
                          onSave={() => handleSaveNote('channel', comp.title, comp)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── CONTENT ────────────────────────────────────────── */}
              {activeTab === 'content' && (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                      Compare vs
                    </span>
                    {(data.competitors || []).map((c) => (
                      <DashChip
                        key={c.id}
                        active={rivalId === c.id}
                        onClick={() => setRivalId(c.id)}
                      >
                        {(c.title || '').slice(0, 20)}
                      </DashChip>
                    ))}
                  </div>

                  <DashPanel
                    title="Views vs likes scatter"
                    icon={Activity}
                    action={
                      selectedRival ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                          You · {selectedRival.title?.slice(0, 16)}
                        </span>
                      ) : null
                    }
                    bodyClassName="h-[380px] p-4 sm:h-[420px] sm:p-5"
                  >
                    <VideoPerformanceScatter
                      videos={data.baseChannel.videos}
                      competitorVideos={selectedRival?.videos || []}
                      youLabel="You"
                      rivalLabel={selectedRival?.title?.slice(0, 16) || 'Rival'}
                    />
                  </DashPanel>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <InsightCard
                      title="Numeric titles"
                      value={`${Math.round(
                        (insights.contentHints.withNumbers /
                          insights.contentHints.total) *
                          100
                      )}%`}
                      desc="Many titles use numbers — that often gets more clicks."
                      icon={BarChart3}
                    />
                    <InsightCard
                      title="How-to / guides"
                      value={`${Math.round(
                        (insights.contentHints.withHow / insights.contentHints.total) *
                          100
                      )}%`}
                      desc="Share of how-to titles among you and rivals."
                      icon={Target}
                    />
                    <InsightCard
                      title="React / vs videos"
                      value={`${Math.round(
                        (insights.contentHints.withVs / insights.contentHints.total) *
                          100
                      )}%`}
                      desc="Share of reaction or vs-style titles."
                      icon={Zap}
                    />
                  </div>

                  {insights.you.topTitle && (
                    <DashPanel title="Your top recent video" icon={Video} bodyClassName="p-5">
                      <p className="text-sm font-semibold text-white">
                        {insights.you.topTitle}
                      </p>
                      <p className="mt-2 text-xs text-zinc-500">
                        Your best recent video by views — study its title and style.
                      </p>
                    </DashPanel>
                  )}
                </>
              )}

              {/* ── GROWTH / BENCHMARKS ─────────────────────────────── */}
              {activeTab === 'growth' && (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                      Metric
                    </span>
                    {[
                      { id: 'views', label: 'Total views' },
                      { id: 'subs', label: 'Subscribers' },
                      { id: 'vpv', label: 'Views / video' },
                      { id: 'efficiency', label: 'Views / sub' },
                    ].map((m) => (
                      <DashChip
                        key={m.id}
                        active={barMetric === m.id}
                        onClick={() => setBarMetric(m.id)}
                      >
                        {m.label}
                      </DashChip>
                    ))}
                  </div>

                  <DashPanel
                    title="Side-by-side comparison"
                    icon={TrendingUp}
                    bodyClassName="h-80 p-4 sm:p-5"
                  >
                    <CompetitorBarComparison
                      channels={[data.baseChannel, ...data.competitors]}
                      metric={barMetric}
                    />
                  </DashPanel>

                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <DashPanel title="How you compare" icon={Gauge} bodyClassName="divide-y divide-white/[0.04]">
                      {insights.bySubs.map((row) => {
                        const delta = row.stats.subs - insights.you.subs;
                        return (
                          <div
                            key={row.id || row.title}
                            className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <Avatar ch={row.isYou ? data.baseChannel : row} size={7} />
                              <span className="truncate text-sm font-medium text-zinc-200">
                                {row.isYou ? 'You' : row.title}
                              </span>
                            </div>
                            {row.isYou ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00f0ff]">
                                you
                              </span>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-bold tabular-nums ${
                                  delta > 0 ? 'text-orange-400' : 'text-emerald-400'
                                }`}
                              >
                                {delta > 0 ? (
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                ) : delta < 0 ? (
                                  <ArrowDownRight className="h-3.5 w-3.5" />
                                ) : (
                                  <Minus className="h-3.5 w-3.5" />
                                )}
                                {delta > 0 ? '+' : ''}
                                {formatNumber(delta)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </DashPanel>

                    <DashPanel title="What to do next" icon={Target} bodyClassName="space-y-3 p-5">
                      <ActionTip
                        n={1}
                        text={
                          insights.gapToLeader > 0
                            ? `You are ${formatNumber(insights.gapToLeader)} subscribers behind the leader. Post every week to catch up.`
                            : 'You lead on subscribers — make more videos like your best recent ones.'
                        }
                      />
                      <ActionTip
                        n={2}
                        text={
                          insights.bestEff && !insights.bestEff.isYou
                            ? `Study ${insights.bestEff.title}'s titles and thumbnails — they get more views per fan (${insights.bestEff.stats.viewsPerSub.toFixed(1)}x).`
                            : 'You get the most views per fan — keep that style and drop weak series.'
                        }
                      />
                      <ActionTip
                        n={3}
                        text="Open the Content tab and compare yourself to a peer. Copy what gets more likes."
                      />
                    </DashPanel>
                  </div>
                </>
              )}

              {/* ── AUDIENCE ───────────────────────────────────────── */}
              {activeTab === 'audience' && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <DashPanel
                    title="How people interact"
                    icon={PieChart}
                    className="lg:col-span-7"
                    bodyClassName="h-80 p-4 sm:p-5"
                  >
                    {(data.baseChannel.videos || []).length > 0 ? (
                      <EngagementPieChart videos={data.baseChannel.videos} />
                    ) : (
                      <p className="flex h-full items-center justify-center text-sm text-zinc-600">
                        No videos loaded yet for this chart.
                      </p>
                    )}
                  </DashPanel>

                  <div className="space-y-3 lg:col-span-5">
                    <DashKpi
                      label="Avg engagement"
                      value={`${insights.you.avgEng.toFixed(2)}%`}
                      icon={Heart}
                      tone="text-pink-400"
                      sub="Likes + comments / views"
                    />
                    <DashKpi
                      label="Avg recent views"
                      value={formatNumber(insights.you.avgRecent)}
                      icon={Eye}
                      tone="text-[#00f0ff]"
                      sub="From loaded uploads"
                    />
                    <DashKpi
                      label="Library size"
                      value={formatNumber(insights.you.videos)}
                      icon={Video}
                      sub={`${formatNumber(insights.you.viewsPerVideo)} views / video lifetime`}
                    />

                    <DashPanel title="You vs rivals (likes + comments)" bodyClassName="divide-y divide-white/[0.04]">
                      {[
                        { label: 'You', stats: insights.you, you: true },
                        ...insights.rivals.map((r) => ({
                          label: r.title,
                          stats: r.stats,
                          you: false,
                        })),
                      ]
                        .sort((a, b) => b.stats.avgEng - a.stats.avgEng)
                        .map((row) => (
                          <div
                            key={row.label}
                            className="flex items-center justify-between px-4 py-3"
                          >
                            <span
                              className={`truncate text-xs font-semibold ${
                                row.you ? 'text-[#00f0ff]' : 'text-zinc-300'
                              }`}
                            >
                              {row.you ? 'You' : row.label}
                            </span>
                            <span className="text-xs font-bold tabular-nums text-zinc-200">
                              {row.stats.avgEng.toFixed(2)}%
                            </span>
                          </div>
                        ))}
                    </DashPanel>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DashBody>
    </DashPage>
  );
}

function Avatar({ ch, size = 8 }) {
  const dim =
    size === 7 ? 'h-7 w-7' : size === 10 ? 'h-10 w-10' : size === 12 ? 'h-12 w-12' : 'h-8 w-8';
  const name = ch?.title || '?';
  const src =
    ch?.thumbnail ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=27272a&color=fff`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={`${dim} shrink-0 rounded-full border border-white/10 object-cover`}
      referrerPolicy="no-referrer"
      onError={(e) => {
        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=27272a&color=fff`;
      }}
    />
  );
}

function InsightCard({ title, value, desc, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-zinc-500" />}
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-600">
          {title}
        </p>
      </div>
      <p className="line-clamp-1 font-display text-lg tracking-tight text-white">
        {value || '—'}
      </p>
      {desc && (
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{desc}</p>
      )}
    </div>
  );
}

function ActionTip({ n, text }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/5 text-[10px] font-bold text-zinc-400">
        {n}
      </span>
      <p className="text-sm leading-relaxed text-zinc-400">{text}</p>
    </div>
  );
}

function CompetitorCard({ comp, you, formatNumber, typeColor, onSave }) {
  const s = comp.stats;
  const subGap = s.subs - you.subs;
  const isLeader = subGap > 0;
  const effDelta = s.viewsPerSub - you.viewsPerSub;

  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-5 transition-colors hover:border-white/15">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar ch={comp} size={10} />
          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold text-white group-hover:text-[#93e9ff]">
              {comp.title}
            </h4>
            <span
              className={`mt-1 inline-flex rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${typeColor(
                comp.matchType
              )}`}
            >
              {comp.matchType}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          {comp.customUrl || comp.id ? (
            <a
              href={`https://youtube.com/channel/${comp.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-500 hover:text-white"
              title="Open on YouTube"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
          <button
            type="button"
            onClick={onSave}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-500 transition-all hover:bg-white hover:text-black"
            title="Save to library"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat
          label="Subs"
          value={formatNumber(s.subs)}
          hint={
            <span className={isLeader ? 'text-orange-400' : 'text-emerald-400'}>
              {isLeader ? '+' : ''}
              {formatNumber(subGap)} vs you
            </span>
          }
        />
        <MiniStat label="Views" value={formatNumber(s.views)} />
        <MiniStat
          label="Efficiency"
          value={`${s.viewsPerSub.toFixed(1)}x`}
          hint={
            <span className={effDelta >= 0 ? 'text-orange-400' : 'text-emerald-400'}>
              {effDelta >= 0 ? '+' : ''}
              {effDelta.toFixed(1)} vs you
            </span>
          }
        />
        <MiniStat
          label="Engagement"
          value={`${s.avgEng.toFixed(2)}%`}
          hint="Recent sample"
        />
      </div>

      <div className="flex flex-wrap gap-3 border-t border-white/[0.05] pt-3 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
        <span className="inline-flex items-center gap-1">
          <Video className="h-3 w-3" /> {formatNumber(s.videos)} videos
        </span>
        <span className="inline-flex items-center gap-1">
          <Eye className="h-3 w-3" /> {formatNumber(s.avgRecent)} avg recent
        </span>
      </div>
    </div>
  );
}

function MiniStat({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-black/30 px-2.5 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold tabular-nums text-white">{value}</p>
      {hint && (
        <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-600">
          {hint}
        </div>
      )}
    </div>
  );
}
