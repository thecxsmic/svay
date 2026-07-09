'use client';

import { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Save, Trash2, Video, User, Lightbulb, 
  BarChart3, FileText, Loader2, Eye, Users, TrendingUp, 
  Calendar, Target, Zap, Activity, ExternalLink, MessageSquare, 
  ThumbsUp, Flame, Rocket, Edit3, Radio, ShieldCheck, 
  History, Globe, Cpu, Network, ChevronRight, Check, Trophy
} from 'lucide-react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function NotePage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  
  const [item, setItem] = useState(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/library?id=${id}`);
      const data = await res.json();
      if (data.success && data.item) {
        setItem(data.item);
        setContent(data.item.content || '');
        setTitle(data.item.title || '');
      } else {
        router.push('/library');
      }
    } catch (err) {
      console.error('Failed to fetch note:', err);
      router.push('/library');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id,
          type: item.type,
          reference_id: item.reference_id,
          title: title,
          content: content,
          metadata: item.metadata
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this research note?')) return;
    
    setDeleting(true);
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id,
          action: 'delete'
        })
      });
      const data = await res.json();
      if (data.success) {
        router.push('/library');
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
      setDeleting(false);
    }
  };

  const formatNumber = (num) => {
    if (isNaN(num) || num === null || num === undefined) return "0";
    const n = parseInt(num);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const getIcon = () => {
    switch (item?.type) {
      case 'video': return <Video className="w-5 h-5 text-blue-500" />;
      case 'channel': return <User className="w-5 h-5 text-purple-500" />;
      case 'idea': return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case 'analysis': return <BarChart3 className="w-5 h-5 text-green-500" />;
      default: return <FileText className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getAnalysisDetails = () => {
    if (item?.type !== 'analysis') return null;
    const m = item.metadata || {};
    const base = m.baseChannel || {};
    const competitors = m.competitors || [];

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-1">
           <Trophy className="w-3.5 h-3.5 text-zinc-500" />
           <h4 className="text-xs font-semibold text-zinc-400">Competitive Landscape</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {competitors.map((comp, i) => (
             <div key={i} className="bg-zinc-900/20 border border-white/5 rounded-2xl p-5 flex items-center gap-4 group hover:border-white/10 transition-all">
                <img src={comp.thumbnail} className="w-12 h-12 rounded-full border border-white/10" alt="" />
                <div className="flex-1 min-w-0">
                   <h4 className="text-sm font-bold text-white truncate">{comp.title}</h4>
                   <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{comp.matchType || 'Competitor'}</p>
                </div>
                <div className="text-right">
                   <p className="text-xs font-bold text-zinc-300">{formatNumber(comp.statistics.subscriberCount)}</p>
                   <p className="text-[9px] text-zinc-600 font-bold uppercase">Subs</p>
                </div>
             </div>
           ))}
        </div>
      </div>
    );
  };

  const getIdeaDetails = () => {
    if (item?.type !== 'idea') return null;
    const m = item.metadata || {};
    const rationale = m.why || m.opportunity || m.rationale || m.predictedViews;
    const effort = m.effort || m.difficulty || (m.viralScore ? `${m.viralScore} Viral Score` : null);
    const timing = m.timing || m.momentum || m.topic;
    const action = m.actionableIdea || m.description;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-1">
           <Target className="w-3.5 h-3.5 text-zinc-500" />
           <h4 className="text-xs font-semibold text-zinc-400">Strategy Overview</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {rationale && (
             <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-5 space-y-3">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Rocket className="w-3.5 h-3.5 text-purple-500" />
                  The Opportunity
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed">"{rationale}"</p>
             </div>
           )}
           {action && (
             <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-5 space-y-3">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  Action Plan
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed">{action}</p>
             </div>
           )}
        </div>

        <div className="flex flex-wrap gap-3">
           {effort && (
             <div className="bg-zinc-900/20 border border-white/5 rounded-xl px-4 py-2.5 flex items-center gap-3">
                <Zap className="w-4 h-4 text-yellow-500" />
                <div>
                   <p className="text-[9px] font-medium text-zinc-500 uppercase">Effort</p>
                   <p className="text-xs font-semibold text-zinc-200">{effort}</p>
                </div>
             </div>
           )}
           {timing && (
             <div className="bg-zinc-900/20 border border-white/5 rounded-xl px-4 py-2.5 flex items-center gap-3">
                <Activity className="w-4 h-4 text-blue-500" />
                <div>
                   <p className="text-[9px] font-medium text-zinc-500 uppercase">Momentum</p>
                   <p className="text-xs font-semibold text-zinc-200">{timing}</p>
                </div>
             </div>
           )}
           {m.viralScore && (
             <div className="bg-zinc-900/20 border border-white/5 rounded-xl px-4 py-2.5 flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-red-500" />
                <div>
                   <p className="text-[9px] font-medium text-zinc-500 uppercase">Viral Score</p>
                   <p className="text-xs font-semibold text-zinc-200">{m.viralScore}/100</p>
                </div>
             </div>
           )}
        </div>
      </div>
    );
  };

  const getChannelDetails = () => {
    if (item?.type !== 'channel') return null;
    const stats = item.metadata?.statistics || {};
    const videoCount = parseInt(stats.videoCount || 0);
    const viewCount = parseInt(stats.viewCount || 0);
    const avgViews = videoCount > 0 ? Math.round(viewCount / videoCount) : 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-1">
           <Activity className="w-3.5 h-3.5 text-zinc-500" />
           <h4 className="text-xs font-semibold text-zinc-400">Channel Ecosystem</h4>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-4">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Library Size</p>
              <p className="text-xl font-black text-white">{formatNumber(videoCount)} <span className="text-[10px] text-zinc-600 font-bold uppercase">Videos</span></p>
           </div>
           <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-4">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Content ROI</p>
              <p className="text-xl font-black text-white">{formatNumber(avgViews)} <span className="text-[10px] text-zinc-600 font-bold uppercase">Avg</span></p>
           </div>
        </div>

        {item.metadata?.snippet?.description && (
          <div className="bg-zinc-900/10 border border-white/5 rounded-2xl p-6">
             <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Channel Positioning</p>
             <p className="text-sm text-zinc-400 leading-relaxed line-clamp-6 whitespace-pre-wrap">{item.metadata.snippet.description}</p>
          </div>
        )}
      </div>
    );
  };

  const getVideoDetails = () => {
    if (item?.type !== 'video') return null;
    const stats = item.metadata?.statistics || {};
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-1">
           <BarChart3 className="w-3.5 h-3.5 text-zinc-500" />
           <h4 className="text-xs font-semibold text-zinc-400">Performance Metrics</h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { label: 'Views', value: stats.viewCount, icon: Eye, color: 'text-zinc-400' },
             { label: 'Likes', value: stats.likeCount, icon: ThumbsUp, color: 'text-zinc-400' },
             { label: 'Comments', value: stats.commentCount, icon: MessageSquare, color: 'text-zinc-400' },
             { label: 'Virality', value: `${item.metadata?.vScore || 0}%`, icon: TrendingUp, color: 'text-blue-500' }
           ].map((stat, i) => (
             <div key={i} className="bg-zinc-900/20 border border-white/5 rounded-2xl p-4 transition-colors hover:border-zinc-700/50">
                <div className="flex items-center gap-2 text-zinc-500 mb-2">
                   <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                   <span className="text-[10px] font-bold uppercase tracking-widest">{stat.label}</span>
                </div>
                <p className={`text-xl font-bold ${stat.color === 'text-blue-500' ? 'text-blue-500' : 'text-zinc-100'}`}>
                   {typeof stat.value === 'string' && stat.value.includes('%') ? stat.value : formatNumber(stat.value)}
                </p>
             </div>
           ))}
        </div>

        {item.metadata?.description && (
          <div className="bg-zinc-900/10 border border-white/5 rounded-2xl p-6">
             <div className="flex items-center gap-2 mb-4">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Original Description</p>
                <div className="flex-1 h-px bg-white/5"></div>
             </div>
             <p className="text-sm text-zinc-400 leading-relaxed line-clamp-4 whitespace-pre-wrap">{item.metadata.description}</p>
          </div>
        )}
      </div>
    );
  };

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'clean']
    ],
  }), []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
        <p className="text-xs font-medium text-zinc-600 uppercase tracking-[0.2em]">Loading research...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#ededed] font-sans selection:bg-[#0070f3] selection:text-white">
      {/* Fixed Top Bar */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-400">
               <span className="truncate max-w-[200px] font-medium text-zinc-200">{title || 'Untitled Note'}</span>
               <ChevronRight className="w-3.5 h-3.5 opacity-40" />
               <span className="text-xs font-medium uppercase tracking-widest opacity-60">Edit Research</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                title="Delete Note"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all relative overflow-hidden ${
                   saveSuccess 
                   ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                   : 'bg-white text-black hover:bg-zinc-200'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Note Area (Left) */}
          <div className="lg:col-span-7 space-y-12">
            {/* Title Section */}
            <header className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-zinc-900 border border-white/5 rounded-xl flex items-center justify-center">
                    {getIcon()}
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-zinc-900 border border-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      {item.type}
                    </span>
                    <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest flex items-center gap-1.5">
                      <History className="w-3 h-3" /> Updated {new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                 </div>
              </div>
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-none p-0 text-3xl md:text-4xl font-bold tracking-tight text-white focus:ring-0 placeholder-zinc-800 transition-all"
                placeholder="Note Title"
              />
            </header>

            {/* Editor Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                 <div className="flex items-center gap-3">
                    <Edit3 className="w-4 h-4 text-zinc-500" />
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Notes & Strategy</label>
                 </div>
                 <AnimatePresence>
                    {saving && (
                       <motion.div 
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full"
                       >
                          <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                          <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Saving...</span>
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>
              <div className="bg-zinc-950 border border-white/5 rounded-3xl overflow-hidden min-h-[600px] rich-text-editor full-editor shadow-sm flex flex-col">
                <ReactQuill 
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={modules}
                  placeholder="Draft your strategy, ideas, or research notes here..."
                  className="quill-dark flex-1 flex flex-col"
                />
              </div>
            </section>
          </div>

          {/* Data Area (Right) */}
          <aside className="lg:col-span-5 space-y-8">
            <div className="lg:sticky lg:top-24 space-y-8">
              {/* Reference Source Card */}
              <section className="bg-zinc-900/10 border border-white/5 rounded-3xl overflow-hidden group">
                 <div className="flex flex-col">
                    {(item.metadata?.thumbnail || (item.type === 'video' && item.reference_id)) && (
                      <div className="w-full aspect-video bg-zinc-900 relative shrink-0 overflow-hidden">
                         <img 
                          src={item.metadata?.thumbnail || (item.type === 'video' ? `https://i.ytimg.com/vi/${item.reference_id}/mqdefault.jpg` : null)} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60" 
                          alt="" 
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                         <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white">Reference</span>
                         </div>
                      </div>
                    )}
                    <div className="p-8 flex-1 flex flex-col justify-center min-w-0 relative">
                       <div className="space-y-6">
                          <div className="space-y-1">
                             <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Source</p>
                             <div className="flex items-center gap-3">
                                <p className="text-xl font-bold text-zinc-200 tracking-tight">
                                   {item.metadata?.channelTitle || (item.type === 'idea' ? 'Trend Radar' : 'Linked Reference')}
                                </p>
                                {item.type === 'idea' && (
                                   <div className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[9px] font-bold text-blue-400 uppercase tracking-widest">
                                      AI Generated
                                   </div>
                                )}
                             </div>
                          </div>
                          
                          <div className="flex gap-3">
                             {(item.type === 'channel' || item.type === 'analysis') && (
                               <a 
                                 href={item.type === 'analysis' ? `/competitors?analysisId=${item.reference_id || item.id}` : `/channels?channelId=${item.reference_id || item.metadata?.channelId}`}
                                 className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-black hover:bg-zinc-200 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-white/5"
                               >
                                 <BarChart3 className="w-4 h-4" />
                                 Deep Analysis
                               </a>
                             )}
                             {(item.type === 'video' || item.type === 'channel') && (
                               <a 
                                 href={item.type === 'video' ? `https://youtube.com/watch?v=${item.reference_id}` : `https://youtube.com/channel/${item.reference_id || item.metadata?.channelId}`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className={`flex items-center gap-2 px-6 py-2.5 bg-zinc-900 border border-white/10 text-white hover:bg-white hover:text-black hover:border-white rounded-xl text-xs font-black uppercase tracking-widest transition-all ${item.type === 'channel' ? 'aspect-square !p-0 !w-11 !justify-center' : 'flex-1 justify-center'}`}
                                 title="YouTube"
                               >
                                 <ExternalLink className="w-4 h-4" />
                                 {item.type === 'video' && 'YouTube'}
                               </a>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
              </section>

              {/* Sidebar Details & Stats */}
              <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-6 lg:p-8 space-y-8">
                 <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4" /> Metadata
                    </h4>
                    <div className="px-2.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full text-[9px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1.5">
                       <div className="w-1 h-1 rounded-full bg-green-500"></div>
                       Synced
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    {[
                      { label: 'Published', value: item.metadata?.publishedAt ? new Date(item.metadata.publishedAt).toLocaleDateString(undefined, { dateStyle: 'long' }) : null, icon: Globe, color: 'text-blue-500' },
                      { label: 'Date Added', value: new Date(item.created_at).toLocaleDateString(undefined, { dateStyle: 'long' }), icon: History, color: 'text-purple-500' },
                      { label: 'Reach', value: item.metadata?.statistics?.subscriberCount ? `${formatNumber(item.metadata.statistics.subscriberCount)} Subscribers` : null, icon: Users, color: 'text-green-500' }
                    ].filter(stat => stat.value).map((stat, i) => (
                       <div key={i} className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4 transition-all hover:bg-black/60">
                          <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0 border border-white/5">
                             <stat.icon className={`w-4.5 h-4.5 text-zinc-500`} />
                          </div>
                          <div className="min-w-0">
                             <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-0.5">{stat.label}</span>
                             <p className="text-sm font-semibold text-zinc-200 truncate">{stat.value}</p>
                          </div>
                       </div>
                    ))}
                 </div>

                 {/* Dynamic Details (Idea/Video Specific) - Integrated into Sidebar */}
                 <div className="pt-4 border-t border-white/5">
                    {item.type === 'idea' && getIdeaDetails()}
                    {item.type === 'video' && getVideoDetails()}
                    {item.type === 'analysis' && getAnalysisDetails()}
                    {item.type === 'channel' && getChannelDetails()}
                 </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style jsx global>{`
        .full-editor {
          display: flex;
          flex-direction: column;
        }
        .full-editor .quill-dark {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .full-editor .ql-toolbar {
          background: #09090b;
          border: none !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          padding: 1.5rem !important;
        }
        .full-editor .ql-container {
          border: none !important;
          padding: 1rem !important;
          font-family: inherit;
          font-size: 1rem;
          background: transparent;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .full-editor .ql-editor {
          color: #d4d4d8;
          line-height: 1.8;
          padding: 1.5rem !important;
          flex: 1;
          overflow-y: auto;
        }
        .full-editor .ql-editor.ql-blank::before {
          color: #3f3f46 !important;
          font-style: normal;
          left: 1.5rem;
          top: 1.5rem;
        }
        .quill-dark .ql-stroke {
          stroke: #71717a !important;
        }
        .quill-dark .ql-fill {
          fill: #71717a !important;
        }
        .quill-dark .ql-picker {
          color: #71717a !important;
        }
        .quill-dark .ql-active .ql-stroke {
          stroke: #fff !important;
        }
        .quill-dark .ql-active .ql-fill {
          fill: #fff !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
