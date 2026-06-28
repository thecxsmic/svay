/**
 * Demo Mode Mock Data and Interceptor Helpers
 */

import { cookies } from "next/headers";

// Helper to determine if Demo Mode is active
export async function getIsDemoMode() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get("demo_mode")?.value === "true";
  } catch (e) {
    return false;
  }
}

// User Profile Mock
export const MOCK_USER = {
  $id: "demo-user-id",
  name: "Demo Account",
  email: "demo@vyron.ai",
  imageUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
};

// Mock Channels
export const MOCK_CHANNELS = {
  "UC-techvibeai123": {
    id: "UC-techvibeai123",
    title: "TechVibe AI",
    custom_url: "@techvibe_ai",
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
    statistics: {
      subscriberCount: "124500",
      viewCount: "8945000",
      videoCount: "142"
    }
  },
  "UC-codecraft456": {
    id: "UC-codecraft456",
    title: "CodeCraft Pro",
    custom_url: "@codecraft_pro",
    thumbnail: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=150&q=80",
    statistics: {
      subscriberCount: "458000",
      viewCount: "34800000",
      videoCount: "312"
    }
  },
  "UC-bytesizetech789": {
    id: "UC-bytesizetech789",
    title: "ByteSize Tech",
    custom_url: "@bytesizetech",
    thumbnail: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=150&q=80",
    statistics: {
      subscriberCount: "89200",
      viewCount: "5240000",
      videoCount: "84"
    }
  },
  "UC-algorithmics000": {
    id: "UC-algorithmics000",
    title: "Algorithmics",
    custom_url: "@algorithmics",
    thumbnail: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=150&q=80",
    statistics: {
      subscriberCount: "1250000",
      viewCount: "98200000",
      videoCount: "524"
    }
  }
};

// High-quality, real Unsplash photo IDs related to technology, development, AI, and design
const MOCK_UNSPLASH_IDS = [
  "photo-1542831371-29b0f74f9713", // Code editor closeup
  "photo-1587620962725-abab7fe55159", // Developer setup with neon/led
  "photo-1607799279861-4dd421887fb3", // Hands typing code
  "photo-1555066931-4365d14bab8c", // Colorful code lines
  "photo-1517694712202-14dd9538aa97", // Coding on macbook
  "photo-1531403009284-440f080d1e12", // UI/UX design screen
  "photo-1507238691740-187a5b1d37b8", // Minimal workspace
  "photo-1526374965328-7f61d4dc18c5", // Digital binary code screen
  "photo-1605379399642-870262d3d051", // Triple monitor desk setup
  "photo-1515879218367-8466d910aaa4", // Python code syntax
  "photo-1498050108023-c5249f4df085", // Keyboard and coffee desk
  "photo-1461749280684-dccba630e2f6", // Dev setup coding
  "photo-1618401471353-b98aedd07871", // Git/GitHub workflow on screen
  "photo-1531297484001-80022131f5a1", // Future technology abstract
  "photo-1518770660439-4636190af475", // CPU motherboard tech
  "photo-1629654297299-c8506221ca97", // Shell/terminal console
  "photo-1618005182384-a83a8bd57fbe", // Abstract 3D graphic
  "photo-1633356122544-f134324a6cee", // React code/visuals
  "photo-1618477388954-7852f32655ec", // Coding graphics
  "photo-1623479322729-28b25c16b011", // Code editor visual
  "photo-1607705703571-c5a8695f18f6", // Glowing mechanical keyboard setup
  "photo-1534972195531-d756b9bfa9f2", // Cyber/developer code screen
  "photo-1562813733-b31f71025d54", // Virtual coding interface
  "photo-1550751827-4bd374c3f58b"  // High security network device
];

// Generate Mock Videos for a Channel
export function generateMockVideos(channelId) {
  const channel = MOCK_CHANNELS[channelId] || MOCK_CHANNELS["UC-techvibeai123"];
  const videoIdeas = [
    { title: "Building a Fully Autonomous Coding Agent in 100 Lines", suffix: "of Python" },
    { title: "I Tried 10 Different LLMs for Web Scraping. Here is the Winner.", suffix: "" },
    { title: "The Hidden Cost of Self-Hosting Llama 3 70B", suffix: "(Deep Dive)" },
    { title: "Is Next.js 16 Actually Faster? Benchmarking App Router", suffix: "vs Pages" },
    { title: "How to Build a Custom Vector DB from Scratch", suffix: "" },
    { title: "This New AI Tool Writes Better Code Than Me", suffix: "(Shocking)" },
    { title: "Understanding Cosine Similarity in Vector Search", suffix: "" },
    { title: "Why Webpack is Dead in 2026", suffix: "" },
    { title: "Designing the Ultimate Developer Setup under $500", suffix: "" },
    { title: "My Workflow to Automate 90% of DevOps", suffix: "" }
  ];

  const channelHash = channelId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return videoIdeas.map((idea, i) => {
    const publishedDaysAgo = i * 4 + 2;
    const publishedAt = new Date();
    publishedAt.setDate(publishedAt.getDate() - publishedDaysAgo);

    // Calculate realistic stats based on channel subscriber count
    const subs = parseInt(channel.statistics.subscriberCount);
    // Add some random variation
    const baseViews = Math.round(subs * (2.5 / (i + 1)) * (0.8 + Math.random() * 0.4));
    const views = Math.max(120, baseViews);
    const likes = Math.round(views * 0.05);
    const comments = Math.round(likes * 0.08);

    const videoId = `vid-${channelId}-${i}`;
    const photoId = MOCK_UNSPLASH_IDS[(channelHash + i) % MOCK_UNSPLASH_IDS.length];

    return {
      id: videoId,
      channel_id: channelId,
      title: `${idea.title} ${idea.suffix}`.trim(),
      thumbnail: `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=400&h=225&q=80`,
      statistics: {
        viewCount: String(views),
        likeCount: String(likes),
        commentCount: String(comments)
      },
      published_at: publishedAt.toISOString(),
      snippet: {
        publishedAt: publishedAt.toISOString(),
        channelId: channelId,
        title: `${idea.title} ${idea.suffix}`.trim(),
        description: `In this video, we break down ${idea.title.toLowerCase()} and check out how it performs in production environments. We'll build step-by-step solutions and benchmark performance.`,
        thumbnails: {
          medium: { url: `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=320&h=180&q=80` },
          high: { url: `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=480&h=360&q=80` }
        },
        channelTitle: channel.title,
        categoryId: "28"
      }
    };
  });
}


// Generate Mock Search Results
export function generateMockSearch(query = "") {
  // Combine all mock channel videos
  const allVideos = [];
  Object.keys(MOCK_CHANNELS).forEach(channelId => {
    allVideos.push(...generateMockVideos(channelId));
  });

  // Filter based on query if provided
  if (query) {
    const q = query.toLowerCase();
    const filtered = allVideos.filter(v => v.title.toLowerCase().includes(q) || v.snippet.description.toLowerCase().includes(q));
    if (filtered.length > 0) return filtered;
  }

  // Shuffle/return default
  return allVideos.sort(() => 0.5 - Math.random()).slice(0, 15);
}

// Generate Analytics Snapshots
export function generateMockAnalytics() {
  const snapshots = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (30 - i));
    return {
      id: `snap-${i}`,
      channel_id: "UC-techvibeai123",
      subscribers: 110000 + i * 500,
      views: 7500000 + i * 48000,
      videos: 135 + Math.floor(i / 6),
      date: date.toISOString().split('T')[0]
    };
  });

  return {
    snapshots,
    channel: MOCK_CHANNELS["UC-techvibeai123"],
    videos: generateMockVideos("UC-techvibeai123")
  };
}

// Mock Competitor Analysis Matrix
export const MOCK_COMPETITORS_ANALYSIS = {
  id: "comp-matrix-1",
  title: "Tech AI Niche Rivals",
  subject_id: "UC-techvibeai123",
  competitor_ids: ["UC-codecraft456", "UC-bytesizetech789", "UC-algorithmics000"],
  created_at: 1782635900000,
  lastEmailSentAt: null
};

// Mock Library Items
export const MOCK_LIBRARY_ITEMS = [
  {
    id: "lib-1",
    type: "note",
    reference_id: "UC-codecraft456",
    title: "CodeCraft Visual Triggers Analysis",
    content: "CodeCraft utilizes an extremely fast editing style. They introduce a title hook within 5 seconds, followed by 3 fast cuts under 1.5 seconds each. This maximizes early-stage viewer retention in the tech niche. We should experiment with similar rapid intros in our upcoming agent coding video.",
    metadata: JSON.stringify({}),
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "lib-2",
    type: "note",
    reference_id: "UC-bytesizetech789",
    title: "ByteSize Video Structure Formula",
    content: "ByteSize structures their tutorials with very clean visual code blocks and side-by-side terminal windows. The visual contrast is very high (black background, neon borders). Viewers appreciate the readability. Their retention curves are extremely flat, showing almost zero drop-off during coding sections.",
    metadata: JSON.stringify({}),
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Mock Pinned Channels List
export const MOCK_PINNED = [
  MOCK_CHANNELS["UC-codecraft456"],
  MOCK_CHANNELS["UC-bytesizetech789"]
];

// Mock Trend Radar Data
export const MOCK_TREND_RADAR = {
  summary: {
    totalVideosAnalyzed: 1480,
  },
  insights: {
    overview: {
      viralPotential: 'High',
      marketMomentum: 'Hot',
      trendingTopics: 12,
      summary: "AI Agents and custom CLI automation tools are currently driving the highest retention rates in the developer space. Audience interest is shifting away from basic API integrations towards local self-hosted configurations."
    },
    quickWins: [
      {
        idea: "Local-first Agent Coding Tutorial",
        why: "Huge keyword searches with very low competition for self-hosted setup guides.",
        effort: "low",
        timing: "Launch within 48 hours"
      },
      {
        idea: "CLI Productivity tool showcase",
        why: "Visual, short form content has high conversion to subscribers right now.",
        effort: "medium",
        timing: "This week"
      },
      {
        idea: "Pricing Breakdown: API vs Self-Host",
        why: "High CTR potential due to cost-saving interests.",
        effort: "low",
        timing: "Next video"
      }
    ],
    emergingTrends: [
      {
        topic: "Browser-use & Playwright Agents",
        viralScore: 92,
        momentum: "hot",
        difficulty: "medium",
        opportunity: "Create hands-on workflow automation templates.",
        actionableIdea: "Automate booking flight tickets or scraping job lists using a browser agent.",
        timeWindow: "Next 7 days",
        estimatedViews: "50K - 120K"
      },
      {
        topic: "Ollama & DeepSeek Local Deployment",
        viralScore: 88,
        momentum: "rising",
        difficulty: "easy",
        opportunity: "Explain how to run massive local intelligence setups without GPUs.",
        actionableIdea: "Setting up a custom local programming partner running on standard laptops.",
        timeWindow: "Next 2 weeks",
        estimatedViews: "35K - 80K"
      },
      {
        topic: "Prompt Caching & LLM Optimization",
        viralScore: 78,
        momentum: "stable",
        difficulty: "hard",
        opportunity: "Technical guide on reducing LLM cost structures by 90%.",
        actionableIdea: "Benchmark OpenAI prompt cache speeds vs Anthropic systems.",
        timeWindow: "Next 30 days",
        estimatedViews: "20K - 45K"
      }
    ],
    videoIdeas: [
      {
        title: "I Built a Self-Hosting Code Assistant (And Stopped Paying)",
        description: "Step-by-step setup using local models and open-source plugins, showing real benchmarks against GitHub Copilot.",
        predictedViews: "65,000",
        difficulty: "Medium"
      },
      {
        title: "Stop Using Web Search API (Use This Web Agent Instead)",
        description: "Introduction to custom browser-use scripts that scrape dynamically and navigate complex logins automatically.",
        predictedViews: "45,000",
        difficulty: "Easy"
      },
      {
        title: "Why Prompt Caching Changes Everything for App Costs",
        description: "Deep technical breakdown of semantic cache and OpenAI/Claude cost reductions for production developers.",
        predictedViews: "28,000",
        difficulty: "Hard"
      }
    ],
    viralPatterns: {
      titleHooks: [
        "Why I stopped paying for [Service] (And did this instead)",
        "Building a fully autonomous [Role] in 100 lines of code",
        "The hidden cost of running [Model/Tool] in 2026"
      ],
      contentStyles: [
        "Interactive side-by-side terminal and browser comparison",
        "Fast-paced, editing-intensive 2-minute introductory live demo",
        "Open-source github repository code-along style guides"
      ]
    }
  }
};
