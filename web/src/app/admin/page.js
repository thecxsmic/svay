"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Zap, 
  Plus, 
  Trash2, 
  Ticket, 
  UserPlus, 
  Calendar, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  Users,
  Copy,
  Check,
  Globe,
  Share2,
  Lock,
  ExternalLink,
  Search,
  Database
} from "lucide-react";

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("promos");

  // States for data
  const [codes, setCodes] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Form states - promo creation
  const [newCode, setNewCode] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAtDate, setExpiresAtDate] = useState("");
  const [creatingCode, setCreatingCode] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [codeSuccess, setCodeSuccess] = useState("");

  // Form states - direct grant
  const [grantEmailOrId, setGrantEmailOrId] = useState("");
  const [grantDurationDays, setGrantDurationDays] = useState("30");
  const [granting, setGranting] = useState(false);
  const [grantError, setGrantError] = useState("");
  const [grantSuccess, setGrantSuccess] = useState("");

  // Form states - shareable analysis search picker
  const [shareQuery, setShareQuery] = useState("");
  const [searchingChannels, setSearchingChannels] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [generatingId, setGeneratingId] = useState("");
  const [shareSuccessLink, setShareSuccessLink] = useState("");
  const [generatedChannelId, setGeneratedChannelId] = useState("");
  const [shareError, setShareError] = useState("");

  // Check admin authorization
  useEffect(() => {
    if (isLoaded) {
      const email = user?.emailAddresses[0]?.emailAddress;
      if (email === "thecxsmic@gmail.com") {
        setIsAdmin(true);
        fetchAdminData();
        fetchChannels();
      } else {
        setIsAdmin(false);
        setLoadingData(false);
      }
    }
  }, [isLoaded, user]);

  const fetchAdminData = async () => {
    try {
      setLoadingData(true);
      const res = await fetch("/api/admin/promo");
      if (res.ok) {
        const data = await res.json();
        setCodes(data.codes || []);
        setRedemptions(data.redemptions || []);
      }
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchChannels = async () => {
    try {
      setLoadingChannels(true);
      const res = await fetch("/api/admin/channels");
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels || []);
      }
    } catch (err) {
      console.error("Failed to fetch channels directory:", err);
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleCreateCode = async (e) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    setCreatingCode(true);
    setCodeError("");
    setCodeSuccess("");

    try {
      let expiresTimestamp = null;
      if (expiresAtDate) {
        expiresTimestamp = Math.floor(new Date(expiresAtDate).getTime() / 1000);
      }

      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode.trim(),
          duration_days: parseInt(durationDays, 10),
          max_uses: maxUses ? parseInt(maxUses, 10) : null,
          expires_at: expiresTimestamp,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create promo code");
      }

      setCodeSuccess(`Code "${data.code.code}" generated successfully!`);
      setNewCode("");
      setMaxUses("");
      setExpiresAtDate("");
      fetchAdminData();
    } catch (err) {
      setCodeError(err.message);
    } finally {
      setCreatingCode(false);
    }
  };

  const handleDeleteCode = async (code) => {
    if (!confirm(`Are you sure you want to delete promo code: ${code}?`)) return;

    try {
      const res = await fetch(`/api/admin/promo?code=${encodeURIComponent(code)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAdminData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete code");
      }
    } catch (err) {
      console.error("Failed to delete code:", err);
    }
  };

  const handleDirectGrant = async (e) => {
    e.preventDefault();
    if (!grantEmailOrId.trim()) return;

    setGranting(true);
    setGrantError("");
    setGrantSuccess("");

    try {
      const res = await fetch("/api/admin/grant-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIdOrEmail: grantEmailOrId.trim(),
          duration_days: parseInt(grantDurationDays, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to grant subscription");
      }

      setGrantSuccess(data.message);
      setGrantEmailOrId("");
      fetchAdminData();
    } catch (err) {
      setGrantError(err.message);
    } finally {
      setGranting(false);
    }
  };

  const handleSearchChannels = async (e) => {
    e.preventDefault();
    if (!shareQuery.trim()) return;

    setSearchingChannels(true);
    setShareError("");
    setSearchResults([]);
    setShareSuccessLink("");
    setGeneratedChannelId("");

    try {
      const res = await fetch(`/api/youtube/channel?q=${encodeURIComponent(shareQuery.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Channel search failed");
      }
      setSearchResults(data.items || []);
    } catch (err) {
      setShareError(err.message);
    } finally {
      setSearchingChannels(false);
    }
  };

  const handleGenerateShareLink = async (channelId) => {
    setGeneratingId(channelId);
    setShareError("");
    setShareSuccessLink("");
    setGeneratedChannelId("");

    try {
      const res = await fetch("/api/admin/share-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: channelId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate shareable analysis");
      }

      const publicLink = `${window.location.origin}/shared/channel/${data.channelId}`;
      setShareSuccessLink(publicLink);
      setGeneratedChannelId(data.channelId);
      setSearchResults([]);
      setShareQuery("");
      fetchChannels();
    } catch (err) {
      setShareError(err.message);
    } finally {
      setGeneratingId("");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleClearCache = async (channelId, title) => {
    if (!confirm(`Are you sure you want to clear all cached database records for channel: "${title}"?\n\nThis will remove its metrics, cached videos, and generated AI video ideas, allowing you to fetch clean updates.`)) return;

    try {
      const res = await fetch(`/api/admin/channels?channelId=${encodeURIComponent(channelId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Cache successfully cleared!");
        fetchChannels();
      } else {
        alert(data.error || "Failed to clear cache");
      }
    } catch (err) {
      console.error("Failed to clear cache:", err);
      alert("Failed to clear cache.");
    }
  };

  const handlePurgeAllCaches = async () => {
    if (!confirm("⚠️ CRITICAL SYSTEM WARNING ⚠️\n\nAre you sure you want to purge ALL cached channel reports, video stats, and AI insights from the database?\n\nThis action cannot be undone. All shared links will remain valid but will require a slow real-time rebuild on their next load.")) return;

    try {
      const res = await fetch("/api/admin/channels?purgeAll=true", {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "All database caches purged!");
        fetchChannels();
      } else {
        alert(data.error || "Failed to purge caches");
      }
    } catch (err) {
      console.error("Failed to purge all caches:", err);
      alert("Failed to purge all caches.");
    }
  };

  function formatNumber(num) {
    if (!num) return "0";
    const parsed = parseInt(num, 10);
    if (isNaN(parsed)) return "0";
    if (parsed >= 1000000000) return (parsed / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
    if (parsed >= 1000000) return (parsed / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (parsed >= 1000) return (parsed / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return parsed.toString();
  }

  // 1. Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-volt animate-spin" />
      </div>
    );
  }

  // 2. Access Denied state
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-950 border border-brand-rose/20 p-6 sm:p-8 rounded-3xl text-center space-y-6">
          <ShieldAlert className="w-12 h-12 sm:w-16 sm:h-16 text-brand-rose mx-auto animate-pulse" />
          <h1 className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white">Access Denied</h1>
          <p className="text-zinc-400 text-xs sm:text-sm">
            Only administrators are authorized to access the Svay Admin Console.
          </p>
          <button 
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // 3. Admin Panel UI
  return (
    <div className="min-h-screen bg-black text-[#ededed] pb-16 relative overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-0 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-brand-volt/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-brand-mint/5 rounded-full filter blur-[120px] pointer-events-none" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 space-y-6 sm:space-y-8 relative z-10">
        
        {/* Minimal inline nav & badge */}
        <div className="flex justify-between items-center pb-2">
          <button 
            onClick={() => router.push("/")}
            className="flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-wider text-zinc-500 hover:text-white transition-all bg-transparent border-none cursor-pointer p-0"
          >
            ← Back to App
          </button>
          <div className="flex items-center gap-2">
            <span className="font-logo font-black text-sm sm:text-base text-white tracking-widest uppercase">SVAY</span>
            <span className="text-[9px] sm:text-[10px] font-black tracking-widest px-2 py-0.5 rounded bg-brand-volt/10 text-brand-volt border border-brand-volt/20 uppercase">Admin</span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-white/5 gap-6 sm:gap-8 bg-transparent px-2 overflow-x-auto no-scrollbar">
          {[
            { id: "promos", label: "Promo & Subscriptions", icon: Ticket },
            { id: "shares", label: "Public Share Reports", icon: Globe },
            { id: "cache", label: "Cache Manager", icon: Database }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 text-[9px] sm:text-[10px] uppercase tracking-widest font-black transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === tab.id 
                  ? "border-brand-volt text-white font-black" 
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
        
        {activeTab === "promos" && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            {/* Section 1: Subscriptions actions grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              
              {/* Card: Generate Promo Code */}
              <section className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-volt/30 to-transparent" />
                
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-volt/10 rounded-xl border border-brand-volt/20">
                      <Ticket className="w-4 sm:w-5 h-4 sm:h-5 text-brand-volt" />
                    </div>
                    <div>
                      <h2 className="font-display font-extrabold text-base sm:text-lg text-white uppercase">Generate Promo Code</h2>
                      <p className="text-zinc-500 text-[10px] sm:text-xs mt-0.5">Create custom redeemable promo codes for users.</p>
                    </div>
                  </div>

                  <form onSubmit={handleCreateCode} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider">Promo Code String</label>
                        <input 
                          type="text"
                          placeholder="e.g. FREE30, VIPMONTH"
                          value={newCode}
                          onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm focus:outline-none focus:border-brand-volt transition-all placeholder:text-zinc-650 font-mono"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider">Duration (Days)</label>
                        <select
                          value={durationDays}
                          onChange={(e) => setDurationDays(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm focus:outline-none focus:border-brand-volt transition-all"
                        >
                          <option value="7">7 Days</option>
                          <option value="14">14 Days</option>
                          <option value="30">30 Days (1 Month)</option>
                          <option value="90">90 Days (3 Months)</option>
                          <option value="365">365 Days (1 Year)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider">Max Uses (Optional)</label>
                        <input 
                          type="number"
                          placeholder="e.g. 50 (empty = unlimited)"
                          value={maxUses}
                          onChange={(e) => setMaxUses(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm focus:outline-none focus:border-brand-volt transition-all placeholder:text-zinc-650"
                          min="1"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider">Code Expiry Date (Optional)</label>
                        <input 
                          type="date"
                          value={expiresAtDate}
                          onChange={(e) => setExpiresAtDate(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm focus:outline-none focus:border-brand-volt transition-all text-left text-zinc-300"
                        />
                      </div>
                    </div>

                    {codeError && (
                      <p className="text-brand-rose text-[11px] font-semibold">{codeError}</p>
                    )}

                    {codeSuccess && (
                      <p className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {codeSuccess}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={creatingCode}
                      className="w-full py-3 bg-brand-volt hover:bg-brand-volt/90 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {creatingCode ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 stroke-[3]" /> Generate Code
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </section>

              {/* Card: Direct Subscription Grant */}
              <section className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-mint/30 to-transparent" />

                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-mint/10 rounded-xl border border-brand-mint/20">
                      <UserPlus className="w-4 sm:w-5 h-4 sm:h-5 text-brand-mint" />
                    </div>
                    <div>
                      <h2 className="font-display font-extrabold text-base sm:text-lg text-white uppercase">Direct Pro Grant</h2>
                      <p className="text-zinc-500 text-[10px] sm:text-xs mt-0.5">Directly grant a user Pro subscription without payment.</p>
                    </div>
                  </div>

                  <form onSubmit={handleDirectGrant} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider">User Email or Clerk User ID</label>
                      <input 
                        type="text"
                        placeholder="e.g. user@example.com or user_2kX..."
                        value={grantEmailOrId}
                        onChange={(e) => setGrantEmailOrId(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm focus:outline-none focus:border-brand-volt transition-all placeholder:text-zinc-600"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider">Duration (Days)</label>
                      <select
                        value={grantDurationDays}
                        onChange={(e) => setGrantDurationDays(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm focus:outline-none focus:border-brand-volt transition-all"
                      >
                        <option value="7">7 Days</option>
                        <option value="14">14 Days</option>
                        <option value="30">30 Days (1 Month)</option>
                        <option value="90">90 Days (3 Months)</option>
                        <option value="365">365 Days (1 Year)</option>
                      </select>
                    </div>

                    {grantError && (
                      <p className="text-brand-rose text-[11px] font-semibold">{grantError}</p>
                    )}

                    {grantSuccess && (
                      <p className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {grantSuccess}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={granting}
                      className="w-full py-3 bg-brand-mint hover:bg-brand-mint/90 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {granting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" /> Grant Pro Access
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </section>

            </div>

            {/* Section 2: Promo codes list */}
            <section className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/[0.04] rounded-xl border border-white/[0.08]">
                    <Ticket className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-base sm:text-lg text-white uppercase">Active Promo Codes</h2>
                    <p className="text-zinc-500 text-[10px] sm:text-xs mt-0.5">List of generated promo codes and stats.</p>
                  </div>
                </div>
                <button 
                  onClick={fetchAdminData}
                  className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white transition-all cursor-pointer w-full sm:w-auto"
                >
                  Refresh
                </button>
              </div>

              {loadingData ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-6 h-6 text-brand-volt animate-spin" />
                </div>
              ) : codes.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs sm:text-sm font-medium">
                  No promo codes found. Create one above to get started.
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full text-left border-collapse text-[11px] sm:text-sm min-w-[500px]">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-zinc-400 font-bold uppercase text-[9px] sm:text-[10px] tracking-wider">
                        <th className="py-3 px-4 sm:py-4 sm:px-6">Code</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6">Duration</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6">Redemptions</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6">Expiry</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {codes.map((item) => {
                        const isExpired = item.expires_at && item.expires_at < Math.floor(Date.now() / 1000);
                        const isLimitReached = item.max_uses && item.uses_count >= item.max_uses;
                        const isInactive = isExpired || isLimitReached;

                        return (
                          <tr key={item.code} className="hover:bg-white/[0.01] transition-all">
                            <td className="py-3 px-4 sm:py-4 sm:px-6 font-mono font-bold text-white flex items-center gap-2">
                              <span className={`${isInactive ? "line-through text-zinc-500" : ""}`}>{item.code}</span>
                              <button
                                onClick={() => copyToClipboard(item.code)}
                                className="p-1 text-zinc-500 hover:text-white transition-all rounded cursor-pointer animate-none bg-transparent border-none"
                                title="Copy code"
                              >
                                {copiedCode === item.code ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </td>
                            <td className="py-3 px-4 sm:py-4 sm:px-6 font-medium text-zinc-300">
                              {item.duration_days} Days
                            </td>
                            <td className="py-3 px-4 sm:py-4 sm:px-6 font-medium text-zinc-300">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-white">{item.uses_count}</span>
                                <span className="text-zinc-650">/</span>
                                <span className="text-zinc-500">{item.max_uses || "∞"}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 sm:py-4 sm:px-6 font-medium text-zinc-300">
                              {item.expires_at ? (
                                <span className={isExpired ? "text-brand-rose font-bold" : "text-zinc-450"}>
                                  {new Date(item.expires_at * 1000).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-zinc-600 font-bold uppercase tracking-wider text-[9px]">No Limit</span>
                              )}
                            </td>
                            <td className="py-3 px-4 sm:py-4 sm:px-6 text-right">
                              <button
                                onClick={() => handleDeleteCode(item.code)}
                                className="p-1.5 bg-brand-rose/10 hover:bg-brand-rose/20 border border-brand-rose/20 hover:border-brand-rose/30 rounded-lg text-brand-rose hover:text-white transition-all cursor-pointer"
                                title="Delete promo code"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Section 3: Redemptions Log */}
            <section className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/[0.04] rounded-xl border border-white/[0.08]">
                  <Users className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display font-extrabold text-base sm:text-lg text-white uppercase">Recent Redemptions</h2>
                  <p className="text-zinc-500 text-[10px] sm:text-xs mt-0.5">Logs of recent user redemptions and direct grants.</p>
                </div>
              </div>

              {loadingData ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-6 h-6 text-brand-volt animate-spin" />
                </div>
              ) : redemptions.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs sm:text-sm font-medium">
                  No redemptions logged yet.
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full text-left border-collapse text-[11px] sm:text-sm min-w-[500px]">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-zinc-400 font-bold uppercase text-[9px] sm:text-[10px] tracking-wider">
                        <th className="py-3 px-4 sm:py-4 sm:px-6">User ID</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6">Promo Code</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6">Redeemed At</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6">Expiry Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {redemptions.map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.01] transition-all">
                          <td className="py-3 px-4 sm:py-4 sm:px-6 font-mono font-medium text-zinc-400 select-all truncate max-w-[120px] sm:max-w-none" title={item.user_id}>
                            {item.user_id}
                          </td>
                          <td className="py-3 px-4 sm:py-4 sm:px-6 font-mono font-bold text-white">
                            {item.code}
                          </td>
                          <td className="py-3 px-4 sm:py-4 sm:px-6 text-zinc-300">
                            {new Date(item.redeemed_at * 1000).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                          </td>
                          <td className="py-3 px-4 sm:py-4 sm:px-6 text-zinc-300">
                            {new Date(item.expires_at * 1000).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === "shares" && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            {/* Generator Action Card */}
            <div className="grid grid-cols-1 gap-6 sm:gap-8">
              <section className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-volt/30 to-transparent" />

                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-volt/10 rounded-xl border border-brand-volt/20">
                      <Search className="w-4 sm:w-5 h-4 sm:h-5 text-brand-volt" />
                    </div>
                    <div>
                      <h2 className="font-display font-extrabold text-base sm:text-lg text-white uppercase">Search & Generate Public Report</h2>
                      <p className="text-zinc-500 text-[10px] sm:text-xs mt-0.5">Search for a channel to verify its details before generating its public shared link.</p>
                    </div>
                  </div>

                  <form onSubmit={handleSearchChannels} className="space-y-4 max-w-xl">
                    <div className="space-y-1.5">
                      <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider">Channel Name or @Handle</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input 
                          type="text"
                          placeholder="Search e.g. MKBHD, MrBeast..."
                          value={shareQuery}
                          onChange={(e) => setShareQuery(e.target.value)}
                          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-brand-volt transition-all placeholder:text-zinc-600"
                          required
                        />
                        <button
                          type="submit"
                          disabled={searchingChannels || generatingId !== ""}
                          className="px-6 py-3 bg-brand-volt text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {searchingChannels ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Search className="w-3.5 h-3.5" /> Search
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {shareError && (
                      <p className="text-brand-rose text-[11px] font-semibold">{shareError}</p>
                    )}

                    {/* Search Results Picker */}
                    {searchResults.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-white/5 animate-in fade-in duration-300">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block">Search Results (Select Correct Channel)</label>
                        <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar border border-white/5 rounded-2xl p-2 bg-black/30 divide-y divide-white/5">
                          {searchResults.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 p-2 hover:bg-white/5 rounded-xl transition-all first:pt-2 last:pb-2">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <img 
                                  src={item.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=30&q=80"} 
                                  className="w-8 h-8 rounded-full object-cover border border-white/5 shrink-0" 
                                  alt="" 
                                />
                                <div className="overflow-hidden">
                                  <span className="text-xs font-bold text-white block truncate">{item.title}</span>
                                  <span className="text-[9px] text-zinc-500 font-mono block truncate">{item.custom_url || item.id}</span>
                                </div>
                              </div>
                              
                              <button
                                type="button"
                                disabled={generatingId !== ""}
                                onClick={() => handleGenerateShareLink(item.id)}
                                className="px-3.5 py-2 bg-brand-volt disabled:opacity-40 text-black text-[9px] font-black uppercase tracking-wider rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 flex items-center gap-1"
                              >
                                {generatingId === item.id ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" /> Gen
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3 h-3 stroke-[2.5]" /> Generate
                                  </>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {shareSuccessLink && (
                      <div className="space-y-4 pt-4 border-t border-white/5 animate-in fade-in duration-300">
                        <p className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Public analysis generated!
                        </p>
                        <div className="flex bg-zinc-900 border border-zinc-855 p-2 rounded-xl items-center justify-between gap-2 overflow-hidden">
                          <span className="text-[10px] font-mono text-zinc-450 truncate select-all">{shareSuccessLink}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(shareSuccessLink)}
                            className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all shrink-0 cursor-pointer"
                          >
                            {copiedCode === shareSuccessLink ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {generatedChannelId && (
                          <div className="space-y-2 pt-3 border-t border-white/5 max-w-sm">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block">Live OG Card Preview</label>
                            <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/40 aspect-[1200/630] relative shadow-inner">
                              <img 
                                src={`/shared/channel/${generatedChannelId}/opengraph-image`} 
                                alt="Social Card Preview" 
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <a 
                              href={`/shared/channel/${generatedChannelId}/opengraph-image`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[9px] font-black text-brand-volt hover:text-white uppercase tracking-wider block text-right mt-1 cursor-pointer"
                            >
                              Open image in new tab ↗
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </form>
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === "cache" && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            {/* Cache Overview Card */}
            <section className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-rose/30 to-transparent" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-rose/10 rounded-xl border border-brand-rose/20 flex items-center justify-center shrink-0">
                    <Database className="w-4 sm:w-5 h-4 sm:h-5 text-brand-rose" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-base sm:text-lg text-white uppercase">System Cache Stats</h2>
                    <p className="text-zinc-500 text-[10px] sm:text-xs mt-0.5">
                      Total Cached Channels: <span className="text-white font-bold">{channels.length}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handlePurgeAllCaches}
                  disabled={channels.length === 0}
                  className="px-6 py-3 bg-brand-rose/10 hover:bg-brand-rose/20 border border-brand-rose/20 hover:border-brand-rose/30 text-brand-rose hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Purge All Caches
                </button>
              </div>
            </section>

            {/* Generated shared channels list directory */}
            <section className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/[0.04] rounded-xl border border-white/[0.08]">
                    <Globe className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-base sm:text-lg text-white uppercase">Cached Reports Directory</h2>
                    <p className="text-zinc-500 text-[10px] sm:text-xs mt-0.5">Directory of all channel analyses currently stored in the database.</p>
                  </div>
                </div>
                <button 
                  onClick={fetchChannels}
                  className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white transition-all cursor-pointer w-full sm:w-auto"
                >
                  Refresh Directory
                </button>
              </div>

              {loadingChannels ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-6 h-6 text-brand-volt animate-spin" />
                </div>
              ) : channels.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs sm:text-sm font-medium">
                  No channel reports stored. Generate one under the Public Share Reports tab.
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full text-left border-collapse text-[11px] sm:text-sm min-w-[650px]">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-zinc-400 font-bold uppercase text-[9px] sm:text-[10px] tracking-wider">
                        <th className="py-3 px-4 sm:py-4 sm:px-6">Channel</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6">Subscribers</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6">Total Views</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6">Total Videos</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {channels.map((item) => {
                        const publicLink = `${window.location.origin}/shared/channel/${item.id}`;
                        return (
                          <tr key={item.id} className="hover:bg-white/[0.01] transition-all">
                            <td className="py-3 px-4 sm:py-4 sm:px-6 font-medium text-white flex items-center gap-3">
                              <img 
                                src={item.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=30&q=80"} 
                                className="w-8 h-8 rounded-full border border-white/5 object-cover shrink-0" 
                                alt="" 
                              />
                              <div className="overflow-hidden">
                                <span className="font-bold block truncate max-w-[150px] sm:max-w-none">{item.title}</span>
                                <span className="text-[9px] text-zinc-500 font-mono block truncate max-w-[150px] sm:max-w-none">{item.custom_url || item.id}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 sm:py-4 sm:px-6 font-medium text-zinc-300">
                              {formatNumber(item.statistics?.subscriberCount)}
                            </td>
                            <td className="py-3 px-4 sm:py-4 sm:px-6 font-medium text-zinc-300">
                              {formatNumber(item.statistics?.viewCount)}
                            </td>
                            <td className="py-3 px-4 sm:py-4 sm:px-6 font-medium text-zinc-300">
                              {formatNumber(item.statistics?.videoCount)}
                            </td>
                            <td className="py-3 px-4 sm:py-4 sm:px-6 text-right">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => copyToClipboard(publicLink)}
                                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-wider text-white transition-all cursor-pointer flex items-center gap-1"
                                >
                                  {copiedCode === publicLink ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" /> Copy<span className="hidden sm:inline"> Link</span>
                                    </>
                                  )}
                                </button>
                                <Link
                                  href={`/shared/channel/${item.id}`}
                                  target="_blank"
                                  className="px-3 py-1.5 bg-brand-volt hover:bg-brand-volt/95 text-black rounded-lg text-[9px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
                                >
                                  Open<span className="hidden sm:inline"> Report</span> <ExternalLink className="w-3 h-3 stroke-[2.5]" />
                                </Link>
                                <button
                                  onClick={() => handleClearCache(item.id, item.title)}
                                  className="px-3 py-1.5 bg-brand-rose/10 hover:bg-brand-rose/20 border border-brand-rose/20 hover:border-brand-rose/30 rounded-lg text-brand-rose hover:text-white transition-all cursor-pointer flex items-center gap-1 shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Clear<span className="hidden sm:inline"> Cache</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

      </main>
    </div>
  );
}
