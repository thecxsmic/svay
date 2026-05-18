'use client';

import { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Save, Trash2, Video, User, Lightbulb, 
  BarChart3, FileText, Loader2, Eye, Users, TrendingUp, 
  Calendar, Target, Zap, Activity, ExternalLink, MessageSquare, ThumbsUp, Flame, Rocket, Edit3, Radio
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
        // Success feedback
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
      case 'video': return <Video className="w-6 h-6 text-blue-500" />;
      case 'channel': return <User className="w-6 h-6 text-purple-500" />;
      case 'idea': return <Lightbulb className="w-6 h-6 text-yellow-500" />;
      default: return <FileText className="w-6 h-6 text-zinc-500" />;
    }
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
           <Target className="w-4 h-4 text-zinc-500" />
           <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Core Strategy</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {rationale && (
             <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-2">
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                  <Rocket className="w-3 h-3 text-purple-500" />
                  Opportunity
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed italic">"{rationale}"</p>
             </div>
           )}
           {action && (
             <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-2">
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                  <Flame className="w-3 h-3 text-orange-500" />
                  Action Plan
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed">{action}</p>
             </div>
           )}
        </div>

        <div className="flex flex-wrap gap-4">
           {effort && (
             <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-2 flex items-center gap-3">
                <Zap className="w-3.5 h-3.5 text-yellow-500" />
                <div>
                   <p className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter">Effort</p>
                   <p className="text-[10px] font-bold text-zinc-200 uppercase">{effort}</p>
                </div>
             </div>
           )}
           {timing && (
             <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-2 flex items-center gap-3">
                <Activity className="w-3.5 h-3.5 text-blue-500" />
                <div>
                   <p className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter">Momentum</p>
                   <p className="text-[10px] font-bold text-zinc-200 uppercase">{timing}</p>
                </div>
             </div>
           )}
           {m.viralScore && (
             <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-2 flex items-center gap-3">
                <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                <div>
                   <p className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter">Viral Score</p>
                   <p className="text-[10px] font-bold text-zinc-200 uppercase">{m.viralScore}/100</p>
                </div>
             </div>
           )}
        </div>
      </div>
    );
  };

  const getVideoDetails = () => {
    if (item?.type !== 'video') return null;
    const stats = item.metadata?.statistics || {};
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-1">
           <BarChart3 className="w-4 h-4 text-zinc-500" />
           <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Engagement Metrics</h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-zinc-600 mb-1">
                 <Eye className="w-3.5 h-3.5" />
                 <span className="text-[9px] font-black uppercase tracking-widest">Views</span>
              </div>
              <p className="text-xl font-black italic tracking-tighter text-white">{formatNumber(stats.viewCount)}</p>
           </div>
           <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-zinc-600 mb-1">
                 <ThumbsUp className="w-3.5 h-3.5" />
                 <span className="text-[9px] font-black uppercase tracking-widest">Likes</span>
              </div>
              <p className="text-xl font-black italic tracking-tighter text-white">{formatNumber(stats.likeCount)}</p>
           </div>
           <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-zinc-600 mb-1">
                 <MessageSquare className="w-3.5 h-3.5" />
                 <span className="text-[9px] font-black uppercase tracking-widest">Comments</span>
              </div>
              <p className="text-xl font-black italic tracking-tighter text-white">{formatNumber(stats.commentCount)}</p>
           </div>
           <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-blue-500/60 mb-1">
                 <TrendingUp className="w-3.5 h-3.5" />
                 <span className="text-[9px] font-black uppercase tracking-widest">Virality</span>
              </div>
              <p className="text-xl font-black italic tracking-tighter text-blue-500">{item.metadata?.vScore || 0}%</p>
           </div>
        </div>

        {item.metadata?.description && (
          <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-2xl p-6">
             <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-3">Original Description Snippet</p>
             <p className="text-xs text-zinc-500 leading-relaxed line-clamp-4 whitespace-pre-wrap">{item.metadata.description}</p>
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 lg:p-12">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest">Back to Library</span>
          </button>
          
          <div className="flex items-center gap-3">
             <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-3 bg-zinc-900/50 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 border border-zinc-800 rounded-2xl transition-all"
                title="Delete Note"
              >
                {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl text-sm font-bold hover:bg-zinc-200 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
              </button>
          </div>
        </div>

        {/* Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-start gap-4">
               <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl shrink-0">
                  {getIcon()}
               </div>
               <div className="flex-1 min-w-0">
                  <input 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-3xl font-black italic tracking-tighter focus:ring-0 placeholder-zinc-800"
                    placeholder="Note Title"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[9px] font-black uppercase tracking-widest text-zinc-500">
                      {item.type}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                      Last Updated: {new Date(item.updated_at).toLocaleString()}
                    </span>
                  </div>
               </div>
            </div>

            {/* Reference Context */}
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl overflow-hidden shadow-2xl">
               <div className="flex flex-col md:flex-row">
                  {(item.metadata?.thumbnail || (item.type === 'video' && item.reference_id)) && (
                    <div className="w-full md:w-64 aspect-video md:aspect-auto bg-zinc-800 relative shrink-0">
                       <img 
                        src={item.metadata?.thumbnail || (item.type === 'video' ? `https://i.ytimg.com/vi/${item.reference_id}/mqdefault.jpg` : null)} 
                        className="w-full h-full object-cover" 
                        alt="" 
                       />
                       <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent"></div>
                    </div>
                  )}
                  <div className="p-8 flex-1 flex flex-col justify-center min-w-0">
                     <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Activity className="w-3 h-3" /> Context Reference
                     </p>
                     
                     <div className="space-y-4">
                        {(item.metadata?.channelTitle || item.type === 'idea') && (
                          <div className="space-y-1">
                             <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Creator / Source</p>
                             <p className="text-lg font-bold text-zinc-200">
                                {item.metadata?.channelTitle || (item.type === 'idea' ? 'Trend Radar Intelligence' : 'Linked Reference')}
                             </p>
                          </div>
                        )}
                        
                        <div className="flex gap-4">
                           {item.type === 'idea' && (
                             <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border border-zinc-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                <Radio className="w-3 h-3 text-blue-500" />
                                Neural Engine v4.2
                             </div>
                           )}
                           {item.type === 'video' && (
                             <a 
                               href={`https://youtube.com/watch?v=${item.reference_id}`}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors"
                             >
                               <ExternalLink className="w-3 h-3" />
                               YouTube
                             </a>
                           )}
                           {item.type === 'channel' && (
                             <a 
                               href={`/channels?channelId=${item.reference_id}`}
                               className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors"
                             >
                               <BarChart3 className="w-3 h-3" />
                               Analyze
                             </a>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Injected Details */}
            {item.type === 'idea' && getIdeaDetails()}
            {item.type === 'video' && getVideoDetails()}
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-8 space-y-8 shadow-2xl lg:sticky lg:top-12">
             <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Quick Reference
             </h4>
             <div className="space-y-6">
                {item.metadata?.publishedAt && (
                   <div className="space-y-1">
                      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Published On</span>
                      <p className="text-sm font-bold text-zinc-300">{new Date(item.metadata.publishedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                   </div>
                )}
                <div className="space-y-1">
                   <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">First Saved</span>
                   <p className="text-sm font-bold text-zinc-300">{new Date(item.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                </div>
                {item.metadata?.statistics?.subscriberCount && (
                   <div className="space-y-1">
                      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Channel Size</span>
                      <p className="text-sm font-bold text-zinc-300">{formatNumber(item.metadata.statistics.subscriberCount)} Subscribers</p>
                   </div>
                )}
             </div>

             <div className="pt-8 border-t border-zinc-800">
                <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-4">Inter-linked Nodes</p>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex items-center justify-center">
                   <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Global Graph v1.0 Active</p>
                </div>
             </div>
          </div>
        </div>

        {/* Editor Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
             <label className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <Edit3 className="w-4 h-4" /> Strategy & Research Observations
             </label>
             {saving && <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest animate-pulse">Auto-saving...</span>}
          </div>
          <div className="bg-zinc-900/20 border border-zinc-800 rounded-[2.5rem] overflow-hidden min-h-[600px] rich-text-editor full-editor shadow-2xl">
            <ReactQuill 
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              placeholder="Start drafting your viral strategy, hook ideas, or research notes..."
              className="quill-dark h-[530px]"
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .full-editor .ql-toolbar {
          background: #09090b;
          border: none !important;
          border-bottom: 1px solid #18181b !important;
          padding: 1.5rem !important;
        }
        .full-editor .ql-container {
          border: none !important;
          padding: 1rem !important;
          font-family: inherit;
          font-size: 1rem;
          background: transparent;
        }
        .full-editor .ql-editor {
          color: #e4e4e7;
          line-height: 1.8;
        }
        .full-editor .ql-editor.ql-blank::before {
          color: #27272a !important;
          font-style: normal;
          left: 2rem;
        }
        .quill-dark .ql-stroke {
          stroke: #52525b !important;
        }
        .quill-dark .ql-fill {
          fill: #52525b !important;
        }
        .quill-dark .ql-picker {
          color: #52525b !important;
        }
        .quill-dark .ql-active .ql-stroke {
          stroke: #fff !important;
        }
        .quill-dark .ql-active .ql-fill {
          fill: #fff !important;
        }
      `}</style>
    </div>
  );
}
