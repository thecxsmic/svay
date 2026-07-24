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
  Check,
  Eye,
  Flame,
  Sparkles,
  ExternalLink
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

/* ─── Tiny helper components ─────────────────────────────────────── */
function Badge({ children, accent }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[10px] font-medium tracking-wide uppercase ${accent ? "border-white/15 bg-white/8 text-white" : "border-zinc-800 bg-zinc-900 text-zinc-400"}`}>
      {children}
    </span>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="group relative bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-5 transition-colors duration-200">
      <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-2xl font-semibold tracking-tight ${accent || "text-white"}`}>{value}</p>
      {sub && <p className="text-[10px] text-zinc-600 mt-1 font-medium">{sub}</p>}
    </div>
  );
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon className="w-3.5 h-3.5 text-zinc-500" />}
      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">{children}</span>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`py-3.5 text-[11px] font-medium transition-all border-b whitespace-nowrap cursor-pointer px-1 ${
        active
          ? "border-white text-white"
          : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}

/* ─── Loading skeleton ────────────────────────────────────────────── */
function Skel({ className = "" }) {
  return (
    <div className={`relative overflow-hidden rounded-md bg-white/[0.05] ${className}`}>
      <div className="dash-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <header className="border-b border-zinc-900 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Skel className="h-5 w-5 rounded-full" />
            <Skel className="h-3.5 w-12" />
          </div>
          <Skel className="h-8 w-32 rounded-lg" />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 pt-10 space-y-8 relative z-10">
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-8">
          <div className="flex items-center gap-5 mb-8">
            <Skel className="h-16 w-16 shrink-0 rounded-full" />
            <div className="space-y-2.5 flex-1">
              <Skel className="h-6 w-1/2 rounded-lg" />
              <Skel className="h-3 w-1/3" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2">
                <Skel className="h-2.5 w-1/2" />
                <Skel className="h-5 w-2/3 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-6 border-b border-zinc-900 pb-1">
          {[...Array(5)].map((_, i) => (
            <Skel key={i} className="mb-1 h-3 w-14" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl space-y-3">
              <Skel className="h-8 w-8 rounded-lg" />
              <Skel className="h-2.5 w-1/3" />
              <Skel className="h-5 w-1/2" />
              <Skel className="h-2.5 w-2/3" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────── */
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
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchReport();
  }, [id]);

  const handleShareOnTwitter = () => {
    if (!analysisData) return;
    const tweetText = encodeURIComponent(
      `Check out the detailed metrics & virality analysis for YouTube channel "${analysisData.channel.title}" on @SvayIntelligence! 🚀📈`
    );
    const tweetUrl = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`, "_blank");
  };

  const handleCopyAIReport = () => {
    if (!analysisData) return;
    const { channel, videos, competitors = [], trends } = analysisData;
    const tierData = getAudienceTier(channel.statistics, videos);

    const ideasText = trends?.insights?.videoIdeas?.length > 0
      ? trends.insights.videoIdeas.map((idea, i) =>
          `${i + 1}. "${idea.title || idea.topic}"\n   Concept: ${idea.strategy || idea.description}\n   Difficulty: ${idea.difficulty || "Medium"}\n   Predicted: ${idea.predictedViews || "N/A"}`
        ).join("\n\n")
      : "No automated ideas generated.";

    const baseSubs = parseInt(channel?.statistics?.subscriberCount || 0, 10);
    const largerCompetitors = competitors.filter(c => parseInt(c.statistics?.subscriberCount || 0, 10) > baseSubs);
    const isKing = !largerCompetitors.length && baseSubs > 1000000;

    const competitorsText = isKing
      ? "- Niche Dominance: No larger rivals detected."
      : competitors.length > 0
        ? competitors.map(c => `- ${c.title} (@${c.custom_url || c.id}) — ${formatNumber(c.statistics?.subscriberCount)} subs`).join("\n")
        : "No benchmarked competitors found.";

    const topVideosText = videos?.length > 0
      ? videos.slice(0, 5).map(v => `- "${v.snippet?.title || v.title}" — ${formatNumber(v.statistics?.viewCount || v.views)} views`).join("\n")
      : "No video stats available.";

    const promptText = `
# SVAY CREATOR INTELLIGENCE REPORT
## ${channel.title} (@${channel.custom_url || channel.id})

### CHANNEL METRICS
- Subscribers: ${formatNumber(channel.statistics?.subscriberCount)}
- Total Views: ${formatNumber(channel.statistics?.viewCount)}
- Videos: ${formatNumber(channel.statistics?.videoCount)}
- Tier: ${tierData.label} (${tierData.sub})

### TOP CONTENT
${topVideosText}

### AI VIDEO IDEAS
${ideasText}

### COMPETITOR MATRIX
${competitorsText}

---
*Report by Svay Intelligence (svay.space) — Paste into Claude/Gemini/ChatGPT for strategic analysis.*
`.trim();

    navigator.clipboard.writeText(promptText);
    setCopiedAIReport(true);
    setTimeout(() => setCopiedAIReport(false), 2500);
  };

  if (loading) return <LoadingSkeleton />;

  if (error || !analysisData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5">
          <Activity className="w-5 h-5 text-zinc-600" />
        </div>
        <h1 className="text-base font-semibold text-white mb-2">Report unavailable</h1>
        <p className="text-zinc-500 text-sm max-w-xs mb-6 leading-relaxed">
          {error || "This channel analysis report doesn't exist or has expired."}
        </p>
        <Link href="/" className="px-4 py-2.5 bg-white text-black rounded-lg text-xs font-medium hover:bg-zinc-200 transition-colors">
          Go to <span className="font-logo font-black uppercase tracking-tight ml-0.5">Svay</span> →
        </Link>
      </div>
    );
  }

  const { channel, videos, competitors = [], trends } = analysisData;
  const baseSubs = parseInt(channel?.statistics?.subscriberCount || 0, 10);
  const largerCompetitors = competitors.filter(c => parseInt(c.statistics?.subscriberCount || 0, 10) > baseSubs);
  const hasLargerCompetitors = largerCompetitors.length > 0;
  const tierData = getAudienceTier(channel.statistics, videos);
  const history = generateChannelHistory(channel.statistics, 14);
  const subsCount = parseInt(channel.statistics?.subscriberCount || 0);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "performance", label: "Virality" },
    { id: "ideas", label: "AI Ideas" },
    { id: "competitors", label: "Competitors" },
    ...(hasLargerCompetitors ? [{ id: "projections", label: "Projections" }] : []),
    { id: "videos", label: "Videos" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24 relative overflow-x-hidden">
      {/* Dot grid */}
      <div className="fixed inset-0 bg-[radial-gradient(#ffffff06_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
      {/* Subtle vignette */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,transparent_60%,#0a0a0a_100%)] pointer-events-none" />

      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="border-b border-zinc-900 bg-[#0a0a0a]/85 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-70 transition-opacity">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-400" />
            <span className="font-logo font-black text-base text-white tracking-tight uppercase">Svay</span>
          </Link>
          <div className="flex items-center gap-3">
            <Badge>Public Report</Badge>
            <Link
              href="/"
              className="px-3.5 py-1.5 bg-white text-black rounded-lg text-xs font-medium hover:bg-zinc-200 transition-colors inline-flex items-center gap-1.5"
            >
              Try <span className="font-logo font-black uppercase tracking-tight text-[10px] ml-0.5">Svay</span> <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-8 space-y-6 relative z-10">

        {/* ── Channel Hero ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 md:p-8 relative overflow-hidden"
        >
          {/* Subtle top border glow */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-600/40 to-transparent" />

          <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-8 justify-between">
            <div className="flex items-center gap-4">
              <img
                src={channel.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80"}
                className="w-14 h-14 rounded-full border border-zinc-800 object-cover shrink-0"
                alt=""
              />
              <div>
                <h1 className="text-xl font-semibold text-white tracking-tight">{channel.title}</h1>
                <p className="text-sm text-zinc-500 font-mono mt-0.5">{channel.custom_url || channel.id}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge accent>{tierData.label}</Badge>
                  <span className="text-[10px] text-zinc-600">{tierData.sub}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col md:flex-row gap-2 shrink-0">
              <button
                onClick={handleCopyAIReport}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-medium text-zinc-300 transition-all cursor-pointer"
              >
                {copiedAIReport ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy Report</>}
              </button>
              <button
                onClick={handleShareOnTwitter}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-medium text-zinc-300 transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-zinc-900">
            {[
              { label: "Subscribers", value: channel.statistics?.subscriberCount },
              { label: "Total Views", value: channel.statistics?.viewCount },
              { label: "Videos", value: channel.statistics?.videoCount },
              {
                label: "Avg Views/Video",
                value: Math.round(parseInt(channel.statistics?.viewCount || 0, 10) / Math.max(1, parseInt(channel.statistics?.videoCount || 0, 10)))
              }
            ].map((s, i) => (
              <div key={i} className="space-y-1">
                <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest">{s.label}</p>
                <p className="text-lg font-semibold text-white tracking-tight">{formatNumber(s.value)}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Tabs ─────────────────────────────────────────── */}
        <div className="flex gap-6 border-b border-zinc-900 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <TabButton key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </TabButton>
          ))}
        </div>

        {/* ── Tab Content ───────────────────────────────────── */}
        <div className="min-h-[300px]">

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Audience Level", value: tierData.label, sub: tierData.sub, icon: Users },
                  { label: "Visibility Index", value: `${(parseInt(channel.statistics?.viewCount || 0, 10) / 10000000).toFixed(2)}%`, sub: "Global Relevance", icon: Eye },
                  { label: "Production Output", value: (parseInt(channel.statistics?.videoCount || 0, 10) / 10).toFixed(1), sub: "Output Intensity", icon: Zap }
                ].map((s, i) => (
                  <div key={i} className="bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-6 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                      <s.icon className="w-4 h-4 text-zinc-400" />
                    </div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium mb-1.5">{s.label}</p>
                    <p className="text-2xl font-semibold text-white tracking-tight">{s.value}</p>
                    <p className="text-xs text-zinc-600 mt-1">{s.sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Channel DNA */}
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6">
                  <SectionLabel icon={Activity}>Channel DNA Metrics</SectionLabel>
                  <div className="space-y-5">
                    {[
                      { label: "Audience Loyalty", value: 85 },
                      { label: "Brand Authority", value: 78 },
                      { label: "Engagement Velocity", value: 68 },
                    ].map((dna, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-[11px] font-medium mb-1.5">
                          <span className="text-zinc-400">{dna.label}</span>
                          <span className="text-white">{dna.value}%</span>
                        </div>
                        <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-white rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${dna.value}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Neural summary */}
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <SectionLabel icon={Sparkles}><span className="font-logo font-black uppercase tracking-tight mr-0.5">Svay</span> Neural Summary</SectionLabel>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      This channel registers a{" "}
                      <span className="text-white font-medium">{tierData.label}</span> classification in its category.
                      The resonance index indicates{" "}
                      <span className="text-white font-medium">Excellent Reach</span> with strong audience authority and robust consistency across uploads.
                    </p>
                  </div>
                  <div className="mt-6 pt-5 border-t border-zinc-900 flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest">Ecosystem Report · <span className="font-logo font-black uppercase tracking-tight mr-0.5">Svay</span> Intelligence</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* PERFORMANCE / VIRALITY */}
          {activeTab === "performance" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {(() => {
                const videoStats = videos.map(v => calculateViralityScore(v));
                const avgScore = videoStats.reduce((acc, s) => acc + s.score, 0) / (videoStats.length || 1);
                const viralHits = videoStats.filter(s => s.score > 40).length;
                const hitRate = (viralHits / (videoStats.length || 1)) * 100;
                const avgEngagement = videoStats.reduce((acc, s) => acc + parseFloat(s.engagement), 0) / (videoStats.length || 1);
                const avgDailyViews = videoStats.reduce((acc, s) => acc + s.dailyViews, 0) / (videoStats.length || 1);

                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { label: "Viral Efficiency", value: `${hitRate.toFixed(1)}%`, sub: "Hit Rate (>40 score)" },
                        { label: "Avg Engagement", value: `${avgEngagement.toFixed(2)}%`, sub: "Interactive Resonance" },
                        { label: "Daily Velocity", value: `+${formatNumber(avgDailyViews)}`, sub: "Avg Daily Views" },
                      ].map((s, i) => (
                        <div key={i} className="bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-6 transition-colors">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium mb-1.5">{s.label}</p>
                          <p className="text-2xl font-semibold text-white tracking-tight">{s.value}</p>
                          <p className="text-xs text-zinc-600 mt-1">{s.sub}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 md:p-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                        <div>
                          <SectionLabel icon={Activity}>Resonance Spread</SectionLabel>
                          <div className="space-y-4 mt-4">
                            {[
                              { label: "High (4%+)", count: videos.filter(v => (parseInt(v.statistics?.likeCount || 0) / parseInt(v.statistics?.viewCount || 1) * 100) > 4).length },
                              { label: "Medium (2–4%)", count: videos.filter(v => { const s = (parseInt(v.statistics?.likeCount || 0) / parseInt(v.statistics?.viewCount || 1) * 100); return s <= 4 && s > 2; }).length },
                              { label: "Low (0–2%)", count: videos.filter(v => (parseInt(v.statistics?.likeCount || 0) / parseInt(v.statistics?.viewCount || 1) * 100) <= 2).length },
                            ].map((r, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">{r.label}</span>
                                <span className="text-white font-medium">{r.count} videos</span>
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

          {/* AI IDEAS */}
          {activeTab === "ideas" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {trends ? (
                <>
                  {/* Overview metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: "Viral Potential", value: trends.insights?.overview?.viralPotential || "High" },
                      { label: "Market Momentum", value: trends.insights?.overview?.marketMomentum || "Rising" },
                      { label: "Trending Topics", value: trends.insights?.overview?.trendingTopics || "8" },
                    ].map((s, i) => (
                      <div key={i} className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium mb-1.5">{s.label}</p>
                        <p className="text-2xl font-semibold text-white">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  {trends.insights?.overview?.summary && (
                    <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6">
                      <SectionLabel icon={Activity}>Niche Analysis</SectionLabel>
                      <p className="text-sm text-zinc-400 leading-relaxed">{trends.insights.overview.summary}</p>
                    </div>
                  )}

                  {/* Video Ideas */}
                  <div>
                    <SectionLabel icon={Lightbulb}>High-Impact Video Concepts</SectionLabel>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {trends.insights?.videoIdeas?.map((idea, i) => (
                        <div key={i} className="bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-6 flex flex-col justify-between gap-4 transition-colors">
                          <div className="space-y-3">
                            <Badge>{idea.difficulty}</Badge>
                            <h5 className="text-sm font-medium text-white leading-snug">{idea.title}</h5>
                            <p className="text-xs text-zinc-500 leading-relaxed">{idea.description}</p>
                          </div>
                          <div className="pt-4 border-t border-zinc-900 flex items-center justify-between text-xs">
                            <span className="text-zinc-600">Predicted Views</span>
                            <span className="text-emerald-400 font-medium">{idea.predictedViews}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Emerging Trends */}
                  <div>
                    <SectionLabel icon={Flame}>Emerging Trends</SectionLabel>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {trends.insights?.emergingTrends?.map((trend, i) => (
                        <div key={i} className="bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-6 space-y-4 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="text-sm font-medium text-white leading-snug">{trend.topic}</h5>
                            <span className="text-[10px] text-zinc-600 font-mono shrink-0 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">{trend.viralScore}</span>
                          </div>
                          <p className="text-xs text-zinc-500 leading-relaxed">{trend.opportunity}</p>
                          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-1">
                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium">Action Idea</p>
                            <p className="text-xs text-zinc-300 leading-relaxed">{trend.actionableIdea}</p>
                          </div>
                          <div className="flex items-center justify-between text-xs text-zinc-600">
                            <span>Window: <span className="text-zinc-400">{trend.timeWindow}</span></span>
                            <span className="text-emerald-400">{trend.estimatedViews}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick wins + title hooks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6">
                      <SectionLabel icon={Zap}>Quick Wins</SectionLabel>
                      <div className="space-y-4">
                        {trends.insights?.quickWins?.map((win, i) => (
                          <div key={i} className="pb-4 border-b border-zinc-900 last:border-0 last:pb-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-medium text-white leading-snug">{win.idea}</p>
                              <span className="text-[10px] text-zinc-600 shrink-0 whitespace-nowrap">{win.timing}</span>
                            </div>
                            <p className="text-xs text-zinc-500">{win.why}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 space-y-6">
                      <div>
                        <SectionLabel icon={Target}>Title Hooks</SectionLabel>
                        <ul className="space-y-2">
                          {trends.insights?.viralPatterns?.titleHooks?.map((hook, i) => (
                            <li key={i} className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 font-mono select-all">
                              "{hook}"
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-4 border-t border-zinc-900">
                        <SectionLabel icon={CheckCircle2}>Content Styles</SectionLabel>
                        <ul className="space-y-2">
                          {trends.insights?.viralPatterns?.contentStyles?.map((style, i) => (
                            <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                              <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                              <span>{style}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-12 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                    <Lightbulb className="w-5 h-5 text-zinc-600" />
                  </div>
                  <h3 className="text-sm font-medium text-white mb-2">No AI ideas cached</h3>
                  <p className="text-zinc-500 text-xs max-w-xs mb-6 leading-relaxed">
                    AI analysis is run on demand inside the primary workspace.
                  </p>
                  <Link href="/" className="px-4 py-2 bg-white text-black rounded-lg text-xs font-medium hover:bg-zinc-200 transition-colors">
                    Analyze Channel →
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {/* COMPETITORS */}
          {activeTab === "competitors" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {!hasLargerCompetitors && baseSubs > 1000000 ? (
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-8 space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-4 h-4 text-zinc-400" />
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Niche Dominance Established</span>
                  </div>
                  <h3 className="text-base font-semibold text-white">Undisputed Market Leader</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed max-w-xl">
                    This channel sits at the absolute peak of its niche subscriber hierarchy. No larger rivals were detected in this keyword space.
                  </p>
                </div>
              ) : competitors.length > 0 ? (
                <>
                  <SectionLabel icon={Trophy}>Niche Rivals Benchmark</SectionLabel>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {competitors.slice(0, 3).map((comp, i) => (
                      <div key={i} className="bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-6 flex flex-col justify-between transition-colors relative overflow-hidden">
                        <div className="absolute top-3 right-3">
                          <Badge>{comp.matchType || "RIVAL"}</Badge>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 pr-16">
                            <img
                              src={comp.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=50&q=80"}
                              className="w-9 h-9 rounded-full border border-zinc-800 object-cover"
                              alt=""
                            />
                            <div>
                              <h5 className="text-sm font-medium text-white leading-snug">{comp.title}</h5>
                              <p className="text-[10px] text-zinc-600 font-mono">{comp.custom_url || "YouTube Channel"}</p>
                            </div>
                          </div>
                          {comp.matchReason && (
                            <p className="text-xs text-zinc-500 italic">"{comp.matchReason}"</p>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-zinc-900 text-center">
                          {[
                            { label: "Subs", value: formatNumber(comp.statistics?.subscriberCount) },
                            { label: "Views", value: formatNumber(comp.statistics?.viewCount) },
                            { label: "Videos", value: formatNumber(comp.statistics?.videoCount) },
                          ].map((s, j) => (
                            <div key={j}>
                              <p className="text-[9px] text-zinc-600 uppercase tracking-wider">{s.label}</p>
                              <p className="text-xs font-medium text-white mt-0.5">{s.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-white mb-1">Live Format Comparison</h4>
                      <p className="text-xs text-zinc-500 leading-relaxed max-w-md">
                        Upgrade to <span className="font-logo font-black uppercase tracking-tight mr-0.5">Svay</span> Pro to overlay competitor upload schedules, compare thumbnails side-by-side, and map video structures.
                      </p>
                    </div>
                    <Link
                      href="/"
                      className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-medium text-zinc-300 transition-colors shrink-0 inline-flex items-center gap-1.5"
                    >
                      Compare Formats <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </>
              ) : (
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-12 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                    <Trophy className="w-5 h-5 text-zinc-600" />
                  </div>
                  <h3 className="text-sm font-medium text-white mb-2">No rivals data found</h3>
                  <p className="text-zinc-500 text-xs max-w-xs mb-6 leading-relaxed">
                    Connecting your channel triggers automatic competitor discovery and benchmarks.
                  </p>
                  <Link href="/" className="px-4 py-2 bg-white text-black rounded-lg text-xs font-medium hover:bg-zinc-200 transition-colors">
                    Connect Channel →
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {/* PROJECTIONS */}
          {activeTab === "projections" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
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

                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: "Predicted Subs (30D)", value: `+${formatNumber(subVelocity * 0.7)} — +${formatNumber(subVelocity * 1.4)}` },
                        { label: "Predicted Views (30D)", value: `+${formatNumber(base30DViews)} — +${formatNumber(opt30DViews)}` },
                        { label: "Monetization", value: isMonetized ? "ACTIVE" : "PENDING" },
                        { label: "Est. Revenue (30D)", value: isMonetized ? `$${formatNumber(revMin)} — $${formatNumber(revMax)}` : "—" },
                      ].map((p, i) => (
                        <div key={i} className="bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-5 transition-colors">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium mb-2">{p.label}</p>
                          <p className="text-lg font-semibold text-white tracking-tight">{p.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 md:p-10">
                      <SectionLabel icon={TrendingUp}>Revenue Projection (30 Days)</SectionLabel>
                      <div className="h-64 mt-4">
                        <RevenueProjectionChart history={history} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6">
                        <SectionLabel icon={TrendingUp}>Growth Velocity Forecast</SectionLabel>
                        <div className="h-56 mt-4">
                          <GrowthChart history={history} />
                        </div>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6">
                        <SectionLabel icon={Users}>Subscriber Acquisition</SectionLabel>
                        <div className="h-56 mt-4">
                          <SubsChangeChart history={history} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Lock className="w-3.5 h-3.5 text-zinc-500" />
                          <h4 className="text-sm font-medium text-white">Interactive Simulations Locked</h4>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed max-w-md">
                          Upgrade to Pro to customize CPM rates, run worst-case scenarios, adjust upload frequency, and export data.
                        </p>
                      </div>
                      <Link
                        href="/"
                        className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-medium text-zinc-300 transition-colors shrink-0 inline-flex items-center gap-1.5"
                      >
                        Unlock Sandbox <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* VIDEOS */}
          {activeTab === "videos" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {videos.map((item, i) => (
                <motion.div
                  key={item.id?.videoId || item.id}
                  initial={{ opacity: 0, y: 8 }}
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

        {/* ── Global CTA ───────────────────────────────────── */}
        <section className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-10 md:p-16 text-center space-y-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900 text-[10px] font-medium text-zinc-400 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-logo font-black uppercase tracking-tight mr-0.5">Svay</span> Creator Intelligence
          </div>

          <h2 className="text-3xl md:text-5xl font-semibold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500 tracking-tight leading-none max-w-2xl mx-auto">
            Unlock Real-Time Virality Tracking
          </h2>
          <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">
            Connect your channel in 1-click to track competitors, discover trending keywords, and forecast audience growth.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium text-sm rounded-xl hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-[0_0_24px_rgba(255,255,255,0.12)]"
            >
              Analyze Your Channel <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

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
