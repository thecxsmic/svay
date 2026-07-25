'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChannel } from '@/contexts/channel';
import { useUser } from '@/contexts/user';
import {
  TrendingUp,
  Zap,
  Flame,
  Target,
  Eye,
  Sparkles,
  Rocket,
  RefreshCw,
  Save,
  Video,
  Lightbulb,
  Layers,
  Plus,
  Mail,
  Clock,
  Radar,
  Copy,
  Check,
  Filter,
  ListOrdered,
  BookOpen,
  Timer,
  Gauge,
  CircleDot,
} from 'lucide-react';
import { useTitle } from '@/lib/hooks/titles';
import ResearchNotesModal from './ResearchNotesModal';
import {
  ProgressLoader,
  EmptyState,
  DashAlert,
  DashToolbar,
  DashButton,
  MetaChip,
} from './dashboard/ui';

const CACHE_KEY_PREFIX = 'trend_radar_cache_';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

const TABS = [
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'trends', label: 'Trends', icon: Rocket },
  { id: 'actions', label: 'Actions', icon: ListOrdered },
  { id: 'ideas', label: 'Ideas', icon: Video },
  { id: 'playbook', label: 'How-to', icon: BookOpen },
];

export default function TrendRadar() {
  useTitle('Trends');
  const { channels } = useChannel();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [lastScanTime, setLastScanTime] = useState(null);
  const [lastEmailSentAt, setLastEmailSentAt] = useState(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedNoteItem, setSelectedNoteItem] = useState(null);
  const [tab, setTab] = useState('overview');
  const [sortBy, setSortBy] = useState('score'); // score | easy | hot
  const [diffFilter, setDiffFilter] = useState('all'); // all | easy | medium | hard
  const [copiedKey, setCopiedKey] = useState(null);


  const selectedChannel = channels.data.find((c) => c.id === channels.selectedId);
  const getCacheKey = () => `${CACHE_KEY_PREFIX}${selectedChannel?.id || 'default'}`;

  const loadCachedData = useCallback(() => {
    if (!selectedChannel) return null;
    try {
      const cached = localStorage.getItem(getCacheKey());
      if (cached) {
        const { data: cachedData, timestamp, lastEmailSentAt: cachedEmailTime } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setData(cachedData);
          setLastScanTime(timestamp);
          setLastEmailSentAt(cachedEmailTime);
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
    if (selectedChannel) {
      const cached = loadCachedData();
      if (!cached && !loading && !data) {
        scanTrends();
      }
    }
  }, [selectedChannel?.id]);

  const cacheData = (payload, lastEmailTime) => {
    if (!selectedChannel) return;
    try {
      localStorage.setItem(
        getCacheKey(),
        JSON.stringify({
          data: payload,
          timestamp: Date.now(),
          channelId: selectedChannel.id,
          lastEmailSentAt: lastEmailTime || lastEmailSentAt,
        })
      );
      setLastScanTime(Date.now());
      if (lastEmailTime) setLastEmailSentAt(lastEmailTime);
    } catch (err) {
      console.error('Cache save error:', err);
    }
  };

  const scanTrends = async () => {
    if (loading) return;
    setLoading(true);
    setProgress(0);
    setError(null);
    setData(null);

    try {
      const response = await fetch('/api/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: { $id: user?.$id || 'anonymous' },
          channelId: selectedChannel?.id,
          channelTitle: selectedChannel?.title,
          channelBased: !!selectedChannel,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || '';

        for (const message of messages) {
          if (message.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(message.slice(6));
              if (jsonData.type === 'step') {
                setProgress(jsonData.progress);
                setCurrentStep(jsonData.message);
              } else if (jsonData.type === 'complete') {
                setData(jsonData.data);
                cacheData(jsonData.data, jsonData.data.lastEmailSentAt);
                setProgress(100);
                setTab('overview');
              } else if (jsonData.type === 'error') {
                setError(jsonData.message || jsonData.error);
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (type, title, metadata) => {
    const b64 =
      typeof window !== 'undefined'
        ? btoa(
            encodeURIComponent(title).replace(/%([0-9A-F]{2})/g, (match, p1) =>
              String.fromCharCode('0x' + p1)
            )
          )
        : btoa(title);
    const reference_id = `${type.substring(0, 2)}-${b64.substring(0, 10)}`;
    setSelectedNoteItem({ type: 'idea', title, reference_id, metadata });
    setIsNotesModalOpen(true);
  };

  const copyText = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1600);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const getCacheAge = () => {
    if (!lastScanTime) return '';
    const mins = Math.floor((Date.now() - lastScanTime) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const trends = data?.insights?.emergingTrends || [];
  const quickWins = data?.insights?.quickWins || [];
  const videoIdeas = data?.insights?.videoIdeas || [];
  const hooks = data?.insights?.viralPatterns?.titleHooks || [];
  const styles = data?.insights?.viralPatterns?.contentStyles || [];
  const overview = data?.insights?.overview;

  const filteredTrends = useMemo(() => {
    let list = [...trends];
    if (diffFilter !== 'all') {
      list = list.filter(
        (t) => String(t.difficulty || '').toLowerCase() === diffFilter
      );
    }
    list.sort((a, b) => {
      if (sortBy === 'easy') {
        const rank = { easy: 0, medium: 1, hard: 2 };
        return (
          (rank[String(a.difficulty).toLowerCase()] ?? 9) -
          (rank[String(b.difficulty).toLowerCase()] ?? 9)
        );
      }
      if (sortBy === 'hot') {
        const rank = { hot: 0, rising: 1, stable: 2 };
        return (
          (rank[String(a.momentum).toLowerCase()] ?? 9) -
          (rank[String(b.momentum).toLowerCase()] ?? 9)
        );
      }
      return (Number(b.viralScore) || 0) - (Number(a.viralScore) || 0);
    });
    return list;
  }, [trends, sortBy, diffFilter]);

  /** Priority queue: high score + easier wins first */
  const actionQueue = useMemo(() => {
    const items = [];
    trends.forEach((t, i) => {
      const score = Number(t.viralScore) || 0;
      const diffBoost =
        String(t.difficulty).toLowerCase() === 'easy'
          ? 15
          : String(t.difficulty).toLowerCase() === 'medium'
            ? 5
            : 0;
      const hotBoost = String(t.momentum).toLowerCase() === 'hot' ? 10 : 0;
      items.push({
        id: `trend-${i}`,
        kind: 'trend',
        priority: score + diffBoost + hotBoost,
        title: t.actionableIdea || t.topic,
        reason: t.opportunity,
        meta: t,
        window: t.timeWindow,
        score,
        effort: t.difficulty,
      });
    });
    quickWins.forEach((w, i) => {
      const effortBoost =
        String(w.effort).toLowerCase() === 'low'
          ? 25
          : String(w.effort).toLowerCase() === 'medium'
            ? 12
            : 0;
      items.push({
        id: `win-${i}`,
        kind: 'quickwin',
        priority: 55 + effortBoost,
        title: w.idea,
        reason: w.why,
        meta: w,
        window: w.timing,
        score: null,
        effort: w.effort,
      });
    });
    return items.sort((a, b) => b.priority - a.priority).slice(0, 6);
  }, [trends, quickWins]);

  const stats = useMemo(() => {
    if (!data) return null;
    const scores = trends.map((t) => Number(t.viralScore) || 0);
    const avg = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    const hot = trends.filter((t) => String(t.momentum).toLowerCase() === 'hot').length;
    const easy = trends.filter((t) => String(t.difficulty).toLowerCase() === 'easy').length;
    const lowEffort = quickWins.filter((w) => String(w.effort).toLowerCase() === 'low').length;
    return {
      avg,
      hot,
      easy,
      lowEffort,
      topics: overview?.trendingTopics ?? trends.length,
      videos: data.summary?.totalVideosAnalyzed ?? 0,
    };
  }, [data, trends, quickWins, overview]);

  return (
    <div className="mx-auto min-h-full w-full min-w-0 max-w-full overflow-x-hidden bg-black text-white font-sans selection:bg-white selection:text-black">
      <ResearchNotesModal
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        item={selectedNoteItem}
      />

      <DashToolbar
        left={
          <>
            {selectedChannel ? (
              <MetaChip>
                <span className="flex max-w-[180px] items-center gap-1.5 normal-case tracking-normal">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedChannel.thumbnail}
                    alt=""
                    className="h-4 w-4 rounded-full object-cover"
                  />
                  <span className="truncate">{selectedChannel.title}</span>
                </span>
              </MetaChip>
            ) : (
              <MetaChip>No channel</MetaChip>
            )}
            {lastScanTime && !loading && (
              <MetaChip icon={Clock}>{getCacheAge()}</MetaChip>
            )}
            {lastEmailSentAt && !loading && (
              <MetaChip icon={Mail}>
                Emailed{' '}
                {new Date(lastEmailSentAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
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
            </>
          ) : null
        }
        tabItems={data && !loading ? TABS : undefined}
        tabValue={tab}
        onTabChange={setTab}
      >
        {data && !loading && hooks.length > 0 && (
          <DashButton
            variant="secondary"
            size="sm"
            onClick={() => copyText('all-hooks', hooks.join('\n'))}
            className="!hidden !h-9 sm:!inline-flex"
          >
            {copiedKey === 'all-hooks' ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Copy hooks</span>
          </DashButton>
        )}
        <DashButton
          size="sm"
          onClick={scanTrends}
          disabled={loading || !selectedChannel}
          className="!h-9 !px-2.5 sm:!px-3.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {loading ? 'Scanning…' : data ? 'Rescan' : 'Scan'}
          </span>
        </DashButton>
      </DashToolbar>

      <div className="mx-auto w-full min-w-0 max-w-full px-4 py-6 sm:px-6 sm:py-8 md:max-w-7xl">
        {error && (
          <div className="mb-6">
            <DashAlert variant="error">{error}</DashAlert>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!data && !loading && (
            <EmptyState
              key="empty"
              icon={Target}
              title="Find trending ideas"
              description={
                selectedChannel
                  ? `Scan ${selectedChannel.title} for hot topics, easy wins, and video ideas.`
                  : 'Pick a channel in the menu to start scanning.'
              }
              action={
                <button
                  type="button"
                  onClick={scanTrends}
                  disabled={!selectedChannel}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-6 text-[11px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200 disabled:opacity-40"
                >
                  <Radar className="h-3.5 w-3.5" />
                  Start scan
                </button>
              }
            />
          )}

          {loading && (
            <ProgressLoader
              key="loading"
              progress={progress}
              step={currentStep || 'Starting…'}
            />
          )}

          {data && !loading && (
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 pb-16 sm:space-y-8"
            >
              {/* ── OVERVIEW ───────────────────────────────────────── */}
              {tab === 'overview' && (
                <>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Kpi
                      label="Chance to go viral"
                      value={overview?.viralPotential}
                      icon={Flame}
                      tone="text-orange-400"
                    />
                    <Kpi
                      label="Trend strength"
                      value={overview?.marketMomentum}
                      icon={TrendingUp}
                      tone="text-[#00f0ff]"
                    />
                    <Kpi
                      label="Topics tracked"
                      value={stats?.topics}
                      icon={CircleDot}
                      tone="text-zinc-200"
                    />
                    <Kpi
                      label="Videos scanned"
                      value={stats?.videos}
                      icon={Layers}
                      tone="text-zinc-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-950/70 lg:col-span-7">
                      <div className="border-b border-white/[0.05] px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-[#00f0ff]" />
                          <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                            Summary
                          </h3>
                        </div>
                      </div>
                      <p className="px-5 py-5 text-[15px] leading-relaxed text-zinc-200">
                        {overview?.summary}
                      </p>
                    </section>

                    <section className="rounded-2xl border border-white/[0.07] bg-zinc-950/70 lg:col-span-5">
                      <div className="border-b border-white/[0.05] px-5 py-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                          Quick stats
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-px bg-white/[0.04] p-px">
                        <Snap label="Average score" value={stats?.avg} />
                        <Snap label="Hot trends" value={stats?.hot} />
                        <Snap label="Easy trends" value={stats?.easy} />
                        <Snap label="Easy wins" value={stats?.lowEffort} />
                      </div>
                    </section>
                  </div>

                  {/* Top priority preview */}
                  <section className="rounded-2xl border border-white/[0.07] bg-zinc-950/70">
                    <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
                      <div className="flex items-center gap-2">
                        <ListOrdered className="h-3.5 w-3.5 text-zinc-500" />
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                          Next steps
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTab('actions')}
                        className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white"
                      >
                        See full list →
                      </button>
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                      {actionQueue.slice(0, 3).map((item, i) => (
                        <ActionRow
                          key={item.id}
                          rank={i + 1}
                          item={item}
                          onSave={() =>
                            handleSave(
                              item.kind,
                              item.title,
                              item.meta
                            )
                          }
                          onCopy={() => copyText(item.id, item.title)}
                          copied={copiedKey === item.id}
                        />
                      ))}
                    </div>
                  </section>
                </>
              )}

              {/* ── TRENDS ─────────────────────────────────────────── */}
              {tab === 'trends' && (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                      <Filter className="h-3 w-3" /> Sort
                    </span>
                    {[
                      { id: 'score', label: 'Score' },
                      { id: 'hot', label: 'Hottest first' },
                      { id: 'easy', label: 'Easiest first' },
                    ].map((s) => (
                      <Chip
                        key={s.id}
                        active={sortBy === s.id}
                        onClick={() => setSortBy(s.id)}
                        label={s.label}
                      />
                    ))}
                    <span className="mx-1 hidden h-4 w-px bg-white/10 sm:inline" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                      Difficulty
                    </span>
                    {['all', 'easy', 'medium', 'hard'].map((d) => (
                      <Chip
                        key={d}
                        active={diffFilter === d}
                        onClick={() => setDiffFilter(d)}
                        label={d}
                      />
                    ))}
                  </div>

                  <div className="space-y-3">
                    {filteredTrends.length === 0 ? (
                      <p className="py-12 text-center text-sm text-zinc-600">
                        No trends match this filter.
                      </p>
                    ) : (
                      filteredTrends.map((trend, i) => (
                        <TrendRow
                          key={`${trend.topic}-${i}`}
                          index={i}
                          trend={trend}
                          onSave={() => handleSave('trend', trend.topic, trend)}
                          onCopyIdea={() =>
                            copyText(
                              `idea-${i}`,
                              trend.actionableIdea || trend.topic
                            )
                          }
                          copied={copiedKey === `idea-${i}`}
                        />
                      ))
                    )}
                  </div>
                </>
              )}

              {/* ── ACTIONS ────────────────────────────────────────── */}
              {tab === 'actions' && (
                <section className="rounded-2xl border border-white/[0.07] bg-zinc-950/70">
                  <div className="border-b border-white/[0.05] px-5 py-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                      What to do first
                    </h3>
                    <p className="mt-1 text-xs text-zinc-600">
                      Sorted by score, heat, and ease. Start at the top.
                    </p>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {actionQueue.map((item, i) => (
                      <ActionRow
                        key={item.id}
                        rank={i + 1}
                        item={item}
                        expanded
                        onSave={() => handleSave(item.kind, item.title, item.meta)}
                        onCopy={() => copyText(item.id, item.title)}
                        copied={copiedKey === item.id}
                      />
                    ))}
                  </div>

                  <div className="border-t border-white/[0.05] p-5">
                    <SectionLabel icon={Zap} title="Quick wins" />
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {quickWins.map((win, i) => (
                        <QuickWinCard
                          key={i}
                          win={win}
                          onSave={() => handleSave('quickwin', win.idea, win)}
                          onCopy={() => copyText(`qw-${i}`, win.idea)}
                          copied={copiedKey === `qw-${i}`}
                        />
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* ── IDEAS ──────────────────────────────────────────── */}
              {tab === 'ideas' && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {videoIdeas.map((idea, i) => (
                    <VideoIdeaCard
                      key={i}
                      idea={idea}
                      onSave={() => handleSave('idea', idea.title, idea)}
                      onCopy={() => copyText(`vi-${i}`, idea.title)}
                      copied={copiedKey === `vi-${i}`}
                    />
                  ))}
                </div>
              )}

              {/* ── PLAYBOOK ───────────────────────────────────────── */}
              {tab === 'playbook' && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <BlueprintCard
                    label="Title hooks"
                    items={hooks}
                    onCopyAll={() => copyText('hooks', hooks.join('\n'))}
                    onCopyItem={(item, i) => copyText(`hook-${i}`, item)}
                    copiedKey={copiedKey}
                  />
                  <BlueprintCard
                    label="Content styles"
                    items={styles}
                    onCopyAll={() => copyText('styles', styles.join('\n'))}
                    onCopyItem={(item, i) => copyText(`style-${i}`, item)}
                    copiedKey={copiedKey}
                  />

                  <section className="rounded-2xl border border-white/[0.07] bg-zinc-950/70 p-5 lg:col-span-2">
                    <SectionLabel icon={Lightbulb} title="How to use this scan" />
                    <ol className="mt-4 space-y-3 text-sm text-zinc-400">
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/5 text-[10px] font-bold text-zinc-300">
                          1
                        </span>
                        <span>
                          Open <button type="button" onClick={() => setTab('actions')} className="font-semibold text-white underline-offset-2 hover:underline">Actions</button> and do the #1 idea while the trend is hot.
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/5 text-[10px] font-bold text-zinc-300">
                          2
                        </span>
                        <span>
                          Copy a title idea and pair it with a hot topic for your next video.
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/5 text-[10px] font-bold text-zinc-300">
                          3
                        </span>
                        <span>
                          Save good ideas to Library so you can write them later.
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/5 text-[10px] font-bold text-zinc-300">
                          4
                        </span>
                        <span>
                          Scan again after you post to see what changed.
                        </span>
                      </li>
                    </ol>
                  </section>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Small UI ──────────────────────────────────────────────────────────── */

function SectionLabel({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-zinc-500" />
      <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
        {title}
      </h3>
    </div>
  );
}

function Chip({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
        active
          ? 'bg-white text-black'
          : 'border border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function Kpi({ label, value, icon: Icon, tone }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-zinc-950/60 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-600">
            {label}
          </p>
          <p className="mt-1.5 font-display text-xl tracking-tight text-white sm:text-2xl">
            {value ?? '—'}
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-black/40">
          <Icon className={`h-3.5 w-3.5 ${tone}`} />
        </div>
      </div>
    </div>
  );
}

function Snap({ label, value }) {
  return (
    <div className="bg-zinc-950 px-4 py-4">
      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-white">{value ?? '—'}</p>
    </div>
  );
}

function scoreTone(score) {
  const n = Number(score) || 0;
  if (n >= 80) return { bar: 'from-orange-500 to-red-500', text: 'text-orange-400' };
  if (n >= 60) return { bar: 'from-[#00f0ff] to-[#0070f3]', text: 'text-[#00f0ff]' };
  return { bar: 'from-zinc-400 to-zinc-600', text: 'text-zinc-300' };
}

function TrendRow({ trend, onSave, onCopyIdea, copied, index }) {
  const hot = String(trend.momentum || '').toLowerCase() === 'hot';
  const tone = scoreTone(trend.viralScore);
  const score = Math.min(100, Math.max(0, Number(trend.viralScore) || 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-4 transition-all hover:border-white/15 sm:p-5"
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-[15px] font-semibold tracking-tight text-white">
              {trend.topic}
            </h4>
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                hot
                  ? 'border-orange-500/25 bg-orange-500/10 text-orange-400'
                  : 'border-sky-500/25 bg-sky-500/10 text-sky-400'
              }`}
            >
              {hot ? <Flame className="h-2.5 w-2.5" /> : <TrendingUp className="h-2.5 w-2.5" />}
              {trend.momentum}
            </span>
            <span className="rounded-md border border-white/[0.08] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
              {trend.difficulty}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-zinc-500">{trend.opportunity}</p>

          {trend.actionableIdea && (
            <div className="rounded-xl border border-[#00f0ff]/15 bg-[#00f0ff]/[0.04] px-3 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#00f0ff]/80">
                Actionable idea
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-200">{trend.actionableIdea}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3 w-3" /> {trend.estimatedViews}
            </span>
            {trend.timeWindow && (
              <>
                <span className="h-1 w-1 rounded-full bg-zinc-800" />
                <span className="inline-flex items-center gap-1 text-amber-500/90">
                  <Timer className="h-3 w-3" /> {trend.timeWindow}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="text-right">
            <p className={`font-display text-2xl tabular-nums tracking-tight ${tone.text}`}>
              {trend.viralScore}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">Score</p>
          </div>
          <div className="h-1 w-14 overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${tone.bar}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <div className="mt-1 flex gap-1.5">
            <button
              type="button"
              onClick={onCopyIdea}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:text-white"
              title="Copy idea"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={onSave}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-500 transition-all hover:bg-white hover:text-black"
              title="Save to library"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ActionRow({ rank, item, onSave, onCopy, copied, expanded }) {
  return (
    <div className="flex items-start gap-3 px-4 py-4 sm:gap-4 sm:px-5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] font-display text-sm text-zinc-400">
        {rank}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-white">{item.title}</p>
          <span className="rounded border border-white/[0.08] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
            {item.kind === 'quickwin' ? 'quick win' : 'trend'}
          </span>
          {item.effort && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
              {item.effort} effort
            </span>
          )}
          {item.score != null && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#00f0ff]/80">
              score {item.score}
            </span>
          )}
        </div>
        {expanded && item.reason && (
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{item.reason}</p>
        )}
        {item.window && (
          <p className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-500/90">
            <Timer className="h-3 w-3" /> {item.window}
          </p>
        )}
      </div>
      <div className="flex shrink-0 gap-1.5">
        <button
          type="button"
          onClick={onCopy}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-500 hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={onSave}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-500 hover:bg-white hover:text-black"
        >
          <Save className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function QuickWinCard({ win, onSave, onCopy, copied }) {
  const effort = String(win.effort || '').toLowerCase();
  const effortClass =
    effort === 'low'
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
      : effort === 'medium'
        ? 'border-amber-500/25 bg-amber-500/10 text-amber-400'
        : 'border-red-500/25 bg-red-500/10 text-red-400';

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/40 p-4">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold leading-snug text-zinc-100">{win.idea}</h4>
        <div className="flex shrink-0 gap-1">
          <button type="button" onClick={onCopy} className="text-zinc-600 hover:text-white">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button type="button" onClick={onSave} className="text-zinc-600 hover:text-white">
            <Save className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${effortClass}`}>
          {win.effort} effort
        </span>
        {win.timing && (
          <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
            <Timer className="h-2.5 w-2.5" /> {win.timing}
          </span>
        )}
      </div>
      {win.why && (
        <p className="mt-2.5 border-l-2 border-[#00f0ff]/25 pl-2.5 text-xs leading-relaxed text-zinc-500">
          {win.why}
        </p>
      )}
    </div>
  );
}

function VideoIdeaCard({ idea, onSave, onCopy, copied }) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-5">
      <div className="mb-4 flex-1 pr-2">
        <h4 className="text-base font-semibold leading-snug text-white">{idea.title}</h4>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-500">
          {idea.description}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-white/[0.05] pt-3">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          <span className="inline-flex items-center gap-1 text-zinc-400">
            <Eye className="h-3 w-3" /> {idea.predictedViews}
          </span>
          <span className="h-1 w-1 rounded-full bg-zinc-800" />
          <span>{idea.difficulty}</span>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onCopy}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-500 hover:text-white"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onSave}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function BlueprintCard({ label, items = [], onCopyAll, onCopyItem, copiedKey }) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-zinc-950/70">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
        <button
          type="button"
          onClick={onCopyAll}
          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white"
        >
          {copiedKey === 'hooks' || copiedKey === 'styles' || copiedKey === 'all-hooks' ? (
            <Check className="h-3 w-3 text-emerald-400" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          Copy all
        </button>
      </div>
      <div className="space-y-2 p-4">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
          >
            <span className="text-sm text-zinc-300">{item}</span>
            <button
              type="button"
              onClick={() => onCopyItem(item, i)}
              className="shrink-0 text-zinc-600 hover:text-white"
            >
              {copiedKey === `hook-${i}` || copiedKey === `style-${i}` ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
