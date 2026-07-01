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
  Loader2,
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
           <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Snapshot Stats</p>
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
           <p className="text-[9px] font-bold text-zinc-600 uppercase">Competitive Set</p>
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
               Strategic Focus
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{rationale}</p>
          </div>
        )}
        
        <div className="flex gap-6 border-t border-white/5 pt-4">
           {effort && (
             <div className="space-y-1">
               <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
                  Complexity
               </p>
               <p className="text-[11px] font-bold text-zinc-300">{effort}</p>
             </div>
           )}
           {timing && (
             <div className="space-y-1">
               <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
                  Velocity
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
    { id: 'all', label: 'Vault', icon: Archive },
    { id: 'video', label: 'Videos', icon: Video },
    { id: 'channel', label: 'Channels', icon: User },
    { id: 'idea', label: 'Ideas', icon: Lightbulb },
    { id: 'analysis', label: 'Market DNA', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* Sticky Header Navigation */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <Layers className="w-5 h-5 text-black" />
            </div>
            <h1 className="font-ahsing text-lg tracking-tight uppercase">Research Hub</h1>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="relative hidden md:block group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-white transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search vault..."
                  className="bg-zinc-900/50 border border-zinc-800 rounded-full h-9 pl-9 pr-4 text-xs focus:outline-none focus:border-zinc-700 transition-all w-64 placeholder:text-zinc-600"
                />
             </div>
             <button
               onClick={fetchItems}
               className="h-9 px-4 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-700 transition-all flex items-center gap-2"
             >
               <Activity className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
               <span className="hidden sm:inline">Refresh</span>
             </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-8 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-2 pb-3 pt-4 text-[10px] uppercase font-bold tracking-[0.2em] transition-all relative whitespace-nowrap ${
                filter === tab.id ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {filter === tab.id && (
                <motion.div 
                  layoutId="library-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" 
                />
              )}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 pb-32">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-40"
            >
              <div className="w-64 space-y-4">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                  <span>Accessing Vault</span>
                  <Loader2 className="w-3 h-3 animate-spin" />
                </div>
                <div className="h-px w-full bg-zinc-900 overflow-hidden">
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="h-full w-full bg-white/20"
                  />
                </div>
              </div>
            </motion.div>
          ) : filteredItems.length > 0 ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleEdit(item)}
                  className="group p-8 rounded-[2rem] bg-zinc-900/30 border border-zinc-800 hover:bg-zinc-900/50 hover:border-zinc-700 transition-all flex flex-col relative overflow-hidden cursor-pointer"
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
                       <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-[0.2em]">Data Pending</p>
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
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Deep Analysis</span>
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
                          <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">VIRALITY</span>
                          <span className="text-[11px] font-black text-blue-400">{item.metadata.vScore}%</span>
                       </div>
                     )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-48 flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 bg-zinc-900/50 border border-zinc-800 rounded-full flex items-center justify-center mb-10 group overflow-hidden relative">
                 <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                 <BookOpen className="w-10 h-10 text-zinc-700 group-hover:text-white transition-colors relative z-10" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-4 text-zinc-300">Vault is empty</h2>
              <p className="text-zinc-600 text-sm max-w-sm mx-auto leading-relaxed font-medium">
                Save analyzed channels, viral patterns, or custom research ideas to build your competitive edge.
              </p>
              <Link 
                href="/radar"
                className="mt-10 px-8 py-3 bg-white text-black text-xs font-black uppercase tracking-[0.2em] rounded-full hover:bg-zinc-200 transition-all inline-block"
              >
                Scan for Trends
              </Link>
            </motion.div>
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
          filters={{ region: 'US' }}
        />
      </main>
    </div>
  );
}
