"use client";

import { useState, useEffect } from "react";
import { 
  Search, Zap, Users, Trophy, BookOpen, BarChart3, 
  Flame, TrendingUp, Layers, Sparkles, Rocket, Video, 
  Eye, Target, Plus, Save, PlaySquare, ChevronRight, ChevronLeft,
  Filter, Check, Calendar, TrendingDown, ArrowUpRight, HelpCircle,
  RefreshCw, AlertCircle, Lock, Share2
} from "lucide-react";

export default function DemoDashboard() {
  const [activeTab, setActiveTab] = useState("radar"); // search, radar, competitors, analytics, library
  
  // Search tab states
  const [searchQuery, setSearchQuery] = useState("AI video");
  const [isSearching, setIsSearching] = useState(false);
  const [searchSort, setSearchSort] = useState("score"); // score, views, date
  const [searchResults, setSearchResults] = useState([]);

  // Trends Tab states
  const [trendData, setTrendData] = useState([]);
  const [quickWins, setQuickWins] = useState([]);
  const [videoIdeas, setVideoIdeas] = useState([]);
  const [radarOverview, setRadarOverview] = useState({
    viralPotential: "High",
    marketMomentum: "Hot",
    trendingTopics: 12,
    summary: "The SaaS & Tech content landscape is showing strong growth. High audience engagement and low competitor coverage create a strong gap for structured explainer formats."
  });
  const [isLoadingRadar, setIsLoadingRadar] = useState(false);

  // Competitor tab states
  const [competitors, setCompetitors] = useState([]);
  const [newCompName, setNewCompName] = useState("");
  const [showCompModal, setShowCompModal] = useState(false);

  // Library tab states
  const [selectedNote, setSelectedNote] = useState(0);
  const [notes, setNotes] = useState([]);
  const [saveStatus, setSaveStatus] = useState("Saved");

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Static mock benchmarks for Radar View (using high-quality images)
  const videoCards = [
    {
      snippet: {
        title: "I Tried AI Video Editors for 30 Days",
        channelTitle: "Tech Insights",
        publishedAt: "2025-01-10T10:00:00Z",
        description: "Are AI video editors actually worth it? Let's find out.",
        thumbnails: { medium: { url: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&q=80" } }
      },
      stats: { dailyViews: 12500, engagement: 8.4, score: 94, level: "HOT" },
      color: "255, 79, 109"
    },
    {
      snippet: {
        title: "The TRUTH About Faceless Channels",
        channelTitle: "Creator Hub",
        publishedAt: "2025-02-05T10:00:00Z",
        description: "Breaking down the actual revenue and effort required.",
        thumbnails: { medium: { url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80" } }
      },
      stats: { dailyViews: 8500, engagement: 6.2, score: 88, level: "GROWING" },
      color: "200, 241, 53"
    }
  ];

  // 1. Load Trends (Radar) from Backend API
  useEffect(() => {
    if (activeTab === "radar") {
      setIsLoadingRadar(true);
      fetch('/api/landing/trends?niche=SaaS & Tech')
        .then(res => res.json())
        .then(data => {
          setTrendData(data.insights.emergingTrends);
          setQuickWins(data.insights.quickWins);
          setVideoIdeas(data.insights.videoIdeas);
          setRadarOverview(data.insights.overview);
          setIsLoadingRadar(false);
        })
        .catch(err => {
          console.error("Error fetching trends from API", err);
          setIsLoadingRadar(false);
        });
    }
  }, [activeTab]);

  // 2. Load Search results from Backend API
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    
    fetch(`/api/landing/youtube-search?q=${encodeURIComponent(searchQuery)}&sort=${searchSort}`)
      .then(res => res.json())
      .then(data => {
        setSearchResults(data);
        setIsSearching(false);
      })
      .catch(err => {
        console.error("Error searching", err);
        setIsSearching(false);
      });
  };

  useEffect(() => {
    if (activeTab === "search") {
      handleSearchSubmit();
    }
  }, [searchSort, activeTab]);

  // 3. Load Competitors from Backend API
  const loadCompetitors = () => {
    fetch('/api/landing/competitors')
      .then(res => res.json())
      .then(data => setCompetitors(data))
      .catch(err => console.error("Error loading competitors", err));
  };

  useEffect(() => {
    if (activeTab === "competitors") {
      loadCompetitors();
    }
  }, [activeTab]);

  const addCompetitor = (e) => {
    e.preventDefault();
    if (!newCompName.trim()) return;
    
    fetch('/api/landing/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCompName })
    })
      .then(res => res.json())
      .then(data => {
        setCompetitors(data);
        setNewCompName("");
        setShowCompModal(false);
      })
      .catch(err => console.error("Error adding competitor", err));
  };

  // 4. Load Analytics from Backend API
  useEffect(() => {
    if (activeTab === "analytics") {
      setIsLoadingAnalytics(true);
      fetch('/api/landing/analytics')
        .then(res => res.json())
        .then(data => {
          setAnalyticsData(data);
          setIsLoadingAnalytics(false);
        })
        .catch(err => {
          console.error("Error loading analytics", err);
          setIsLoadingAnalytics(false);
        });
    }
  }, [activeTab]);

  // 5. Load Library Notes from Backend API
  const loadNotes = () => {
    fetch('/api/landing/library')
      .then(res => res.json())
      .then(data => setNotes(data))
      .catch(err => console.error("Error loading notes from API", err));
  };

  useEffect(() => {
    if (activeTab === "library") {
      loadNotes();
    }
  }, [activeTab]);

  const saveNotesToServer = (updatedNotes) => {
    setSaveStatus("Saving...");
    fetch('/api/landing/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedNotes)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSaveStatus("Saved");
        }
      })
      .catch(err => {
        console.error("Error saving notes to API", err);
        setSaveStatus("Error");
      });
  };

  const handleNoteChange = (e) => {
    const updatedNotes = [...notes];
    updatedNotes[selectedNote].content = e.target.value;
    setNotes(updatedNotes);
    saveNotesToServer(updatedNotes);
  };

  const handleNoteTitleChange = (e) => {
    const updatedNotes = [...notes];
    updatedNotes[selectedNote].title = e.target.value;
    setNotes(updatedNotes);
    saveNotesToServer(updatedNotes);
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num;
  };

  return (
    <div className="flex flex-col relative w-full border border-zinc-800/80 rounded-[20px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.02)] bg-black z-10">
      {/* macOS Safari Style Title Bar (Tailwind styling) */}
      <div className="flex items-center justify-between h-12 bg-[#09090b] border-b border-zinc-900 px-4 select-none relative z-50">
        {/* Left: Window Dots + Navigation arrows */}
        <div className="flex items-center gap-5 w-[100px] sm:w-[120px] shrink-0">
          <div className="flex gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]"></span>
          </div>
          <div className="hidden sm:flex items-center gap-2.5">
            <ChevronLeft className="w-3.5 h-3.5 text-zinc-500 hover:text-white transition-colors cursor-pointer" />
            <ChevronRight className="w-3.5 h-3.5 text-zinc-700 cursor-not-allowed" />
          </div>
        </div>
        
        {/* Center: URL address bar container */}
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 border border-zinc-800 bg-black/60 rounded-lg font-mono text-[10px] tracking-wide max-w-[180px] xs:max-w-[240px] sm:max-w-[340px] w-full">
          <Lock className="w-2.5 h-2.5 text-brand-mint shrink-0" />
          <div className="flex items-center gap-1 mx-auto overflow-hidden truncate">
            <span className="text-zinc-300">app.vyron.ai</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400">console</span>
            <span className="text-zinc-600">/</span>
            <span className="text-brand-volt font-bold">{activeTab}</span>
          </div>
          <RefreshCw className="w-2.5 h-2.5 text-zinc-500 hover:text-white transition-colors cursor-pointer shrink-0" />
        </div>

        {/* Right: Safari icons (Share, New tab, Switcher) */}
        <div className="flex items-center gap-4 w-[100px] sm:w-[120px] shrink-0 justify-end hidden sm:flex">
          <Share2 className="w-3.5 h-3.5 text-zinc-500 hover:text-white transition-colors cursor-pointer" />
          <Plus className="w-3.5 h-3.5 text-zinc-500 hover:text-white transition-colors cursor-pointer" />
          <Layers className="w-3.5 h-3.5 text-zinc-500 hover:text-white transition-colors cursor-pointer" />
        </div>
      </div>
      
      {/* Dashboard container */}
      <div className="demo-body flex flex-col md:flex-row h-[680px] md:h-[780px] overflow-hidden bg-black text-white font-sans text-left">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-zinc-900 bg-zinc-950 flex flex-row md:flex-col justify-between shrink-0 md:h-full">
          {/* Sidebar Top: Logo info */}
          <div className="p-5 hidden md:flex items-center gap-2.5 border-b border-zinc-900/50">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-volt to-brand-mint p-[1px]">
              <div className="w-full h-full bg-black rounded-[6px] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-brand-volt" />
              </div>
            </div>
            <span className="font-display font-extrabold text-sm tracking-wider text-white">VYRON CORES</span>
          </div>

          {/* Nav List */}
          <nav className="flex flex-row md:flex-col flex-1 p-2 md:p-3 gap-1 md:gap-0.5 mt-0 md:mt-2 overflow-x-auto md:overflow-x-visible no-scrollbar">
            <div className="hidden md:block pb-2 px-3">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Intelligence</p>
            </div>
            
            <button 
              onClick={() => setActiveTab("search")}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-all relative shrink-0 ${
                activeTab === "search" ? "text-white bg-zinc-900 border border-zinc-800" : "text-zinc-500 hover:text-white hover:bg-zinc-900/50 border border-transparent"
              }`}
            >
              {activeTab === "search" && <div className="absolute left-0 w-[2.5px] h-3 bg-brand-volt rounded-full hidden md:block" />}
              <Search className={`w-4 h-4 ${activeTab === "search" ? "text-brand-volt" : ""}`} strokeWidth={2.2} /> Search
            </button>

            <button 
              onClick={() => setActiveTab("radar")}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-all relative shrink-0 ${
                activeTab === "radar" ? "text-white bg-zinc-900 border border-zinc-800" : "text-zinc-500 hover:text-white hover:bg-zinc-900/50 border border-transparent"
              }`}
            >
              {activeTab === "radar" && <div className="absolute left-0 w-[2.5px] h-3 bg-brand-volt rounded-full hidden md:block" />}
              <Zap className={`w-4 h-4 ${activeTab === "radar" ? "text-brand-volt" : ""}`} strokeWidth={2.2} /> Trend Radar
            </button>

            <button 
              onClick={() => setActiveTab("competitors")}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-all relative shrink-0 ${
                activeTab === "competitors" ? "text-white bg-zinc-900 border border-zinc-800" : "text-zinc-500 hover:text-white hover:bg-zinc-900/50 border border-transparent"
              }`}
            >
              {activeTab === "competitors" && <div className="absolute left-0 w-[2.5px] h-3 bg-brand-volt rounded-full hidden md:block" />}
              <Trophy className={`w-4 h-4 ${activeTab === "competitors" ? "text-brand-volt" : ""}`} strokeWidth={2.2} /> Rivals Matrix
            </button>

            <button 
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-all relative shrink-0 ${
                activeTab === "analytics" ? "text-white bg-zinc-900 border border-zinc-800" : "text-zinc-500 hover:text-white hover:bg-zinc-900/50 border border-transparent"
              }`}
            >
              {activeTab === "analytics" && <div className="absolute left-0 w-[2.5px] h-3 bg-brand-volt rounded-full hidden md:block" />}
              <BarChart3 className={`w-4 h-4 ${activeTab === "analytics" ? "text-brand-volt" : ""}`} strokeWidth={2.2} /> Analytics
            </button>

            <button 
              onClick={() => setActiveTab("library")}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-all relative shrink-0 ${
                activeTab === "library" ? "text-white bg-zinc-900 border border-zinc-800" : "text-zinc-500 hover:text-white hover:bg-zinc-900/50 border border-transparent"
              }`}
            >
              {activeTab === "library" && <div className="absolute left-0 w-[2.5px] h-3 bg-brand-volt rounded-full hidden md:block" />}
              <BookOpen className={`w-4 h-4 ${activeTab === "library" ? "text-brand-volt" : ""}`} strokeWidth={2.2} /> Library notes
            </button>
          </nav>

          {/* Sidebar Bottom: Connected status */}
          <div className="hidden md:flex p-4 border-t border-zinc-900 bg-zinc-950/60 mt-auto flex-col gap-2">
            <div className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3 flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-brand-volt/10 border border-brand-volt/20 flex items-center justify-center text-[10px] font-black text-brand-volt">PRO</div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-white uppercase tracking-wider truncate">Tech Insights</p>
                <p className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-widest flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-brand-volt" /> Live tracking</p>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN PANEL CONTENT WINDOW */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto bg-black">
          
          {/* 1. SEARCH TAB PANEL */}
          {activeTab === "search" && (
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                <div>
                  <h3 className="font-display font-extrabold text-xl text-white">SEARCH VIRALITY INDEX</h3>
                  <p className="text-[11px] text-zinc-500">Query YouTube database and sort by core virality metric scores</p>
                </div>
              </div>

              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter keywords, niches, categories (e.g. AI video, coding, shorts)..."
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-850 focus:border-brand-volt/35 focus:ring-1 focus:ring-brand-volt/20 rounded-xl text-xs text-white focus:outline-none placeholder-zinc-650"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-6 bg-brand-volt hover:bg-[#d6fb3a] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5"
                >
                  {isSearching ? <span className="animate-spin text-sm">↻</span> : "Search"}
                </button>
              </form>

              <div className="flex items-center justify-between border-y border-zinc-900/60 py-3 text-xs">
                <span className="text-zinc-500">Found {searchResults.length} indexed database entries</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Sort metrics by:</span>
                  <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-0.5 flex gap-1">
                    {['score', 'views', 'date'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSearchSort(type)}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${
                          searchSort === type 
                            ? "bg-zinc-900 text-white border border-zinc-800" 
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {isSearching ? (
                  <div className="py-16 text-center text-zinc-500 flex flex-col items-center gap-2">
                    <span className="animate-spin text-2xl text-brand-volt">↻</span>
                    <p className="text-[11px] font-black uppercase tracking-widest text-brand-volt">Filtering database indices...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-16 text-center text-zinc-500 flex flex-col items-center gap-2">
                    <p className="text-xs uppercase font-extrabold tracking-wider">No matching indices found</p>
                    <p className="text-[10px] text-zinc-650 max-w-xs">Try searching for generic tech words, "AI", "SaaS", "Shorts" or "Coding".</p>
                  </div>
                ) : (
                  searchResults.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 rounded-xl border border-zinc-900/80 bg-zinc-950/40 hover:border-zinc-800/80 hover:bg-zinc-950/80 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 truncate flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-brand-volt bg-brand-volt/10 border border-brand-volt/20 px-2 py-0.5 rounded uppercase">{item.category}</span>
                          <span className="text-[10px] text-zinc-500 font-mono truncate">Channel: {item.channel}</span>
                        </div>
                        <h4 className="text-xs md:text-sm font-bold text-white truncate">{item.title}</h4>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono">
                          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {formatNumber(item.views)} views</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {item.date}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-3">
                        <div className="flex flex-col items-end">
                          <span className="text-xl font-display font-extrabold text-white text-glow-volt">{item.score}</span>
                          <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Virality Score</span>
                        </div>
                        <button className="p-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-450 hover:text-white rounded-lg transition-colors">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 2. TRENDS (RADAR) TAB PANEL */}
          {activeTab === "radar" && (
            <div className="p-6 md:p-8 space-y-8">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                <div>
                  <h3 className="font-display font-extrabold text-xl text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-brand-volt" /> TREND RADAR
                  </h3>
                  <p className="text-[11px] text-zinc-500">Real-time scan outputs and quick blueprints for trending keywords</p>
                </div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest hidden sm:inline">Last scan: Just now</span>
              </div>

              {isLoadingRadar ? (
                <div className="py-24 text-center text-zinc-500 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 text-brand-volt animate-spin" />
                  <p className="text-xs uppercase font-extrabold tracking-widest text-brand-volt">Running API scans...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <Flame className="w-4 h-4 text-brand-rose" />
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Niche Velocity</span>
                      </div>
                      <p className="text-2xl font-bold tracking-tight">{radarOverview.viralPotential ? radarOverview.viralPotential.toUpperCase() : "HIGH"}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-brand-mint" />
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Search Spike avg</span>
                      </div>
                      <p className="text-2xl font-bold tracking-tight">{radarOverview.marketMomentum === 'Hot' ? '+24.6% today' : '+18.2% today'}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <Layers className="w-4 h-4 text-zinc-400" />
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Database records</span>
                      </div>
                      <p className="text-2xl font-bold tracking-tight">2,485 Scrapes</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7 space-y-6">
                      <div className="flex items-center gap-2 text-zinc-400 font-bold text-xs uppercase tracking-wider">
                        <Sparkles className="w-4 h-4" /> Emerging Keyword Trends
                      </div>
                      <div className="space-y-3.5">
                        {trendData.map((trend, i) => (
                          <div key={i} className="group p-5 rounded-2xl bg-zinc-950/30 border border-zinc-900/80 hover:bg-zinc-950/60 transition-all flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-white group-hover:text-brand-volt transition-colors">
                                    {trend.topic}
                                  </h4>
                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded bg-zinc-900 uppercase ${trend.momentum === 'hot' ? 'text-brand-rose' : 'text-brand-mint'}`}>
                                    {trend.momentum}
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-500 leading-snug">{trend.opportunity}</p>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="text-lg font-display font-extrabold text-white">{trend.viralScore}</p>
                                  <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Score</p>
                                </div>
                                <button className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-450 hover:text-white transition-all">
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-500 pt-1 border-t border-zinc-900/40">
                              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {trend.estimatedViews} views</span>
                              <span>•</span>
                              <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> {trend.difficulty} difficulty</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="lg:col-span-5 space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-zinc-400 font-bold text-xs uppercase tracking-wider">
                          <Zap className="w-4 h-4" /> Quick Wins Blueprint
                        </div>
                        <div className="space-y-3">
                          {quickWins.map((win, i) => (
                            <div key={i} className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 transition-all flex flex-col gap-3">
                              <div className="flex justify-between items-start gap-2">
                                <div className="space-y-1">
                                  <h4 className="text-xs font-bold text-zinc-200">{win.idea}</h4>
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                                    win.effort === 'low' 
                                      ? 'bg-brand-mint/10 text-brand-mint border-brand-mint/20' 
                                      : 'bg-brand-volt/10 text-brand-volt border-brand-volt/20'
                                  }`}>
                                    {win.effort} Effort
                                  </span>
                                </div>
                                <button className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-500 hover:text-white">
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-[10px] text-zinc-500 leading-relaxed italic border-l-2 border-zinc-800 pl-3">
                                "{win.why}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-zinc-400 font-bold text-xs uppercase tracking-wider">
                          <Video className="w-4 h-4" /> Benchmark Performance
                        </div>
                        <div className="space-y-3">
                          {videoCards.map((video, i) => (
                            <div 
                              key={i}
                              className="group border p-3 rounded-xl bg-zinc-950/40 hover:bg-zinc-950/80 border-zinc-900 hover:border-zinc-800 transition-all flex gap-3.5"
                            >
                              <div className="w-20 h-14 rounded-lg overflow-hidden bg-zinc-900 shrink-0 relative">
                                <img 
                                  src={video.snippet.thumbnails.medium.url} 
                                  alt="" 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                />
                                <div className="absolute bottom-1 left-1 bg-black/80 px-1 py-0.5 rounded text-[7px] font-black text-brand-volt">
                                  {video.stats.level}
                                </div>
                              </div>

                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <h5 className="font-bold text-xs text-white truncate leading-tight group-hover:text-brand-volt transition-colors">
                                  {video.snippet.title}
                                </h5>
                                <p className="text-[9px] text-zinc-500 font-mono">
                                  Daily Views: <span className="text-white font-bold">{video.stats.dailyViews}</span>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 3. COMPETITORS TAB PANEL */}
          {activeTab === "competitors" && (
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                <div>
                  <h3 className="font-display font-extrabold text-xl text-white">COMPETITOR MATRIX</h3>
                  <p className="text-[11px] text-zinc-500">Benchmark your parameters with direct and rising niche competitors</p>
                </div>
                
                <button
                  onClick={() => setShowCompModal(true)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-brand-volt" /> Add Rival
                </button>
              </div>

              {showCompModal && (
                <div className="p-4 rounded-xl border border-brand-volt/25 bg-zinc-950/95 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-brand-volt flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Scrape new channel index</h4>
                  <form onSubmit={addCompetitor} className="flex gap-2">
                    <input
                      type="text"
                      value={newCompName}
                      onChange={(e) => setNewCompName(e.target.value)}
                      placeholder="Enter YouTube Channel URL or Name..."
                      className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 focus:border-brand-volt/30 rounded-xl text-xs text-white focus:outline-none"
                    />
                    <button type="submit" className="px-4 bg-brand-volt hover:bg-[#d6fb3a] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md">Scrape</button>
                    <button type="button" onClick={() => setShowCompModal(false)} className="px-3 bg-zinc-900 text-zinc-400 hover:text-white rounded-xl text-xs transition-colors">Cancel</button>
                  </form>
                </div>
              )}

              <div className="border border-zinc-900 rounded-2xl overflow-hidden bg-zinc-950/40">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-950 border-b border-zinc-900 font-mono text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        <th className="p-4">Channel Name</th>
                        <th className="p-4">Subscribers</th>
                        <th className="p-4">Avg Views/Video</th>
                        <th className="p-4">Growth Velocity</th>
                        <th className="p-4">Efficiency</th>
                        <th className="p-4">Content DNA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/60">
                      {competitors.map((comp, idx) => (
                        <tr key={idx} className="hover:bg-zinc-950/80 transition-colors">
                          <td className="p-4 font-bold text-white flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-volt" />
                            {comp.name}
                          </td>
                          <td className="p-4 font-mono text-zinc-300">{comp.subs}</td>
                          <td className="p-4 font-mono text-zinc-300">{comp.avgViews}</td>
                          <td className="p-4 font-bold">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                              comp.velocity && comp.velocity.includes("Surging") 
                                ? "text-brand-mint bg-brand-mint/10" 
                                : comp.velocity && comp.velocity.includes("Declining")
                                  ? "text-brand-rose bg-brand-rose/10"
                                  : "text-zinc-500 bg-zinc-900"
                            }`}>
                              {comp.velocity}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-white">{comp.efficiency}</td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {comp.dna && comp.dna.map((d, i) => (
                                <span key={i} className="text-[9px] font-mono font-bold text-zinc-500 border border-zinc-900 px-1.5 py-0.5 rounded bg-zinc-950">{d}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. ANALYTICS TAB PANEL */}
          {activeTab === "analytics" && (
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                <div>
                  <h3 className="font-display font-extrabold text-xl text-white">CHANNEL ANALYTICS</h3>
                  <p className="text-[11px] text-zinc-500">Live snapshot vectors and predicted progress graphs</p>
                </div>
                <span className="text-[10px] text-brand-mint font-bold uppercase tracking-widest bg-brand-mint/10 px-2.5 py-1 rounded">API LINKED</span>
              </div>

              {isLoadingAnalytics || !analyticsData ? (
                <div className="py-24 text-center text-zinc-550 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 text-brand-volt animate-spin" />
                  <p className="text-xs uppercase font-extrabold tracking-widest text-brand-volt">Loading Trajectory Metrics...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-zinc-950/50 border border-zinc-900 p-4 rounded-xl">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Subscriber total</p>
                      <p className="text-xl font-bold">{formatNumber(analyticsData.overview.subscribers)}</p>
                      <p className="text-[10px] text-brand-mint font-bold mt-0.5">{analyticsData.overview.subscribersGrowth}</p>
                    </div>
                    <div className="bg-zinc-950/50 border border-zinc-900 p-4 rounded-xl">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Video uploads</p>
                      <p className="text-xl font-bold">{analyticsData.overview.videoUploads}</p>
                      <p className="text-[10px] text-zinc-500 font-bold mt-0.5">{analyticsData.overview.videoUploadsGrowth}</p>
                    </div>
                    <div className="bg-zinc-950/50 border border-zinc-900 p-4 rounded-xl">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total views</p>
                      <p className="text-xl font-bold">{formatNumber(analyticsData.overview.totalViews)}</p>
                      <p className="text-[10px] text-brand-volt font-bold mt-0.5">{analyticsData.overview.totalViewsGrowth}</p>
                    </div>
                    <div className="bg-zinc-950/50 border border-zinc-900 p-4 rounded-xl">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Growth projection</p>
                      <p className="text-xl font-bold">{analyticsData.overview.growthProjection}</p>
                      <p className="text-[10px] text-brand-volt font-bold mt-0.5">{analyticsData.overview.growthProjectionGrowth}</p>
                    </div>
                  </div>

                  <div className="p-5 border border-zinc-900 rounded-2xl bg-zinc-950/20">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">30-Day Trajectory Vectors</span>
                      <span className="text-[10px] font-mono text-zinc-400">Peak: 12.5K/day</span>
                    </div>
                    <div className="relative h-44 w-full">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(200, 241, 53, 0.25)" />
                            <stop offset="100%" stopColor="rgba(200, 241, 53, 0)" />
                          </linearGradient>
                        </defs>
                        <path 
                          d="M 0 90 Q 50 70 100 80 T 200 45 T 300 55 T 400 20 T 500 10 L 500 100 L 0 100 Z" 
                          fill="url(#chartGlow)"
                        />
                        <path 
                          d="M 0 90 Q 50 70 100 80 T 200 45 T 300 55 T 400 20 T 500 10" 
                          fill="none" 
                          stroke="var(--color-brand-volt)" 
                          strokeWidth="2.5"
                        />
                        <circle cx="200" cy="45" r="4.5" fill="var(--color-brand-volt)" stroke="black" strokeWidth="1.5" className="animate-pulse" />
                        <circle cx="400" cy="20" r="4.5" fill="var(--color-brand-volt)" stroke="black" strokeWidth="1.5" className="animate-pulse" />
                      </svg>
                      
                      <div className="absolute inset-x-0 bottom-[10%] h-[1px] bg-zinc-900 border-dashed" />
                      <div className="absolute inset-x-0 bottom-[50%] h-[1px] bg-zinc-900 border-dashed" />
                      <div className="absolute inset-x-0 bottom-[90%] h-[1px] bg-zinc-900 border-dashed" />
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 pt-3 border-t border-zinc-900/50">
                      <span>Day 1</span>
                      <span>Day 10</span>
                      <span>Day 20</span>
                      <span>Day 30 (Today)</span>
                    </div>
                  </div>

                  <div className="p-5 border border-zinc-900 rounded-2xl bg-zinc-950/40 space-y-4">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Core Milestones Tracking</span>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-zinc-300">
                        <span>Goal: {analyticsData.milestone.goal}</span>
                        <span>{analyticsData.milestone.progressPercent}% Done (Current: {analyticsData.milestone.current})</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                        <div className="h-full bg-brand-volt rounded-full" style={{ width: `${analyticsData.milestone.progressPercent}%` }} />
                      </div>
                      <p className="text-[10px] text-zinc-500">Projected target reached on: <strong className="text-white">{analyticsData.milestone.targetDate}</strong> based on recent velocity growth vectors.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 5. LIBRARY NOTES TAB PANEL */}
          {activeTab === "library" && (
            <div className="flex flex-col md:flex-row h-full">
              
              {/* Notes List Column */}
              <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-zinc-900 flex flex-col shrink-0">
                <div className="p-4 border-b border-zinc-900/50 flex justify-between items-center">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">SAVED BLUEPRINTS</span>
                  <button 
                    onClick={() => {
                      const newNote = { title: "Untitled strategy note", content: "", date: new Date().toISOString().split('T')[0] };
                      const updated = [newNote, ...notes];
                      setNotes(updated);
                      setSelectedNote(0);
                      saveNotesToServer(updated);
                    }}
                    className="p-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {notes.map((note, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedNote(idx)}
                      className={`w-full text-left p-3 rounded-xl transition-all border flex flex-col gap-1.5 ${
                        selectedNote === idx 
                          ? "bg-zinc-900 border-zinc-800 text-white font-bold" 
                          : "bg-transparent border-transparent text-zinc-455 hover:bg-zinc-900/30 hover:text-zinc-200"
                      }`}
                    >
                      <span className="text-[11px] leading-snug truncate w-full">{note.title || "Untitled Note"}</span>
                      <span className="text-[8px] font-mono text-zinc-500">{note.date}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Note Editor window */}
              <div className="flex-1 flex flex-col h-full bg-zinc-950/20">
                <div className="px-5 py-3 border-b border-zinc-900 bg-zinc-950/40 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Save className="w-3.5 h-3.5 text-zinc-550" /> Status: <strong className={`${saveStatus === 'Saving...' ? 'text-brand-volt' : 'text-brand-mint'}`}>{saveStatus}</strong>
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500">Edit Mode (Markdown enabled)</span>
                </div>

                <div className="p-6 flex-1 flex flex-col gap-4">
                  <input
                    type="text"
                    value={notes[selectedNote]?.title || ""}
                    onChange={handleNoteTitleChange}
                    placeholder="Strategy note title..."
                    className="w-full bg-transparent border-b border-zinc-900/60 focus:border-brand-volt/25 text-white font-display font-extrabold text-base md:text-lg focus:outline-none pb-2 placeholder-zinc-700"
                  />
                  <textarea
                    value={notes[selectedNote]?.content || ""}
                    onChange={handleNoteChange}
                    placeholder="Write down keywords, niche comparisons, script summaries or video blueprints..."
                    className="w-full flex-1 bg-transparent text-xs text-zinc-300 focus:outline-none resize-none font-mono leading-relaxed placeholder-zinc-700"
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>


    </div>
  );
}
