'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useChannel } from '@/contexts/channel';
import {
  Search,
  Zap,
  Trophy,
  Eye,
  Users,
  ArrowRight,
  Flame,
  BarChart3,
  Video,
  Sparkles,
  ChevronRight,
  Command,
  ArrowUpRight,
  BookOpen,
} from 'lucide-react';
import { useTitle } from '@/lib/hooks/titles';
import { DashPage, DashBody } from '../components/dashboard/ui';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function formatNum(n) {
  const v = parseInt(n || 0, 10);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toString();
}




/* ── Fallback data ────────────────────────────────────────────────────────── */
const DEFAULT_TRENDS = [
  { topic: 'Browser-use & Playwright Agents', whyItsHot: 'Self-hosted AI web automation', opportunityScore: 92 },
  { topic: 'Ollama & DeepSeek Local Setup', whyItsHot: 'Local models running without GPUs', opportunityScore: 88 },
  { topic: 'Autonomous Coding Assistants', whyItsHot: 'Agentic dev tools with terminal exec', opportunityScore: 85 },
  { topic: 'Prompt Caching & LLM Optimization', whyItsHot: 'Reducing API costs by up to 90%', opportunityScore: 78 },
  { topic: 'Next.js App Router Performance', whyItsHot: 'Server actions & streaming optimization', opportunityScore: 74 },
];

const DEFAULT_COMPETITORS = [
  { title: 'CodeCraft Pro', subs: 458000, matchType: 'Top channel' },
  { title: 'TechVibe AI', subs: 124500, matchType: 'Bigger channel' },
  { title: 'ByteSize Tech', subs: 89200, matchType: 'Similar size' },
  { title: 'Algorithmics', subs: 1250000, matchType: 'Top channel' },
];

/* ════════════════════════════════════════════════════════════════════════════
 * Page
 * ════════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  useTitle('Dashboard');
  const router = useRouter();
  const { channels } = useChannel();
  const selectedChannel = channels.data.find(c => c.id === channels.selectedId);

  /* ── Video Search ─────────────────────────────────────────────────────── */
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);

  /* ── Analytics overview ───────────────────────────────────────────────── */
  const [analyticsData, setAnalyticsData] = useState(null);

  /* ── Radar snapshot ───────────────────────────────────────────────────── */
  const [radarData, setRadarData] = useState(null);
  const [radarLoading, setRadarLoading] = useState(true);

  /* ── Competitor snapshot ──────────────────────────────────────────────── */
  const [compData, setCompData] = useState(null);
  const [compLoading, setCompLoading] = useState(true);

  /* ── Load radar ───────────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    async function loadRadar() {
      setRadarLoading(true);
      const chId = selectedChannel?.id || 'default';
      try {
        const localStr = localStorage.getItem(`trend_radar_cache_${chId}`);
        if (localStr) {
          const parsed = JSON.parse(localStr);
          const topics = parsed?.data?.insights?.emergingTrends || parsed?.data?.insights?.quickWins || [];
          if (!cancelled && topics.length > 0) {
            setRadarData({ items: topics.slice(0, 5), isLive: true });
            setRadarLoading(false);
            return;
          }
        }
      } catch (e) {}
      if (selectedChannel?.id) {
        try {
          const res = await fetch(`/api/trends?channelId=${selectedChannel.id}`);
          const json = await res.json();
          const topics = json?.data?.insights?.emergingTrends || json?.data?.insights?.quickWins || [];
          if (!cancelled && topics.length > 0) {
            setRadarData({ items: topics.slice(0, 5), isLive: true });
            setRadarLoading(false);
            return;
          }
        } catch (e) {}
      }
      if (!cancelled) {
        setRadarData({ items: DEFAULT_TRENDS, isFallback: true });
        setRadarLoading(false);
      }
    }
    loadRadar();
    return () => { cancelled = true; };
  }, [selectedChannel?.id]);

  /* ── Load competitors ─────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    async function loadCompetitors() {
      setCompLoading(true);
      const chId = selectedChannel?.id || 'default';
      try {
        const localStr = localStorage.getItem(`competitor_analysis_cache_v2_${chId}`);
        if (localStr) {
          const parsed = JSON.parse(localStr);
          const comps = parsed?.data?.competitors || [];
          if (!cancelled && comps.length > 0) {
            setCompData({ competitors: comps, baseChannel: parsed?.data?.baseChannel, isLive: true });
            setCompLoading(false);
            return;
          }
        }
      } catch (e) {}
      if (selectedChannel?.id) {
        try {
          const res = await fetch(`/api/competitors/history?subjectId=${selectedChannel.id}&limit=1`);
          const json = await res.json();
          if (json.success && json.history?.length) {
            setCompData({ ...json.history[0], isLive: true });
            setCompLoading(false);
            return;
          }
        } catch (e) {}
      }
      if (!cancelled) {
        const userSubs = parseInt(selectedChannel?.statistics?.subscriberCount || 100000, 10);
        setCompData({
          isFallback: true,
          competitors: DEFAULT_COMPETITORS.map(c => ({ ...c, statistics: { subscriberCount: c.subs } })),
          userSubs,
        });
        setCompLoading(false);
      }
    }
    loadCompetitors();
    return () => { cancelled = true; };
  }, [selectedChannel?.id]);

  /* ── Load analytics overview ──────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    async function loadAnalytics() {
      try {
        const res = await fetch('/api/analytics');
        const json = await res.json();
        if (!cancelled && json.success && json.channel) {
          const current = json.channel.statistics;
          const snapshots = json.data || [];
          const prev = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;
          setAnalyticsData({
            subs: parseInt(current.subscriberCount || 0),
            views: parseInt(current.viewCount || 0),
            videos: parseInt(current.videoCount || 0),
            subChange: prev ? parseInt(current.subscriberCount) - prev.subscribers : null,
            viewChange: prev ? parseInt(current.viewCount) - prev.views : null,
          });
        }
      } catch (e) {}
    }
    loadAnalytics();
    return () => { cancelled = true; };
  }, []);

  /* ── Search handler — navigate to /search ─────────────────────────────── */
  const handleSearch = useCallback((e) => {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q || searching) return;
    router.push(`/search?query=${encodeURIComponent(q)}`);
  }, [query, searching, router]);

  /* ── Cmd+K shortcut ───────────────────────────────────────────────────── */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <DashPage>
      <DashBody className="space-y-10 pb-24">

        {/* ── Channel header ──────────────────────────────────────────── */}
        <ChannelHeader selectedChannel={selectedChannel} />

        {/* ── Search hero ─────────────────────────────────────────────── */}
        <SearchHero
          query={query}
          setQuery={setQuery}
          searching={searching}
          handleSearch={handleSearch}
          inputRef={inputRef}
        />

        {/* ── KPI strip ───────────────────────────────────────────────── */}
        <KpiStrip selectedChannel={selectedChannel} analyticsData={analyticsData} />

        {/* ── Bento: radar + competitors ───────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <RadarPanel radarData={radarData} radarLoading={radarLoading} />
          <CompPanel compData={compData} compLoading={compLoading} selectedChannel={selectedChannel} />
        </div>

        {/* ── Tool tiles ──────────────────────────────────────────────── */}
        <ToolGrid />

      </DashBody>
    </DashPage>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * ChannelHeader
 * ════════════════════════════════════════════════════════════════════════════ */
function ChannelHeader({ selectedChannel }) {
  return (
    <div className="flex justify-center pt-2 pb-6">
      {selectedChannel?.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={selectedChannel.thumbnail}
          alt={selectedChannel.title}
          className="h-12 w-12 rounded-full border border-zinc-800 object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-base font-bold text-white">
          {selectedChannel ? selectedChannel.title[0] : 'S'}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * SearchHero
 * ════════════════════════════════════════════════════════════════════════════ */
function SearchHero({ query, setQuery, searching, handleSearch, inputRef }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-600/40 to-transparent" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-zinc-800/20 blur-3xl" />

      <div className="relative px-6 py-10 sm:px-10 sm:py-12">
        <div className="mb-5 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] font-medium text-zinc-400">
            <Sparkles className="h-3 w-3 text-zinc-500" />
            Real-time virality scoring
          </span>
        </div>

        <h2 className="mb-1 text-center font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Find viral ideas instantly
        </h2>
        <p className="mb-7 text-center text-sm text-zinc-500">
          Search any topic, keyword, or competitor channel.
        </p>

        <form onSubmit={handleSearch} className="mx-auto max-w-2xl">
          <div className="flex items-center rounded-xl border border-zinc-700/60 bg-black transition-all focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-600/30">
            <Search className="ml-4 h-4 w-4 shrink-0 text-zinc-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search topics, keywords, or video titles…"
              className="flex-1 bg-transparent px-3 py-3 text-sm text-white placeholder-zinc-600 outline-none"
              autoComplete="off"
            />
            {!query && (
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-zinc-800 mr-3 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            )}
            <div className="m-1.5 shrink-0">
              <button
                type="submit"
                disabled={!query.trim() || searching}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black transition-opacity hover:opacity-85 disabled:opacity-30 sm:px-4"
              >
                {searching
                  ? <span className="h-3 w-3 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                  : <ArrowRight className="h-3.5 w-3.5" />
                }
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * KpiStrip — subscriber / video / view counts
 * ════════════════════════════════════════════════════════════════════════════ */
function KpiStrip({ selectedChannel, analyticsData }) {
  const stats = selectedChannel?.statistics || {};

  // Prefer live analytics data, fall back to channel stats
  const subs   = analyticsData?.subs   ?? parseInt(stats.subscriberCount || 0);
  const views  = analyticsData?.views  ?? parseInt(stats.viewCount || 0);
  const videos = analyticsData?.videos ?? parseInt(stats.videoCount || 0);

  const kpis = [
    {
      label: 'Subscribers',
      value: formatNum(subs),
      delta: analyticsData?.subChange ?? null,
      icon: Users,
    },
    {
      label: 'Total Views',
      value: formatNum(views),
      delta: analyticsData?.viewChange ?? null,
      icon: Eye,
    },
    {
      label: 'Videos',
      value: formatNum(videos),
      delta: null,
      icon: Video,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">
          Channel overview
        </p>
        <Link
          href="/analytics"
          className="inline-flex items-center gap-1 text-[11px] text-zinc-500 transition-colors hover:text-white"
        >
          Full analytics <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {kpis.map(kpi => (
          <div
            key={kpi.label}
            className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-500">{kpi.label}</span>
              <kpi.icon className="h-3.5 w-3.5 text-zinc-700" />
            </div>
            <span className="font-display text-xl font-semibold text-white">
              {kpi.value}
            </span>
            {kpi.delta !== null && kpi.delta !== 0 && (
              <span className={`text-[10px] font-medium ${kpi.delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {kpi.delta > 0 ? '+' : ''}{formatNum(kpi.delta)} since last scan
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * RadarPanel
 * ════════════════════════════════════════════════════════════════════════════ */
function RadarPanel({ radarData, radarLoading }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      {/* Top accent line */}
      <div className="h-px w-full bg-gradient-to-r from-cyan-500/50 via-cyan-500/20 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Trend Radar</h3>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-zinc-500">
                {radarData?.isFallback ? 'suggested' : 'live'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">Emerging topics in your niche</p>
          </div>
        </div>
        <Link
          href="/radar"
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-[11px] text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
        >
          View <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Body */}
      <div className="flex-1 p-3">
        {radarLoading ? (
          <SkeletonRows />
        ) : radarData?.items?.length ? (
          <div className="space-y-0.5">
            {radarData.items.map((item, i) => (
              <RadarRow key={item.id || i} item={item} rank={i + 1} />
            ))}
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800/60 px-5 py-3">
        <Link
          href="/radar"
          className="inline-flex items-center gap-1 text-[11px] text-zinc-500 transition-colors hover:text-white"
        >
          Open full radar scan <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * CompPanel
 * ════════════════════════════════════════════════════════════════════════════ */
function CompPanel({ compData, compLoading, selectedChannel }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      {/* Top accent line */}
      <div className="h-px w-full bg-gradient-to-r from-amber-500/50 via-amber-500/20 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Competitor Benchmarks</h3>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-zinc-500">
                {compData?.isFallback ? 'suggested' : 'live'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">Subscriber gaps & view velocity</p>
          </div>
        </div>
        <Link
          href="/competitors"
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-[11px] text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
        >
          View <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Body */}
      <div className="flex-1 p-3">
        {compLoading ? (
          <SkeletonRows />
        ) : compData ? (
          <CompSummary data={compData} selectedChannel={selectedChannel} />
        ) : null}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800/60 px-5 py-3">
        <Link
          href="/competitors"
          className="inline-flex items-center gap-1 text-[11px] text-zinc-500 transition-colors hover:text-white"
        >
          Open competitor matrix <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * ToolGrid — 4 quick-action tiles
 * ════════════════════════════════════════════════════════════════════════════ */
const TOOLS = [
  {
    title: 'Trend Radar',
    desc: 'Detect emerging viral topics before they peak.',
    href: '/radar',
    icon: Zap,
    color: 'text-cyan-400',
  },
  {
    title: 'Competitors',
    desc: 'Benchmark growth and view velocity against rivals.',
    href: '/competitors',
    icon: Trophy,
    color: 'text-amber-400',
  },
  {
    title: 'Analytics',
    desc: 'Track trajectory, retention curves and performance.',
    href: '/analytics',
    icon: BarChart3,
    color: 'text-purple-400',
  },
  {
    title: 'Research Library',
    desc: 'Save scripts, video ideas and channel notes.',
    href: '/library',
    icon: BookOpen,
    color: 'text-emerald-400',
  },
];

function ToolGrid() {
  return (
    <div className="space-y-3">
      {/* Section label */}
      <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">
        Platform modules
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TOOLS.map(tool => (
          <Link
            key={tool.title}
            href={tool.href}
            className="group flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-900/60"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 transition-colors group-hover:border-zinc-700">
                <tool.icon className={`h-4 w-4 ${tool.color}`} />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-zinc-700 transition-all group-hover:text-zinc-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{tool.title}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">{tool.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * Small reusable sub-components
 * ════════════════════════════════════════════════════════════════════════════ */

function RadarRow({ item, rank }) {
  const title = item?.topic || item?.keyword || item?.title || 'Unknown trend';
  const why = item?.whyItsHot || item?.description || '';
  const score = item?.opportunityScore ?? item?.viralScore ?? item?.heat_score ?? 85;

  return (
    <div className="group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-900/60">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 font-mono text-[10px] font-semibold text-zinc-500 group-hover:text-white">
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">
            {title}
          </p>
          {why && (
            <p className="truncate text-[10px] text-zinc-600">{why}</p>
          )}
        </div>
      </div>
      <span className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-400">
        <Flame className="h-2.5 w-2.5 text-amber-500" />
        {score}
      </span>
    </div>
  );
}

function CompSummary({ data, selectedChannel }) {
  let list = [];
  const baseSubs = data?.userSubs || parseInt(
    data?.baseChannel?.statistics?.subscriberCount ||
    selectedChannel?.statistics?.subscriberCount || 0, 10
  );

  if (Array.isArray(data?.competitors) && data.competitors.length > 0) {
    list = data.competitors.map(c => {
      const subs = parseInt(c.statistics?.subscriberCount || c.subs || 0, 10);
      return { name: c.title || c.name || 'Unknown rival', subs, diff: baseSubs > 0 ? subs - baseSubs : 0, matchType: c.matchType };
    });
  } else if (data?.summary?.competitorTitles?.length) {
    const titles = data.summary.competitorTitles;
    const subs = data.summary.competitorSubs || [];
    const bSubs = data.summary.baseChannelSubs || baseSubs;
    list = titles.map((name, i) => ({ name, subs: subs[i] || 0, diff: bSubs > 0 ? (subs[i] || 0) - bSubs : 0, matchType: null }));
  }

  if (!list.length) return <p className="py-6 text-center text-xs text-zinc-600">No competitor data found</p>;

  return (
    <div className="space-y-0.5">
      {list.slice(0, 5).map((item, i) => (
        <div
          key={i}
          className="group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-900/60"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 font-mono text-[10px] font-semibold text-zinc-500 group-hover:text-white">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">
                {item.name}
              </p>
              {item.matchType && (
                <span className="text-[10px] text-zinc-600">{item.matchType}</span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="font-mono text-xs font-semibold text-white block">
              {formatNum(item.subs)}
            </span>
            {item.diff !== 0 && (
              <span className={`font-mono text-[10px] block ${item.diff > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {item.diff > 0 ? '+' : ''}{formatNum(item.diff)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-1.5 p-1">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <div className="h-5 w-5 rounded-md bg-zinc-900 animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-3/4 rounded bg-zinc-900 animate-pulse" />
            <div className="h-2 w-1/2 rounded bg-zinc-900/60 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
