'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  AlertCircle, 
  RefreshCw, 
  Save, 
  ArrowUpRight, 
  Video, 
  Lightbulb, 
  BarChart3, 
  Layers,
  ChevronRight,
  Plus
} from 'lucide-react';
import { useTitle } from '@/lib/hooks/titles';
import ResearchNotesModal from './ResearchNotesModal';

const CACHE_KEY_PREFIX = 'trend_radar_cache_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export default function TrendRadar() {
  useTitle("Trend Radar");
  const { channels } = useChannel();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [lastScanTime, setLastScanTime] = useState(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedNoteItem, setSelectedNoteItem] = useState(null);

  const selectedChannel = channels.data.find(c => c.id === channels.selectedId);
  const getCacheKey = () => `${CACHE_KEY_PREFIX}${selectedChannel?.id || 'default'}`;

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
    if (selectedChannel) {
      const cached = loadCachedData();
      if (!cached && !loading && !data) {
        scanTrends();
      }
    }
  }, [selectedChannel?.id]);

  const cacheData = (data) => {
    if (!selectedChannel) return;
    try {
      localStorage.setItem(getCacheKey(), JSON.stringify({
        data,
        timestamp: Date.now(),
        channelId: selectedChannel.id
      }));
      setLastScanTime(Date.now());
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
          channelBased: !!selectedChannel
        })
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
                cacheData(jsonData.data);
                setProgress(100);
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
    const reference_id = `${type.substring(0,2)}-${btoa(title).substring(0, 10)}`;
    setSelectedNoteItem({ type: 'idea', title, reference_id, metadata });
    setIsNotesModalOpen(true);
  };

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
              <BarChart3 className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-lg font-medium tracking-tight">Radar</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {lastScanTime && !loading && (
              <span className="text-xs text-zinc-500 hidden sm:inline">
                Last scan: {getCacheAge()}
              </span>
            )}
            <button
              onClick={scanTrends}
              disabled={loading || !selectedChannel}
              className="h-9 px-4 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {loading ? 'Scanning' : 'Scan'}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          {!data && !loading && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
                <Target className="w-10 h-10 text-zinc-500" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Market Intelligence</h2>
              <p className="text-zinc-500 max-w-md mb-8">
                {selectedChannel 
                  ? `Scan ${selectedChannel.title} to identify viral trends, competitor gaps, and high-potential video ideas.`
                  : "Select a channel to begin scanning for real-time market opportunities."}
              </p>
              <button
                onClick={scanTrends}
                disabled={!selectedChannel}
                className="px-8 py-3 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-all disabled:opacity-30"
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
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative w-32 h-32 mb-12">
                <motion.div 
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 border-2 border-white rounded-full"
                />
                <motion.div 
                  animate={{ scale: [1, 1.3], opacity: [0.3, 0] }}
                  transition={{ duration: 2, delay: 0.5, repeat: Infinity }}
                  className="absolute inset-0 border border-white rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white mb-2 tracking-widest uppercase">
                  {currentStep || 'Initializing...'}
                </p>
                <div className="w-64 h-1 bg-zinc-900 rounded-full overflow-hidden mx-auto">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-white"
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-4 font-mono">{progress}%</p>
              </div>
            </motion.div>
          )}

          {data && !loading && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12 pb-20"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard 
                  title="Viral Potential" 
                  value={data.insights.overview.viralPotential} 
                  icon={Flame}
                  color="text-orange-500"
                />
                <SummaryCard 
                  title="Market Momentum" 
                  value={data.insights.overview.marketMomentum} 
                  icon={TrendingUp}
                  color="text-blue-500"
                />
                <SummaryCard 
                  title="Videos Scanned" 
                  value={data.summary.totalVideosAnalyzed} 
                  icon={Layers}
                  color="text-zinc-400"
                />
              </div>

              {/* Analysis Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Overview & Trends */}
                <div className="lg:col-span-7 space-y-12">
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Market Summary
                      </h3>
                    </div>
                    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
                      <p className="text-lg leading-relaxed text-zinc-200 font-light">
                        {data.insights.overview.summary}
                      </p>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <Rocket className="w-4 h-4" /> Emerging Trends
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {data.insights.emergingTrends.map((trend, i) => (
                        <TrendRow 
                          key={i} 
                          trend={trend} 
                          onSave={() => handleSave('trend', trend.topic, trend)} 
                        />
                      ))}
                    </div>
                  </section>
                </div>

                {/* Right Column: Quick Wins & AI Ideas */}
                <div className="lg:col-span-5 space-y-12">
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Quick Wins
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {data.insights.quickWins.map((win, i) => (
                        <QuickWinCard 
                          key={i} 
                          win={win} 
                          onSave={() => handleSave('quickwin', win.idea, win)}
                        />
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <Video className="w-4 h-4" /> AI Concepts
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {data.insights.videoIdeas.map((idea, i) => (
                        <VideoIdeaCard 
                          key={i} 
                          idea={idea} 
                          onSave={() => handleSave('idea', idea.title, idea)}
                        />
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              {/* Viral Patterns */}
              <section className="pt-12 border-t border-zinc-900">
                <div className="flex items-center gap-2 mb-8">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">Viral Blueprint</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-600 uppercase mb-4 tracking-tighter">Title Hooks</h4>
                    <div className="flex flex-wrap gap-2">
                      {data.insights.viralPatterns.titleHooks.map((hook, i) => (
                        <div key={i} className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-400">
                          {hook}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-600 uppercase mb-4 tracking-tighter">Content Styles</h4>
                    <div className="flex flex-wrap gap-2">
                      {data.insights.viralPatterns.contentStyles.map((style, i) => (
                        <div key={i} className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-400">
                          {style}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mt-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, color }) {
  return (
    <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">{title}</span>
      </div>
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function TrendRow({ trend, onSave }) {
  const momentumColor = trend.momentum === 'hot' ? 'text-red-500' : 'text-blue-500';
  
  return (
    <div className="group p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:bg-zinc-900/60 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-medium text-white group-hover:text-blue-400 transition-colors">
              {trend.topic}
            </h4>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 ${momentumColor} uppercase`}>
              {trend.momentum}
            </span>
          </div>
          <p className="text-sm text-zinc-500 leading-snug">{trend.opportunity}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold tracking-tighter text-white">{trend.viralScore}</span>
            <span className="text-[10px] font-bold text-zinc-600 uppercase">Score</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onSave}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
        <div className="flex items-center gap-1">
          <Eye className="w-3 h-3" /> {trend.estimatedViews}
        </div>
        <div className="flex items-center gap-1">
          <Target className="w-3 h-3" /> {trend.difficulty}
        </div>
      </div>
    </div>
  );
}

function QuickWinCard({ win, onSave }) {
  const effortColor = win.effort === 'low' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                     win.effort === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                     'bg-red-500/10 text-red-500 border-red-500/20';

  return (
    <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col gap-4">
      <div className="flex justify-between items-start gap-3">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-zinc-100">{win.idea}</h4>
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase border ${effortColor}`}>
            {win.effort} Effort
          </span>
        </div>
        <button 
          onClick={onSave}
          className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-white"
        >
          <Save className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-zinc-500 leading-relaxed italic border-l-2 border-zinc-800 pl-3">
        "{win.why}"
      </p>
    </div>
  );
}

function VideoIdeaCard({ idea, onSave }) {
  return (
    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4">
        <button 
          onClick={onSave}
          className="p-2 rounded-full bg-white text-black opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-white pr-10 leading-tight mb-2">{idea.title}</h4>
        <p className="text-sm text-zinc-500 line-clamp-2">{idea.description}</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            <Eye className="w-3 h-3" /> {idea.predictedViews}
          </div>
          <div className="w-1 h-1 bg-zinc-800 rounded-full" />
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
            {idea.difficulty}
          </span>
        </div>
      </div>
    </div>
  );
}
