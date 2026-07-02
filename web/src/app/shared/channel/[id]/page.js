"use client";

import { useState, useEffect, use } from "react";
import { calculateViralityScore } from "@/lib/ranking/virality";
import { generateChannelHistory, calculateAverages } from "@/lib/utils/history";
import { GrowthChart, SubsChangeChart, EngagementPieChart, RevenueProjectionChart } from "@/app/components/ChannelCharts";
import VideoCard from "@/app/components/VideoCard";
import VideoDetailsModal from "@/app/components/VideoDetailsModal";
import Link from "next/link";
import { 
  Zap, 
  BarChart3, 
  Target, 
  Users, 
  ArrowRight, 
  Activity, 
  Share2, 
  Lock, 
  Video,
  Lightbulb,
  Trophy,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  TrendingDown,
  Copy,
  Check
} from "lucide-react";
import { motion } from "framer-motion";

function formatNumber(num) {
  if (!num) return "0";
  const parsed = parseInt(num, 10);
  if (isNaN(parsed)) return "0";
  if (parsed >= 1000000000) return (parsed / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
  if (parsed >= 1000000) return (parsed / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (parsed >= 1000) return (parsed / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return parsed.toString();
}

function getAudienceTier(stats, videos) {
  const subs = parseInt(stats?.subscriberCount || 0, 10);
  let avgDaily = 0;
  if (videos && videos.length > 0) {
    const totalViews = videos.reduce((acc, v) => acc + parseInt(v.statistics?.viewCount || 0, 10), 0);
    const dates = videos.map(v => new Date(v.published_at || v.snippet?.publishedAt).getTime()).sort((a, b) => a - b);
    const daysDiff = Math.max(1, (Date.now() - dates[0]) / (1000 * 60 * 60 * 24));
    avgDaily = totalViews / daysDiff;
  }

  if (subs >= 100000000 || avgDaily >= 10000000) return { tier: 1, label: "Global Icon", sub: "God Tier Scale" };
  if (subs >= 50000000 || avgDaily >= 5000000) return { tier: 2, label: "Diamond", sub: "Market Leader" };
  if (subs >= 20000000 || avgDaily >= 2000000) return { tier: 3, label: "Titan", sub: "Elite Production" };
  if (subs >= 10000000 || avgDaily >= 1000000) return { tier: 4, label: "Gold", sub: "High Impact" };
  if (subs >= 5000000 || avgDaily >= 500000) return { tier: 5, label: "Elite", sub: "Established Pro" };
  if (subs >= 1000000 || avgDaily >= 250000) return { tier: 6, label: "Silver", sub: "Scale Achieved" };
  if (subs >= 500000 || avgDaily >= 100000) return { tier: 7, label: "Major", sub: "Consistent Growth" };
  if (subs >= 100000 || avgDaily >= 20000) return { tier: 8, label: "Established", sub: "Niche Presence" };
  if (subs >= 10000 || avgDaily >= 5000) return { tier: 9, label: "Micro", sub: "Emerging Talent" };
  return { tier: 10, label: "Nano", sub: "Early Stage" };
}

export default function SharedChannelPage({ params }) {
  const { id } = use(params);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [copiedAIReport, setCopiedAIReport] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/youtube/channel?channelId=${id}`);
        const data = await res.json();
        
        if (data.success && data.channel) {
          setAnalysisData(data);
        } else {
          throw new Error(data.error || "Failed to load channel report.");
        }
      } catch (err) {
        console.error("Shared report load error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchReport();
  }, [id]);

  const handleShareOnTwitter = () => {
    if (!analysisData) return;
    const title = analysisData.channel.title;
    const tweetText = encodeURIComponent(
      `Check out the detailed metrics & virality analysis for YouTube channel "${title}" on @SvayIntelligence! 🚀📈`
    );
    const tweetUrl = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`, "_blank");
  };

  const handleCopyAIReport = () => {
    if (!analysisData) return;
    
    const { channel, videos, competitors = [], trends } = analysisData;
    const tierData = getAudienceTier(channel.statistics, videos);
    
    // 1. Video ideas list
    const ideasText = trends?.videoIdeas && trends.videoIdeas.length > 0
      ? trends.videoIdeas.map((idea, index) => 
          `${index + 1}. Title Idea: "${idea.title || idea.topic}"\n   Strategy: ${idea.strategy || idea.description}\n   Target Audience Hook: ${idea.angle || "General engagement hook"}`
        ).join("\n\n")
      : "No automated ideas generated. Run deep analysis in dashboard.";
      
    // 2. Competitors list
    const competitorsText = competitors.length > 0
      ? competitors.map(comp => 
          `- Name: ${comp.title} (@${comp.custom_url || comp.id})\n  Type: ${comp.matchType || "BENCHMARK"} (${comp.matchReason || "Similar size/cadence"})\n  Subscribers: ${formatNumber(comp.statistics?.subscriberCount)}`
        ).join("\n")
      : "No benchmarked competitors found.";

    // 3. Top videos virality list
    const topVideosText = videos && videos.length > 0
      ? videos.slice(0, 5).map(v => 
          `- Title: "${v.snippet?.title || v.title}"\n  Views: ${formatNumber(v.statistics?.viewCount || v.views)}\n  Likes: ${formatNumber(v.statistics?.likeCount || v.likes)}`
        ).join("\n")
      : "No parsed video statistics available.";

    const promptText = `
# SVAY CREATOR INTELLIGENCE REPORT
## CHANNEL AUDIT: ${channel.title} (@${channel.custom_url || channel.id})

This is a structured, AI-ready report containing creator performance data, subscriber speed, competitive landscapes, virality benchmarks, and video opportunities.

### 📊 CHANNEL PERFORMANCE INDEX
- Channel Title: ${channel.title}
- Handle/URL: ${channel.custom_url ? "@" + channel.custom_url : "https://youtube.com/channel/" + channel.id}
- Total Subscribers: ${formatNumber(channel.statistics?.subscriberCount)}
- Total Channel Views: ${formatNumber(channel.statistics?.viewCount)}
- Total Videos Published: ${formatNumber(channel.statistics?.videoCount)}
- Svay Audience Tier: ${tierData.label} (${tierData.sub})

### ⚡ TOP PERFORMING CONTENT
${topVideosText}

### 🧠 STRATEGIC VIDEO OPPORTUNITIES (AI MOCK IDEAS)
${ideasText}

### 🏁 COMPETITIVE MATRIX & RIVAL METRICS
${competitorsText}

---
*Audit compiled by Svay Intelligence (https://svay.space). Paste this data into Claude, Gemini, or ChatGPT with prompt: "Analyze this channel audit and suggest a 30-day content calendar, outline three specific script strategies to improve audience retention, and identify content gaps based on my competitors."*
    `.trim();

    navigator.clipboard.writeText(promptText);
    setCopiedAIReport(true);
    setTimeout(() => setCopiedAIReport(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-[#ededed] pb-24 relative overflow-x-hidden">
        {/* Background gradients */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-volt/5 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full filter blur-[120px] pointer-events-none" />

        {/* Header Skeleton */}
        <header className="border-b border-white/5 bg-black/60 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-white/10 animate-pulse" />
              <div className="w-16 h-4 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="w-36 h-9 bg-white/10 rounded-xl animate-pulse" />
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className="max-w-4xl mx-auto px-4 pt-12 space-y-12 relative z-10">
          {/* Banner Card Skeleton */}
          <div className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 w-full">
                {/* Profile Picture */}
                <div className="w-20 h-20 rounded-full bg-white/5 animate-pulse shrink-0" />
                <div className="space-y-3 w-full max-w-md">
                  {/* Title */}
                  <div className="h-8 bg-white/5 rounded-xl w-3/4 animate-pulse" />
                  {/* Handle */}
                  <div className="h-4 bg-white/5 rounded-lg w-1/2 animate-pulse" />
                </div>
              </div>
              {/* Share Button */}
              <div className="w-full md:w-44 h-12 bg-white/5 rounded-2xl animate-pulse shrink-0" />
            </div>

            {/* Stats Bar Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-8 border-t border-white/5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl space-y-2">
                  <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse" />
                  <div className="h-6 bg-white/5 rounded-lg w-3/4 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Tabs Bar Skeleton */}
          <div className="flex border-b border-white/5 gap-8 bg-black/80 backdrop-blur-md px-2 overflow-x-auto no-scrollbar">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="py-4 whitespace-nowrap">
                <div className="w-16 h-3 bg-white/5 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Dashboard Body Skeleton */}
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl space-y-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-3 bg-white/5 rounded w-1/3 animate-pulse" />
                    <div className="h-6 bg-white/5 rounded-lg w-2/3 animate-pulse" />
                    <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Row Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/[0.01] border border-white/5 p-8 rounded-3xl space-y-6">
                <div className="h-3 bg-white/5 rounded w-1/4 animate-pulse" />
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <div className="h-3 bg-white/5 rounded w-1/3 animate-pulse" />
                        <div className="h-3 bg-white/5 rounded w-1/12 animate-pulse" />
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full w-full animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/[0.01] border border-white/5 p-8 rounded-3xl flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="h-3 bg-white/5 rounded w-1/3 animate-pulse" />
                  <div className="h-4 bg-white/5 rounded w-full animate-pulse" />
                  <div className="h-4 bg-white/5 rounded w-5/6 animate-pulse" />
                </div>
                <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                  <div className="w-4 h-4 bg-white/5 rounded-full animate-pulse" />
                  <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-xl font-black text-red-500 uppercase tracking-wider mb-2">Report Not Available</h1>
        <p className="text-zinc-500 text-xs max-w-sm mb-6">
          {error || "The channel analysis report you are trying to view does not exist or has expired."}
        </p>
        <Link 
          href="/" 
          className="px-6 py-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl text-[10px] font-black uppercase tracking-wider text-white transition-all"
        >
          Go to Svay Homepage
        </Link>
      </div>
    );
  }

  const { channel, videos, competitors = [], trends } = analysisData;
  const baseSubs = parseInt(channel?.statistics?.subscriberCount || 0, 10);
  const largerCompetitors = competitors.filter(c => parseInt(c.statistics?.subscriberCount || 0, 10) > baseSubs);
  const hasLargerCompetitors = largerCompetitors.length > 0;
  const tierData = getAudienceTier(channel.statistics, videos);

  // Setup history details for charts
  const history = generateChannelHistory(channel.statistics, 14);
  const avgs = calculateAverages(history);
  const subsCount = parseInt(channel.statistics?.subscriberCount || 0);

  return (
    <div className="min-h-screen bg-black text-[#ededed] pb-24 relative overflow-x-hidden selection:bg-brand-volt selection:text-black">
      {/* Background gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-volt/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Standalone Premium Header */}
      <header className="border-b border-white/5 bg-black/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-geist-success via-[#00f0ff] to-geist-success" />
            <span className="font-logo font-black text-lg tracking-wider text-white uppercase">Svay</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block text-[9px] font-black text-zinc-500 uppercase tracking-widest bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg">
              Public Report
            </span>
            <Link 
              href="/" 
              className="px-4 py-2 bg-brand-volt text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all"
            >
              Analyze Your Channel
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-4xl mx-auto px-4 pt-12 space-y-12 relative z-10">
        {/* Channel Banner Info */}
        <div className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-volt/20 to-transparent" />
          
          <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
              <img 
                src={channel.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80"} 
                className="w-20 h-20 rounded-full border border-white/10 shadow-xl object-cover shrink-0" 
                alt="" 
              />
              <div className="space-y-1">
                <h1 className="text-3xl font-black text-white tracking-tight uppercase">{channel.title}</h1>
                <p className="text-zinc-500 font-mono text-xs">{channel.custom_url || channel.id}</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
              <button
                onClick={handleCopyAIReport}
                className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl hover:scale-105 active:scale-95 transition-all text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 text-white shrink-0 cursor-pointer"
              >
                {copiedAIReport ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> Copied AI Report
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy AI-Ready Report
                  </>
                )}
              </button>

              <button
                onClick={handleShareOnTwitter}
                className="px-5 py-3 bg-white text-black rounded-2xl hover:scale-105 active:scale-95 transition-all text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Share2 className="w-4 h-4" /> Share on Twitter / X
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-8 border-t border-white/5">
            {[
              { label: "Subscribers", value: channel.statistics?.subscriberCount, color: "text-white" },
              { label: "Total Views", value: channel.statistics?.viewCount, color: "text-brand-mint" },
              { label: "Total Videos", value: channel.statistics?.videoCount, color: "text-brand-volt" },
              { 
                label: "Avg Views/Video", 
                value: Math.round(parseInt(channel.statistics?.viewCount || 0, 10) / Math.max(1, parseInt(channel.statistics?.videoCount || 0, 10))),
                color: "text-white"
              }
            ].map((stat, i) => (
              <div key={i} className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color} tracking-tight`}>
                  {formatNumber(stat.value)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-white/5 gap-8 bg-black/80 backdrop-blur-md z-40 px-2 overflow-x-auto no-scrollbar">
          {[
            { id: "overview", label: "Overview" },
            { id: "performance", label: "Virality" },
            { id: "ideas", label: "AI Video Ideas 💡" },
            { id: "competitors", label: "Competitors 🏁" },
            { id: "projections", label: "Predictions 📈" },
            { id: "videos", label: "Videos" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 text-[10px] uppercase tracking-widest font-black transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id 
                  ? "border-brand-volt text-white font-black" 
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Tab Contents */}
        <div className="min-h-[300px]">
          {activeTab === "overview" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Audience Level", value: tierData.label, sub: tierData.sub, icon: Users, color: "text-brand-volt" },
                  { label: "Visibility Index", value: `${(parseInt(channel.statistics?.viewCount || 0, 10) / 10000000).toFixed(2)}%`, sub: "Global Relevance", icon: Target, color: "text-brand-mint" },
                  { label: "Production Level", value: (parseInt(channel.statistics?.videoCount || 0, 10) / 10).toFixed(1), sub: "Output Intensity", icon: Zap, color: "text-white" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl">
                    <div className={`w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-4 ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-white tracking-tight mb-1">{stat.value}</p>
                    <p className="text-[10px] text-zinc-400 font-medium">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* DNA Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/[0.01] border border-white/5 p-8 rounded-3xl">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-6">Channel DNA Metrics</h4>
                  <div className="space-y-5">
                    {[
                      { label: "Audience Loyalty", value: 85, color: "bg-brand-volt" },
                      { label: "Brand Authority", value: 78, color: "bg-brand-mint" },
                      { label: "Engagement Velocity", value: 68, color: "bg-white" }
                    ].map((dna, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-[9px] font-bold uppercase mb-2">
                          <span className="text-zinc-500">{dna.label}</span>
                          <span className="text-white">{dna.value}%</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${dna.color} rounded-full`} style={{ width: `${dna.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/[0.01] border border-white/5 p-8 rounded-3xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-4">Svay Neural Summary</h4>
                    <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                      This channel registers a <span className="text-white font-bold">{tierData.label}</span> classification in its category. 
                      The resonance index indicates <span className="text-brand-volt font-bold">Excellent Reach</span> with strong audience authority and robust consistency across uploads.
                    </p>
                  </div>
                  <div className="pt-6 mt-6 border-t border-white/5 flex items-center gap-3">
                    <Activity className="w-4 h-4 text-brand-volt" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">ECOSYSTEM REPORT BY SVAY SYSTEM</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "performance" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {(() => {
                const videoStats = videos.map(v => calculateViralityScore(v));
                const avgScore = videoStats.reduce((acc, s) => acc + s.score, 0) / videoStats.length;
                const viralHits = videoStats.filter(s => s.score > 40).length;
                const hitRate = (viralHits / videoStats.length) * 100;
                const avgEngagement = videoStats.reduce((acc, s) => acc + parseFloat(s.engagement), 0) / videoStats.length;
                const avgDailyViews = videoStats.reduce((acc, s) => acc + s.dailyViews, 0) / videoStats.length;

                return (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { label: "Viral Efficiency", value: `${hitRate.toFixed(1)}%`, sub: "Hit Rate (>40 score)", color: "text-white" },
                        { label: "Avg Engagement", value: `${avgEngagement.toFixed(2)}%`, sub: "Interactive Resonance", color: "text-brand-mint" },
                        { label: "Daily Velocity", value: `+${formatNumber(avgDailyViews)}`, sub: "Avg Daily Views", color: "text-brand-volt" }
                      ].map((stat, i) => (
                        <div key={i} className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</p>
                          <p className={`text-2xl font-bold ${stat.color} tracking-tight`}>{stat.value}</p>
                          <p className="text-[9px] text-zinc-400 font-bold uppercase mt-1">{stat.sub}</p>
                        </div>
                      ))}
                    </div>

                    {/* Engagement spread table */}
                    <div className="bg-white/[0.01] border border-white/5 p-8 rounded-3xl">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                        <div>
                          <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-2">Resonance Spread</h4>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase mb-6 font-mono">Engagement Distribution</p>
                          <div className="space-y-4">
                            {[
                              { label: "High (4% +)", count: videos.filter(v => (parseInt(v.statistics?.likeCount || 0) / parseInt(v.statistics?.viewCount || 1) * 100) > 4).length, color: "border-brand-volt" },
                              { label: "Medium (2-4%)", count: videos.filter(v => { const s = (parseInt(v.statistics?.likeCount || 0) / parseInt(v.statistics?.viewCount || 1) * 100); return s <= 4 && s > 2; }).length, color: "border-brand-mint" },
                              { label: "Low (0-2%)", count: videos.filter(v => (parseInt(v.statistics?.likeCount || 0) / parseInt(v.statistics?.viewCount || 1) * 100) <= 2).length, color: "border-white/10" }
                            ].map((res, i) => (
                              <div key={i} className={`flex justify-between items-center text-[10px] font-bold uppercase tracking-wider border-l-2 ${res.color} pl-4`}>
                                <span className="text-zinc-400">{res.label}</span>
                                <span className="text-white">{res.count} Videos</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="md:col-span-2 h-64 flex justify-center items-center">
                          <EngagementPieChart videos={videos} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {activeTab === "ideas" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {trends ? (
                <>
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Viral Potential</p>
                      <p className="text-2xl font-black text-brand-volt uppercase tracking-tight">
                        {trends.insights?.overview?.viralPotential || "High"}
                      </p>
                    </div>
                    <div className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Market Momentum</p>
                      <p className="text-2xl font-black text-brand-mint uppercase tracking-tight">
                        {trends.insights?.overview?.marketMomentum || "Rising"}
                      </p>
                    </div>
                    <div className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Trending Topics</p>
                      <p className="text-2xl font-black text-white uppercase tracking-tight">
                        {trends.insights?.overview?.trendingTopics || "8"}
                      </p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-white/[0.01] border border-white/5 p-8 rounded-3xl">
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-4">Niche Analysis Summary</h4>
                    <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                      {trends.insights?.overview?.summary}
                    </p>
                  </div>

                  {/* Video Ideas */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-5 h-5 text-brand-volt" />
                      <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">High-Impact Video Concepts</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {trends.insights?.videoIdeas?.map((idea, i) => (
                        <div key={i} className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl flex flex-col justify-between gap-4">
                          <div className="space-y-2">
                            <span className="text-[9px] font-black tracking-widest px-2 py-0.5 rounded bg-brand-volt/10 text-brand-volt border border-brand-volt/10 uppercase">
                              {idea.difficulty}
                            </span>
                            <h5 className="text-sm font-bold text-white leading-snug">{idea.title}</h5>
                            <p className="text-xs text-zinc-500 leading-relaxed">{idea.description}</p>
                          </div>
                          <div className="pt-3 border-t border-white/5 text-[10px] font-bold text-zinc-450 uppercase flex justify-between">
                            <span>Predicted Views</span>
                            <span className="text-brand-mint">{idea.predictedViews}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Emerging Trends */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-5 h-5 text-brand-mint" />
                      <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Emerging Trends</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {trends.insights?.emergingTrends?.map((trend, i) => (
                        <div key={i} className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl space-y-4">
                          <div className="flex justify-between items-center">
                            <h5 className="text-xs font-black text-white uppercase tracking-wider font-mono truncate mr-2">{trend.topic}</h5>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-mono">
                              Score: {trend.viralScore}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 leading-relaxed">{trend.opportunity}</p>
                          <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                            <p className="text-[8px] font-bold text-brand-volt uppercase tracking-wider mb-1">Action Idea</p>
                            <p className="text-[11px] text-zinc-300 leading-relaxed">{trend.actionableIdea}</p>
                          </div>
                          <div className="pt-2 flex justify-between text-[8px] font-black uppercase text-zinc-500">
                            <span>Time Window: <span className="text-white">{trend.timeWindow}</span></span>
                            <span>Est: <span className="text-brand-mint">{trend.estimatedViews}</span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Wins & Viral Hooks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Quick Wins */}
                    <div className="bg-white/[0.01] border border-white/5 p-8 rounded-3xl space-y-4">
                      <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Quick Wins</h4>
                      <div className="divide-y divide-white/5">
                        {trends.insights?.quickWins?.map((win, i) => (
                          <div key={i} className="py-3 first:pt-0 last:pb-0 space-y-1">
                            <div className="flex justify-between text-[9px] font-bold uppercase">
                              <span className="text-brand-volt">{win.idea}</span>
                              <span className="text-zinc-500">{win.timing}</span>
                            </div>
                            <p className="text-xs text-zinc-450">{win.why}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Viral Hooks */}
                    <div className="bg-white/[0.01] border border-white/5 p-8 rounded-3xl space-y-6">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Suggested Title Hooks</h4>
                        <ul className="space-y-2">
                          {trends.insights?.viralPatterns?.titleHooks?.map((hook, i) => (
                            <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                              <span className="text-brand-volt font-bold shrink-0 mt-0.5">→</span>
                              <span className="font-mono text-[11px] select-all italic bg-white/5 px-2 py-1 rounded border border-white/5 w-full block">"{hook}"</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2 pt-4 border-t border-white/5">
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Content Styles to Apply</h4>
                        <ul className="space-y-1.5">
                          {trends.insights?.viralPatterns?.contentStyles?.map((style, i) => (
                            <li key={i} className="text-xs text-zinc-400 flex items-center gap-2">
                              <span className="text-brand-mint font-bold shrink-0">✓</span>
                              <span>{style}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-8 text-center flex flex-col items-center justify-center py-16">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Lightbulb className="w-5 h-5 text-zinc-600" />
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">No AI Ideas Cached</h3>
                  <p className="text-zinc-500 text-xs max-w-sm mb-6 leading-relaxed">
                    AI analysis is ran on demand inside the primary application workspace.
                  </p>
                  <Link 
                    href="/" 
                    className="px-5 py-2.5 bg-brand-volt text-black rounded-xl text-[10px] font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all"
                  >
                    Analyze Channel to Generate Ideas
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "competitors" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {!hasLargerCompetitors && baseSubs > 0 ? (
                <div className="border border-zinc-800 bg-zinc-950 p-6 sm:p-10 rounded-2xl space-y-4 text-left relative overflow-hidden">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-white" />
                    <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">niche dominance established</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-tight font-mono">Undisputed Market Leader</h3>
                    <p className="text-zinc-450 text-xs leading-relaxed max-w-3xl">
                      Your channel sits at the absolute peak of this niche's subscriber hierarchy. No larger rivals were detected in this keyword space. 
                      You are currently the primary benchmark for other creators. Focus on pioneering new formats and optimizing viewer retention to protect your market share.
                    </p>
                  </div>
                </div>
              ) : competitors.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-brand-volt" />
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Niche Rivals Benchmark Matrix</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {competitors.slice(0, 3).map((comp, i) => (
                      <div key={i} className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 px-3 py-1 bg-white/5 rounded-bl-xl text-[8px] font-black text-brand-mint uppercase tracking-widest border-l border-b border-white/5">
                          {comp.matchType || "RIVAL"}
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={comp.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=50&q=80"} 
                              className="w-10 h-10 rounded-full border border-white/10" 
                              alt="" 
                            />
                            <div>
                              <h5 className="text-sm font-bold text-white leading-snug">{comp.title}</h5>
                              <p className="text-[9px] text-zinc-500 font-mono">{comp.custom_url || "YouTube Channel"}</p>
                            </div>
                          </div>
                          <p className="text-xs text-zinc-450 font-medium italic">"{comp.matchReason || "Operating in matching keyword space"}"</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-white/5 text-center">
                          <div>
                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Subs</span>
                            <p className="text-xs font-bold text-white mt-0.5">{formatNumber(comp.statistics?.subscriberCount)}</p>
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Views</span>
                            <p className="text-xs font-bold text-brand-mint mt-0.5">{formatNumber(comp.statistics?.viewCount)}</p>
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Videos</span>
                            <p className="text-xs font-bold text-brand-volt mt-0.5">{formatNumber(comp.statistics?.videoCount)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Rivals radar mock CTA */}
                  <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-8 text-center flex flex-col items-center justify-center py-10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-brand-volt/5 via-transparent to-transparent pointer-events-none" />
                    <SlidersHorizontal className="w-8 h-8 text-brand-volt mb-3" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Live Format Comparison</h4>
                    <p className="text-zinc-500 text-[11px] max-w-sm mb-4 leading-relaxed">
                      Upgrade to Svay Pro to overlay competitor upload schedules, compare thumbnails side-by-side, and map video structures.
                    </p>
                    <Link 
                      href="/"
                      className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl text-[9px] font-black uppercase tracking-wider text-white transition-all flex items-center gap-1.5"
                    >
                      Compare Niche Formats <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </>
              ) : (
                <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-8 text-center flex flex-col items-center justify-center py-16">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Trophy className="w-5 h-5 text-zinc-600" />
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">No Rivals Data Found</h3>
                  <p className="text-zinc-500 text-xs max-w-sm mb-6 leading-relaxed">
                    Connecting your channel triggers automatic competitor discovery and benchmarks views/publishing cadence.
                  </p>
                  <Link 
                    href="/" 
                    className="px-5 py-2.5 bg-brand-volt text-black rounded-xl text-[10px] font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all"
                  >
                    Connect Channel
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "projections" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {/* Predicted Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  let dailyVelocity = 0;
                  if (videos.length > 0) {
                    const batch = videos.slice(0, 10);
                    const batchViews = batch.reduce((acc, v) => acc + parseInt(v.statistics?.viewCount || v.views || 0, 10), 0);
                    const oldestDate = new Date(batch[batch.length - 1].published_at || batch[batch.length - 1].snippet?.publishedAt).getTime();
                    const daysSpan = Math.max(1, (Date.now() - oldestDate) / (1000 * 60 * 60 * 24));
                    dailyVelocity = batchViews / daysSpan;
                  } else {
                    dailyVelocity = (parseInt(channel.statistics?.viewCount || 0, 10) / Math.max(1, parseInt(channel.statistics?.videoCount || 1, 10))) * 0.1;
                  }

                  const avgEngagement = videos.length > 0 
                    ? videos.slice(0, 10).reduce((acc, v) => {
                        const vViews = parseInt(v.statistics?.viewCount || v.views || 1, 10);
                        const vEng = (parseInt(v.statistics?.likeCount || v.likes || 0, 10) + parseInt(v.statistics?.commentCount || v.comments || 0, 10)) / vViews;
                        return acc + vEng;
                      }, 0) / Math.min(videos.length, 10)
                    : 0.02;

                  const base30DViews = dailyVelocity * 30;
                  const opt30DViews = base30DViews * (1 + (avgEngagement * 5));
                  const subVelocity = (base30DViews / Math.max(1, parseInt(channel.statistics?.viewCount || 1, 10))) * subsCount * 0.1;
                  const isMonetized = subsCount >= 1000;
                  const revMin = isMonetized ? (base30DViews / 1000) * 3.00 : 0;
                  const revMax = isMonetized ? (opt30DViews / 1000) * 10.00 : 0;

                  return [
                    { label: "Predicted Subs (30D)", value: `+${formatNumber(subVelocity * 0.7)} — +${formatNumber(subVelocity * 1.4)}`, color: "text-[#00dfd8]" },
                    { label: "Predicted Views (30D)", value: `+${formatNumber(base30DViews)} — +${formatNumber(opt30DViews)}`, color: "text-brand-mint" },
                    { label: "Monetization Status", value: isMonetized ? "ACTIVE" : "PENDING", color: "text-white" },
                    { label: "Estimated Revenue (30D)", value: isMonetized ? `$${formatNumber(revMin)} — $${formatNumber(revMax)}` : "—", color: "text-brand-volt" }
                  ].map((p, i) => (
                    <div key={i} className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{p.label}</p>
                      <p className={`text-xl font-bold ${p.color} tracking-tight`}>{p.value}</p>
                    </div>
                  ));
                })()}
              </div>

              {/* Revenue projection chart card */}
              <div className="bg-white/[0.01] border border-white/5 p-10 rounded-[2rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <TrendingUp className="w-40 h-40 text-[#00dfd8]" />
                </div>
                <div className="relative z-10 text-center">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Neural Revenue Projection</h4>
                  <p className="text-2xl text-white font-black tracking-tight mb-8">Estimated Trajectory (Next 30 Days)</p>
                  <div className="h-64">
                    <RevenueProjectionChart history={history} />
                  </div>
                </div>
              </div>

              {/* Growth velocity & Acquisition charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/[0.01] border border-white/5 p-8 rounded-[2rem]">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-8">Growth Velocity Forecast</h4>
                  <div className="h-60">
                    <GrowthChart history={history} />
                  </div>
                </div>
                <div className="bg-white/[0.01] border border-white/5 p-8 rounded-[2rem]">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-8">Subscriber Acquisition Speed</h4>
                  <div className="h-60">
                    <SubsChangeChart history={history} />
                  </div>
                </div>
              </div>

              {/* Simulation locks banner */}
              <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-8 text-center flex flex-col items-center justify-center py-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-volt/5 via-transparent to-transparent pointer-events-none" />
                <Lock className="w-8 h-8 text-brand-volt mb-3" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Interactive Simulations Locked</h4>
                <p className="text-zinc-500 text-[11px] max-w-sm mb-4 leading-relaxed">
                  Upgrade to Pro to customize CPM rates, run worst-case scenarios, adjust target upload frequency, and export data spreadsheets.
                </p>
                <Link 
                  href="/"
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl text-[9px] font-black uppercase tracking-wider text-white transition-all flex items-center gap-1.5"
                >
                  Unlock Simulation Sandbox <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          )}

          {activeTab === "videos" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {videos.map((item, i) => (
                <motion.div
                  key={item.id?.videoId || item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <VideoCard 
                    item={{
                      ...item,
                      snippet: item.snippet || {
                        title: item.title,
                        thumbnails: { medium: { url: item.thumbnail }, high: { url: item.thumbnail } },
                        publishedAt: item.published_at,
                        channelTitle: channel.title
                      }
                    }}
                    setHoverInfo={setHoverInfo}
                    setSelectedVideo={setSelectedVideo}
                    formatNumber={formatNumber}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Global CTA Banner */}
        <section className="bg-gradient-to-tr from-brand-volt/10 to-transparent border border-brand-volt/20 rounded-[2.5rem] p-8 md:p-12 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-volt/30 to-transparent" />
          
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter leading-none">
            Unlock Real-Time Virality Tracking
          </h2>
          <p className="text-zinc-400 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
            Svay is the ultimate workspace for content creators. Connect your channel in 1-click to track competitors, discover trending keywords, and forecast audience expansion.
          </p>
          <div className="pt-2">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-black text-xs uppercase tracking-wider rounded-2xl hover:scale-105 active:scale-[0.98] transition-all"
            >
              Analyze Your Channel Now
            </Link>
          </div>
        </section>
      </main>

      {/* Video Details Modal */}
      {selectedVideo && (
        <VideoDetailsModal 
          selectedVideo={selectedVideo} 
          setSelectedVideo={setSelectedVideo}
          formatNumber={formatNumber}
          channelSubs={channel.statistics?.subscriberCount}
        />
      )}
    </div>
  );
}
