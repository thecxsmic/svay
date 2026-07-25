'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Video, 
  User, 
  Lightbulb, 
  BarChart3, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Calendar, 
  Plus, 
  BookOpen, 
  Clock, 
  ChevronRight, 
  Eye, 
  Zap, 
  Target, 
  Activity, 
  Check, 
  Archive,
  Layers,
  SearchCode,
  Sparkles,
  LayoutGrid,
  Database
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ResearchNotesModal from '../components/ResearchNotesModal';
import VideoDetailsModal from '../components/VideoDetailsModal';
import {
  EmptyState,
  DashPage,
  DashToolbar,
  DashBody,
  DashButton,
  SkeletonGrid,
  FadeIn,
  MetaChip,
} from '../components/dashboard/ui';

export default function LibraryPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVideoModal, setSelectedVideoModal] = useState(null);

  useEffect(() => {
    fetchItems();
  }, [filter]);

  const formatNumber = (num) => {
    if (isNaN(num) || num === null || num === undefined) return "0";
    const n = parseInt(num);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const getAnalysisDetails = (item) => {
    if (item.type !== 'analysis') return null;
    const m = item.metadata || {};
    const base = m.baseChannel || {};
    const competitors = m.competitors || [];
    
    return (
      <div className="bg-black/40 border border-white/5 rounded-2xl p-5 mb-8 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-1">
           <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Saved stats</p>
           <span className="text-[9px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">At Save Time</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-1">
              <p className="text-[9px] font-bold text-zinc-600 uppercase">Subscribers</p>
              <p className="text-xs font-black text-zinc-200">{formatNumber(base.statistics?.subscriberCount)}</p>
           </div>
           <div className="space-y-1">
              <p className="text-[9px] font-bold text-zinc-600 uppercase">Total Views</p>
              <p className="text-xs font-black text-zinc-200">{formatNumber(base.statistics?.viewCount)}</p>
           </div>
        </div>

        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
           <p className="text-[9px] font-bold text-zinc-600 uppercase">Rivals saved</p>
           <div className="flex -space-x-1.5">
              {competitors.slice(0, 3).map((c, i) => (
                <img 
                  key={i} 
                  src={c.thumbnail} 
                  className="w-5 h-5 rounded-full ring-2 ring-zinc-900 border border-white/10" 
                  title={c.title}
                  alt=""
                />
              ))}
              {competitors.length > 3 && (
                <div className="w-5 h-5 rounded-full bg-zinc-800 ring-2 ring-zinc-900 flex items-center justify-center border border-white/10">
                   <span className="text-[7px] font-black text-zinc-500">+{competitors.length - 3}</span>
                </div>
              )}
           </div>
        </div>
      </div>
    );
  };

  const getIdeaDetails = (item) => {
    if (item.type !== 'idea') return null;
    const m = item.metadata || {};
    
    const rationale = m.why || m.opportunity || m.rationale || m.predictedViews;
    const effort = m.effort || m.difficulty || (m.viralScore ? `${m.viralScore} Viral Score` : null);
    const timing = m.timing || m.momentum || m.topic;

    return (
      <div className="bg-black/40 border border-white/5 rounded-2xl p-5 mb-8 space-y-5">
        {rationale && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
               <Target className="w-3.5 h-3.5" />
               Why it matters
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{rationale}</p>
          </div>
        )}
        
        <div className="flex gap-6 border-t border-white/5 pt-4">
           {effort && (
             <div className="space-y-1">
               <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
                  How hard
               </p>
               <p className="text-[11px] font-bold text-zinc-300">{effort}</p>
             </div>
           )}
           {timing && (
             <div className="space-y-1">
               <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
                  Timing
               </p>
               <p className="text-[11px] font-bold text-zinc-300">{timing}</p>
             </div>
           )}
        </div>
      </div>
    );
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? '/api/library' : `/api/library?type=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setItems(data.items);
    } catch (err) {
      console.error('Failed to fetch library items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this research?')) return;
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
      const data = await res.json();
      if (data.success) {
        setItems(items.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleEdit = (item) => {
    router.push(`/library/${item.id}`);
  };

  const handleOpenVideoDetails = (item) => {
    if (item.type !== 'video') return;
    const thumbnail = item.metadata?.thumbnail || `https://i.ytimg.com/vi/${item.reference_id}/mqdefault.jpg`;
    setSelectedVideoModal({
      item: {
        id: item.reference_id,
        title: item.title,
        thumbnail: thumbnail,
        snippet: {
          title: item.title,
          thumbnails: { medium: { url: thumbnail } },
          channelId: item.metadata?.channelId,
          channelTitle: item.metadata?.channelTitle,
          publishedAt: item.metadata?.publishedAt
        },
        statistics: item.metadata?.statistics || {}
      },
      v: {
        score: item.metadata?.vScore || 0,
        level: item.metadata?.vScore > 40 ? 'Viral' : 'Stable',
        color: item.metadata?.vScore > 40 ? 'from-orange-500 to-red-600' : 'from-blue-500 to-cyan-600',
        engagement: (parseFloat(item.metadata?.statistics?.likeCount || 0) / Math.max(1, parseInt(item.metadata?.statistics?.viewCount || 1)) * 100).toFixed(2),
        dailyViews: Math.round(parseInt(item.metadata?.statistics?.viewCount || 0) / 30) // Simplified fallback
      }
    });
  };

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getThumbnail = (item) => {
    if (item.metadata?.thumbnail) return item.metadata.thumbnail;
    if (item.type === 'analysis' && item.metadata?.baseChannel?.thumbnail) {
      return item.metadata.baseChannel.thumbnail;
    }
    if (item.type === 'video' && item.reference_id) {
      return `https://i.ytimg.com/vi/${item.reference_id}/mqdefault.jpg`;
    }
    return null;
  };

  const getAnalyzeLink = (item) => {
    if (item.type === 'analysis') {
      const id = item.reference_id || item.id;
      return `/competitors?analysisId=${id}`;
    }
    const channelId = item.type === 'video' ? item.metadata?.channelId : (item.reference_id || item.metadata?.channelId);
    if (!channelId || channelId === 'undefined') return '#';
    return `/channels?channelId=${channelId}`;
  };

  const getYouTubeLink = (item) => {
    if (item.type === 'video') return `https://youtube.com/watch?v=${item.reference_id}`;
    const channelId = item.reference_id || item.metadata?.channelId;
    if (!channelId || channelId === 'undefined') return '#';
    return `https://youtube.com/channel/${channelId}`;
  };

  const getIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4 text-blue-500" />;
      case 'channel': return <User className="w-4 h-4 text-purple-500" />;
      case 'idea': return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case 'analysis': return <BarChart3 className="w-4 h-4 text-green-500" />;
      default: return <BookOpen className="w-4 h-4 text-zinc-500" />;
    }
  };

  const TABS = [
    { id: 'all', label: 'All', icon: Archive },
    { id: 'video', label: 'Videos', icon: Video },
    { id: 'channel', label: 'Channels', icon: User },
    { id: 'idea', label: 'Ideas', icon: Lightbulb },
    { id: 'analysis', label: 'Comparisons', icon: BarChart3 }
  ];

  return (
    <DashPage>
      <DashToolbar
        left={
          <>
            <MetaChip icon={Layers}>
              {filteredItems.length} item{filteredItems.length === 1 ? "" : "s"}
            </MetaChip>
            <div className="relative hidden md:block group">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500 group-focus-within:text-white" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved items..."
                className="h-9 w-56 rounded-full border border-white/[0.08] bg-white/[0.03] pl-9 pr-4 text-xs text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-white/20"
              />
            </div>
          </>
        }
        mobileLeft={
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
              Library
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              {filteredItems.length} item{filteredItems.length === 1 ? "" : "s"}
            </p>
          </div>
        }
        tabItems={TABS.map((t) => ({ id: t.id, label: t.label, icon: t.icon }))}
        tabValue={filter}
        onTabChange={setFilter}
      >
        <DashButton
          variant="secondary"
          size="sm"
          onClick={fetchItems}
          disabled={loading}
          className="!h-10 !px-2.5 sm:!h-9 sm:!px-3.5"
        >
          <Activity className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </DashButton>
      </DashToolbar>

      <DashBody className="pb-32">
        <AnimatePresence mode="wait">
          {loading ? (
            <FadeIn key="loading">
              <SkeletonGrid count={6} />
            </FadeIn>
          ) : filteredItems.length > 0 ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => handleEdit(item)}
                  className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-5 transition-colors hover:border-white/15 hover:bg-zinc-950 sm:p-6"
                >
                  {/* Item Type Badge */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-black/40 border border-white/5 rounded-xl text-zinc-400 group-hover:text-white transition-colors">
                          {getIcon(item.type)}
                       </div>
                       <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">{item.type}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      className="p-2 opacity-0 group-hover:opacity-100 bg-red-500/10 rounded-xl transition-all text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Visual Context */}
                  {getThumbnail(item) && (
                    <div className="relative aspect-video mb-8 rounded-2xl overflow-hidden border border-white/5 bg-black">
                       <img src={getThumbnail(item)} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 scale-105 group-hover:scale-100" alt="" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                       {item.metadata?.channelTitle && (
                         <div className="absolute bottom-4 left-5 right-5 flex justify-between items-center">
                            <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] truncate flex-1">{item.metadata.channelTitle}</p>
                            {item.type === 'video' && (
                              <button 
                                onClick={(e) => { 
                                  e.preventDefault(); 
                                  e.stopPropagation();
                                  handleOpenVideoDetails(item); 
                                }}
                                className="bg-white/10 hover:bg-white backdrop-blur-md p-2 rounded-xl border border-white/10 hover:text-black transition-all"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                         </div>
                       )}
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="text-xl font-bold text-zinc-100 mb-6 line-clamp-2 leading-tight tracking-tight group-hover:text-white transition-colors">{item.title}</h3>
                  
                  {/* Dynamic Content Details */}
                  {item.type === 'idea' ? getIdeaDetails(item) : item.type === 'analysis' ? getAnalysisDetails(item) : (
                    item.content && (
                      <div className="bg-black/40 border border-white/5 rounded-2xl p-5 mb-8 flex-1 overflow-hidden">
                         <div 
                          className="text-[13px] text-zinc-500 line-clamp-4 leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-0"
                          dangerouslySetInnerHTML={{ __html: item.content }}
                         />
                      </div>
                    )
                  )}

                  {/* Fallback for items with no content/thumbnail */}
                  {!item.content && !getThumbnail(item) && (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 border border-dashed border-zinc-800 rounded-3xl mb-8 opacity-40">
                       <Database className="w-6 h-6 text-zinc-700 mb-3" />
                       <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-[0.2em]">No details yet</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-auto">
                    {(item.type === 'channel' || item.type === 'analysis') && (
                      <Link 
                        href={getAnalyzeLink(item)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 h-12 bg-white text-black hover:bg-zinc-200 border border-white rounded-2xl transition-all flex items-center justify-center gap-2 group/btn shadow-xl shadow-white/5"
                        title="Analyze"
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Open analysis</span>
                      </Link>
                    )}
                    {(item.type === 'video' || item.type === 'channel') && (
                       <a 
                        href={getYouTubeLink(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`h-12 bg-zinc-900 hover:bg-white hover:text-black border border-zinc-800 rounded-2xl transition-all flex items-center justify-center group/btn ${item.type === 'video' ? 'flex-1 gap-2' : 'w-12'}`}
                        title="YouTube"
                       >
                         <ExternalLink className="w-4 h-4 text-zinc-500 group-hover/btn:text-black" />
                         {item.type === 'video' && <span className="text-[10px] font-black uppercase tracking-[0.2em] group-hover/btn:text-black">Watch on YouTube</span>}
                       </a>
                    )}
                  </div>

                  {/* Meta Footer */}
                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                     </div>
                     {item.metadata?.vScore && (
                       <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                          <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">Viral score</span>
                          <span className="text-[11px] font-black text-blue-400">{item.metadata.vScore}%</span>
                       </div>
                     )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <EmptyState
              key="empty"
              icon={BookOpen}
              title="Nothing saved yet"
              description="Save channels, videos, or ideas while you research."
              action={
                <Link
                  href="/radar"
                  className="inline-flex items-center rounded-full bg-white px-8 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-zinc-200"
                >
                  Find trends
                </Link>
              }
            />
          )}
        </AnimatePresence>

        <ResearchNotesModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          item={selectedItem}
          onSave={() => {
            fetchItems();
            setIsEditModalOpen(false);
          }}
          onViewDetails={(item) => {
            setIsEditModalOpen(false);
            handleOpenVideoDetails(item);
          }}
        />

        <VideoDetailsModal
          selectedVideo={selectedVideoModal}
          setSelectedVideo={setSelectedVideoModal}
          formatNumber={formatNumber}
          filters={{ region: "US" }}
        />
      </DashBody>
    </DashPage>
  );
}
