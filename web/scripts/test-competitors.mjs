import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env variables manually for standalone script execution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...values] = trimmed.split('=');
      process.env[key.trim()] = values.join('=').trim();
    }
  });
}

const API_KEY = process.env.YOUTUBE_API_KEY;

if (!API_KEY) {
  console.error("❌ Error: YOUTUBE_API_KEY is not set in .env file.");
  process.exit(1);
}

// Format numbers nicely (e.g. 1.2M, 500K)
function formatNumber(num) {
  const n = parseInt(num || 0, 10);
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

// Curated high-signal benchmark creators by niche (used to complement search)
const CURATED_CREATORS_BY_NICHE = {
  tech: [
    { id: "UCsbjURrPqeZg9351C4WULqQ", title: "Fireship" },
    { id: "UC29ju8bIPH5as8OGnQzwJyA", title: "Traversy Media" },
    { id: "UC8butISFwT-Wl7EV0hUK0BQ", title: "freeCodeCamp.org" },
    { id: "UCsBjURrPqeZg9351C4WULqQ", title: "Web Dev Simplified" },
    { id: "UC_mYaQAE6-71rjSN6Ce5-2g", title: "Joma Tech" },
    { id: "UCV0qA-cjKAvfxyg52656V5Q", title: "Sebastian Lague" },
    { id: "UC4xK9zSj7ejOMq55f553i" , title: "Tech With Tim" },
    { id: "UC8ENHE5xdFyp786pV185vog", title: "The Primeagen" }
  ],
  gaming: [
    { id: "UC-lHJZR3Gqxm24_Vd_AJ5Yw", title: "PewDiePie" },
    { id: "UC7_YxT-KID8yTOQzNew5XCg", title: "Markiplier" },
    { id: "UCYzPXprvl5Y-Sf0g4vX-m6g", title: "Jacksepticeye" },
    { id: "UCAW-NpUFkMyCNrvRSSGIvDQ", title: "Ninja" },
    { id: "UCS5Oz6CHmeoF7vSad0qqXfw", title: "DanTDM" }
  ],
  finance: [
    { id: "UCV6KDgJskWaEckne5aPA0aQ", title: "Graham Stephan" },
    { id: "UCoOae5nYA7VqaXzerajD0lg", title: "Ali Abdaal" },
    { id: "UCGy7SkBjcIAgTiwkXEtPnYg", title: "Andrei Jikh" },
    { id: "UCUvvj5lwue7PspotMDjk5UA", title: "Meet Kevin" }
  ],
  automotive: [
    { id: "UCUhFaUpnq31m6TNX2VKVSVA", title: "carwow" },
    { id: "UCG72WbiCvdB6JKU-3YRP8Kg", title: "Doug DeMuro" },
    { id: "UCL6JmiMXKoXS6bpP1D3bk8g", title: "Donut Media" },
    { id: "UCes1EvRjcKU4sY_UEavndBw", title: "ChrisFix" }
  ],
  general: [
    { id: "UCX6OQ3DkcsbYNE6H8uQQuVA", title: "MrBeast" },
    { id: "UCRijo3ddMTht_IHyNSNXpNQ", title: "Dude Perfect" },
    { id: "UCtinbF-Q-fVthA0qrFQTgXQ", title: "Casey Neistat" }
  ]
};

// Detect Niche from Channel Metadata & Popular Videos
function detectNiche(channel, popularVideos) {
  const title = channel.title || "";
  const desc = channel.description || "";
  const keywords = channel.keywords || "";
  const topicCat = (channel.topicCategories || []).join(" ");
  const videoTitles = popularVideos.map(v => v.title).join(" ");

  const combined = `${title} ${desc} ${keywords} ${topicCat} ${videoTitles}`.toLowerCase();

  if (/\b(code|coding|programming|software|developer|app|web|website|react|nextjs|javascript|python|css|html|dino|tech|bot|build app|game dev|indie dev)\b/i.test(combined)) {
    return "tech";
  } else if (/\b(game|games|gaming|gameplay|minecraft|fortnite|roblox|ps5|xbox|streamer)\b/i.test(combined)) {
    return "gaming";
  } else if (/\b(money|finance|crypto|stocks|invest|investing|business|trading)\b/i.test(combined)) {
    return "finance";
  } else if (/\b(car|cars|auto|driving|engine|vehicle|exhaust|porsche|bmw)\b/i.test(combined)) {
    return "automotive";
  }
  return "general";
}

// Extract high-signal topic query from video title
function buildHighSignalQuery(videoTitle, niche) {
  if (!videoTitle) return "";
  
  // Clean special characters and punctuation
  const clean = videoTitle.replace(/[^\w\s]/gi, ' ');

  const STOP_WORDS = new Set([
    "how", "to", "in", "and", "or", "the", "a", "an", "is", "for", "with", "on", "at", "by",
    "from", "this", "that", "it", "my", "your", "i", "you", "we", "they", "of", "best", "top",
    "video", "channel", "official", "new", "2024", "2025", "2026", "vlog", "full", "hd", "free",
    "ever", "on", "purpose", "needed", "seconds", "here", "real", "life"
  ]);

  const words = clean.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w.toLowerCase()));

  // Add niche context term if query is very broad
  let query = words.slice(0, 4).join(" ");
  if (niche === "tech" && !/\b(code|coding|dev|programming|app|web|tech|website|software)\b/i.test(query)) {
    query += " coding web dev";
  }
  return query.trim();
}

// 1. Resolve channel by handle, ID, or URL
async function resolveChannel(input) {
  const raw = input.trim();
  let channelId = null;

  if (raw.startsWith("UC") && raw.length === 24) {
    channelId = raw;
  } else if (raw.includes("youtube.com/channel/")) {
    channelId = raw.split("/channel/")[1].split("/")[0].split("?")[0];
  } else if (raw.includes("youtube.com/@")) {
    const handle = "@" + raw.split("/@")[1].split("/")[0].split("?")[0];
    return await resolveByHandle(handle);
  } else if (raw.startsWith("@")) {
    return await resolveByHandle(raw);
  } else {
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("q", raw);
    searchUrl.searchParams.set("type", "channel");
    searchUrl.searchParams.set("maxResults", "1");
    searchUrl.searchParams.set("key", API_KEY);

    const res = await fetch(searchUrl.toString());
    const data = await res.json();
    if (data.items?.length > 0) {
      channelId = data.items[0].id.channelId;
    }
  }

  if (!channelId) return null;
  return await fetchChannelDetails(channelId);
}

async function resolveByHandle(handle) {
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "snippet,statistics,topicDetails,brandingSettings");
  url.searchParams.set("forHandle", handle);
  url.searchParams.set("key", API_KEY);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.items?.length > 0) {
    const c = data.items[0];
    return {
      id: c.id,
      title: c.snippet.title,
      description: c.snippet.description || "",
      customUrl: c.snippet.customUrl || handle,
      subs: parseInt(c.statistics?.subscriberCount || 0, 10),
      videoCount: parseInt(c.statistics?.videoCount || 0, 10),
      topicCategories: c.topicDetails?.topicCategories || [],
      keywords: c.brandingSettings?.channel?.keywords || "",
      raw: c
    };
  }
  return null;
}

async function fetchChannelDetails(id) {
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "snippet,statistics,topicDetails,brandingSettings");
  url.searchParams.set("id", id);
  url.searchParams.set("key", API_KEY);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.items?.length > 0) {
    const c = data.items[0];
    return {
      id: c.id,
      title: c.snippet.title,
      description: c.snippet.description || "",
      customUrl: c.snippet.customUrl || "",
      subs: parseInt(c.statistics?.subscriberCount || 0, 10),
      videoCount: parseInt(c.statistics?.videoCount || 0, 10),
      topicCategories: c.topicDetails?.topicCategories || [],
      keywords: c.brandingSettings?.channel?.keywords || "",
      raw: c
    };
  }
  return null;
}

// 2. Fetch popular videos
async function getTopPopularVideos(channelId) {
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("channelId", channelId);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("maxResults", "25");
  searchUrl.searchParams.set("key", API_KEY);

  const res = await fetch(searchUrl.toString());
  const data = await res.json();
  if (!res.ok || !data.items || data.items.length === 0) return [];

  const videoIds = data.items.map(item => item.id.videoId);
  const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  statsUrl.searchParams.set("part", "snippet,statistics");
  statsUrl.searchParams.set("id", videoIds.join(","));
  statsUrl.searchParams.set("key", API_KEY);

  const statsRes = await fetch(statsUrl.toString());
  const statsData = await statsRes.json();

  const sorted = (statsData.items || [])
    .map(v => ({
      id: v.id,
      title: v.snippet.title,
      views: parseInt(v.statistics?.viewCount || 0, 10),
      likes: parseInt(v.statistics?.likeCount || 0, 10),
      channelId: v.snippet.channelId,
      channelTitle: v.snippet.channelTitle
    }))
    .sort((a, b) => b.views - a.views);

  return sorted.slice(0, 3);
}

// 3. Search for video & channel candidates
async function searchCandidates(query) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "10");
  url.searchParams.set("key", API_KEY);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (!res.ok || !data.items) return { videos: [], channelIds: [] };

  const videos = data.items.map(item => ({
    title: item.snippet.title,
    channelId: item.snippet.channelId,
    channelTitle: item.snippet.channelTitle
  }));

  const channelIds = [...new Set(videos.map(v => v.channelId))];
  return { videos, channelIds };
}

// 4. Batch fetch channel details
async function fetchBatchChannels(channelIds) {
  if (!channelIds || channelIds.length === 0) return [];
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "snippet,statistics");
  url.searchParams.set("id", channelIds.slice(0, 50).join(","));
  url.searchParams.set("key", API_KEY);

  const res = await fetch(url.toString());
  const data = await res.json();
  return (data.items || []).map(c => ({
    id: c.id,
    title: c.snippet.title,
    customUrl: c.snippet.customUrl || "",
    subs: parseInt(c.statistics?.subscriberCount || 0, 10),
    videoCount: parseInt(c.statistics?.videoCount || 0, 10),
    url: c.snippet.customUrl ? `https://youtube.com/${c.snippet.customUrl}` : `https://youtube.com/channel/${c.id}`
  }));
}

// Main Runner
async function runAnalysis(inputChannel) {
  console.log("\n=======================================================");
  console.log(`🔎 STEP 1: Resolving Base Channel: "${inputChannel}"`);
  console.log("=======================================================");

  const baseChannel = await resolveChannel(inputChannel);
  if (!baseChannel) {
    console.log("❌ Could not find channel. Please check the handle or ID.\n");
    return;
  }

  console.log(`✅ Base Channel Found:`);
  console.log(`   📌 Title:        ${baseChannel.title}`);
  console.log(`   👥 Subscribers:  ${formatNumber(baseChannel.subs)} (${baseChannel.subs.toLocaleString()})`);
  console.log(`   🔗 Handle/URL:   https://youtube.com/${baseChannel.customUrl || 'channel/' + baseChannel.id}`);
  console.log(`   🆔 Channel ID:   ${baseChannel.id}`);

  console.log("\n=======================================================");
  console.log("🔥 STEP 2: Fetching Top 3 Popular Videos");
  console.log("=======================================================");

  const popularVideos = await getTopPopularVideos(baseChannel.id);
  if (popularVideos.length === 0) {
    console.log("⚠️ No videos found for this channel.");
  } else {
    popularVideos.forEach((v, idx) => {
      console.log(`\n  [Popular Video #${idx + 1}]`);
      console.log(`  🎬 Title: "${v.title}"`);
      console.log(`  👁️  Views: ${formatNumber(v.views)} (${v.views.toLocaleString()} views)`);
    });
  }

  const detectedNiche = detectNiche(baseChannel, popularVideos);
  console.log(`\n🎯 Detected Channel Niche: [ ${detectedNiche.toUpperCase()} ]`);

  console.log("\n=======================================================");
  console.log("🔍 STEP 3: Performing Up To 3 Targeted Topic Searches");
  console.log("=======================================================");

  const searchQueries = [];
  popularVideos.forEach((v, i) => {
    const q = buildHighSignalQuery(v.title, detectedNiche);
    if (q && !searchQueries.includes(q)) {
      searchQueries.push({ query: q, source: `Popular Video #${i + 1}` });
    }
  });

  if (searchQueries.length < 3) {
    const fallbackQ = `${detectedNiche} coding web dev project`;
    searchQueries.push({ query: fallbackQ, source: "Niche Fallback Query" });
  }

  const allCandidateChannelIds = new Set();

  for (let i = 0; i < Math.min(3, searchQueries.length); i++) {
    const { query, source } = searchQueries[i];
    console.log(`\n📡 Search #${i + 1} [Query from ${source}]: "${query}"`);
    
    const { videos, channelIds } = await searchCandidates(query);
    console.log(`   Found ${videos.length} videos from ${channelIds.length} unique channels.`);
    console.log("   Top Video Titles Returned:");
    
    videos.slice(0, 5).forEach((v, idx) => {
      console.log(`     ${idx + 1}. "${v.title}" (${v.channelTitle})`);
      if (v.channelId !== baseChannel.id) {
        allCandidateChannelIds.add(v.channelId);
      }
    });
  }

  // Include curated niche creators to guarantee high-quality benchmark options
  const curatedPresets = CURATED_CREATORS_BY_NICHE[detectedNiche] || CURATED_CREATORS_BY_NICHE.general;
  curatedPresets.forEach(preset => {
    if (preset.id !== baseChannel.id) {
      allCandidateChannelIds.add(preset.id);
    }
  });

  console.log("\n=======================================================");
  console.log("🎯 STEP 4: Candidate Competitor Channels & URLs");
  console.log("=======================================================");

  const candidateIds = Array.from(allCandidateChannelIds).filter(id => id !== baseChannel.id);
  console.log(`Fetching detailed subscriber stats for ${candidateIds.length} candidate channels...`);

  const detailedCandidates = await fetchBatchChannels(candidateIds);

  // Filter out low quality accounts (sub counts < MIN_SUBS_BAR or fan/reaction channels)
  const MIN_SUBS_BAR = baseChannel.subs >= 100000 ? 5000 : 500;
  const filteredCandidates = detailedCandidates.filter(c => {
    if (c.id === baseChannel.id) return false;
    if (c.subs < MIN_SUBS_BAR) return false;
    const titleLower = (c.title || "").toLowerCase();
    
    // Filter out irrelevant reaction, meme, or clip channels
    if (/\b(fan|repost|clip|asmongold|reaction|reacts|edit|status|whatsapp)\b/i.test(titleLower)) return false;
    return true;
  });

  const baseSubs = baseChannel.subs;
  const peers = [];
  const targets = [];
  const leaders = [];

  filteredCandidates.forEach(c => {
    const s = c.subs;
    if (baseSubs > 0 && s >= baseSubs * 0.2 && s <= baseSubs * 3.0) {
      peers.push({ ...c, tier: "PEER (Similar Scale)" });
    } else if (s > baseSubs * 3.0 && s <= baseSubs * 15.0) {
      targets.push({ ...c, tier: "TARGET (Growth Benchmark)" });
    } else if (s > baseSubs * 15.0 || baseSubs < 1000) {
      leaders.push({ ...c, tier: "LEADER (Niche Authority)" });
    } else {
      peers.push({ ...c, tier: "RIVAL (Niche Creator)" });
    }
  });

  // Pick balanced top recommendations
  const finalCompetitors = [
    ...peers.sort((a, b) => b.subs - a.subs).slice(0, 3),
    ...targets.sort((a, b) => b.subs - a.subs).slice(0, 3),
    ...leaders.sort((a, b) => b.subs - a.subs).slice(0, 3)
  ];

  // Fill up to 6-8 channels
  if (finalCompetitors.length < 6) {
    const seenIds = new Set(finalCompetitors.map(c => c.id));
    for (const c of filteredCandidates) {
      if (!seenIds.has(c.id)) {
        finalCompetitors.push({ ...c, tier: "RIVAL (Niche Creator)" });
        seenIds.add(c.id);
        if (finalCompetitors.length >= 8) break;
      }
    }
  }

  console.log(`\n🏆 TOP RECOMMENDED COMPETITOR CHANNELS (${finalCompetitors.length} Total):\n`);

  finalCompetitors.forEach((c, idx) => {
    console.log(`  [${idx + 1}] ${c.title}`);
    console.log(`      🏷️ Tier:         ${c.tier}`);
    console.log(`      👥 Subscribers:  ${formatNumber(c.subs)} (${c.subs.toLocaleString()})`);
    console.log(`      🔗 Channel URL:  ${c.url}`);
    console.log(`      🆔 Channel ID:   ${c.id}\n`);
  });

  console.log("-------------------------------------------------------");
  console.log(`💡 Evaluate if these competitors are accurate for ${baseChannel.title}!`);
  console.log("-------------------------------------------------------\n");
}

// Handle interactive or CLI argument
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const cliArg = process.argv[2];

if (cliArg) {
  runAnalysis(cliArg).then(() => process.exit(0));
} else {
  function promptChannel() {
    rl.question('Enter YouTube Channel Handle / ID / URL (or "exit" to quit): ', async (answer) => {
      const input = answer.trim();
      if (!input || input.toLowerCase() === 'exit') {
        rl.close();
        process.exit(0);
      }
      await runAnalysis(input);
      promptChannel();
    });
  }

  console.log("\n=======================================================");
  console.log("🚀 SVAY COMPETITOR ANALYSIS TEST SCRIPT");
  console.log("=======================================================");
  promptChannel();
}
