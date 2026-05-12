"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function PinnedChannels() {
  const [pinned, setPinned] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPinned();
    // Refresh occasionally or on a custom event
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

  if (loading) return (
    <div className="px-4 py-2 space-y-2">
      <div className="h-8 bg-white/5 rounded-lg animate-pulse"></div>
      <div className="h-8 bg-white/5 rounded-lg animate-pulse"></div>
    </div>
  );

  if (pinned.length === 0) return (
    <div className="px-6 py-4">
      <p className="text-[10px] font-bold text-[#333] uppercase tracking-widest leading-relaxed">
        No pinned channels. Pin a creator to see them here.
      </p>
    </div>
  );

  return (
    <div className="px-2 space-y-1">
      {pinned.map((channel) => (
        <div key={channel.id} className="group relative flex items-center">
           <Link 
            href={`/ideas?channelId=${channel.id}`} 
            className="flex-1 flex items-center gap-3 px-4 py-2 rounded-xl text-[11px] font-bold text-[#888] hover:text-white hover:bg-white/5 transition-all truncate"
          >
            <img src={channel.thumbnail} className="w-5 h-5 rounded-full grayscale group-hover:grayscale-0 transition-all" alt="" />
            <span className="truncate">{channel.title}</span>
          </Link>
          <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0070f3]"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
