/**
 * Free public tools — tiers, limits, and tool registry.
 *
 * Tiers
 *  - anonymous: guest cookie + IP (strict)
 *  - free:      signed-in, no active Pro
 *  - demo:      demo_mode cookie
 *  - pro:       active paid / promo subscription
 */

export const TOOL_IDS = [
  "earnings",
  "title",
  "tags",
  "engagement",
  "script",
  "chapters",
  "milestones",
  "seo",
];

export const TOOL_META = {
  earnings: {
    id: "earnings",
    name: "Earnings Calculator",
    path: "/tools/earnings",
  },
  title: {
    id: "title",
    name: "Title Analyzer",
    path: "/tools/title",
  },
  tags: {
    id: "tags",
    name: "Tag Generator",
    path: "/tools/tags",
  },
  engagement: {
    id: "engagement",
    name: "Engagement Rate",
    path: "/tools/engagement",
  },
  script: {
    id: "script",
    name: "Script Duration",
    path: "/tools/script",
  },
  chapters: {
    id: "chapters",
    name: "Chapter Timestamps",
    path: "/tools/chapters",
  },
  milestones: {
    id: "milestones",
    name: "Subscriber Milestones",
    path: "/tools/milestones",
  },
  seo: {
    id: "seo",
    name: "Keyword SEO Check",
    path: "/tools/seo",
  },
};

/** Burst + daily caps per account tier */
export const TIER_LIMITS = {
  anonymous: {
    id: "anonymous",
    label: "Guest",
    dailyGlobal: 10,
    dailyPerTool: 4,
    burstPerMin: 3,
    ipDailyGlobal: 24,
    ipBurstPerMin: 6,
  },
  free: {
    id: "free",
    label: "Free account",
    dailyGlobal: 50,
    dailyPerTool: 18,
    burstPerMin: 10,
    ipDailyGlobal: 100,
    ipBurstPerMin: 20,
  },
  demo: {
    id: "demo",
    label: "Demo",
    dailyGlobal: 15,
    dailyPerTool: 5,
    burstPerMin: 4,
    ipDailyGlobal: 30,
    ipBurstPerMin: 8,
  },
  pro: {
    id: "pro",
    label: "Pro",
    dailyGlobal: 500,
    dailyPerTool: 200,
    burstPerMin: 30,
    ipDailyGlobal: 1000,
    ipBurstPerMin: 60,
  },
};

/** Cookie name for anonymous tool session */
export const TOOLS_SID_COOKIE = "svay_tools_sid";

/** Max payload field sizes (abuse / DoS) */
export const INPUT_LIMITS = {
  title: 120,
  topic: 120,
  niche: 80,
  keyword: 80,
  description: 5000,
  script: 20000,
  chapters: 8000,
  maxViews: 10_000_000_000,
  maxTags: 40,
  maxSubs: 500_000_000,
};
