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
  Database,
  Megaphone,
  DollarSign,
  Wallet,
  Key,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  AlertTriangle,
  Download,
  Layers
} from "lucide-react";

function usd(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function currentPeriodMonth() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

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
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { title: "", message: "", onConfirm: () => void, isDanger: boolean }

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Form states - promo creation
  const [newCode, setNewCode] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAtDate, setExpiresAtDate] = useState("");
  const [codeTier, setCodeTier] = useState(""); // "" = standard, "appsumo_lite", "appsumo_pro"
  const [creatingCode, setCreatingCode] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [codeSuccess, setCodeSuccess] = useState("");

  // Bulk generation state
  const [bulkCount, setBulkCount] = useState("100");
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkSuccess, setBulkSuccess] = useState("");
  const [exportingCSV, setExportingCSV] = useState(false);

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

  // Affiliate admin
  const [affiliates, setAffiliates] = useState([]);
  const [affiliatePayouts, setAffiliatePayouts] = useState(null);
  const [payoutMonth, setPayoutMonth] = useState(currentPeriodMonth());
  const [loadingAffiliates, setLoadingAffiliates] = useState(false);
  const [markingPaidId, setMarkingPaidId] = useState(null);

  // API Keys admin
  const [apiKeys, setApiKeys] = useState([]);
  const [loadingApiKeys, setLoadingApiKeys] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState("");
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [newKeyQuota, setNewKeyQuota] = useState("10000");
  const [addingKey, setAddingKey] = useState(false);
  const [editingQuotaId, setEditingQuotaId] = useState(null);
  const [editingQuotaValue, setEditingQuotaValue] = useState("");
  const [editingLabelValue, setEditingLabelValue] = useState("");

  // Check admin authorization
  useEffect(() => {
    if (isLoaded) {
      const email = user?.emailAddresses[0]?.emailAddress;
      if (email === "thecxsmic@gmail.com") {
        setIsAdmin(true);
        fetchAdminData();
        fetchChannels();
        fetchAffiliates();
        fetchApiKeys();
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

  const fetchAffiliates = async (month) => {
    try {
      setLoadingAffiliates(true);
      const m = month || payoutMonth;
      const res = await fetch(
        `/api/admin/affiliates?month=${encodeURIComponent(m)}`
      );
      if (res.ok) {
        const data = await res.json();
        setAffiliates(data.affiliates || []);
        setAffiliatePayouts(data.payouts || null);
      }
    } catch (err) {
      console.error("Failed to fetch affiliates:", err);
    } finally {
      setLoadingAffiliates(false);
    }
  };

  const handleMarkAffiliatePaid = (affiliateId, code) => {
    setConfirmModal({
      title: "Mark month as paid",
      message: `Mark all unpaid commissions for ${code} in ${payoutMonth} as paid?\n\nConfirm only after you sent the PayPal transfer.`,
      isDanger: false,
      onConfirm: async () => {
        setMarkingPaidId(affiliateId);
        try {
          const res = await fetch("/api/admin/affiliates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "mark_paid",
              affiliateId,
              periodMonth: payoutMonth,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed");
          showToast(data.message || "Marked as paid");
          fetchAffiliates();
        } catch (err) {
          showToast(err.message, "error");
        } finally {
          setMarkingPaidId(null);
        }
      },
    });
  };

  const handleToggleAffiliateStatus = async (affiliateId, nextStatus) => {
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_status",
          affiliateId,
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      showToast(data.message || `Set to ${nextStatus}`);
      fetchAffiliates();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const copyPaypal = (email) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedCode(email);
    setTimeout(() => setCopiedCode(null), 2000);
    showToast("PayPal email copied");
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

  const handleBulkGenerate = async () => {
    const count = parseInt(bulkCount, 10);
    if (!count || count < 1 || count > 1000) {
      setBulkError("Enter a number between 1 and 1000");
      return;
    }
    setBulkGenerating(true);
    setBulkError("");
    setBulkSuccess("");
    try {
      const days = parseInt(durationDays, 10);
      let expiresTimestamp = null;
      if (expiresAtDate) {
        expiresTimestamp = Math.floor(new Date(expiresAtDate).getTime() / 1000);
      }
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration_days: days,
          max_uses: maxUses ? parseInt(maxUses, 10) : null,
          expires_at: expiresTimestamp,
          tier: codeTier || null,
          bulk_count: count,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk generation failed");
      setBulkSuccess(`${data.count} codes generated successfully!`);
      fetchAdminData();
    } catch (err) {
      setBulkError(err.message);
    } finally {
      setBulkGenerating(false);
    }
  };

  const handleExportCSV = async (tier) => {
    setExportingCSV(true);
    try {
      const tierParam = tier ? `&tier=${encodeURIComponent(tier)}` : "";
      const res = await fetch(`/api/admin/promo?export=true${tierParam}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = tier ? `svay-promo-codes-${tier}.csv` : "svay-promo-codes.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setExportingCSV(false);
    }
  };

  const handleDeleteCode = (code) => {
    setConfirmModal({
      title: "Delete Promo Code",
      message: `Are you sure you want to delete promo code: ${code}?`,
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/promo?code=${encodeURIComponent(code)}`, {
            method: "DELETE",
          });
          if (res.ok) {
            fetchAdminData();
            showToast("Promo code deleted successfully");
          } else {
            const data = await res.json();
            showToast(data.error || "Failed to delete code", "error");
          }
        } catch (err) {
          console.error("Failed to delete code:", err);
          showToast("Failed to delete code.", "error");
        }
      }
    });
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

  const handleClearCache = (channelId, title) => {
    setConfirmModal({
      title: "Clear Channel Cache",
      message: `Are you sure you want to clear all cached database records for channel: "${title}"?\n\nThis will remove its metrics, cached videos, and generated AI video ideas, allowing you to fetch clean updates.`,
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/channels?channelId=${encodeURIComponent(channelId)}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (res.ok) {
            showToast(data.message || "Cache successfully cleared!");
            fetchChannels();
          } else {
            showToast(data.error || "Failed to clear cache", "error");
          }
        } catch (err) {
          console.error("Failed to clear cache:", err);
          showToast("Failed to clear cache.", "error");
        }
      }
    });
  };

  const handlePurgeAllCaches = () => {
    setConfirmModal({
      title: "⚠️ CRITICAL SYSTEM WARNING ⚠️",
      message: "Are you sure you want to purge ALL cached channel reports, video stats, and AI insights from the database?\n\nThis action cannot be undone. All shared links will remain valid but will require a slow real-time rebuild on their next load.",
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/channels?purgeAll=true", {
            method: "DELETE"
          });
          const data = await res.json();
          if (res.ok) {
            showToast(data.message || "All database caches purged!");
            fetchChannels();
          } else {
            showToast(data.error || "Failed to purge caches", "error");
          }
        } catch (err) {
          console.error("Failed to purge all caches:", err);
          showToast("Failed to purge all caches.", "error");
        }
      }
    });
  };

  const fetchApiKeys = async () => {
    try {
      setLoadingApiKeys(true);
      const res = await fetch("/api/admin/api-keys");
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.keys || []);
      }
    } catch (err) {
      console.error("Failed to fetch API keys:", err);
    } finally {
      setLoadingApiKeys(false);
    }
  };

  const handleAddApiKey = async (e) => {
    e.preventDefault();
    if (!newKeyValue.trim()) return;
    setAddingKey(true);
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          key: newKeyValue.trim(),
          label: newKeyLabel.trim(),
          daily_quota: parseInt(newKeyQuota, 10) || 10000,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add key");
      showToast("API key added successfully");
      setNewKeyValue("");
      setNewKeyLabel("");
      setNewKeyQuota("10000");
      fetchApiKeys();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setAddingKey(false);
    }
  };

  const handleToggleApiKey = async (id, currentEnabled) => {
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", id, enabled: !currentEnabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      showToast(data.message);
      fetchApiKeys();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleUpdateQuota = async (id) => {
    const quota = parseInt(editingQuotaValue, 10);
    if (!quota || quota < 1) { showToast("Invalid quota", "error"); return; }
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_quota", id, daily_quota: quota, label: editingLabelValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      showToast("Quota updated");
      setEditingQuotaId(null);
      fetchApiKeys();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleResetUsage = async (id) => {
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_usage", id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      showToast("Usage counter reset");
      fetchApiKeys();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteApiKey = (id, label) => {
    setConfirmModal({
      title: "Delete API Key",
      message: `Delete key "${label || id}"? This cannot be undone.`,
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/api-keys?id=${id}`, { method: "DELETE" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed");
          showToast("API key deleted");
          fetchApiKeys();
        } catch (err) {
          showToast(err.message, "error");
        }
      },
    });
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
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="dash-ring absolute inset-0 rounded-full border border-white/10" />
          <span className="dash-ring-delay absolute inset-1 rounded-full border border-white/5" />
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-geist-success via-[#00f0ff] to-geist-success animate-logo-gradient dash-orb-pulse shadow-[0_0_18px_rgba(0,112,243,0.4)]" role="status" aria-label="Loading" />
        </div>
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
            { id: "affiliates", label: "Affiliates & Payouts", icon: Megaphone },
            { id: "shares", label: "Public Share Reports", icon: Globe },
            { id: "cache", label: "Cache Manager", icon: Database },
            { id: "apikeys", label: "API Keys", icon: Key }
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
        
        {activeTab === "affiliates" && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            {/* Month picker + totals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <section className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-3 lg:col-span-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-volt" />
                  <h2 className="font-display font-extrabold text-sm uppercase text-white">
                    Payout month
                  </h2>
                </div>
                <input
                  type="month"
                  value={payoutMonth}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPayoutMonth(v);
                    fetchAffiliates(v);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-volt text-zinc-200"
                />
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  15% commission for 6 months after each referred user joins.
                  Monthly = recurring each paid month. Yearly = one-time cut of
                  the annual charge. Pay creators manually via PayPal.
                </p>
                <button
                  type="button"
                  onClick={() => fetchAffiliates()}
                  disabled={loadingAffiliates}
                  className="text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-white cursor-pointer bg-transparent border-none"
                >
                  {loadingAffiliates ? "Loading…" : "Refresh"}
                </button>
              </section>

              <section className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl p-5 sm:p-6 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-zinc-500 mb-2">
                  <Wallet className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[9px] font-black uppercase tracking-wider">
                    Unpaid this month
                  </span>
                </div>
                <p className="font-display text-3xl font-extrabold text-amber-400 tabular-nums">
                  {usd(affiliatePayouts?.totalUnpaidCents)}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Send these via PayPal, then mark paid.
                </p>
              </section>

              <section className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl p-5 sm:p-6 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-zinc-500 mb-2">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[9px] font-black uppercase tracking-wider">
                    Total commission ({payoutMonth})
                  </span>
                </div>
                <p className="font-display text-3xl font-extrabold text-white tabular-nums">
                  {usd(affiliatePayouts?.totalCommissionCents)}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {affiliates.length} creator{affiliates.length === 1 ? "" : "s"} in program
                </p>
              </section>
            </div>

            {/* Monthly payout table — the main thing you need */}
            <section className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <Wallet className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h2 className="font-display font-extrabold text-base sm:text-lg text-white uppercase">
                    Monthly payout list — {payoutMonth}
                  </h2>
                  <p className="text-zinc-500 text-[10px] sm:text-xs mt-0.5">
                    Each creator&apos;s recurring revenue share + PayPal email for manual transfer.
                  </p>
                </div>
              </div>

              {loadingAffiliates && !affiliatePayouts ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                </div>
              ) : !affiliatePayouts?.creators?.length ? (
                <p className="text-zinc-500 text-sm py-6 text-center">
                  No affiliates enrolled yet. Creators join at /affiliate.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm min-w-[720px]">
                    <thead>
                      <tr className="text-[9px] uppercase tracking-wider text-zinc-500 border-b border-white/5">
                        <th className="py-2.5 pr-3 font-black">Creator</th>
                        <th className="py-2.5 pr-3 font-black">Code</th>
                        <th className="py-2.5 pr-3 font-black">PayPal email</th>
                        <th className="py-2.5 pr-3 font-black">Gross</th>
                        <th className="py-2.5 pr-3 font-black">Commission</th>
                        <th className="py-2.5 pr-3 font-black">Unpaid</th>
                        <th className="py-2.5 pr-3 font-black">Mo / Yr pays</th>
                        <th className="py-2.5 font-black">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {affiliatePayouts.creators.map((c) => (
                        <tr
                          key={c.affiliateId}
                          className="border-b border-white/[0.03] text-zinc-300"
                        >
                          <td className="py-3 pr-3">
                            <div className="font-semibold text-white">
                              {c.displayName || "—"}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              {c.email || c.userId}
                            </div>
                            <div className="text-[9px] uppercase mt-0.5">
                              <span
                                className={
                                  c.status === "active"
                                    ? "text-emerald-400"
                                    : "text-zinc-500"
                                }
                              >
                                {c.status}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 pr-3 font-mono text-brand-volt font-bold">
                            {c.code}
                          </td>
                          <td className="py-3 pr-3">
                            {c.paypalEmail ? (
                              <button
                                type="button"
                                onClick={() => copyPaypal(c.paypalEmail)}
                                className="flex items-center gap-1.5 font-mono text-xs text-sky-300 hover:text-white cursor-pointer bg-transparent border-none p-0"
                                title="Copy PayPal email"
                              >
                                {c.paypalEmail}
                                {copiedCode === c.paypalEmail ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3 text-zinc-500" />
                                )}
                              </button>
                            ) : (
                              <span className="text-rose-400 text-[11px]">
                                Missing PayPal
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-3 tabular-nums">
                            {usd(c.grossCents)}
                          </td>
                          <td className="py-3 pr-3 tabular-nums text-white font-semibold">
                            {usd(c.commissionCents)}
                          </td>
                          <td className="py-3 pr-3 tabular-nums">
                            {c.unpaidCents > 0 ? (
                              <span className="text-amber-400 font-bold">
                                {usd(c.unpaidCents)}
                              </span>
                            ) : c.commissionCents > 0 ? (
                              <span className="text-emerald-400">Paid</span>
                            ) : (
                              <span className="text-zinc-600">$0.00</span>
                            )}
                          </td>
                          <td className="py-3 pr-3 text-zinc-400">
                            {c.monthlyPayments || 0} mo · {c.yearlyPayments || 0} yr
                          </td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-2">
                              {c.unpaidCents > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMarkAffiliatePaid(c.affiliateId, c.code)
                                  }
                                  disabled={markingPaidId === c.affiliateId}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[9px] font-black uppercase tracking-wider cursor-pointer hover:bg-emerald-500/25 disabled:opacity-50"
                                >
                                  {markingPaidId === c.affiliateId
                                    ? "…"
                                    : "Mark paid"}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleAffiliateStatus(
                                    c.affiliateId,
                                    c.status === "active" ? "disabled" : "active"
                                  )
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 text-[9px] font-black uppercase tracking-wider cursor-pointer hover:text-white"
                              >
                                {c.status === "active" ? "Disable" : "Enable"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Line-item earnings for the month */}
            {affiliatePayouts?.earnings?.length > 0 && (
              <section className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl p-4 sm:p-8 space-y-4">
                <h2 className="font-display font-extrabold text-sm uppercase text-white">
                  Commission line items — {payoutMonth}
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[640px]">
                    <thead>
                      <tr className="text-[9px] uppercase tracking-wider text-zinc-500 border-b border-white/5">
                        <th className="py-2 pr-3 font-black">Creator</th>
                        <th className="py-2 pr-3 font-black">Plan</th>
                        <th className="py-2 pr-3 font-black">User</th>
                        <th className="py-2 pr-3 font-black">Gross</th>
                        <th className="py-2 pr-3 font-black">15% cut</th>
                        <th className="py-2 font-black">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {affiliatePayouts.earnings.map((e) => (
                        <tr
                          key={e.id}
                          className="border-b border-white/[0.03] text-zinc-300"
                        >
                          <td className="py-2 pr-3">
                            <span className="font-mono text-brand-volt">
                              {e.affiliateCode}
                            </span>
                            {e.paypalEmail && (
                              <div className="text-[10px] text-zinc-500 font-mono">
                                {e.paypalEmail}
                              </div>
                            )}
                          </td>
                          <td className="py-2 pr-3 capitalize">
                            {e.planType}
                            {e.planType === "yearly" ? " (one-time)" : " (recurring)"}
                          </td>
                          <td className="py-2 pr-3 font-mono text-[10px] text-zinc-500">
                            {e.referredUserId}
                          </td>
                          <td className="py-2 pr-3">{usd(e.grossCents)}</td>
                          <td className="py-2 pr-3 text-white font-semibold">
                            {usd(e.commissionCents)}
                          </td>
                          <td className="py-2 capitalize">
                            {e.payoutStatus === "paid" ? (
                              <span className="text-emerald-400">Paid</span>
                            ) : (
                              <span className="text-amber-400">Unpaid</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* All affiliates summary */}
            <section className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl p-4 sm:p-8 space-y-4">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-sky-400" />
                <h2 className="font-display font-extrabold text-sm uppercase text-white">
                  All affiliates (lifetime)
                </h2>
              </div>
              {affiliates.length === 0 ? (
                <p className="text-zinc-500 text-sm">None yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[600px]">
                    <thead>
                      <tr className="text-[9px] uppercase tracking-wider text-zinc-500 border-b border-white/5">
                        <th className="py-2 pr-3 font-black">Creator</th>
                        <th className="py-2 pr-3 font-black">Code</th>
                        <th className="py-2 pr-3 font-black">PayPal</th>
                        <th className="py-2 pr-3 font-black">Refs</th>
                        <th className="py-2 pr-3 font-black">Lifetime earned</th>
                        <th className="py-2 font-black">Unpaid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {affiliates.map((a) => (
                        <tr
                          key={a.id}
                          className="border-b border-white/[0.03] text-zinc-300"
                        >
                          <td className="py-2 pr-3">
                            {a.displayName || a.email || "—"}
                          </td>
                          <td className="py-2 pr-3 font-mono text-brand-volt">
                            {a.code}
                          </td>
                          <td className="py-2 pr-3 font-mono text-[11px]">
                            {a.paypalEmail || (
                              <span className="text-rose-400">—</span>
                            )}
                          </td>
                          <td className="py-2 pr-3">{a.referralCount}</td>
                          <td className="py-2 pr-3">
                            {usd(a.totalCommissionCents)}
                          </td>
                          <td className="py-2">
                            {a.unpaidCents > 0 ? (
                              <span className="text-amber-400 font-semibold">
                                {usd(a.unpaidCents)}
                              </span>
                            ) : (
                              <span className="text-zinc-600">$0.00</span>
                            )}
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
                      <p className="text-zinc-500 text-[10px] sm:text-xs mt-0.5">Create AppSumo or standard promo codes.</p>
                    </div>
                  </div>

                  <form onSubmit={handleCreateCode} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                      {/* Tier selector */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider">Plan Tier</label>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { value: "", label: "Standard", color: "zinc" },
                            { value: "appsumo_lite", label: "AppSumo Lite", color: "amber" },
                            { value: "appsumo_pro", label: "AppSumo Pro", color: "brand-volt" },
                          ].map((t) => (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() => setCodeTier(t.value)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                                codeTier === t.value
                                  ? t.value === "appsumo_lite"
                                    ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                                    : t.value === "appsumo_pro"
                                    ? "bg-brand-volt/15 border-brand-volt/40 text-brand-volt"
                                    : "bg-white/10 border-white/20 text-white"
                                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider">Promo Code String</label>
                        <input 
                          type="text"
                          placeholder="e.g. SUMO-ABC1-XY2Z (leave blank for bulk)"
                          value={newCode}
                          onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm focus:outline-none focus:border-brand-volt transition-all placeholder:text-zinc-650 font-mono"
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
                          <option value="36500">Lifetime (AppSumo LTD)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider">Max Uses (Optional)</label>
                        <input 
                          type="number"
                          placeholder="e.g. 1 (empty = unlimited)"
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
                      disabled={creatingCode || !newCode.trim()}
                      className="w-full py-3 bg-brand-volt hover:bg-brand-volt/90 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {creatingCode ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 stroke-[3]" /> Generate Single Code
                        </>
                      )}
                    </button>
                  </form>

                  {/* Bulk generate divider */}
                  <div className="border-t border-white/5 pt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-zinc-500" />
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Bulk Generate (AppSumo batch)</p>
                    </div>

                    <div className="flex gap-2 items-end">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">How many codes?</label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={bulkCount}
                          onChange={(e) => setBulkCount(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-volt transition-all"
                          placeholder="e.g. 500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleBulkGenerate}
                        disabled={bulkGenerating}
                        className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {bulkGenerating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Layers className="w-3.5 h-3.5" />
                        )}
                        Bulk Gen
                      </button>
                    </div>

                    {bulkError && <p className="text-brand-rose text-[11px] font-semibold">{bulkError}</p>}
                    {bulkSuccess && (
                      <p className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 shrink-0" /> {bulkSuccess}
                      </p>
                    )}
                  </div>
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
                <div className="flex gap-2 flex-wrap">
                  <button 
                    onClick={fetchAdminData}
                    className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white transition-all cursor-pointer"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={() => handleExportCSV("appsumo_lite")}
                    disabled={exportingCSV}
                    className="px-3.5 py-2 bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-300 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Download className="w-3 h-3" /> Lite CSV
                  </button>
                  <button
                    onClick={() => handleExportCSV("appsumo_pro")}
                    disabled={exportingCSV}
                    className="px-3.5 py-2 bg-brand-volt/10 border border-brand-volt/20 hover:border-brand-volt/40 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-brand-volt transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Download className="w-3 h-3" /> Pro CSV
                  </button>
                  <button
                    onClick={() => handleExportCSV(null)}
                    disabled={exportingCSV}
                    className="px-3.5 py-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-zinc-300 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Download className="w-3 h-3" /> All CSV
                  </button>
                </div>
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
                        <th className="py-3 px-4 sm:py-4 sm:px-6">Tier</th>
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
                            <td className="py-3 px-4 sm:py-4 sm:px-6">
                              {item.tier === "appsumo_lite" ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-300">Lite</span>
                              ) : item.tier === "appsumo_pro" ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-brand-volt/10 border border-brand-volt/20 text-brand-volt">Pro</span>
                              ) : (
                                <span className="text-[9px] text-zinc-600 font-bold uppercase">Standard</span>
                              )}
                            </td>
                            <td className="py-3 px-4 sm:py-4 sm:px-6 font-medium text-zinc-300">
                              {item.duration_days >= 36500 ? (
                                <span className="text-[#00f0ff] font-bold">Lifetime</span>
                              ) : (
                                `${item.duration_days} Days`
                              )}
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

        {activeTab === "apikeys" && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">

            {/* Add new key card */}
            <section className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-volt/30 to-transparent" />
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-brand-volt/10 rounded-xl border border-brand-volt/20">
                  <Key className="w-4 sm:w-5 h-4 sm:h-5 text-brand-volt" />
                </div>
                <div>
                  <h2 className="font-display font-extrabold text-base sm:text-lg text-white uppercase">Add YouTube API Key</h2>
                  <p className="text-zinc-500 text-[10px] sm:text-xs mt-0.5">Add keys from different Google Cloud projects to multiply your daily quota. Default is 10,000 units/day per key.</p>
                </div>
              </div>

              <form onSubmit={handleAddApiKey} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">API Key</label>
                  <input
                    type="text"
                    placeholder="AIzaSy..."
                    value={newKeyValue}
                    onChange={(e) => setNewKeyValue(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-brand-volt transition-all placeholder:text-zinc-600"
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Label (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Project 2, Backup"
                    value={newKeyLabel}
                    onChange={(e) => setNewKeyLabel(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-brand-volt transition-all placeholder:text-zinc-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Daily Quota (units)</label>
                  <input
                    type="number"
                    placeholder="10000"
                    value={newKeyQuota}
                    onChange={(e) => setNewKeyQuota(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-brand-volt transition-all placeholder:text-zinc-600"
                    min="1"
                    required
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-4 flex justify-start">
                  <button
                    type="submit"
                    disabled={addingKey}
                    className="px-6 py-3 bg-brand-volt hover:bg-brand-volt/90 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {addingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Key</>}
                  </button>
                </div>
              </form>
            </section>

            {/* Live key pool table */}
            <section className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/[0.04] rounded-xl border border-white/[0.08]">
                    <Key className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-base sm:text-lg text-white uppercase">Key Pool — Live Usage</h2>
                    <p className="text-zinc-500 text-[10px] sm:text-xs mt-0.5">Usage resets at midnight Pacific Time (YouTube's quota schedule).</p>
                  </div>
                </div>
                <button
                  onClick={fetchApiKeys}
                  className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white transition-all cursor-pointer flex items-center gap-1.5 w-full sm:w-auto justify-center"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {loadingApiKeys ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-6 h-6 text-brand-volt animate-spin" />
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Key className="w-8 h-8 text-zinc-700 mx-auto" />
                  <p className="text-zinc-500 text-sm">No API keys added yet.</p>
                  <p className="text-zinc-600 text-xs">The system will fall back to the <code className="font-mono text-zinc-400">YOUTUBE_API_KEY</code> env var until you add keys here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((k) => {
                    const isEditing = editingQuotaId === k.id;
                    const pct = k.pctUsed ?? 0;
                    const isExhausted = k.exhaustedAt != null;
                    const barColor = isExhausted || pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-400" : "bg-brand-volt";

                    return (
                      <div
                        key={k.id}
                        className={`border rounded-2xl p-4 sm:p-5 transition-all ${
                          !k.enabled
                            ? "border-zinc-800/50 bg-zinc-900/30 opacity-60"
                            : isExhausted
                            ? "border-rose-500/20 bg-rose-500/5"
                            : "border-white/[0.06] bg-zinc-900/40"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          {/* Left: key info */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded-lg">
                                {k.keyMasked}
                              </span>
                              {k.label && (
                                <span className="text-[10px] text-zinc-400 font-medium">{k.label}</span>
                              )}
                              {isExhausted && (
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Exhausted
                                </span>
                              )}
                              {!k.enabled && (
                                <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full">
                                  Disabled
                                </span>
                              )}
                            </div>

                            {/* Usage bar */}
                            <div className="space-y-1 max-w-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-zinc-500">
                                  {k.usedToday.toLocaleString()} / {k.daily_quota.toLocaleString()} units used today
                                </span>
                                <span className={`text-[10px] font-bold tabular-nums ${pct >= 80 ? "text-amber-400" : "text-zinc-400"}`}>
                                  {pct}%
                                </span>
                              </div>
                              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${barColor}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <p className="text-[9px] text-zinc-600">
                                {(k.daily_quota - k.usedToday).toLocaleString()} units remaining
                              </p>
                            </div>
                          </div>

                          {/* Right: actions */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {/* Inline quota/label edit */}
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingLabelValue}
                                  onChange={(e) => setEditingLabelValue(e.target.value)}
                                  placeholder="Label"
                                  className="w-24 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-[10px] focus:outline-none focus:border-brand-volt"
                                />
                                <input
                                  type="number"
                                  value={editingQuotaValue}
                                  onChange={(e) => setEditingQuotaValue(e.target.value)}
                                  placeholder="Quota"
                                  className="w-24 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-[10px] focus:outline-none focus:border-brand-volt"
                                  min="1"
                                />
                                <button
                                  onClick={() => handleUpdateQuota(k.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-brand-volt text-black text-[9px] font-black uppercase tracking-wider cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingQuotaId(null)}
                                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-[9px] font-black uppercase tracking-wider cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingQuotaId(k.id);
                                  setEditingQuotaValue(String(k.daily_quota));
                                  setEditingLabelValue(k.label || "");
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-[9px] font-black uppercase tracking-wider cursor-pointer hover:text-white"
                              >
                                Edit
                              </button>
                            )}

                            {/* Reset usage */}
                            <button
                              onClick={() => handleResetUsage(k.id)}
                              title="Reset today's usage counter"
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-[9px] font-black uppercase tracking-wider cursor-pointer hover:text-white flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Reset
                            </button>

                            {/* Toggle enabled */}
                            <button
                              onClick={() => handleToggleApiKey(k.id, k.enabled)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                                k.enabled
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                                  : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
                              }`}
                            >
                              {k.enabled ? (
                                <><ToggleRight className="w-3.5 h-3.5" /> On</>
                              ) : (
                                <><ToggleLeft className="w-3.5 h-3.5" /> Off</>
                              )}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteApiKey(k.id, k.label || k.keyMasked)}
                              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-rose-400 hover:text-white transition-all cursor-pointer"
                              title="Delete key"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Info card */}
            <section className="bg-zinc-950/80 border border-white/[0.06] rounded-2xl p-4 sm:p-6">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-3">How it works</h3>
              <ul className="space-y-1.5 text-[11px] text-zinc-500 leading-relaxed">
                <li>• Each key has its own daily quota. The pool auto-rotates to the next available key when one fills up.</li>
                <li>• <span className="text-zinc-300">search.list</span> costs <span className="text-amber-400 font-bold">100 units</span> · <span className="text-zinc-300">videos.list / channels.list</span> cost <span className="text-brand-volt font-bold">1 unit</span></li>
                <li>• A 10,000-unit key supports ~100 searches/day. Add more keys from different Google Cloud projects to scale.</li>
                <li>• Quota resets at midnight <span className="text-zinc-300">Pacific Time</span> (YouTube's official schedule). Use Reset to manually clear a counter.</li>
                <li>• If no keys are added here, the system falls back to the <code className="font-mono text-zinc-400">YOUTUBE_API_KEY</code> environment variable.</li>
              </ul>
            </section>

          </div>
        )}

      </main>

      {/* Vercel-style Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Red accent top border for danger actions */}
            {confirmModal.isDanger && (
              <div className="absolute top-0 inset-x-0 h-[2px] bg-red-500" />
            )}
            
            <div className="space-y-2">
              <h3 className={`text-base font-semibold ${confirmModal.isDanger ? "text-red-400" : "text-white"}`}>
                {confirmModal.title}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">
                {confirmModal.message}
              </p>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const onConfirm = confirmModal.onConfirm;
                  setConfirmModal(null);
                  if (onConfirm) await onConfirm();
                }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer ${
                  confirmModal.isDanger 
                    ? "bg-red-650 hover:bg-red-500" 
                    : "bg-white text-black hover:bg-zinc-200"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vercel-style Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          )}
          <span className="text-xs text-zinc-300 font-medium">{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            className="text-[10px] text-zinc-650 hover:text-zinc-400 ml-2 font-mono uppercase cursor-pointer transition-colors"
          >
            dismiss
          </button>
        </div>
      )}
    </div>
  );
}
