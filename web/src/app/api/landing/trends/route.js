import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const niche = searchParams.get('niche') || 'SaaS & Tech';
  
  const data = getTrendsForNiche(niche);
  return NextResponse.json(data);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const niche = body.niche || 'SaaS & Tech';
    const data = getTrendsForNiche(niche);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

function getTrendsForNiche(niche) {
  const base = {
    summary: { totalVideosAnalyzed: 2485 },
    insights: {
      overview: {
        viralPotential: 'High',
        marketMomentum: 'Hot',
        trendingTopics: 12,
        summary: `The ${niche} content landscape is showing strong growth. High audience engagement and low competitor coverage create a strong gap for structured explainer formats.`
      },
      quickWins: [],
      emergingTrends: [],
      videoIdeas: []
    }
  };

  if (niche === 'Finance & Crypto') {
    base.insights.quickWins = [
      { idea: "How to Build a Portfolio During Inflation", effort: "low", why: "Competitors missing simplified entry guides." },
      { idea: "Crypto Arbitrage Strategies 2026", effort: "medium", why: "High search volume, lack of verified proofs." }
    ];
    base.insights.emergingTrends = [
      { topic: "Hyper-inflation Safeguards", viralScore: 96, momentum: "hot", difficulty: "hard", opportunity: "Exploit global market anxiety", estimatedViews: "600K" },
      { topic: "DeFi Yield Farming 2026", viralScore: 91, momentum: "rising", difficulty: "medium", opportunity: "New layer-2 chains launching this month", estimatedViews: "450K" },
      { topic: "Tax Loss Harvesting", viralScore: 82, momentum: "stable", difficulty: "easy", opportunity: "Evergreen year-end topic", estimatedViews: "200K" }
    ];
    base.insights.videoIdeas = [
      { title: "I Spent 30 Days Crypto Arbitrage Trading", description: "A realistic review of crypto arbitrage strategies.", predictedViews: "450K", difficulty: "Hard" },
      { title: "Inflation-Proof Your Money: 3 Simple Steps", description: "Beginner-friendly wealth preservation guidelines.", predictedViews: "580K", difficulty: "Easy" }
    ];
  } else if (niche === 'Gaming & Tech') {
    base.insights.quickWins = [
      { idea: "Steam Deck vs Competitors in 2026", effort: "low", why: "High search spikes after recent hardware leak." },
      { idea: "Building a Game in 1 Hour with AI", effort: "low", why: "Low-effort click-magnet." }
    ];
    base.insights.emergingTrends = [
      { topic: "Next-gen Handheld Consoles", viralScore: 99, momentum: "hot", difficulty: "easy", opportunity: "Unboxing and thermal test reviews", estimatedViews: "2.1M" },
      { topic: "Indie Game Engine Showdown", viralScore: 87, momentum: "rising", difficulty: "medium", opportunity: "Godot 4.5 upgrades releasing this week", estimatedViews: "800K" },
      { topic: "Retro Gaming Emulator legal updates", viralScore: 78, momentum: "stable", difficulty: "hard", opportunity: "Niche news discussion", estimatedViews: "350K" }
    ];
    base.insights.videoIdeas = [
      { title: "Godot 4.5 is officially a Unity Killer", description: "Analyzing the new rendering upgrades and benchmark results.", predictedViews: "920K", difficulty: "Medium" },
      { title: "I Built a Flappy Bird Clone in 15 Minutes", description: "Testing the game building speeds using generative coding agents.", predictedViews: "1.1M", difficulty: "Easy" }
    ];
  } else if (niche === 'Fitness & Lifestyle') {
    base.insights.quickWins = [
      { idea: "Desk Stretches for Remote Workers", effort: "low", why: "Viral momentum on TikTok translating to YouTube search." },
      { idea: "3-Ingredient High-Protein Meals", effort: "low", why: "Quick-wins for shorts and reels." }
    ];
    base.insights.emergingTrends = [
      { topic: "Minimalist Biohacking Routines", viralScore: 94, momentum: "hot", difficulty: "medium", opportunity: "Simple sleep and morning hacks", estimatedViews: "1.4M" },
      { topic: "10-Minute High Intensity Mobility", viralScore: 89, momentum: "rising", difficulty: "easy", opportunity: "At-home routine with no gear", estimatedViews: "950K" },
      { topic: "Dopamine Fasting 2.0", viralScore: 75, momentum: "stable", difficulty: "hard", opportunity: "Scientific review of digital detoxes", estimatedViews: "300K" }
    ];
    base.insights.videoIdeas = [
      { title: "I dopamined fasted for 72 hours (scientific results)", description: "A realistic biological review of digital detoxes.", predictedViews: "340K", difficulty: "Hard" },
      { title: "The ultimate 10-minute posture routine", description: "Short, crisp stretching routine for desk workers.", predictedViews: "890K", difficulty: "Easy" }
    ];
  } else {
    // SaaS & Tech
    base.insights.quickWins = [
      { idea: "Top 5 AI Video Generators", effort: "low", why: "Competitors missing reviews of newest model upgrades." },
      { idea: "Building SaaS with Cursor & Bolt", effort: "medium", why: "High search volume, lack of step-by-step guides." }
    ];
    base.insights.emergingTrends = [
      { topic: "AI Video Editing 2025/2026", viralScore: 98, momentum: "hot", difficulty: "medium", opportunity: "High demand, low competition comparison videos", estimatedViews: "1.2M" },
      { topic: "Faceless YouTube Channels", viralScore: 85, momentum: "growing", difficulty: "hard", opportunity: "Steady growth in automation tech niche", estimatedViews: "850K" },
      { topic: "YouTube Shorts Strategy", viralScore: 72, momentum: "stable", difficulty: "low", opportunity: "Evergreen formatting tips", estimatedViews: "500K" }
    ];
    base.insights.videoIdeas = [
      { title: "I Tried AI Video Editors for 30 Days", description: "Are AI video editors actually worth it? Let's find out.", predictedViews: "1.2M", difficulty: "Medium" },
      { title: "The TRUTH About Faceless Channels", description: "Breaking down the actual revenue and effort required.", predictedViews: "854K", difficulty: "Hard" }
    ];
  }
  
  return base;
}
