'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useChannel } from '@/contexts/channel';
import {
  Search,
  Zap,
  Trophy,
  TrendingUp,
  Eye,
  Users,
  ArrowRight,
  Flame,
  Clock,
  BarChart3,
  Video,
  Sparkles,
  ChevronRight,
  Target,
} from 'lucide-react';
import { useTitle } from '@/lib/hooks/titles';
import {
  DashPage,
  DashBody,
} from '../components/dashboard/ui';

const STAGES = [
  'Connecting…',
  'Searching YouTube…',
  'Scoring virality…',
  'Almost there…',
];

function formatNum(n) {
  const v = parseInt(n || 0, 10);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toString();
}

function timeAgo(publishedAt) {
  if (!publishedAt) return '';
  const diff = (Date.now() - new Date(publishedAt).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
}

export default function DashboardPage() {
  useTitle('Dashboard');
  const router = useRouter();
  const { channels } = useChannel();
  const selectedChannel = channels.data.find(c => c.id === channels.selectedId);

  // ── Video Search ──────────────────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchStage, setSearchStage] = useState(0);
  const [searchError, setSearchError] = useState(null);
  const inputRef = useRef(null);

  // ── Radar snapshot ─────────────────────────────────────────────────────
  const [radarData, setRadarData] = useState(null);
  const [radarLoading, setRadarLoading] = useState(true);

  // ── Competitor snapshot ────────────────────────────────────────────────
  const [compData, setCompData] = useState(null);
  const [compLoading, setCompLoading] = useState(true);

  // Load radar snapshot from the last cached scan
  useEffect(() => {
    if (!selectedChannel?.id) { setRadarLoading(false); return; }
    let cancelled = false;
    async function load() {
      setRadarLoading(true);
      try {
        const res = await fetch(`/api/trends?channelId=${selectedChannel.id}&history=true&limit=1`);
        const json = await res.json();
        const latest = json.history?.[0] || json.data;
        const topics =
          latest?.data?.insights?.emergingTrends
          || latest?.insights?.emergingTrends
          || [];
        if (!cancelled && topics.length) {
          setRadarData(topics.slice(0, 6));
        }
      } catch {}
      if (!cancelled) setRadarLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [selectedChannel?.id]);

  // Load competitor snapshot from cache
  useEffect(() => {
    if (!selectedChannel?.id) { setCompLoading(false); return; }
    let cancelled = false;
    async function load() {
      setCompLoading(true);
      try {
        const res = await fetch(`/api/competitors/history?subjectId=${selectedChannel.id}&limit=1`);
        const json = await res.json();
        if (!cancelled && json.success && json.history?.length) {
          setCompData(json.history[0]);
        }
      } catch {}
      if (!cancelled) setCompLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [selectedChannel?.id]);

  // Search handler
  const handleSearch = useCallback(async (e) => {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q || searching) return;
    setSearching(true);
    setSearchResults(null);
    setSearchError(null);
    setSearchStage(0);

    let stage = 0;
    const ticker = setInterval(() => {
      stage = Math.min(stage + 1, STAGES.length - 1);
      setSearchStage(stage);
    }, 900);

    try {
      const params = new URLSearchParams({ q, maxResults: 12, order: 'relevance' });
      const res = await fetch(`/api/youtube/search?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Search failed');
      setSearchResults(json.items || []);
    } catch (err) {
      setSearchError(err.message);
    } finally {
      clearInterval(ticker);
      setSearching(false);
    }
  }, [query, searching]);

  const handleVideoClick = (video) => {
    // Navigate to main search page with the query pre-filled
    router.push(`/?q=${encodeURIComponent(query || video.snippet?.title || '')}`);
  };

  return (
    <DashPage>
      <DashBody className="space-y-6 pb-24">
        {/* ── Hero search bar ──────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-black p-6 sm:p-8">
          {/* Background glow */}
          <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-[#00f0ff]/[0.06] blur-3xl" />
          <div className="relative">
            {selectedChannel && (
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#00f0ff]/60">
                Welcome back
              </p>
            )}
            <h1 className="mb-4 font-display text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
              {selectedChannel ? selectedChannel.title : 'Your dashboard'}
            </h1>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex flex-1 items-center gap-3 rounded-xl border border-white/[0.1] bg-black/60 px-4 py-3 focus-within:border-[#00f0ff]/40 transition-colors">
                <Search className="h-4 w-4 shrink-0 text-zinc-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search any video topic…"
                  className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
                  autoComplete="off"
                />
                {query && (
                  <button type="button" onClick={() => { setQuery(''); setSearchResults(null); }} className="text-zinc-600 hover:text-zinc-400">
                    ×
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={!query.trim() || searching}
                className="flex items-center gap-2 rounded-xl border border-[#00f0ff]/20 bg-[#00f0ff]/10 px-5 py-3 text-sm font-bold uppercase tracking-wider text-[#00f0ff] transition-all hover:bg-[#00f0ff]/20 disabled:opacity-40"
              >
                {searching ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#00f0ff]/30 border-t-[#00f0ff]" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{searching ? STAGES[searchStage] : 'Search'}</span>
              </button>
            </form>
            {/* Quick chips */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {['Shorts ideas', 'Viral trends', 'Tutorial videos', 'Review content'].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => { setQuery(chip); setTimeout(() => handleSearch(null), 50); }}
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 transition-colors hover:border-white/20 hover:text-zinc-300"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Search results ───────────────────────────────────────────── */}
        <AnimatePresence>
          {searchError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4 text-sm text-red-400"
            >
              {searchError}
            </motion.div>
          )}
          {searchResults && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                  {searchResults.length} results for "{query}"
                </p>
                <Link
                  href={`/?q=${encodeURIComponent(query)}`}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#00f0ff] hover:underline"
                >
                  Full search <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {searchResults.slice(0, 6).map(video => (
                  <SearchResultCard key={video.id?.videoId || video.id} video={video} onClick={() => router.push(`/?q=${encodeURIComponent(query)}`)} />
                ))}
              </div>
              {searchResults.length > 6 && (
                <Link
                  href={`/?q=${encodeURIComponent(query)}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] py-3 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:border-white/15 hover:text-zinc-300 transition-colors"
                >
                  View all {searchResults.length} results <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Summary grid ─────────────────────────────────────────────── */}
        {!searchResults && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Trend Radar Summary */}
            <SummaryPanel
              title="Trend Radar"
              subtitle="Hottest topics right now"
              icon={Zap}
              href="/radar"
              loading={radarLoading}
              accentColor="#00f0ff"
            >
              {radarData?.length ? (
                <div className="space-y-1">
                  {radarData.map((item, i) => (
                    <RadarRow key={item.id || i} item={item} rank={i + 1} />
                  ))}
                </div>
              ) : (
                <EmptyHint text="No radar data yet — open Trends to run a scan" />
              )}
            </SummaryPanel>

            {/* Competitors Summary */}
            <SummaryPanel
              title="Competitors"
              subtitle={selectedChannel ? `vs ${selectedChannel.title}` : 'Your rivals'}
              icon={Trophy}
              href="/competitors"
              loading={compLoading}
              accentColor="#f59e0b"
            >
              {compData ? (
                <CompSummary data={compData} />
              ) : (
                <EmptyHint text="No competitor scan yet — go to Rivals to scan" />
              )}
            </SummaryPanel>
          </div>
        )}

        {/* ── Quick nav tiles ───────────────────────────────────────────── */}
        {!searchResults && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Trends', href: '/radar', icon: Zap, color: 'text-[#00f0ff]', bg: 'bg-[#00f0ff]/10 border-[#00f0ff]/20' },
              { label: 'Rivals', href: '/competitors', icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
              { label: 'Analytics', href: '/analytics', icon: BarChart3, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
              { label: 'Library', href: '/library', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            ].map(tile => (
              <Link
                key={tile.href}
                href={tile.href}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all hover:scale-[1.02] ${tile.bg}`}
              >
                <tile.icon className={`h-6 w-6 ${tile.color}`} />
                <span className="text-xs font-bold uppercase tracking-wider text-white">{tile.label}</span>
              </Link>
            ))}
          </div>
        )}
      </DashBody>
    </DashPage>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function SummaryPanel({ title, subtitle, icon: Icon, href, loading, accentColor, children }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950/80">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4" style={{ color: accentColor }} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">{subtitle}</p>
            <p className="text-sm font-bold text-white">{title}</p>
          </div>
        </div>
        <Link
          href={href}
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors"
        >
          Open <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex-1 p-4">
        {loading ? <SkeletonRows /> : children}
      </div>
    </div>
  );
}

function RadarRow({ item, rank }) {
  const title = item?.topic || item?.keyword || item?.title || 'Unknown trend';
  const why = item?.whyItsHot || item?.description || '';
  const score = item?.opportunityScore ?? item?.heat_score ?? null;
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.04]">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-[9px] font-bold text-zinc-500">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-zinc-200">{title}</p>
        {why && (
          <p className="truncate text-[9px] font-bold uppercase tracking-wider text-zinc-600">{why}</p>
        )}
      </div>
      {score != null && (
        <span className="flex items-center gap-0.5 text-[9px] font-bold text-orange-400">
          <Flame className="h-3 w-3" />
          {typeof score === 'number' ? score.toFixed(0) : score}
        </span>
      )}
    </div>
  );
}

function CompSummary({ data }) {
  const competitors = data.summary?.competitorTitles || [];
  const subs = data.summary?.competitorSubs || [];
  const baseSubs = data.summary?.baseChannelSubs || 0;
  return (
    <div className="space-y-1">
      {competitors.slice(0, 5).map((name, i) => {
        const compSubs = subs[i] || 0;
        const diff = compSubs - baseSubs;
        return (
          <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.04] transition-colors">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-[9px] font-bold text-zinc-500">
              {i + 1}
            </span>
            <p className="min-w-0 flex-1 truncate text-xs font-semibold text-zinc-200">{name}</p>
            <span className={`text-[9px] font-bold tabular-nums ${diff > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
              {diff > 0 ? '+' : ''}{formatNum(diff)}
            </span>
          </div>
        );
      })}
      {competitors.length === 0 && <EmptyHint text="No competitor data yet" />}
    </div>
  );
}

function SearchResultCard({ video, onClick }) {
  const snippet = video.snippet || {};
  const thumb = snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '';
  const title = snippet.title || 'Untitled';
  const channel = snippet.channelTitle || '';
  const published = timeAgo(snippet.publishedAt);
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex gap-3 rounded-xl border border-white/[0.07] bg-zinc-950/60 p-3 text-left transition-all hover:border-white/15 hover:bg-zinc-900/60"
    >
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" className="h-16 w-28 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
          <Video className="h-5 w-5 text-zinc-600" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-xs font-semibold text-white group-hover:text-[#93e9ff] transition-colors">
          {title}
        </p>
        <p className="mt-1 truncate text-[9px] font-bold uppercase tracking-wider text-zinc-600">{channel}</p>
        {published && (
          <p className="mt-0.5 text-[9px] text-zinc-700">{published}</p>
        )}
      </div>
    </button>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <div className="h-5 w-5 rounded-md bg-white/[0.05] animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-3/4 rounded bg-white/[0.05] animate-pulse" />
            <div className="h-2 w-1/2 rounded bg-white/[0.04] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyHint({ text }) {
  return (
    <p className="py-6 text-center text-xs text-zinc-700">{text}</p>
  );
}
