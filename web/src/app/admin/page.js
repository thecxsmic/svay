"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
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
  Check
} from "lucide-react";

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  // States for data
  const [codes, setCodes] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
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

  // Check admin authorization
  useEffect(() => {
    if (isLoaded) {
      const email = user?.emailAddresses[0]?.emailAddress;
      if (email === "thecxsmic@gmail.com") {
        setIsAdmin(true);
        fetchAdminData();
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

      setCodeSuccess(`Code "${newCode.toUpperCase()}" created successfully!`);
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

  const handleDeleteCode = async (codeToDelete) => {
    if (!confirm(`Are you sure you want to delete the promo code "${codeToDelete}"?`)) return;

    try {
      const res = await fetch(`/api/admin/promo?code=${encodeURIComponent(codeToDelete)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete promo code");
      }

      fetchAdminData();
    } catch (err) {
      alert(`Error deleting code: ${err.message}`);
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

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
        
        {/* Section 1: Top Actions grid */}
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
                            className="p-1 text-zinc-500 hover:text-white transition-all rounded"
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
                        {new Date(item.redeemed_at * 1000).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
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

      </main>
    </div>
  );
}
