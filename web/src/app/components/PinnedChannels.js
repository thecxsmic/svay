"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";

export default function PinnedChannels() {
  const [pinned, setPinned] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPinned();
    const handleRefresh = () => fetchPinned();
    window.addEventListener('refresh-pins', handleRefresh);
    return () => window.removeEventListener('refresh-pins', handleRefresh);
  }, []);

  const fetchPinned = async () => {
    try {
      const res = await fetch("/api/youtube/channel/pin");
      const data = await res.json();
      if (data.success) {
        setPinned(data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch pins:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnpin = async (channelId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch('/api/youtube/channel/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId })
      });
      const data = await res.json();
      if (data.success) {
        setPinned(prev => prev.filter(c => c.id !== channelId));
        // Notify other components (like Channels page) that pins changed
        window.dispatchEvent(new CustomEvent('refresh-pins'));
      }
    } catch (err) {
      console.error("Failed to unpin:", err);
    }
  };

  if (loading) return (
    <div className="px-4 py-2 space-y-2">
      <div className="relative h-8 overflow-hidden rounded-lg bg-white/[0.04]">
        <div className="dash-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>
      <div className="relative h-8 overflow-hidden rounded-lg bg-white/[0.04]">
        <div className="dash-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>
    </div>
  );

  if (pinned.length === 0) return (
    <div className="px-6 py-4">
      <p className="text-[9px] font-bold text-accents-3 uppercase tracking-widest leading-relaxed">
        Sync creators to enable tracking.
      </p>
    </div>
  );

  return (
    <div className="px-2 space-y-0.5">
      {pinned.map((channel) => (
        <div key={channel.id} className="group relative flex items-center pr-2">
           <Link 
            href={`/channels?channelId=${channel.id}`} 
            className="flex-1 flex items-center gap-3 px-3 py-1.5 rounded-md text-[10px] font-bold text-accents-4 hover:text-white hover:bg-white/[0.04] transition-all uppercase tracking-tight truncate"
          >
            <img src={channel.thumbnail} className="w-4 h-4 rounded-full grayscale group-hover:grayscale-0 transition-all border border-white/10" alt="" />
            <span className="truncate">{channel.title}</span>
          </Link>
          <button 
            onClick={(e) => handleUnpin(channel.id, e)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-md text-accents-3 hover:text-geist-error transition-all"
          >
            <X className="w-3 h-3" />
          </button>
          <div className="absolute right-0 w-1 h-1 rounded-full bg-geist-success shadow-[0_0_8px_rgba(0,112,243,0.5)] group-hover:hidden"></div>
        </div>
      ))}
    </div>
  );
}
