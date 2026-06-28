import { NextResponse } from 'next/server';

const mockSearchDatabase = [
  // Tech & AI
  { title: "I Built an AI Agent Team in 24 Hours", channel: "DevCraft", views: 340000, date: "3 days ago", score: 96, category: "Tech", rawDate: 3 },
  { title: "How to Build a Faceless Channel in 2026", channel: "Creator Launch", views: 890000, date: "8 days ago", score: 91, category: "Business", rawDate: 8 },
  { title: "The Next 10 Years of AI: What to Expect", channel: "Future Loop", views: 1200000, date: "15 days ago", score: 88, category: "Tech", rawDate: 15 },
  { title: "My YouTube Shorts Strategy Exposed", channel: "Growth Lab", views: 150000, date: "2 days ago", score: 79, category: "Marketing", rawDate: 2 },
  { title: "React 19 vs Next.js 16: The Ultimate Guide", channel: "CodeCraft", views: 85000, date: "1 day ago", score: 74, category: "Dev", rawDate: 1 },
  { title: "Why I Fired My AI Coder Agents", channel: "Startup CEO", views: 560000, date: "5 days ago", score: 82, category: "SaaS", rawDate: 5 },
  // Finance & Crypto
  { title: "Hyper-inflation Safeguards they aren't telling you", channel: "Gold Guard", views: 600000, date: "4 days ago", score: 96, category: "Finance", rawDate: 4 },
  { title: "DeFi Yield Farming 2026 Tutorial", channel: "Crypto Capital", views: 450000, date: "7 days ago", score: 91, category: "Crypto", rawDate: 7 },
  { title: "How to Build a Portfolio During Inflation", channel: "Wealth Wise", views: 200000, date: "12 days ago", score: 82, category: "Finance", rawDate: 12 },
  // Gaming
  { title: "Next-gen Handheld Consoles Review & Thermals", channel: "Hardware Hub", views: 2100000, date: "6 days ago", score: 99, category: "Gaming", rawDate: 6 },
  { title: "Indie Game Engine Showdown: Godot vs Unity", channel: "Pixel Dev", views: 800000, date: "10 days ago", score: 87, category: "Dev", rawDate: 10 },
  { title: "Retro Gaming Emulator Legal Controversies", channel: "Game Lore", views: 350000, date: "14 days ago", score: 78, category: "Gaming", rawDate: 14 },
  // Fitness & Lifestyle
  { title: "Minimalist Biohacking Morning Routine", channel: "BioHack", views: 1400000, date: "9 days ago", score: 94, category: "Fitness", rawDate: 9 },
  { title: "10-Minute High Intensity Mobility Routine", channel: "Flex Fit", views: 950000, date: "11 days ago", score: 89, category: "Fitness", rawDate: 11 },
  { title: "Dopamine Fasting 2.0: My 3-Day Experiment", channel: "Mind Reset", views: 300000, date: "16 days ago", score: 75, category: "Lifestyle", rawDate: 16 }
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'score';
  
  let results = [...mockSearchDatabase];
  if (query.trim() !== '') {
    const qLower = query.toLowerCase();
    results = mockSearchDatabase.filter(item => 
      item.title.toLowerCase().includes(qLower) ||
      item.channel.toLowerCase().includes(qLower) ||
      item.category.toLowerCase().includes(qLower)
    );
  }
  
  results.sort((a, b) => {
    if (sort === 'score') return b.score - a.score;
    if (sort === 'views') return b.views - a.views;
    if (sort === 'date') return a.rawDate - b.rawDate;
    return 0;
  });
  
  return NextResponse.json(results);
}
