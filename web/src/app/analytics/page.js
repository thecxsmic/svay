'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  Video, 
  Zap, 
  RefreshCw,
  Sparkles,
  Target,
  Rocket,
  Clock,
} from 'lucide-react';
import { useChannel } from '@/contexts/channel';
import {
  PageLoader,
  EmptyState,
  DashPage,
  DashToolbar,
  DashBody,
  DashButton,
  DashKpi,
  DashPanel,
  MetaChip,
} from '../components/dashboard/ui';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const formatNumber = (num) => {
  const n = parseInt(num || 0);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
};

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#000',
      titleFont: { size: 10, weight: 'bold' },
      bodyFont: { size: 12, weight: 'black' },
      padding: 12,
      cornerRadius: 12,
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      displayColors: false,
    },
  },
  scales: {
    x: {
      grid: { display: false, drawBorder: false },
      ticks: { color: '#444', font: { size: 9, weight: 'bold' } }
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
      ticks: { 
        color: '#444', 
        font: { size: 9, weight: 'bold' }, 
        callback: (value) => formatNumber(value)
      }
    }
  }
};

export default function AnalyticsPage() {
  const { userChannel } = useChannel();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ snapshots: [], channel: null, videos: [] });
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(null);


  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics');
      const json = await res.json();
      if (json.success) {
        setData({
          snapshots: json.data || [],
          channel: json.channel,
          videos: json.videos || []
        });
        setLastScanTime(Date.now());
        
        // If no snapshots today, trigger a sync
        const today = new Date().toISOString().split('T')[0];
        const hasToday = json.data.some(s => s.date === today);
        if (!hasToday && json.channel) {
          syncSnapshot();
        }
      } else {
        setError(json.error);
      }
    } catch (err) {
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  const syncSnapshot = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/analytics', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setLastScanTime(Date.now());
        // Refresh data
        const refreshRes = await fetch('/api/analytics');
        const refreshJson = await refreshRes.json();
        if (refreshJson.success) {
          setData({
            snapshots: refreshJson.data || [],
            channel: refreshJson.channel,
            videos: refreshJson.videos || []
          });
        }
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getCacheAge = () => {
    if (!lastScanTime) return '';
    const mins = Math.floor((Date.now() - lastScanTime) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins/60)}h ago`;
  };

  // Metrics Calculations
  const metrics = useMemo(() => {
    if (!data.channel) return null;
    
    const snapshots = data.snapshots;
    const current = data.channel.statistics;
    const prev = snapshots.length > 1 ? snapshots[snapshots.length - 2] : snapshots[0];

    const subChange = prev ? (parseInt(current.subscriberCount) - prev.subscribers) : 0;
    const viewChange = prev ? (parseInt(current.viewCount) - prev.views) : 0;
    
    // Average views per video from recent videos
    const avgViews = data.videos.length > 0 
      ? Math.round(data.videos.reduce((acc, v) => acc + parseInt(v.statistics.viewCount || 0), 0) / data.videos.length)
      : 0;

    return {
      subscribers: parseInt(current.subscriberCount),
      views: parseInt(current.viewCount),
      videos: parseInt(current.videoCount),
      subChange,
      viewChange,
      avgViews,
      isLowData: snapshots.length < 2
    };
  }, [data]);

  // Chart Data
  const chartData = useMemo(() => {
    if (data.snapshots.length < 2) {
      // PREDICTION MODE
      const labels = [];
      const subData = [];
      const viewData = [];
      const now = new Date();
      
      const baseSubs = metrics?.subscribers || 0;
      const baseViews = metrics?.views || 0;
      const dailyViews = metrics?.avgViews * 0.1 || 100; // conservative daily growth
      const dailySubs = Math.max(1, Math.round(dailyViews * 0.01));

      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        labels.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
        subData.push(baseSubs + (dailySubs * i));
        viewData.push(baseViews + (dailyViews * i));
      }

      return {
        labels,
        datasets: [
          {
            label: 'Predicted Subscribers',
            data: subData,
            borderColor: '#00dfd8',
            backgroundColor: 'rgba(0, 223, 216, 0.1)',
            fill: true,
            tension: 0.4,
            borderDash: [5, 5]
          },
          {
            label: 'Predicted Views',
            data: viewData,
            borderColor: '#0070f3',
            backgroundColor: 'rgba(0, 112, 243, 0.1)',
            fill: true,
            tension: 0.4,
            borderDash: [5, 5]
          }
        ],
        isPrediction: true
      };
    }

    // ACTUAL HISTORICAL DATA
    return {
      labels: data.snapshots.map(s => new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Subscribers',
          data: data.snapshots.map(s => s.subscribers),
          borderColor: '#00dfd8',
          backgroundColor: 'rgba(0, 223, 216, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Total Views',
          data: data.snapshots.map(s => s.views),
          borderColor: '#0070f3',
          backgroundColor: 'rgba(0, 112, 243, 0.1)',
          fill: true,
          tension: 0.4,
        }
      ],
      isPrediction: false
    };
  }, [data, metrics]);

  if (loading && !data.channel) {
    return <PageLoader label="Loading analytics…" />;
  }

  if (!userChannel) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No channel connected"
        description="Connect your YouTube channel in the menu to track growth over time."
      />
    );
  }

  return (
    <DashPage>
      <DashToolbar
        left={
          <>
            {data.channel?.title && (
              <MetaChip>
                {data.channel.title}
              </MetaChip>
            )}
            {lastScanTime && !syncing && (
              <MetaChip icon={Clock}>Scanned {getCacheAge()}</MetaChip>
            )}
          </>
        }
        mobileLeft={
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-white">
              {data.channel?.title || "Analytics"}
            </p>
            {lastScanTime && !syncing && (
              <p className="truncate text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Scanned {getCacheAge()}
              </p>
            )}
          </div>
        }
      >
        <DashButton
          size="sm"
          onClick={syncSnapshot}
          disabled={syncing || !userChannel}
          className="!h-10 !px-2.5 sm:!h-9 sm:!px-3.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">{syncing ? "Syncing" : "Sync"}</span>
        </DashButton>
      </DashToolbar>

      <DashBody className="space-y-6 pb-24 sm:space-y-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <DashKpi
            label="Subscribers"
            value={formatNumber(metrics?.subscribers)}
            icon={Users}
            tone="text-[#00f0ff]"
            sub={
              metrics?.subChange !== undefined
                ? `${metrics.subChange >= 0 ? "+" : ""}${formatNumber(metrics.subChange)} period`
                : undefined
            }
          />
          <DashKpi
            label="Total views"
            value={formatNumber(metrics?.views)}
            icon={Eye}
            tone="text-zinc-200"
            sub={
              metrics?.viewChange !== undefined
                ? `${metrics.viewChange >= 0 ? "+" : ""}${formatNumber(metrics.viewChange)} period`
                : undefined
            }
          />
          <DashKpi
            label="Videos"
            value={formatNumber(metrics?.videos)}
            icon={Video}
          />
          <DashKpi
            label="Avg views"
            value={formatNumber(metrics?.avgViews)}
            icon={TrendingUp}
            tone="text-orange-400"
            sub="Recent 10"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <DashPanel
            title="Growth over time"
            icon={BarChart3}
            className="lg:col-span-8"
            action={
              chartData.isPrediction ? (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-[#00f0ff]/20 bg-[#00f0ff]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#00f0ff]">
                  <Sparkles className="h-3 w-3" /> Guess ahead
                </span>
              ) : null
            }
            bodyClassName="p-4 sm:p-6 min-h-[320px] sm:min-h-[400px]"
          >
            <p className="mb-4 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              {chartData.isPrediction
                ? "Guess based on recent views"
                : "Daily history"}
            </p>
            <div className="h-[280px] sm:h-[340px]">
              <Line
                options={{
                  ...commonOptions,
                  plugins: {
                    ...commonOptions.plugins,
                    legend: {
                      display: true,
                      position: "bottom",
                      labels: {
                        color: "#666",
                        font: { size: 10, weight: "bold" },
                        usePointStyle: true,
                        padding: 16,
                      },
                    },
                  },
                }}
                data={chartData}
              />
            </div>
          </DashPanel>

          <div className="flex flex-col gap-4 lg:col-span-4">
            <DashPanel title="Next milestone" icon={Target} bodyClassName="p-5 space-y-5">
              <p className="text-xs leading-relaxed text-zinc-500">
                Path to 100K total views based on recent averages.
              </p>
              <div>
                <div className="mb-2 flex items-end justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                    To 100K views
                  </span>
                  <span className="text-sm font-bold tabular-nums text-white">
                    {metrics?.views >= 100000
                      ? "Reached"
                      : formatNumber(100000 - (metrics?.views || 0))}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-geist-success to-[#00f0ff]"
                    style={{
                      width: `${Math.min(((metrics?.views || 0) / 100000) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                <Rocket className="h-4 w-4 text-[#00f0ff]" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  ~{Math.max(0, Math.ceil((100000 - (metrics?.views || 0)) / ((metrics?.avgViews || 0) * 0.1 || 100)))} days to target
                </p>
              </div>
            </DashPanel>

            <div className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-zinc-950/70 p-5">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                  Channel status
                </p>
                <p className="mt-1 font-display text-lg uppercase tracking-tight text-white">
                  Growing steadily
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                <Zap className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Video className="h-3.5 w-3.5 text-zinc-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                Recent performance
              </h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              Last 10 uploads
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {data.videos.map((video) => {
              const views = parseInt(video.statistics?.viewCount || 0, 10);
              const hot = views > (metrics?.avgViews || 0);
              return (
                <div
                  key={video.id}
                  className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-950/50 transition-colors hover:border-white/15"
                >
                  <div className="relative aspect-video">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={video.thumbnail}
                      className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                      alt=""
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <p className="absolute bottom-2 left-3 right-3 line-clamp-1 text-[10px] font-bold text-white/90">
                      {video.title}
                    </p>
                  </div>
                  <div className="flex items-center justify-between px-3 py-3">
                    <span className="inline-flex items-center gap-1 text-xs font-bold tabular-nums text-zinc-300">
                      <Eye className="h-3 w-3 text-zinc-500" />
                      {formatNumber(views)}
                    </span>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        hot
                          ? "bg-orange-500/10 text-orange-400"
                          : "bg-white/5 text-zinc-500"
                      }`}
                    >
                      {hot ? "Hot" : "Normal"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </DashBody>
    </DashPage>
  );
}
