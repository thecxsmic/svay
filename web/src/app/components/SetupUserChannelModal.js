"use client";

import { useState } from "react";

export default function SetupUserChannelModal({ onChannelSet }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [isSetting, setIsSetting] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch(`/api/youtube/channel?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (data.items && data.items.length > 0) {
        setResults(data.items);
      } else {
        throw new Error("No channels found. Try a different name or Channel ID.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setAsPrimary = async (channel) => {
    setIsSetting(true);
    try {
      const res = await fetch("/api/youtube/channel/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          channelId: channel.id,
          action: 'set'
        })
      });
      const data = await res.json();
      if (data.success) {
        onChannelSet(channel);
      } else {
        throw new Error(data.error || "Failed to set channel");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/80 animate-in fade-in duration-500">
      <div className="bg-[#050505] border border-white/10 w-full max-w-xl rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,112,243,0.2)] animate-in zoom-in-95 duration-500">
        <div className="p-8 md:p-12">
          <div className="w-20 h-20 bg-[#0070f3]/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-[#0070f3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-black text-white text-center mb-4 uppercase tracking-tighter">Register Your Channel</h2>
          <p className="text-[#888888] text-sm text-center mb-10 font-medium leading-relaxed">
            To generate personalized AI strategies, you need to associate your YouTube channel with your account.
          </p>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative flex items-center bg-[#000] border border-white/10 rounded-2xl overflow-hidden focus-within:border-[#0070f3] transition-all">
              <input 
                type="text" 
                placeholder="Search your channel..." 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                className="w-full py-4 px-6 bg-transparent outline-none text-white font-bold"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-4 bg-white text-black font-black hover:bg-[#eee] transition-colors"
              >
                {loading ? "..." : "FIND"}
              </button>
            </div>
          </form>

          {error && <p className="text-red-500 text-xs font-bold text-center mb-6">{error}</p>}

          <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
            {results.map((channel) => (
              <div key={channel.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-4 group hover:border-white/10 transition-all">
                <img src={channel.thumbnail} className="w-12 h-12 rounded-full border border-white/10" alt="" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-white truncate">{channel.title}</h4>
                  <p className="text-[10px] text-[#666] font-bold uppercase tracking-widest">{channel.custom_url || channel.id}</p>
                </div>
                <button 
                  onClick={() => setAsPrimary(channel)}
                  disabled={isSetting}
                  className="bg-white text-black text-[10px] font-black px-4 py-2 rounded-xl hover:scale-105 active:scale-95 transition-all uppercase"
                >
                  {isSetting ? "..." : "Select"}
                </button>
              </div>
            ))}
          </div>

          {!results.length && !loading && !error && (
            <div className="text-center">
              <p className="text-[10px] text-[#444] font-black uppercase tracking-[0.2em]">Enter your channel name or ID above</p>
            </div>
          )}
        </div>
        
        <div className="bg-white/[0.02] border-t border-white/5 p-6 text-center">
          <p className="text-[9px] text-[#444] font-bold uppercase tracking-widest">Only one channel can be registered per account</p>
        </div>
      </div>
    </div>
  );
}
