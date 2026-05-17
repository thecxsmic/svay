'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChannel } from '@/contexts/channel';
import { useUser } from '@/contexts/user';
import { useBottomSheet } from '@/contexts/bottomSheet';
import { 
  TrendingUp,
  Zap,
  Flame,
  Target,
  Clock,
  Eye,
  Sparkles,
  Rocket,
  AlertCircle,
  Activity,
  Loader2,
  Radio,
  ArrowUpRight,
  PlayCircle,
  Calendar,
  Timer,
  RefreshCw,
  ExternalLink,
  BarChart3,
  Gauge,
  TrendingDown,
  Layers,
  Maximize2,
  Minimize2,
  Info,
  Lightbulb,
  Trophy,
  Hash,
  Video,
  Star,
  ZoomIn,
  ZoomOut,
  Maximize,
  Menu,
  X
} from 'lucide-react';
import { useTitle } from '@/lib/hooks/titles';

const CACHE_KEY_PREFIX = 'trend_radar_cache_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export default function TrendRadar() {
  useTitle("Trend Radar - dashboard")
  const { channels } = useChannel();
  const { user } = useUser();
  const { openBottomSheet } = useBottomSheet();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [lastScanTime, setLastScanTime] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const selectedChannel = channels.data.find(c => c.id === channels.selectedId);
  
  // Generate cache key based on selected channel
  const getCacheKey = () => {
    return `${CACHE_KEY_PREFIX}${selectedChannel?.id || 'default'}`;
  };

  // Load cached data on mount or when channel changes
  useEffect(() => {
    if (selectedChannel) {
      const cached = loadCachedData();
      if (!cached) {
        scanTrends();
      }
    }
  }, [selectedChannel?.id]);

  const loadCachedData = () => {
    if (!selectedChannel) return null;
    
    try {
      const cached = localStorage.getItem(getCacheKey());
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < CACHE_DURATION) {
          setData(cachedData);
          setLastScanTime(timestamp);
          return cachedData;
        } else {
          localStorage.removeItem(getCacheKey());
        }
      }
    } catch (err) {
      console.error('Failed to load cached data:', err);
    }
    return null;
  };

  const cacheData = (data) => {
    if (!selectedChannel) return;
    
    try {
      const cacheObject = {
        data,
        timestamp: Date.now(),
        channelId: selectedChannel.id,
        channelTitle: selectedChannel.title
      };
      localStorage.setItem(getCacheKey(), JSON.stringify(cacheObject));
      setLastScanTime(Date.now());
    } catch (err) {
      console.error('Failed to cache data:', err);
    }
  };

  const getCacheAge = () => {
    if (!lastScanTime) return null;
    const age = Date.now() - lastScanTime;
    const hours = Math.floor(age / (60 * 60 * 1000));
    const minutes = Math.floor((age % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) return `${hours}h ${minutes}m ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const scanTrends = async () => {
    setLoading(true);
    setProgress(0);
    setError(null);
    setData(null);
  
    try {
      const requestBody = {
        user: { $id: user?.$id || 'anonymous' },
        category: 'all',
      };
  
      if (selectedChannel) {
        requestBody.channelId = selectedChannel.id;
        requestBody.channelTitle = selectedChannel.title;
        requestBody.channelBased = true;
      } else {
        requestBody.channelBased = false;
      }
  
      const response = await fetch('/api/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
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
            } catch (parseError) {
              console.error('Failed to parse SSE message:', parseError);
            }
          }
        }
      }
      
      if (buffer.startsWith('data: ')) {
        try {
          const jsonData = JSON.parse(buffer.slice(6));
          if (jsonData.type === 'complete') {
            setData(jsonData.data);
            cacheData(jsonData.data);
            setProgress(100);
          } else if (jsonData.type === 'error') {
            setError(jsonData.message || jsonData.error);
          }
        } catch (parseError) {
          console.error('Failed to parse final SSE message:', parseError);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate 2D mind map nodes with horizontal layout (left-to-right) for all devices
  const mindMapNodes = useMemo(() => {
    if (!data) return { center: null, quickWins: [], trends: [] };
    
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    
    // Center node - Overview (leftmost)
    const center = {
      id: 'center',
      type: 'center',
      title: 'Trend Radar',
      subtitle: `${data.summary.totalVideosAnalyzed} videos analyzed`,
      icon: Radio,
      position: { x: -600, y: 0 },
      color: 'from-blue-500 to-purple-600',
      data: data
    };

    // Quick Wins - Middle section (horizontal layout for all devices)
    const quickWinCount = data.insights.quickWins.length;
    const quickWins = data.insights.quickWins.map((win, index) => {
      const rows = Math.ceil(quickWinCount / 2);
      const row = Math.floor(index / 2);
      const col = index % 2;
      const spacing = isMobile ? 160 : 180;
      const startX = isMobile ? -200 : -150;
      const startY = -(rows - 1) * spacing / 2;
      
      return {
        id: `qw-${index}`,
        type: 'quickWin',
        title: win.idea,
        subtitle: win.timing,
        icon: Lightbulb,
        position: {
          x: startX + (col * spacing),
          y: startY + (row * spacing)
        },
        color: win.effort === 'low' ? 'from-green-500 to-emerald-600' : 
               win.effort === 'medium' ? 'from-yellow-500 to-orange-600' : 
               'from-red-500 to-pink-600',
        data: win,
        connections: ['center']
      };
    });

    // Emerging Trends - Right section (horizontal layout for all devices)
    const trendCount = Math.min(data.insights.emergingTrends.length, 8);
    const trends = data.insights.emergingTrends.slice(0, trendCount).map((trend, index) => {
      const rows = Math.ceil(trendCount / 2);
      const row = Math.floor(index / 2);
      const col = index % 2;
      const spacing = isMobile ? 160 : 180;
      const startX = isMobile ? 300 : 350;
      const startY = -(rows - 1) * spacing / 2;
      
      return {
        id: `trend-${index}`,
        type: 'trend',
        title: trend.topic,
        subtitle: `Score: ${trend.viralScore}`,
        icon: Flame,
        position: {
          x: startX + (col * spacing),
          y: startY + (row * spacing)
        },
        color: trend.momentum === 'hot' ? 'from-red-500 to-orange-600' :
               trend.momentum === 'rising' ? 'from-blue-500 to-cyan-600' :
               'from-purple-500 to-pink-600',
        data: trend,
        connections: ['center']
      };
    });

    // Video Ideas - Far right section
    const ideaCount = data.insights.videoIdeas?.length || 0;
    const videoIdeas = (data.insights.videoIdeas || []).map((idea, index) => {
      const rows = Math.ceil(ideaCount / 2);
      const row = Math.floor(index / 2);
      const col = index % 2;
      const spacing = isMobile ? 160 : 180;
      const startX = isMobile ? 800 : 850;
      const startY = -(rows - 1) * spacing / 2;
      
      return {
        id: `idea-${index}`,
        type: 'videoIdea',
        title: idea.title,
        subtitle: idea.predictedViews,
        icon: Video,
        position: {
          x: startX + (col * spacing),
          y: startY + (row * spacing)
        },
        color: 'from-fuchsia-500 to-violet-600',
        data: idea,
        connections: ['center']
      };
    });

    return { center, quickWins, trends, videoIdeas };
  }, [data]);

  const allNodes = useMemo(() => {
    if (!mindMapNodes.center) return [];
    return [
      mindMapNodes.center,
      ...mindMapNodes.quickWins,
      ...mindMapNodes.trends,
      ...mindMapNodes.videoIdeas
    ];
  }, [mindMapNodes]);

  const handleNodeClick = useCallback((node) => {
    if (node.type === 'center') {
      openBottomSheet({
        id: 'center-overview',
        title: 'Market Overview',
        description: 'Complete trend analysis and insights',
        size: 'large',
        content: <CenterNodeDetails data={node.data} />
      });
    } else if (node.type === 'quickWin') {
      openBottomSheet({
        id: `quickwin-${node.id}`,
        title: 'Quick Win Opportunity',
        description: 'Low-hanging fruit for viral content',
        size: 'default',
        content: <QuickWinDetails data={node.data} />
      });
    } else if (node.type === 'trend') {
      openBottomSheet({
        id: `trend-${node.id}`,
        title: 'Emerging Trend',
        description: 'Capitalize on this trending topic',
        size: 'default',
        content: <TrendDetails data={node.data} />
      });
    } else if (node.type === 'videoIdea') {
      openBottomSheet({
        id: `idea-${node.id}`,
        title: 'Video Idea',
        description: 'Generated video concept',
        size: 'default',
        content: <VideoIdeaDetails data={node.data} />
      });
    }
  }, [data, openBottomSheet]);

  return (
    <div className="flex flex-col flex-1 h-full bg-[#000] text-white overflow-hidden">
      {/* Main Content - Flex fill remaining space */}
      <div className="flex-1 h-full relative overflow-hidden">
        {data ? (
          isMobile ? (
            <MobileCardView data={data} onNodeClick={handleNodeClick} />
          ) : (
            <MindMap2D 
              nodes={allNodes}
              hoveredNode={hoveredNode}
              setHoveredNode={setHoveredNode}
              onNodeClick={handleNodeClick}
              loading={loading}
              progress={progress}
              currentStep={currentStep}
            />
          )
        ) : !loading ? (
          <EmptyState onScan={scanTrends} hasChannel={!!selectedChannel} />
        ) : null}

        {/* Loading Animation Overlay */}
        <AnimatePresence>
          {loading && !data && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
            >
              <LoadingMindMap progress={progress} currentStep={currentStep} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 z-50 sm:max-w-md mx-auto"
            >
              <div className="bg-red-950/90 backdrop-blur-xl border border-red-900 rounded-xl p-4 flex items-start gap-3 shadow-2xl">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-red-400">Scan Failed</p>
                  <p className="text-xs text-red-500 mt-1 break-words">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer - Fixed height, flex layout */}
      {!loading && (
        <footer className="relative h-min border-t border-zinc-800 bg-gradient-to-t from-black/95 to-black/80 backdrop-blur-sm z-40 flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 py-3 sm:py-4">
              {/* Footer Content */}
              <div className="flex flex-row items-center justify-between gap-4">
                {/* Left Section - Title and Status */}
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">Trend Radar</h1>
                    {lastScanTime && !loading && (
                      <p className="text-xs text-zinc-500">Updated {getCacheAge()}</p>
                    )}
                  </div>
                </div>

                {/* Right Section - Actions */}
                <button
                  onClick={scanTrends}
                  disabled={loading || !selectedChannel}
                  className="px-3 sm:px-5 py-2 sm:py-2.5 bg-white hover:bg-zinc-100 text-black rounded-xl text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-white/10 flex-shrink-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                      <span className="hidden sm:inline">Scanning...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Scan</span>
                    </>
                  )}
                </button>
              </div>

              {/* Legend and Instructions */}
              {data && (
                <div className="flex gap-3 sm:gap-4 h-min">
                  {/* Legend */}
                  <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 sm:px-4 py-2 overflow-x-auto">
                    <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0" />
                        <span className="text-zinc-400">Overview</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex-shrink-0" />
                        <span className="text-zinc-400">Quick Wins</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex-shrink-0" />
                        <span className="text-zinc-400">Trends</span>
                      </div>
                    </div>
                  </div>

                  {/* Instructions - Hidden on mobile */}
                  <div className="hidden md:block bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 sm:px-4 py-2">
                    <p className="text-[10px] sm:text-xs text-zinc-500 whitespace-nowrap">
                      <span className="text-zinc-400 font-medium">Click</span> node • 
                      <span className="text-zinc-400 font-medium"> Scroll</span> zoom • 
                      <span className="text-zinc-400 font-medium"> Drag</span> pan
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

// ============= MOBILE CARD VIEW COMPONENT =============

function MobileCardView({ data, onNodeClick }) {
  return (
    <div className="h-full overflow-y-auto px-4 py-6 space-y-8 no-scrollbar pb-32">
      {/* Overview Card */}
      <section>
        <div className="flex items-center gap-2 mb-4 px-1">
          <Activity className="w-4 h-4 text-blue-500" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Market Overview</h2>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onNodeClick({ type: 'center', data })}
          className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 relative overflow-hidden group active:scale-[0.98] transition-transform"
        >
          <div className="absolute top-0 right-0 p-4">
             <ArrowUpRight className="w-4 h-4 text-zinc-600" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Trend Intelligence</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-tight">{data.summary.totalVideosAnalyzed} videos scanned</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 mb-4 italic">
            "{data.insights.overview.summary}"
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/40 border border-white/5 rounded-lg p-2 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500">Potential</span>
              <span className="text-[10px] font-bold text-blue-400">{data.insights.overview.viralPotential}</span>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-lg p-2 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500">Momentum</span>
              <span className="text-[10px] font-bold text-purple-400">{data.insights.overview.marketMomentum}</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Quick Wins Card */}
      <section>
        <div className="flex items-center gap-2 mb-4 px-1">
          <Zap className="w-4 h-4 text-green-500" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Quick Wins</h2>
        </div>
        <div className="space-y-3">
          {data.insights.quickWins.map((win, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => onNodeClick({ type: 'quickWin', data: win })}
              className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${win.effort === 'low' ? 'from-green-500 to-emerald-600' : 'from-yellow-500 to-orange-600'} flex items-center justify-center flex-shrink-0`}>
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-zinc-200 truncate">{win.idea}</h3>
                <p className="text-[10px] text-zinc-500">{win.timing}</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-700" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Emerging Trends Card */}
      <section>
        <div className="flex items-center gap-2 mb-4 px-1">
          <Flame className="w-4 h-4 text-red-500" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Emerging Trends</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
          {data.insights.emergingTrends.map((trend, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => onNodeClick({ type: 'trend', data: trend })}
              className="min-w-[200px] bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 active:scale-[0.98] transition-transform"
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${trend.momentum === 'hot' ? 'from-red-500 to-orange-600' : 'from-blue-500 to-cyan-600'} flex items-center justify-center`}>
                  <Flame className="w-4 h-4 text-white" />
                </div>
                <div className="bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                  <span className="text-[9px] font-bold text-yellow-500">{trend.viralScore}</span>
                </div>
              </div>
              <h3 className="text-xs font-bold text-zinc-200 mb-1 line-clamp-1">{trend.topic}</h3>
              <p className="text-[10px] text-zinc-500 truncate mb-3">{trend.estimatedViews} potential</p>
              <div className="bg-white/5 rounded-lg p-2">
                <p className="text-[9px] text-zinc-400 line-clamp-2 italic">"{trend.actionableIdea}"</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Video Ideas Card */}
      <section>
        <div className="flex items-center gap-2 mb-4 px-1">
          <Rocket className="w-4 h-4 text-fuchsia-500" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">AI Video Concepts</h2>
        </div>
        <div className="space-y-4">
          {data.insights.videoIdeas.map((idea, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => onNodeClick({ type: 'videoIdea', data: idea })}
              className="bg-gradient-to-br from-fuchsia-900/10 to-violet-900/10 backdrop-blur-xl border border-fuchsia-500/10 rounded-2xl p-5 active:scale-[0.98] transition-transform"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-sm font-bold text-white max-w-[80%] leading-tight">{idea.title}</h3>
                <div className="w-8 h-8 rounded-lg bg-fuchsia-500/10 flex items-center justify-center">
                  <Video className="w-4 h-4 text-fuchsia-500" />
                </div>
              </div>
              <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed">{idea.description}</p>
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-1.5">
                    <Eye className="w-3 h-3 text-zinc-600" />
                    <span className="text-[10px] font-bold text-zinc-500">{idea.predictedViews} Views</span>
                 </div>
                 <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${idea.difficulty === 'Easy' ? 'bg-green-500/5 text-green-500 border-green-500/10' : 'bg-yellow-500/5 text-yellow-500 border-yellow-500/10'}`}>
                    {idea.difficulty}
                 </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ============= LOADING MIND MAP COMPONENT =============

function LoadingMindMap({ progress, currentStep }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const containerSize = isMobile ? 280 : 420;
  const centerPoint = containerSize / 2;

  return (
    <div className="relative flex flex-col items-center justify-center p-6 sm:p-8 bg-black min-h-screen">
      <div className="relative z-10">
        {/* SVG Animation Container */}
        <div 
          className="relative mb-8 sm:mb-12" 
          style={{ width: containerSize, height: containerSize }}
        >
          <svg 
            className="absolute inset-0 w-full h-full" 
            viewBox={`0 0 ${containerSize} ${containerSize}`}
          >
            <defs>
              {/* Minimal gradient - mostly monochrome */}
              <linearGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#a1a1a1" />
              </linearGradient>
              
              {/* Subtle glow */}
              <filter id="subtleGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              {/* Stronger glow for center */}
              <filter id="strongGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Subtle concentric circles */}
            {[0, 1, 2].map((layer) => {
              const radius = (isMobile ? 40 : 60) + layer * (isMobile ? 35 : 50);
              
              return (
                <circle
                  key={`ring-${layer}`}
                  cx={centerPoint}
                  cy={centerPoint}
                  r={radius}
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="0.5"
                  opacity="0.4"
                />
              );
            })}

            {/* Animated scan lines */}
            <motion.g key="scanlines">
              <line
                x1={centerPoint - (isMobile ? 50 : 80)}
                y1={centerPoint}
                x2={centerPoint + (isMobile ? 50 : 80)}
                y2={centerPoint}
                stroke="#ffffff"
                strokeWidth="0.5"
                opacity="0.1"
              />
              <motion.line
                x1={centerPoint}
                y1={centerPoint - (isMobile ? 60 : 90)}
                x2={centerPoint}
                y2={centerPoint + (isMobile ? 60 : 90)}
                stroke="url(#scanGradient)"
                strokeWidth="1"
                opacity="0.3"
                animate={{
                  opacity: [0.1, 0.5, 0.1],
                  scaleY: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{ transformOrigin: `${centerPoint}px ${centerPoint}px` }}
              />
            </motion.g>

            {/* Orbiting nodes - minimal style */}
            {[
              { angle: 0, delay: 0, label: '01' },
              { angle: 120, delay: 0.4, label: '02' },
              { angle: 240, delay: 0.8, label: '03' }
            ].map((node, i) => {
              const orbitRadius = isMobile ? 90 : 130;
              const x = centerPoint + Math.cos((node.angle * Math.PI) / 180) * orbitRadius;
              const y = centerPoint + Math.sin((node.angle * Math.PI) / 180) * orbitRadius;
              
              return (
                <g key={`node-${i}`}>
                  {/* Orbit path */}
                  <circle
                    cx={centerPoint}
                    cy={centerPoint}
                    r={orbitRadius}
                    fill="none"
                    stroke="#27272a"
                    strokeWidth="0.5"
                    opacity="0.3"
                  />
                  
                  {/* Animated node */}
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: node.delay }}
                  >
                    <motion.circle
                      cx={x}
                      cy={y}
                      r={isMobile ? 6 : 8}
                      fill="#ffffff"
                      opacity="0.8"
                      filter="url(#subtleGlow)"
                      animate={{
                        opacity: [0.5, 0.9, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <motion.circle
                      cx={x}
                      cy={y}
                      r={isMobile ? 10 : 14}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="0.5"
                      opacity="0.3"
                      animate={{
                        r: [isMobile ? 12 : 18, isMobile ? 14 : 22, isMobile ? 12 : 18],
                        opacity: [0.5, 0, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    />
                  </motion.g>
                </g>
              );
            })}

            {/* Central scanning element */}
            <motion.circle
              cx={centerPoint}
              cy={centerPoint}
              r={isMobile ? 24 : 32}
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
              filter="url(#strongGlow)"
              animate={{
                opacity: [0.6, 1, 0.6]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Inner dot */}
            <motion.circle
              cx={centerPoint}
              cy={centerPoint}
              r={isMobile ? 4 : 5}
              fill="#ffffff"
              animate={{
                scale: [1, 1.3, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Progress ring */}
            <motion.circle
              cx={centerPoint}
              cy={centerPoint}
              r={isMobile ? 30 : 40}
              fill="none"
              stroke="#ffffff"
              strokeWidth="1"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * (isMobile ? 30 : 40)}`}
              initial={{ strokeDashoffset: 2 * Math.PI * (isMobile ? 30 : 40) }}
              animate={{ 
                strokeDashoffset: 2 * Math.PI * (isMobile ? 30 : 40) * (1 - progress / 100)
              }}
              transition={{ duration: 0.3 }}
              transform={`rotate(-90 ${centerPoint} ${centerPoint})`}
              opacity="0.4"
            />
          </svg>
        </div>

        {/* Text Content */}
        <div className="text-center max-w-lg px-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6 sm:mb-8"
          >
            <h3 className="text-xl sm:text-2xl font-light text-white tracking-tight mb-1">
              Processing
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 tracking-wide">
              Analyzing data streams
            </p>
          </motion.div>
          
          {/* Progress bar instead of percentage circle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-8 sm:mb-10"
          >
            <div className="relative h-0.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex justify-between mt-2 px-1">
              <span className="text-xs text-zinc-600">
                {Math.round(progress)}%
              </span>
              <span className="text-xs text-zinc-600">
                100%
              </span>
            </div>
          </motion.div>

          {/* Current Step */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="min-h-[48px] flex items-center justify-center"
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={currentStep}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-zinc-400 font-light leading-relaxed px-4"
              >
                {currentStep || 'Initializing...'}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          {/* Minimal loading dots */}
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-white"
                animate={{
                  opacity: [0.3, 0.9, 0.3],
                  scale: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============= 2D MIND MAP COMPONENT =============

function MindMap2D({ nodes, hoveredNode, setHoveredNode, onNodeClick, loading, progress, currentStep }) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(0.6);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Adjust initial zoom for mobile
      if (window.innerWidth < 768) {
        setZoom(0.3);
      } else if (window.innerWidth < 1024) {
        setZoom(0.45);
      } else {
        setZoom(0.6);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Handle zoom with mouse wheel
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.2, Math.min(2, prev * delta)));
  }, []);

  // Touch handling for mobile
  const [touchStart, setTouchStart] = useState(null);
  const [lastPinchDistance, setLastPinchDistance] = useState(null);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      const distance = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      setLastPinchDistance(distance);
    } else if (e.touches.length === 1) {
      // Pan
      setIsPanning(true);
      setPanStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      });
    }
  }, [pan]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && lastPinchDistance) {
      // Pinch zoom
      const distance = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const delta = distance / lastPinchDistance;
      setZoom(prev => Math.max(0.2, Math.min(2, prev * delta)));
      setLastPinchDistance(distance);
    } else if (e.touches.length === 1 && isPanning) {
      // Pan
      setPan({
        x: e.touches[0].clientX - panStart.x,
        y: e.touches[0].clientY - panStart.y
      });
    }
  }, [isPanning, panStart, lastPinchDistance]);

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    setLastPinchDistance(null);
  }, []);

  // Handle pan start
  const handleMouseDown = useCallback((e) => {
    if (e.target.tagName === 'svg' || e.target.closest('.connection-line') || e.target.classList.contains('pan-area')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  // Handle pan move
  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  }, [isPanning, panStart]);

  // Handle pan end
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(2, prev * 1.2));
  const handleZoomOut = () => setZoom(prev => Math.max(0.2, prev / 1.2));
  const handleResetView = () => {
    if (isMobile) {
      setZoom(0.3);
    } else if (window.innerWidth < 1024) {
      setZoom(0.45);
    } else {
      setZoom(0.6);
    }
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, handleMouseMove, handleMouseUp]);

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden touch-none"
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `
              linear-gradient(to right, #27272a 1px, transparent 1px),
              linear-gradient(to bottom, #27272a 1px, transparent 1px)
            `,
            backgroundSize: `${50 * zoom}px ${50 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`
          }} 
        />
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-40 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="w-9 h-9 sm:w-10 sm:h-10 bg-zinc-900/90 hover:bg-zinc-800 backdrop-blur-sm border border-zinc-800 rounded-lg flex items-center justify-center transition-all shadow-lg active:scale-95"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-9 h-9 sm:w-10 sm:h-10 bg-zinc-900/90 hover:bg-zinc-800 backdrop-blur-sm border border-zinc-800 rounded-lg flex items-center justify-center transition-all shadow-lg active:scale-95"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" />
        </button>
        <button
          onClick={handleResetView}
          className="w-9 h-9 sm:w-10 sm:h-10 bg-zinc-900/90 hover:bg-zinc-800 backdrop-blur-sm border border-zinc-800 rounded-lg flex items-center justify-center transition-all shadow-lg active:scale-95"
          title="Reset view"
        >
          <Maximize className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" />
        </button>
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-lg flex items-center justify-center shadow-lg">
          <span className="text-[9px] sm:text-[10px] text-zinc-400 font-medium">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        className="absolute inset-0 w-full h-full pan-area"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <defs>
          {/* Gradient definitions for connection lines */}
          <linearGradient id="line-gradient-blue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
          </linearGradient>
          
          {/* Radar Sweep Gradient */}
          <conicGradient id="radar-sweep" cx="50%" cy="50%" angle="0deg">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0)" />
            <stop offset="25%" stopColor="rgba(59, 130, 246, 0.02)" />
            <stop offset="99%" stopColor="rgba(59, 130, 246, 0.15)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.8)" />
          </conicGradient>

          {/* Gradient definitions for glow effects */}
          <radialGradient id="blue-glow">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="green-glow">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="red-glow">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="purple-glow">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g transform={`translate(${centerX + pan.x}, ${centerY + pan.y}) scale(${zoom})`}>
          
          {/* Animated Background Radar Rings */}
          <g className="radar-background pointer-events-none">
            {[1, 2, 3, 4, 5].map((ring) => (
              <circle 
                key={`bg-ring-${ring}`}
                r={ring * 300}
                fill="none"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="1"
                strokeDasharray="4 8"
              />
            ))}
            
            {/* Animated Sweep */}
            <motion.circle
              r={1500}
              fill="url(#radar-sweep)"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: '0 0' }}
            />
          </g>

          {/* Connection Lines */}
          <g className="connection-line">
            {nodes.map(node => {
              if (!node.connections) return null;
              return node.connections.map(targetId => {
                const target = nodes.find(n => n.id === targetId);
                if (!target) return null;
                
                const isHovered = hoveredNode === node.id || hoveredNode === targetId;
                
                return (
                  <ConnectionLine2D
                    key={`${node.id}-${targetId}`}
                    from={node.position}
                    to={target.position}
                    isHovered={isHovered}
                  />
                );
              });
            })}
          </g>

          {/* Nodes */}
          {nodes.map((node, index) => (
            <Node2D
              key={node.id}
              node={node}
              index={index}
              isHovered={hoveredNode === node.id}
              onHover={() => setHoveredNode(node.id)}
              onLeave={() => setHoveredNode(null)}
              onClick={() => onNodeClick(node)}
              isMobile={isMobile}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

function Node2D({ node, index, isHovered, onHover, onLeave, onClick, isMobile }) {
  const Icon = node.icon;
  const baseSize = node.type === 'center' ? 180 : 140;
  const size = isMobile ? baseSize * 0.8 : baseSize;
  
  const getGlowColor = (color) => {
    if (color.includes('blue')) return 'url(#blue-glow)';
    if (color.includes('green')) return 'url(#green-glow)';
    if (color.includes('red') || color.includes('orange')) return 'url(#red-glow)';
    if (color.includes('purple') || color.includes('pink') || color.includes('fuchsia')) return 'url(#purple-glow)';
    return 'url(#blue-glow)';
  };
  
  return (
    <g
      style={{
        transform: `translate(${node.position.x}px, ${node.position.y}px)`,
        cursor: 'pointer'
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Intense Hover Glow Effect (Toned down for glassmorphic style) */}
      {isHovered && (
        <motion.circle
          r={size * 0.8}
          fill={getGlowColor(node.color)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.3 }}
          transition={{ duration: 0.4 }}
          style={{ filter: 'blur(30px)' }}
        />
      )}

      {/* Node Container */}
      <foreignObject
        x={-size / 2}
        y={-size / 2}
        width={size}
        height={size}
        className="overflow-visible"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: index * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-full h-full rounded-[20px] p-[1px] shadow-sm transition-all duration-300 z-10"
        >
          {/* Subtle gradient border based on node color */}
          <div className={`absolute inset-0 rounded-[20px] bg-gradient-to-br ${node.color} opacity-40`} />

          {/* Inner Glassmorphism Container */}
          <div className="w-full h-full bg-black/60 backdrop-blur-xl rounded-[19px] p-3 sm:p-4 flex flex-col items-center justify-center text-center gap-2 border border-white/5 relative overflow-hidden group">
            
            {/* Hover shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full" />

            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${node.color} flex items-center justify-center shadow-inner flex-shrink-0 relative z-10 opacity-90`}>
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            
            <h3 className="text-xs sm:text-sm font-semibold text-zinc-100 line-clamp-2 leading-tight px-1 z-10">
              {node.title}
            </h3>
            
            <p className="text-[9px] sm:text-[10px] text-zinc-400 font-medium tracking-wide bg-white/5 border border-white/5 px-2 py-1 rounded-md z-10">
              {node.subtitle}
            </p>
          </div>
        </motion.div>
      </foreignObject>

      {/* Pulse Animation for Center */}
      {node.type === 'center' && (
        <>
          <motion.circle
            r={size / 1.8}
            className="stroke-blue-500 fill-none stroke-[1]"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.circle
            r={size / 1.8}
            className="stroke-purple-500 fill-none stroke-[1]"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeOut", delay: 2 }}
          />
        </>
      )}
    </g>
  );
}

function ConnectionLine2D({ from, to, isHovered }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const curveOffset = distance * 0.15;
  const perpX = -dy / distance * curveOffset;
  const perpY = dx / distance * curveOffset;
  
  const controlX = midX + perpX;
  const controlY = midY + perpY;

  const pathData = `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;

  return (
    <>
      {/* Subtle background track */}
      <motion.path
        d={pathData}
        className={`transition-all duration-300`}
        stroke={isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}
        strokeWidth="1.5"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.8 }}
      />
      
      {/* Animated dash array line */}
      <motion.path
        d={pathData}
        className={`transition-all duration-300`}
        stroke={isHovered ? '#fff' : 'rgba(255,255,255,0.3)'}
        strokeWidth="1"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: isHovered ? 1 : 0.4 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        strokeDasharray="4 8"
      />
      
      {/* Soft Animated particle */}
      {isHovered && (
        <circle r="2" fill="#fff" style={{ filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.8))' }}>
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path={pathData}
          />
        </circle>
      )}
    </>
  );
}

// ============= BOTTOM SHEET CONTENT COMPONENTS =============

function CenterNodeDetails({ data }) {
  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Flame}
          label="Viral Potential"
          value={data.insights.overview.viralPotential}
          color="from-red-500/20 to-orange-600/20 text-red-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Momentum"
          value={data.insights.overview.marketMomentum}
          color="from-blue-500/20 to-cyan-600/20 text-blue-500"
        />
        <StatCard
          icon={Target}
          label="Topics"
          value={data.insights.overview.trendingTopics}
          color="from-purple-500/20 to-pink-600/20 text-purple-500"
        />
        <StatCard
          icon={Eye}
          label="Videos"
          value={(data.summary.totalVideosAnalyzed * 10.5 || 305).toFixed(0)}
          color="from-green-500/20 to-emerald-600/20 text-green-500"
        />
      </div>

      {/* Summary */}
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Market Summary
        </h3>
        <p className="text-sm text-zinc-300 leading-relaxed">
          {data.insights.overview.summary}
        </p>
      </div>

      {/* Viral Patterns */}
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Viral Patterns
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-zinc-500 mb-2 font-medium">Title Hooks</p>
            <div className="space-y-2">
              {data.insights.viralPatterns.titleHooks.map((hook, idx) => (
                <div key={idx} className="bg-black/40 border border-white/5 rounded-lg p-3 text-sm text-zinc-300">
                  {hook}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-2 font-medium">Content Styles</p>
            <div className="space-y-2">
              {data.insights.viralPatterns.contentStyles.map((style, idx) => (
                <div key={idx} className="bg-black/40 border border-white/5 rounded-lg p-3 text-sm text-zinc-300">
                  {style}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickWinDetails({ data }) {
  const effortColors = {
    low: 'from-green-500/20 to-emerald-600/20 text-green-500',
    medium: 'from-yellow-500/20 to-orange-600/20 text-yellow-500',
    high: 'from-red-500/20 to-pink-600/20 text-red-500'
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${effortColors[data.effort]} flex items-center justify-center border border-white/5`}>
            <Lightbulb className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">{data.idea}</h3>
            <p className="text-sm text-zinc-400">{data.timing}</p>
          </div>
        </div>
        
        <div className="bg-black/40 border border-white/5 rounded-lg p-4">
          <p className="text-xs text-zinc-500 mb-2 font-medium">Why It Works</p>
          <p className="text-sm text-zinc-300 leading-relaxed">{data.why}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-zinc-500 mb-2">Effort Level</p>
          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold bg-gradient-to-br ${effortColors[data.effort]} border border-white/5 capitalize`}>
            {data.effort}
          </span>
        </div>
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-zinc-500 mb-2">Timeline</p>
          <p className="text-sm font-bold text-white">{data.timing}</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-xl border border-blue-500/20 rounded-xl p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          Quick Win Strategy
        </h4>
        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-sm text-zinc-300">
            <span className="text-blue-400 mt-1">•</span>
            <span>Create content around {data.idea.toLowerCase()}</span>
          </li>
          <li className="flex items-start gap-2 text-sm text-zinc-300">
            <span className="text-blue-400 mt-1">•</span>
            <span>Leverage the {data.timing.toLowerCase()} window</span>
          </li>
          <li className="flex items-start gap-2 text-sm text-zinc-300">
            <span className="text-blue-400 mt-1">•</span>
            <span>Focus on {data.effort} effort execution</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function TrendDetails({ data }) {
  const momentumColors = {
    rising: 'from-blue-500/20 to-cyan-600/20 text-blue-500',
    hot: 'from-red-500/20 to-orange-600/20 text-red-500',
    peaked: 'from-yellow-500/20 to-orange-600/20 text-yellow-500',
    declining: 'from-zinc-500/20 to-zinc-600/20 text-zinc-400'
  };

  const difficultyColors = {
    easy: 'from-green-500/20 to-emerald-600/20 text-green-500',
    medium: 'from-yellow-500/20 to-orange-600/20 text-yellow-500',
    hard: 'from-red-500/20 to-pink-600/20 text-red-500'
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${momentumColors[data.momentum]} flex items-center justify-center border border-white/5`}>
            <Hash className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">{data.topic}</h3>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-br ${momentumColors[data.momentum]} border border-white/5 capitalize`}>
                {data.momentum}
              </span>
              <span className={`px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-br ${difficultyColors[data.difficulty]} border border-white/5 capitalize`}>
                {data.difficulty}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-yellow-500 mb-1">
              <Zap className="w-5 h-5 fill-current" />
              <span className="text-2xl font-bold">{data.viralScore}</span>
            </div>
            <p className="text-xs text-zinc-500">Viral Score</p>
          </div>
        </div>

        <p className="text-sm text-zinc-400 leading-relaxed">{data.opportunity}</p>
      </div>

      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-xl border border-purple-500/20 rounded-xl p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Rocket className="w-4 h-4 text-purple-400" />
          Actionable Idea
        </h4>
        <p className="text-sm text-zinc-300 leading-relaxed">{data.actionableIdea}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Time Window</span>
          </div>
          <p className="text-sm font-bold text-white">{data.timeWindow}</p>
        </div>
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <Eye className="w-4 h-4" />
            <span className="text-xs font-medium">Est. Views</span>
          </div>
          <p className="text-sm font-bold text-blue-400">{data.estimatedViews}</p>
        </div>
      </div>
    </div>
  );
}

function VideoIdeaDetails({ data }) {
  const difficultyColors = {
    Easy: 'from-green-500/20 to-emerald-600/20 text-green-500',
    Medium: 'from-yellow-500/20 to-orange-600/20 text-yellow-500',
    Hard: 'from-red-500/20 to-pink-600/20 text-red-500'
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-violet-600/20 border border-fuchsia-500/20 flex items-center justify-center">
            <Video className="w-8 h-8 text-fuchsia-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">{data.title}</h3>
            <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-br ${difficultyColors[data.difficulty] || difficultyColors.Medium} border border-white/5 capitalize`}>
              {data.difficulty}
            </span>
          </div>
        </div>

        <p className="text-sm text-zinc-400 leading-relaxed mb-4">{data.description}</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-zinc-500">
            <Eye className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium">Predicted Views</span>
          </div>
          <p className="text-lg font-bold text-white">{data.predictedViews}</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center border border-white/5`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs text-zinc-500 font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-white capitalize">{value}</p>
    </div>
  );
}

function EmptyState({ onScan, hasChannel }) {
  return (
    <div className="w-full h-full flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[24px] bg-black/60 backdrop-blur-xl border border-white/5 flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-sm">
          <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-blue-500/10 to-purple-600/10 opacity-50 pointer-events-none" />
          <Radio className="w-10 h-10 sm:w-12 sm:h-12 text-zinc-300 animate-pulse relative z-10" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold mb-3 sm:mb-4 tracking-tight text-white">Discover Viral Opportunities</h2>
        <p className="text-sm sm:text-base text-zinc-500 mb-6 sm:mb-8 leading-relaxed">
          Explore trending content in an interactive mind map. Click any node to dive deep into insights.
        </p>
        {!hasChannel ? (
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-6 shadow-sm inline-flex flex-col items-center">
            <AlertCircle className="w-8 h-8 text-yellow-500/80 mb-3" />
            <p className="text-sm text-zinc-400">
              Please select a channel to begin scanning.
            </p>
          </div>
        ) : (
          <button
            onClick={onScan}
            className="px-6 sm:px-8 py-3 sm:py-4 bg-white hover:bg-zinc-100 text-black rounded-[14px] font-semibold transition-all inline-flex items-center gap-3 shadow-sm active:scale-95"
          >
            <Radio className="w-5 h-5" />
            Start Scanning
          </button>
        )}
      </div>
    </div>
  );
}
