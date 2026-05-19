'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  Video, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  Calendar,
  RefreshCw,
  Info,
  Sparkles,
  Target,
  Rocket
} from 'lucide-react';
import { useChannel } from '@/contexts/channel';
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
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-geist-success animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest text-accents-4">Loading Analytics...</p>
      </div>
    );
  }

  if (!userChannel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <BarChart3 className="w-10 h-10 text-accents-3" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">No Channel Connected</h2>
        <p className="text-accents-4 max-w-sm mb-8">Connect your YouTube channel in the sidebar to unlock historical tracking and growth predictions.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-10 max-w-[1600px] mx-auto pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-geist-success animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-accents-4">Real-time Intelligence</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic flex items-center gap-4">
            Analytics <span className="text-accents-2 font-normal not-italic">/ {data.channel.title}</span>
          </h1>
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Subscribers" 
          value={formatNumber(metrics?.subscribers)} 
          change={metrics?.subChange} 
          icon={Users}
        />
        <StatCard 
          label="Total Views" 
          value={formatNumber(metrics?.views)} 
          change={metrics?.viewChange} 
          icon={Eye}
        />
        <StatCard 
          label="Video Count" 
          value={formatNumber(metrics?.videos)} 
          icon={Video}
        />
        <StatCard 
          label="Avg. Views" 
          value={formatNumber(metrics?.avgViews)} 
          icon={TrendingUp}
          subLabel="Recent 10 videos"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-[#080808] border border-white/5 rounded-[2.5rem] p-8 min-h-[450px] flex flex-col relative overflow-hidden">
          {chartData.isPrediction && (
            <div className="absolute top-8 right-8 z-10 flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-geist-success" />
              <span className="text-[10px] font-black uppercase tracking-widest text-geist-success">Growth Prediction</span>
            </div>
          )}
          
          <div className="mb-8">
            <h3 className="text-xl font-black uppercase tracking-tighter mb-1">Performance Trajectory</h3>
            <p className="text-[10px] text-accents-4 font-bold uppercase tracking-[0.2em]">
              {chartData.isPrediction ? 'Linear projection based on recent video performance' : 'Historical data from daily snapshots'}
            </p>
          </div>

          <div className="flex-1 min-h-0">
             <Line 
               options={{
                 ...commonOptions,
                 plugins: {
                   ...commonOptions.plugins,
                   legend: { display: true, position: 'bottom', labels: { color: '#666', font: { size: 10, weight: 'bold' }, usePointStyle: true, padding: 20 } }
                 }
               }} 
               data={chartData} 
             />
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex-1 bg-white text-black rounded-[2.5rem] p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Next Milestone</h3>
              <p className="text-sm font-medium opacity-60">Based on your current trajectory, you will reach your next milestone soon.</p>
            </div>
            
            <div className="mt-8 space-y-6">
               <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">To 100K Views</span>
                    <span className="text-xl font-black tracking-tighter">
                      {metrics?.views >= 100000 ? 'REACHED' : formatNumber(100000 - metrics?.views)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
                    <div className="h-full bg-black" style={{ width: `${Math.min((metrics?.views / 100000) * 100, 100)}%` }}></div>
                  </div>
               </div>
               
               <div className="flex items-center gap-3 p-4 bg-black/5 rounded-2xl">
                  <Rocket className="w-5 h-5" />
                  <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">
                    Prediction: {Math.ceil((100000 - metrics?.views) / (metrics?.avgViews * 0.1 || 100))} days to target
                  </p>
               </div>
            </div>
          </div>

          <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8 flex items-center justify-between group cursor-pointer hover:border-white/20 transition-all">
             <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-accents-4 mb-1">Channel Health</h4>
                <p className="text-xl font-black uppercase tracking-tighter">Stable Growth</p>
             </div>
             <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-geist-success/20 transition-all">
                <Zap className="w-6 h-6 text-geist-success" />
             </div>
          </div>
        </div>
      </div>

      {/* Recent Videos Grid */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
             </div>
             <h3 className="text-2xl font-black uppercase tracking-tighter italic">Recent Performance</h3>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-accents-3 italic">Last 10 Uploads</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {data.videos.map((video) => (
            <div key={video.id} className="group bg-[#080808] border border-white/5 rounded-3xl overflow-hidden hover:border-white/20 transition-all">
              <div className="relative aspect-video">
                <img src={video.thumbnail} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-[10px] font-black text-white/80 line-clamp-1">{video.title}</p>
                </div>
              </div>
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                   <Eye className="w-3.5 h-3.5 text-accents-4" />
                   <span className="text-xs font-black tracking-tight">{formatNumber(video.statistics?.viewCount)}</span>
                </div>
                <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                  parseInt(video.statistics?.viewCount) > metrics?.avgViews ? 'text-geist-success bg-geist-success/10' : 'text-accents-4 bg-white/5'
                }`}>
                  {parseInt(video.statistics?.viewCount) > metrics?.avgViews ? 'Hot' : 'Normal'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, change, icon: Icon, subLabel }) {
  const isPositive = change >= 0;
  
  return (
    <div className="bg-[#080808] border border-white/5 p-8 rounded-[2.5rem] hover:border-white/10 transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-white/10 transition-all">
          <Icon className="w-5 h-5 text-accents-3 group-hover:text-white" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isPositive ? 'text-geist-success bg-geist-success/10' : 'text-red-500 bg-red-500/10'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {formatNumber(Math.abs(change))}
          </div>
        )}
      </div>
      
      <p className="text-[10px] font-black uppercase tracking-widest text-accents-4 mb-1">{label}</p>
      <h4 className="text-3xl font-black tracking-tighter text-white">{value}</h4>
      {subLabel && <p className="text-[9px] text-accents-3 font-bold uppercase tracking-widest mt-2">{subLabel}</p>}
    </div>
  );
}
