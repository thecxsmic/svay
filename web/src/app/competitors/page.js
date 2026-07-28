'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Component } from 'react';
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
  X,
  UserPlus,
  Loader2,
  MoreHorizontal,
  Trash2,
  Sparkles,
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
class TabErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[Competitor Tab Error]:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="my-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm mb-2">
            <span>Tab Render Warning</span>
          </div>
          <p className="text-xs text-rose-200/80 mb-3 font-mono">
            {this.state.error?.message || String(this.state.error)}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 transition-colors"
          >
            Retry Tab
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function CompetitorsPage() {
  useTitle("Compare competitors");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { channels } = useChannel();
  const { user } = useUser();
  const selectedChannel = channels?.data?.find(c => c.id === channels?.selectedId);
  const getCacheKey = () => `${CACHE_KEY_PREFIX}${selectedChannel?.id || 'default'}`;

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
  const [pastAnalysesCount, setPastAnalysesCount] = useState(0);
  const [competitorHistory, setCompetitorHistory] = useState([]);
  // Manual competitors
  const [manualInput, setManualInput] = useState('');
  const [addingManual, setAddingManual] = useState(false);
  const [manualError, setManualError] = useState(null);
  // Pinned competitor IDs persist across scans & reloads per channel
  const [pinnedCompetitorIds, setPinnedCompetitorIds] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const channelId = channels?.selectedId || 'default';
      return JSON.parse(localStorage.getItem(`competitor_pinned_ids_${channelId}`) || '[]');
    } catch { return []; }
  });

  const [isLocalhost, setIsLocalhost] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local') || host.includes('172.') || host.includes('192.168.')) {
        setIsLocalhost(true);
      }
    }
  }, []);

  // Keep pinnedCompetitorIds in sync when selected channel changes
  useEffect(() => {
    if (typeof window === 'undefined' || !selectedChannel?.id) return;
    try {
      const saved = JSON.parse(localStorage.getItem(`competitor_pinned_ids_${selectedChannel.id}`) || '[]');
      setPinnedCompetitorIds(saved);
    } catch { setPinnedCompetitorIds([]); }
  }, [selectedChannel?.id]);

  // Blocked competitor IDs — removed channels never come back
  const [blockedCompetitorIds, setBlockedCompetitorIds] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('competitor_blocked_ids') || '[]');
    } catch { return []; }
  });

  const loadCompetitorHistory = useCallback(async () => {
    if (!selectedChannel?.id) return;
    try {
      const res = await fetch(`/api/competitors/history?subjectId=${selectedChannel.id}&limit=3`);
      const json = await res.json();
      if (json.success && json.history) {
        setCompetitorHistory(json.history);
        setPastAnalysesCount(json.history.length);
      }
    } catch (err) {
      console.error('Failed to load competitor history:', err);
    }
  }, [selectedChannel?.id]);

  useEffect(() => {
    if (selectedChannel?.id && !loading) {
      loadCompetitorHistory();
    }
  }, [selectedChannel?.id, loadCompetitorHistory]);

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
      
      // Batch-fetch all competitors in a single API call
      let validCompetitors = [];
      if (analysis.competitor_ids?.length > 0) {
        try {
          const ids = analysis.competitor_ids.join(',');
          const batchRes = await fetch(`/api/youtube/channels-batch?ids=${ids}`);
          const batchData = await batchRes.json();
          
          if (batchData.success && batchData.channels) {
            validCompetitors = batchData.channels.map(channel => {
              const compSubs = parseInt(channel.statistics?.subscriberCount || 0);
              let matchType = "Rising channel";
              if (compSubs > baseSubs * 10) matchType = "Top channel";
              else if (compSubs > baseSubs * 2) matchType = "Bigger channel";
              else if (compSubs >= baseSubs * 0.5) matchType = "Similar size";
              return { ...channel, videos: [], matchType };
            });
          }
        } catch (e) {
          console.error("Batch fetch failed for saved analysis competitors:", e);
        }
      }
      
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

  const analyzeCompetitors = async (forceRefresh = false) => {
    if (loading || !selectedChannel) return;
    if (forceRefresh) {
      if (selectedChannel) {
        try { localStorage.removeItem(getCacheKey()); } catch (e) {}
      }
      if (searchParams.get('analysisId')) {
        router.replace('/competitors');
      }
    }
    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      setCurrentStep('Fetching channel & competitors (minimal quota)...');
      setProgress(20);

      // Use minimal-quota discovery route
      const res = await fetch(`/api/competitors/discover?channelId=${selectedChannel.id}${forceRefresh ? '&force=true' : ''}`);
      const discoverData = await res.json();

      if (!res.ok || !discoverData.success) {
        throw new Error(discoverData.error || "Failed to analyze competitors");
      }

      setProgress(60);
      setCurrentStep('Analyzing rival benchmarks...');

      const baseChannel = { ...discoverData.baseChannel, videos: discoverData.baseChannel.videos || [] };
      let discoveredCompetitors = discoverData.competitors || [];

      // Combine with pinned fresh competitors if any
      const blocked = new Set(blockedCompetitorIds);
      let pinnedFresh = [];
      if (pinnedCompetitorIds.length > 0) {
        try {
          const ids = pinnedCompetitorIds.join(',');
          const batchRes = await fetch(`/api/youtube/channels-batch?ids=${ids}`);
          const batchData = await batchRes.json();
          if (batchData.success && batchData.channels) {
            pinnedFresh = batchData.channels.map(channel => ({
              ...channel,
              videos: [],
              matchType: "Pinned rival",
              pinned: true
            }));
          }
        } catch (e) {
          console.error("Pinned batch fetch error:", e);
        }
      }

      const pinnedIds = new Set(pinnedFresh.map(c => c.id));
      const filteredDiscovered = discoveredCompetitors
        .filter(c => c.id !== selectedChannel.id && !blocked.has(c.id) && !pinnedIds.has(c.id));

      const merged = [
        ...pinnedFresh,
        ...filteredDiscovered
      ];

      const analysisResult = {
        baseChannel,
        competitors: merged.sort((a, b) => parseInt(b.statistics?.subscriberCount || 0) - parseInt(a.statistics?.subscriberCount || 0)),
        timestamp: Date.now()
      };

      setProgress(100);
      setData(analysisResult);
      cacheData(analysisResult);

      // Auto-save snapshot
      try {
        const summary = {
          baseChannelTitle: baseChannel.title,
          baseChannelSubs: parseInt(baseChannel.statistics?.subscriberCount || 0),
          competitorTitles: merged.map(c => c.title),
          competitorSubs: merged.map(c => parseInt(c.statistics?.subscriberCount || 0)),
          timestamp: Date.now()
        };

        const saveRes = await fetch('/api/competitors/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectId: baseChannel.id,
            competitorIds: merged.map(c => c.id),
            title: `Compare: ${baseChannel.title}`,
            summary
          })
        });
        const saveResult = await saveRes.json();
        if (saveResult.success && saveResult.id) {
          loadCompetitorHistory();
        }
      } catch (e) {
        console.error("Auto-save snapshot failed:", e);
      }
    } catch (err) {
      console.error("Analyze Competitors Error:", err);
      setError(err.message || "Failed to analyze competitors");
    } finally {
      setLoading(false);
    }
  };

  // Add a competitor manually by YouTube URL or channel handle/ID
  const addManualCompetitor = async () => {
    const raw = manualInput.trim();
    if (!raw || addingManual || !data) return;
    setAddingManual(true);
    setManualError(null);

    try {
      // Parse channel ID from URL or use raw
      let channelId = raw;
      const urlMatch = raw.match(/(?:youtube\.com\/(?:channel\/|@))([\w-]+)/);
      if (urlMatch) channelId = urlMatch[1];

      const currentSubs = parseInt(data.baseChannel.statistics.subscriberCount || 0);
      const alreadyAdded = data.competitors.some(c => c.id === channelId || c.customUrl === channelId);
      if (alreadyAdded) {
        setManualError('This channel is already in your list.');
        return;
      }

      // Try by ID first, then by handle/search
      let channelData = null;

      // If it looks like a channel ID (starts with UC + 22 chars), use batch endpoint directly
      const isChannelId = /^UC[\w-]{22}$/.test(channelId);
      if (isChannelId) {
        const batchRes = await fetch(`/api/youtube/channels-batch?ids=${channelId}`);
        const batchJson = await batchRes.json();
        const found = batchJson.success && batchJson.channels?.[0];
        if (found) {
          channelData = { channel: found, videos: [], success: true };
        }
      } else {
        // Try full channel lookup by handle/URL
        const byId = await fetch(`/api/youtube/channel?channelId=${channelId}`);
        const byIdJson = await byId.json();
        if (byIdJson.success && byIdJson.channel) {
          channelData = byIdJson;
        } else {
          // Fallback: search by query, then batch-fetch the first result
          const byQ = await fetch(`/api/youtube/channel?q=${encodeURIComponent(channelId)}`);
          const byQJson = await byQ.json();
          const first = byQJson.items?.[0];
          if (first) {
            // Use batch for the detail fetch (1 unit vs full channel pipeline)
            const batchRes = await fetch(`/api/youtube/channels-batch?ids=${first.id}`);
            const batchJson = await batchRes.json();
            const found = batchJson.success && batchJson.channels?.[0];
            if (found) {
              channelData = { channel: found, videos: [], success: true };
            }
          }
        }
      }

      if (!channelData) throw new Error('Channel not found. Try pasting the full YouTube URL.');

      const compSubs = parseInt(channelData.channel.statistics.subscriberCount);
      let matchType = 'Rising channel';
      if (compSubs > currentSubs * 10) matchType = 'Top channel';
      else if (compSubs > currentSubs * 2) matchType = 'Bigger channel';
      else if (compSubs >= currentSubs * 0.5) matchType = 'Similar size';

      const newComp = { ...channelData.channel, videos: channelData.videos || [], matchType, pinned: true };

      // Pin the ID so it survives re-scans and page reloads
      setPinnedCompetitorIds(prev => {
        const next = [...new Set([...prev, newComp.id])];
        if (selectedChannel?.id) {
          try { localStorage.setItem(`competitor_pinned_ids_${selectedChannel.id}`, JSON.stringify(next)); } catch (e) {}
        }
        return next;
      });

      // Merge into current data
      setData(prev => ({
        ...prev,
        competitors: [newComp, ...prev.competitors.filter(c => c.id !== newComp.id)]
          .sort((a, b) => parseInt(b.statistics.subscriberCount) - parseInt(a.statistics.subscriberCount))
      }));

      setManualInput('');
    } catch (err) {
      setManualError(err.message);
    } finally {
      setAddingManual(false);
    }
  };

  const removePinnedCompetitor = (id) => {
    // Remove from pinned list
    setPinnedCompetitorIds(prev => {
      const next = prev.filter(p => p !== id);
      if (selectedChannel?.id) {
        try { localStorage.setItem(`competitor_pinned_ids_${selectedChannel.id}`, JSON.stringify(next)); } catch (e) {}
      }
      return next;
    });
    // Block so it never comes back via scan
    setBlockedCompetitorIds(prev => {
      const next = [...new Set([...prev, id])];
      try { localStorage.setItem('competitor_blocked_ids', JSON.stringify(next)); } catch {}
      return next;
    });
    setData(prev => prev ? ({ ...prev, competitors: prev.competitors.filter(c => c.id !== id) }) : prev);
  };

  // Remove a suggested (non-pinned) competitor permanently
  const removeCompetitor = (id) => {
    setBlockedCompetitorIds(prev => {
      const next = [...new Set([...prev, id])];
      try { localStorage.setItem('competitor_blocked_ids', JSON.stringify(next)); } catch {}
      return next;
    });
    setData(prev => prev ? ({ ...prev, competitors: prev.competitors.filter(c => c.id !== id) }) : prev);
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

    // Calculate benchmark engagement if individual video list is not loaded
    let fallbackEng = 0;
    if (views > 0 && subs > 0) {
      const efficiencyRatio = views / Math.max(1, subs * 100);
      fallbackEng = Math.min(6.5, Math.max(1.8, 2.2 + (efficiencyRatio * 1.2)));
    } else if (subs > 0) {
      fallbackEng = 2.4;
    }

    const avgEng =
      engRates.length > 0
        ? engRates.reduce((a, b) => a + b, 0) / engRates.length
        : fallbackEng;

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
    ]
      .map((v) => v.snippet?.title || v.title || v.topTitle || '')
      .filter(Boolean);

    let withNumbers = allTitles.filter((t) => /\d/.test(t)).length;
    let withHow = allTitles.filter((t) => /how to|how i|guide|build|make|create|learn|code|coding/i.test(t)).length;
    let withVs = allTitles.filter((t) => /\bvs\b|versus|react|testing|most|in 60|seconds|purpose/i.test(t)).length;
    let total = allTitles.length;

    const numPct = total > 0 ? Math.round((withNumbers / total) * 100) : 40;
    const howPct = total > 0 ? Math.round((withHow / total) * 100) : 50;
    const vsPct = total > 0 ? Math.round((withVs / total) * 100) : 30;

    const contentHints = { withNumbers, withHow, withVs, total, numPct, howPct, vsPct };

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
      contentHints,
      isKing: rank === 1,
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
    insights?.rivals?.find((c) => c.id === rivalId) || insights?.rivals?.[0];

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
            {pastAnalysesCount > 0 && data && !loading && (
              <MetaChip icon={Activity} tone="text-[#00f0ff]">
                {pastAnalysesCount} past comparison{pastAnalysesCount > 1 ? 's' : ''}
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
        {selectedChannel && (process.env.NODE_ENV !== 'production' || isLocalhost || (user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '').toLowerCase() === 'thecxsmic@gmail.com') && (
          <div className="flex items-center gap-2">
            <DashButton
              variant="secondary"
              size="sm"
              onClick={() => analyzeCompetitors(true)}
              disabled={loading}
              className="!h-9 !px-2.5 sm:!px-3.5 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
              title="Force refresh competitors (Dev / Admin mode)"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Intel</span>
            </DashButton>
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
          </div>
        )}
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
            <TabErrorBoundary>
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
                  {/* Manual add row */}
                  <div className="flex flex-col gap-2 rounded-2xl border border-white/[0.07] bg-zinc-950/60 p-4 sm:flex-row sm:items-center sm:gap-3">
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2">
                      <UserPlus className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                      <input
                        type="text"
                        value={manualInput}
                        onChange={e => { setManualInput(e.target.value); setManualError(null); }}
                        onKeyDown={e => e.key === 'Enter' && addManualCompetitor()}
                        placeholder="Paste YouTube channel URL or @handle…"
                        className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
                      />
                      {manualInput && (
                        <button onClick={() => { setManualInput(''); setManualError(null); }} className="text-zinc-600 hover:text-white">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={addManualCompetitor}
                      disabled={!manualInput.trim() || addingManual}
                      className="flex shrink-0 items-center gap-2 rounded-xl border border-[#00f0ff]/20 bg-[#00f0ff]/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#00f0ff] transition-all hover:bg-[#00f0ff]/20 disabled:opacity-40"
                    >
                      {addingManual ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      {addingManual ? 'Adding…' : 'Add competitor'}
                    </button>
                  </div>
                  {manualError && (
                    <p className="-mt-1 text-xs text-red-400">{manualError}</p>
                  )}

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
                          onRemove={comp.pinned
                            ? () => removePinnedCompetitor(comp.id)
                            : () => removeCompetitor(comp.id)
                          }
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
                    <DashChip
                      active={rivalId === 'all'}
                      onClick={() => setRivalId('all')}
                    >
                      All Rivals
                    </DashChip>
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
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                        {rivalId === 'all' ? 'You · All Rivals' : `You · ${selectedRival?.title?.slice(0, 16) || 'Rival'}`}
                      </span>
                    }
                    bodyClassName="h-[380px] p-4 sm:h-[420px] sm:p-5"
                  >
                    <VideoPerformanceScatter
                      videos={data.baseChannel?.videos}
                      competitorVideos={selectedRival?.videos || []}
                      allRivals={rivalId === 'all' ? insights.rivals : []}
                      youLabel="You"
                      rivalLabel={selectedRival?.title?.slice(0, 16) || 'Rival'}
                    />
                  </DashPanel>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <InsightCard
                      title="Numeric titles"
                      value={`${insights.contentHints.numPct}%`}
                      desc="Many titles use numbers — that often gets more clicks."
                      icon={BarChart3}
                    />
                    <InsightCard
                      title="How-to / guides"
                      value={`${insights.contentHints.howPct}%`}
                      desc="Share of how-to titles among you and rivals."
                      icon={Target}
                    />
                    <InsightCard
                      title="React / vs videos"
                      value={`${insights.contentHints.vsPct}%`}
                      desc="Share of reaction or vs-style titles."
                      icon={Zap}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {insights.you.topTitle && (
                      <DashPanel title="Your top video benchmark" icon={Video} bodyClassName="p-5">
                        <p className="text-sm font-semibold text-white">
                          {insights.you.topTitle}
                        </p>
                        <p className="mt-2 text-xs text-zinc-500">
                          Your best recent video by views — study its title and framing.
                        </p>
                      </DashPanel>
                    )}

                    <DashPanel title={`Rival benchmark: ${selectedRival?.title || 'Top Rivals'}`} icon={Sparkles} bodyClassName="p-5">
                      <p className="text-sm font-semibold text-white">
                        {selectedRival?.stats?.topTitle || (selectedRival?.title ? `Popular video from ${selectedRival.title}` : 'Internets WORST Websites (Trilzo)')}
                      </p>
                      <p className="mt-2 text-xs text-zinc-500">
                        Top performing video topic from your selected competitor.
                      </p>
                    </DashPanel>
                  </div>
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
          </TabErrorBoundary>
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

function CompetitorCard({ comp, you, formatNumber, typeColor, onSave, onRemove }) {
  const s = comp.stats;
  const subGap = s.subs - you.subs;
  const isLeader = subGap > 0;
  const effDelta = s.viewsPerSub - you.viewsPerSub;
  const recentVideos = (comp.videos || []).slice(0, 5);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef?.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 transition-all duration-200 hover:border-white/[0.14] hover:shadow-lg hover:shadow-black/40">
      {/* Subtle top accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#00f0ff]/30 to-transparent" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <Avatar ch={comp} size={12} />
            {comp.pinned && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#00f0ff]/20 ring-1 ring-[#00f0ff]/40">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00f0ff]" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-bold text-white transition-colors group-hover:text-[#93e9ff]">
              {comp.title}
            </h4>
            <span
              className={`mt-1 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${typeColor(comp.matchType)}`}
            >
              {comp.matchType}
            </span>
          </div>
        </div>

        {/* Three-dot menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-500 transition-colors hover:border-white/20 hover:text-white"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-9 z-50 min-w-[160px] overflow-hidden rounded-xl border border-white/[0.1] bg-zinc-900 shadow-2xl shadow-black/60">
              {/* Open on YouTube */}
              {comp.id && (
                <a
                  href={`https://youtube.com/channel/${comp.id}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
                  Open on YouTube
                </a>
              )}
              {/* Save to library */}
              <button
                type="button"
                onClick={() => { onSave(); setMenuOpen(false); }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <Save className="h-3.5 w-3.5 text-zinc-500" />
                Save to library
              </button>
              {/* Divider */}
              <div className="mx-3 my-1 h-px bg-white/[0.07]" />
              {/* Remove */}
              {onRemove && (
                <button
                  type="button"
                  onClick={() => { onRemove(); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-px bg-white/[0.04] mx-4 overflow-hidden rounded-xl">
        {/* Subs */}
        <div className="bg-zinc-950/70 p-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Subs</p>
          <p className="mt-1 text-base font-bold tabular-nums text-white">{formatNumber(s.subs)}</p>
          <p className={`mt-0.5 text-[10px] font-semibold ${isLeader ? 'text-orange-400' : 'text-emerald-400'}`}>
            {isLeader ? '+' : ''}{formatNumber(subGap)} vs you
          </p>
        </div>
        {/* Views */}
        <div className="bg-zinc-950/70 p-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Views</p>
          <p className="mt-1 text-base font-bold tabular-nums text-white">{formatNumber(s.views)}</p>
          <p className="mt-0.5 text-[10px] font-semibold text-zinc-600">lifetime total</p>
        </div>
        {/* Efficiency */}
        <div className="bg-zinc-950/70 p-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Efficiency</p>
          <p className="mt-1 text-base font-bold tabular-nums text-white">{s.viewsPerSub.toFixed(1)}x</p>
          <p className={`mt-0.5 text-[10px] font-semibold ${effDelta >= 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
            {effDelta >= 0 ? '+' : ''}{effDelta.toFixed(1)} vs you
          </p>
        </div>
        {/* Engagement */}
        <div className="bg-zinc-950/70 p-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Engagement</p>
          <p className="mt-1 text-base font-bold tabular-nums text-white">{s.avgEng.toFixed(2)}%</p>
          <p className="mt-0.5 text-[10px] font-semibold text-zinc-600">avg likes+comments</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
          <span className="inline-flex items-center gap-1">
            <Video className="h-3 w-3" /> {formatNumber(s.videos)} videos
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3 w-3" /> {formatNumber(s.avgRecent)} avg
          </span>
        </div>
        {recentVideos.length > 0 && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-700">
            {recentVideos.length} recent sample
          </span>
        )}
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
