'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, FileText, Video, User, Lightbulb, BarChart3, Loader2, Eye, Users, TrendingUp, Calendar, Target, Zap, Activity, Maximize2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import 'react-quill-new/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function ResearchNotesModal({ isOpen, onClose, item, onSave, onViewDetails }) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [dbId, setDbId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Quill key is only set after content is ready, preventing premature mount
  const [quillReady, setQuillReady] = useState(false);
  const [quillKey, setQuillKey] = useState('quill-init');

  const formatNumber = (num) => {
    if (isNaN(num) || num === null || num === undefined) return "0";
    const n = parseInt(num);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const getIdeaPreview = () => {
    if (item?.type !== 'idea') return null;
    const m = item.metadata || {};
    const rationale = m.why || m.opportunity || m.rationale || m.predictedViews;
    const effort = m.effort || m.difficulty || (m.viralScore ? `${m.viralScore} Viral Score` : null);
    const timing = m.timing || m.momentum || m.topic;

    return (
      <div className="space-y-4 mt-2">
        {rationale && (
          <div className="space-y-1">
            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-1.5">
              <Target className="w-2.5 h-2.5" />
              Strategy / Opportunity
            </p>
            <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2 italic">{rationale}</p>
          </div>
        )}
        <div className="flex gap-4">
          {effort && (
            <div className="space-y-1">
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-2.5 h-2.5 text-yellow-500" />
                Effort
              </p>
              <p className="text-[10px] font-bold text-zinc-300 uppercase">{effort}</p>
            </div>
          )}
          {timing && (
            <div className="space-y-1">
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="w-2.5 h-2.5 text-blue-500" />
                Momentum
              </p>
              <p className="text-[10px] font-bold text-zinc-300 uppercase">{timing}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!isOpen || !item) {
      // Reset state when modal closes, with a short delay for exit animation
      const timer = setTimeout(() => {
        if (isMounted) {
          setContent('');
          setDbId(null);
          setLoading(false);
          setQuillReady(false);
        }
      }, 300);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }

    // Modal is opening — reset quill so it doesn't show stale content
    setQuillReady(false);
    setContent('');

    const initialContent = item.content || '';
    const initialDbId = item.dbId || (item.hasOwnProperty('content') ? item.id : null);
    const refId = item.reference_id || item.id || item.channelId;

    if (initialContent) {
      // We already have content — set it and mount Quill immediately
      setContent(initialContent);
      setDbId(initialDbId);
      // Use a unique key so Quill mounts fresh with the correct value
      setQuillKey(`quill-${refId || Date.now()}`);
      setQuillReady(true);
    } else if (refId) {
      // Fetch first, then mount Quill only after content is known
      setDbId(initialDbId);
      setLoading(true);

      fetch(`/api/library?reference_id=${refId}`)
        .then(res => res.json())
        .then(data => {
          if (!isMounted) return;
          if (data.success && data.item) {
            setContent(data.item.content || '');
            setDbId(data.item.id);
          } else {
            setContent('');
          }
        })
        .catch(err => {
          console.error('Failed to fetch existing note:', err);
          if (isMounted) setContent('');
        })
        .finally(() => {
          if (!isMounted) return;
          setLoading(false);
          // Now that content state is set, give Quill its stable key and mount
          setQuillKey(`quill-${refId}-${Date.now()}`);
          setQuillReady(true);
        });
    } else {
      // No refId, no existing content — mount empty Quill
      setContent('');
      setQuillKey(`quill-new-${Date.now()}`);
      setQuillReady(true);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, item]);

  // Quill modules configuration
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'clean']
    ],
  }), []);

  const handleSave = async () => {
    if (!content || content === '<p><br></p>') return;
    setSaving(true);
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: dbId,
          type: item?.type || 'note',
          reference_id: item?.reference_id || item?.id || item?.channelId || null,
          title: item?.title || 'Quick Note',
          content: content,
          metadata: item?.metadata || {}
        })
      });
      const data = await res.json();
      if (data.success) {
        if (onSave) onSave(data.id || dbId);
        onClose();
      }
    } catch (err) {
      console.error('Failed to save research note:', err);
    } finally {
      setSaving(false);
    }
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

  const modalContent = (
    <>
      <style jsx global>{`
        .quill-dark .ql-toolbar {
          background: #18181b;
          border-color: #27272a !important;
          border-top-left-radius: 1rem;
          border-top-right-radius: 1rem;
        }
        .quill-dark .ql-container {
          border-color: #27272a !important;
          border-bottom-left-radius: 1rem;
          border-bottom-right-radius: 1rem;
          height: 250px;
          font-family: inherit;
          font-size: 0.875rem;
          background: transparent;
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
        .quill-dark .ql-editor.ql-blank::before {
          color: #3f3f46 !important;
          font-style: normal;
        }
        .quill-dark .ql-editor {
          color: #e4e4e7;
        }
        .quill-dark .ql-active .ql-stroke {
          stroke: #fff !important;
        }
        .quill-dark .ql-active .ql-fill {
          fill: #fff !important;
        }
      `}</style>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-800 rounded-xl">
                    {getIcon()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-tighter italic">
                      {dbId ? 'Edit Research Note' : 'Save to Research Hub'}
                    </h3>
                    {item?.title && (
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate max-w-[400px]">
                        {item.title}
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                {/* Reference Preview */}
                {item && (
                  <div className="bg-black/40 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col md:flex-row min-h-[8rem]">
                    {(item.thumbnail || item.metadata?.thumbnail || (item.type === 'video' && item.reference_id)) && (
                      <div className="w-full md:w-48 h-32 md:h-auto shrink-0 bg-zinc-800 relative">
                        <img
                          src={
                            item.thumbnail ||
                            item.metadata?.thumbnail ||
                            (item.type === 'video' ? `https://i.ytimg.com/vi/${item.reference_id}/mqdefault.jpg` : null)
                          }
                          className="w-full h-full object-cover"
                          alt=""
                        />
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest text-white border border-white/10">
                          {item.type}
                        </div>
                        {item.type === 'video' && onViewDetails && (
                          <button
                            onClick={() => onViewDetails(item)}
                            className="absolute bottom-2 right-2 bg-white/10 hover:bg-white/20 backdrop-blur-md p-1.5 rounded-lg border border-white/5 transition-all group"
                            title="View Full Analytics"
                          >
                            <Eye className="w-3.5 h-3.5 text-white" />
                          </button>
                        )}
                      </div>
                    )}
                    <div className="p-4 flex-1 flex flex-col justify-center min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!item.thumbnail && !item.metadata?.thumbnail && item.type !== 'video' && (
                          <div className="p-1.5 bg-zinc-800 rounded-lg">
                            {getIcon()}
                          </div>
                        )}
                        <h4 className="text-sm font-bold text-white line-clamp-2">{item.title}</h4>
                      </div>

                      {item.type === 'idea' ? (
                        getIdeaPreview()
                      ) : (
                        <>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">
                            {item.metadata?.channelTitle || item.metadata?.customUrl || 'Linked Reference'}
                          </p>
                          <div className="flex flex-wrap gap-4">
                            {item.metadata?.statistics?.viewCount && (
                              <div className="flex items-center gap-1.5">
                                <Eye className="w-3 h-3 text-zinc-600" />
                                <span className="text-[10px] font-black text-zinc-400">
                                  {formatNumber(item.metadata.statistics.viewCount)}
                                </span>
                              </div>
                            )}
                            {item.metadata?.statistics?.subscriberCount && (
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3 h-3 text-zinc-600" />
                                <span className="text-[10px] font-black text-zinc-400">
                                  {formatNumber(item.metadata.statistics.subscriberCount)}
                                </span>
                              </div>
                            )}
                            {item.metadata?.vScore && (
                              <div className="flex items-center gap-1.5">
                                <TrendingUp className="w-3 h-3 text-blue-500" />
                                <span className="text-[10px] font-black text-blue-500">
                                  {item.metadata.vScore}% VIRAL
                                </span>
                              </div>
                            )}
                            {item.metadata?.publishedAt && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-zinc-600" />
                                <span className="text-[10px] font-black text-zinc-400">
                                  {new Date(item.metadata.publishedAt).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Editor */}
                <div className="space-y-2 rich-text-editor">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                      Research Observations & Strategies
                    </label>
                    {loading && (
                      <span className="text-[9px] font-black text-blue-500 uppercase animate-pulse">
                        Syncing Intelligence...
                      </span>
                    )}
                  </div>

                  <div className="bg-black/40 border border-zinc-800 rounded-2xl overflow-hidden relative">
                    {/* Loading overlay — shown while fetching, Quill is NOT mounted yet */}
                    {loading && (
                      <div className="h-[calc(250px+42px)] flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-zinc-700 animate-spin" />
                      </div>
                    )}

                    {/*
                      KEY FIX:
                      - quillReady is only set to true AFTER content state is finalized
                        (either from item.content directly, or after the fetch completes).
                      - This prevents Quill from mounting with '' and ignoring
                        the subsequent content state update.
                      - quillKey changes with each modal open so Quill always
                        re-initializes cleanly with the correct value prop.
                    */}
                    {!loading && quillReady && (
                      <ReactQuill
                        key={quillKey}
                        theme="snow"
                        value={content}
                        onChange={setContent}
                        modules={modules}
                        placeholder="Write your observations, viral hooks, or strategy notes here..."
                        className="quill-dark"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 shrink-0">
                {dbId && (
                  <button
                    onClick={() => {
                      onClose();
                      router.push(`/library/${dbId}`);
                    }}
                    className="mr-auto px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2"
                  >
                    <Maximize2 className="w-4 h-4" />
                    Full Page
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || saving}
                  className="px-6 py-2.5 bg-white text-black rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50"
                >
                  {(loading || saving) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {dbId ? 'Update Research' : 'Save to Hub'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}