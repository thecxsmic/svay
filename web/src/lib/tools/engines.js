/**
 * Server-side tool engines. All free-tool compute runs here so quotas apply.
 */

import { REGION_CONFIG, getEarnings } from "@/lib/utils/earnings";
import { INPUT_LIMITS } from "./config";

const POWER_WORDS = [
  "how",
  "why",
  "secret",
  "ultimate",
  "best",
  "worst",
  "never",
  "always",
  "truth",
  "mistake",
  "proven",
  "simple",
  "free",
  "new",
  "guide",
  "vs",
  "review",
  "exposed",
  "insane",
  "shocking",
];

const STOP = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "this",
  "that",
  "it",
  "as",
  "my",
  "your",
  "our",
  "how",
  "what",
  "why",
  "when",
  "where",
  "who",
  "i",
  "you",
  "we",
  "they",
]);

const MILESTONES = [
  100, 500, 1000, 5000, 10000, 50000, 100000, 250000, 500000, 1000000, 5000000,
  10000000, 50000000, 100000000,
];

function clampStr(v, max) {
  return String(v ?? "")
    .trim()
    .slice(0, max);
}

function parseNonNegInt(v, max = Number.MAX_SAFE_INTEGER) {
  const n = parseInt(String(v ?? "").replace(/,/g, ""), 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

function parseNonNegFloat(v, max = Number.MAX_SAFE_INTEGER) {
  const n = parseFloat(String(v ?? "").replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function formatCompact(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

function scoreTitle(title) {
  const t = title.trim();
  const len = t.length;
  const words = t.split(/\s+/).filter(Boolean);
  const checks = [];

  if (len === 0) {
    return { score: 0, checks: [], level: "—", len: 0, words: 0 };
  }

  let score = 50;

  if (len >= 40 && len <= 70) {
    score += 20;
    checks.push({ ok: true, text: "Length is in the 40–70 character sweet spot" });
  } else if (len < 30) {
    score -= 15;
    checks.push({ ok: false, text: "Title is short — add more context or a hook" });
  } else if (len > 100) {
    score -= 20;
    checks.push({ ok: false, text: "Over 100 characters — will truncate hard on mobile" });
  } else {
    checks.push({
      ok: len <= 70,
      text:
        len <= 70
          ? "Length is acceptable for most surfaces"
          : "Slightly long — consider trimming for mobile",
    });
    if (len > 70) score -= 8;
  }

  const lower = t.toLowerCase();
  const powerHits = POWER_WORDS.filter((w) => new RegExp(`\\b${w}\\b`, "i").test(lower));
  if (powerHits.length > 0) {
    score += Math.min(15, powerHits.length * 5);
    checks.push({
      ok: true,
      text: `Hook words detected: ${powerHits.slice(0, 4).join(", ")}`,
    });
  } else {
    score -= 5;
    checks.push({
      ok: false,
      text: "No strong hook words (how, why, best, secret…)",
    });
  }

  if (/\d/.test(t)) {
    score += 8;
    checks.push({ ok: true, text: "Contains a number — often lifts CTR" });
  } else {
    checks.push({ ok: false, text: "No numbers — lists and years often perform well" });
  }

  if (words.length >= 4 && words.length <= 12) {
    score += 7;
    checks.push({ ok: true, text: "Word count is scannable" });
  } else if (words.length > 14) {
    score -= 8;
    checks.push({ ok: false, text: "Too many words — tighten the message" });
  }

  if (t === t.toUpperCase() && t.length > 8) {
    score -= 15;
    checks.push({ ok: false, text: "ALL CAPS can look spammy" });
  }

  if ((/[!]{1,}/.test(t) && /\?/.test(t)) || /[!?]{2,}/.test(t)) {
    score -= 5;
    checks.push({ ok: false, text: "Heavy punctuation can hurt trust" });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  let level = "Weak";
  if (score >= 75) level = "Strong";
  else if (score >= 55) level = "Solid";
  else if (score >= 35) level = "Average";

  return {
    score,
    checks,
    level,
    len,
    words: words.length,
    mobileCut: t.slice(0, 50),
    desktopCut: t.slice(0, 70),
  };
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s#+-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

function generateTags(topic, niche) {
  const base = tokenize(topic);
  const nicheWords = tokenize(niche);
  if (base.length === 0 && nicheWords.length === 0) return [];

  const primary = base.length ? base : nicheWords;
  const phrase = primary.join(" ");
  const tags = new Set();

  if (phrase) tags.add(phrase);
  primary.forEach((w) => tags.add(w));
  nicheWords.forEach((w) => tags.add(w));

  if (primary.length >= 2) {
    tags.add(primary.slice(0, 2).join(" "));
    tags.add(primary.slice(-2).join(" "));
  }
  if (nicheWords.length && primary.length) {
    tags.add(`${primary[0]} ${nicheWords[0]}`);
    tags.add(`${nicheWords[0]} ${primary.join(" ")}`);
  }

  const mods = [
    "tutorial",
    "guide",
    "tips",
    "explained",
    "2026",
    "for beginners",
    "review",
    "best",
    "how to",
  ];
  mods.forEach((m) => {
    if (phrase) tags.add(`${phrase} ${m}`);
    if (primary[0]) tags.add(`${m} ${primary[0]}`);
  });

  if (phrase) {
    tags.add(`best ${phrase}`);
    tags.add(`${phrase} tutorial`);
    tags.add(`learn ${phrase}`);
  }

  return Array.from(tags)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && t.length <= 40)
    .slice(0, INPUT_LIMITS.maxTags);
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  let count = 0;
  let idx = 0;
  while ((idx = h.indexOf(n, idx)) !== -1) {
    count += 1;
    idx += n.length;
  }
  return count;
}

function parseChapterLines(raw) {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const chapters = [];
  for (const line of lines) {
    // 0:00 Intro | 1:23 - Hook | 01:02:03 Chapter
    const m = line.match(
      /^(?:#?\s*)?(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s*[-–—:|]?\s*(.+)$/i
    );
    if (m) {
      const h = m[1] ? parseInt(m[1], 10) : 0;
      const min = parseInt(m[2], 10);
      const sec = parseInt(m[3], 10);
      const label = m[4].trim().slice(0, 80);
      if (min > 59 || sec > 59) continue;
      const total = h * 3600 + min * 60 + sec;
      chapters.push({ seconds: total, label, raw: line });
      continue;
    }
    // Label only — will auto-time later
    if (line.length >= 2 && line.length <= 80 && !/^\d+$/.test(line)) {
      chapters.push({ seconds: null, label: line.slice(0, 80), raw: line });
    }
  }
  return chapters;
}

/**
 * @param {string} toolId
 * @param {Record<string, unknown>} input
 */
export function runToolEngine(toolId, input = {}) {
  switch (toolId) {
    case "earnings": {
      const views = parseNonNegInt(input.views, INPUT_LIMITS.maxViews);
      const region = String(input.region || "US").toUpperCase().slice(0, 4);
      if (!REGION_CONFIG[region]) {
        throw Object.assign(new Error("Invalid region"), { status: 400 });
      }
      const customRpmRaw = input.customRpm;
      const customRpm =
        customRpmRaw === "" || customRpmRaw == null
          ? null
          : parseFloat(String(customRpmRaw));

      let result;
      if (customRpm != null && Number.isFinite(customRpm) && customRpm >= 0) {
        const config = REGION_CONFIG[region];
        const rpm = Math.min(customRpm, 500);
        const usd = (views / 1000) * rpm;
        result = {
          usd,
          local: usd * config.exchange,
          ...config,
          rate: rpm / 1000,
          usedCustom: true,
          views,
          region,
          rpm,
        };
      } else {
        const e = getEarnings(views, region);
        result = {
          ...e,
          usedCustom: false,
          views,
          region,
          rpm: e.rate * 1000,
        };
      }
      return { result };
    }

    case "title": {
      const title = clampStr(input.title, INPUT_LIMITS.title);
      if (!title) {
        throw Object.assign(new Error("Title is required"), { status: 400 });
      }
      return { result: scoreTitle(title) };
    }

    case "tags": {
      const topic = clampStr(input.topic, INPUT_LIMITS.topic);
      const niche = clampStr(input.niche, INPUT_LIMITS.niche);
      if (!topic && !niche) {
        throw Object.assign(new Error("Topic or niche is required"), { status: 400 });
      }
      const tags = generateTags(topic, niche);
      return { result: { tags, csv: tags.join(", ") } };
    }

    case "engagement": {
      const views = parseNonNegInt(input.views, INPUT_LIMITS.maxViews);
      const likes = parseNonNegInt(input.likes, INPUT_LIMITS.maxViews);
      const comments = parseNonNegInt(input.comments, INPUT_LIMITS.maxViews);
      if (views <= 0) {
        throw Object.assign(new Error("Views must be greater than 0"), { status: 400 });
      }

      const likeRate = (likes / views) * 100;
      const commentRate = (comments / views) * 100;
      // Weighted engagement (comments count more)
      const engagement = ((likes + comments * 2) / views) * 100;

      let level = "Low";
      let tip = "Try stronger hooks in the first 15s and a clearer CTA.";
      if (engagement >= 8) {
        level = "Excellent";
        tip = "Top-tier engagement — double down on this format.";
      } else if (engagement >= 4) {
        level = "Strong";
        tip = "Above average. Ask a question mid-video to push comments.";
      } else if (engagement >= 2) {
        level = "Average";
        tip = "Solid baseline. Improve thumbnail–title congruence for more likes.";
      } else if (engagement >= 1) {
        level = "Fair";
        tip = "Add a pinned comment prompt and end-screen CTA.";
      }

      return {
        result: {
          views,
          likes,
          comments,
          likeRate: Number(likeRate.toFixed(3)),
          commentRate: Number(commentRate.toFixed(3)),
          engagement: Number(engagement.toFixed(3)),
          level,
          tip,
          benchmarks: [
            { label: "Low", max: 1 },
            { label: "Fair", max: 2 },
            { label: "Average", max: 4 },
            { label: "Strong", max: 8 },
            { label: "Excellent", max: null },
          ],
        },
      };
    }

    case "script": {
      const script = clampStr(input.script, INPUT_LIMITS.script);
      if (!script) {
        throw Object.assign(new Error("Script text is required"), { status: 400 });
      }
      const words = script.split(/\s+/).filter(Boolean).length;
      const chars = script.length;
      const wpm = Math.min(
        220,
        Math.max(100, parseNonNegInt(input.wpm, 300) || 150)
      );
      const seconds = (words / wpm) * 60;
      const withBroll = seconds * 1.15; // ~15% padding for pauses / b-roll

      let format = "Long-form";
      if (seconds <= 60) format = "Shorts / Reels";
      else if (seconds <= 180) format = "Short video";
      else if (seconds <= 600) format = "Standard";
      else if (seconds <= 1200) format = "Deep dive";

      return {
        result: {
          words,
          chars,
          wpm,
          seconds: Math.round(seconds),
          duration: formatDuration(seconds),
          withBrollSeconds: Math.round(withBroll),
          withBrollDuration: formatDuration(withBroll),
          format,
          tips: [
            words < 80
              ? "Very short — consider adding a stronger hook + payoff."
              : null,
            seconds > 900
              ? "Long runtime — add chapter markers every 2–3 minutes."
              : null,
            "Aim for a scroll-stopping first sentence in under 3 seconds.",
          ].filter(Boolean),
        },
      };
    }

    case "chapters": {
      const raw = clampStr(input.chapters, INPUT_LIMITS.chapters);
      if (!raw) {
        throw Object.assign(new Error("Add at least one chapter line"), { status: 400 });
      }

      let parsed = parseChapterLines(raw);
      if (parsed.length === 0) {
        throw Object.assign(
          new Error("Could not parse chapters. Use lines like: 0:00 Intro"),
          { status: 400 }
        );
      }

      // Auto-space unlabeled lines evenly if no times
      const hasAnyTime = parsed.some((c) => c.seconds != null);
      if (!hasAnyTime) {
        const totalMin = Math.min(
          180,
          Math.max(1, parseNonNegInt(input.totalMinutes, 180) || 10)
        );
        const step = (totalMin * 60) / parsed.length;
        parsed = parsed.map((c, i) => ({
          ...c,
          seconds: Math.round(i * step),
        }));
      } else {
        // Fill missing with previous + 60s
        let last = 0;
        parsed = parsed.map((c) => {
          if (c.seconds == null) {
            last += 60;
            return { ...c, seconds: last };
          }
          last = c.seconds;
          return c;
        });
      }

      // Sort + force first chapter at 0:00 (YouTube requirement)
      parsed.sort((a, b) => a.seconds - b.seconds);
      if (parsed[0].seconds !== 0) {
        parsed[0] = { ...parsed[0], seconds: 0 };
      }

      // Deduplicate times
      const seen = new Set();
      const clean = [];
      for (const c of parsed) {
        let t = c.seconds;
        while (seen.has(t)) t += 1;
        seen.add(t);
        clean.push({ ...c, seconds: t, stamp: formatDuration(t) });
      }

      if (clean.length < 3) {
        // still return but warn
      }

      const formatted = clean.map((c) => `${c.stamp} ${c.label}`).join("\n");
      const youtubeReady = clean.length >= 3 && clean[0].seconds === 0;

      return {
        result: {
          chapters: clean.map(({ stamp, label, seconds }) => ({
            stamp,
            label,
            seconds,
          })),
          formatted,
          count: clean.length,
          youtubeReady,
          warnings: [
            clean.length < 3
              ? "YouTube needs at least 3 chapters for the chapter UI."
              : null,
            !youtubeReady ? "First chapter must start at 0:00." : null,
          ].filter(Boolean),
        },
      };
    }

    case "milestones": {
      const current = parseNonNegInt(input.current, INPUT_LIMITS.maxSubs);
      const dailyGain = parseNonNegFloat(input.dailyGain, 1_000_000);
      if (current <= 0 && dailyGain <= 0) {
        throw Object.assign(
          new Error("Enter current subscribers and daily net growth"),
          { status: 400 }
        );
      }

      const nextMilestones = MILESTONES.filter((m) => m > current).slice(0, 6);
      if (nextMilestones.length === 0) {
        return {
          result: {
            current,
            dailyGain,
            next: null,
            projections: [],
            note: "You're past the listed public milestones — keep going.",
          },
        };
      }

      const projections = nextMilestones.map((target) => {
        const remaining = target - current;
        if (dailyGain <= 0) {
          return {
            target,
            targetLabel: formatCompact(target),
            remaining,
            days: null,
            eta: null,
          };
        }
        const days = Math.ceil(remaining / dailyGain);
        const eta = new Date();
        eta.setDate(eta.getDate() + days);
        return {
          target,
          targetLabel: formatCompact(target),
          remaining,
          days,
          eta: eta.toISOString().slice(0, 10),
        };
      });

      const next = projections[0];
      return {
        result: {
          current,
          dailyGain,
          next,
          projections,
          monthlyPace: Math.round(dailyGain * 30),
          tip:
            dailyGain > 0
              ? `At +${dailyGain}/day you add ~${formatCompact(
                  Math.round(dailyGain * 30)
                )} subs/month.`
              : "Enter a positive daily growth rate to project ETAs.",
        },
      };
    }

    case "seo": {
      const keyword = clampStr(input.keyword, INPUT_LIMITS.keyword);
      const title = clampStr(input.title, INPUT_LIMITS.title);
      const description = clampStr(input.description, INPUT_LIMITS.description);
      if (!keyword) {
        throw Object.assign(new Error("Target keyword is required"), { status: 400 });
      }
      if (!title && !description) {
        throw Object.assign(
          new Error("Add a title and/or description to check"),
          { status: 400 }
        );
      }

      const kwLower = keyword.toLowerCase();
      const titleLower = title.toLowerCase();
      const descLower = description.toLowerCase();
      const titleHas = titleLower.includes(kwLower);
      const descHas = descLower.includes(kwLower);
      const titleCount = countOccurrences(title, keyword);
      const descCount = countOccurrences(description, keyword);
      const titlePos = titleLower.indexOf(kwLower);
      const inFirstHalf = titleHas && titlePos <= Math.max(0, title.length / 2);

      const words = description.split(/\s+/).filter(Boolean).length;
      const density =
        words > 0 ? Number(((descCount / words) * 100).toFixed(2)) : 0;

      let score = 20;
      const checks = [];

      if (titleHas) {
        score += 30;
        checks.push({ ok: true, text: "Keyword appears in the title" });
      } else {
        checks.push({ ok: false, text: "Keyword missing from title" });
      }

      if (inFirstHalf) {
        score += 10;
        checks.push({ ok: true, text: "Keyword is near the front of the title" });
      } else if (titleHas) {
        checks.push({
          ok: false,
          text: "Move the keyword earlier in the title when possible",
        });
      }

      if (descHas) {
        score += 20;
        checks.push({ ok: true, text: "Keyword appears in the description" });
      } else {
        checks.push({ ok: false, text: "Add the keyword naturally in the description" });
      }

      if (description.length >= 100 && description.length <= 5000) {
        score += 10;
        checks.push({ ok: true, text: "Description has useful length" });
      } else if (description.length > 0 && description.length < 100) {
        checks.push({
          ok: false,
          text: "Description is short — aim for 2–3 sentences minimum",
        });
      }

      if (density > 0 && density <= 2.5) {
        score += 10;
        checks.push({ ok: true, text: `Keyword density looks natural (${density}%)` });
      } else if (density > 2.5) {
        score -= 10;
        checks.push({
          ok: false,
          text: `Density is high (${density}%) — ease off to avoid stuffing`,
        });
      }

      if (title.length >= 40 && title.length <= 70) {
        score += 5;
        checks.push({ ok: true, text: "Title length is in a good range" });
      }

      score = Math.max(0, Math.min(100, score));
      let level = "Weak";
      if (score >= 75) level = "Strong";
      else if (score >= 55) level = "Solid";
      else if (score >= 35) level = "Average";

      return {
        result: {
          keyword,
          score,
          level,
          titleHas,
          descHas,
          titleCount,
          descCount,
          density,
          titleLen: title.length,
          descLen: description.length,
          checks,
        },
      };
    }

    default:
      throw Object.assign(new Error("Unknown tool"), { status: 404 });
  }
}

export function listRegions() {
  return Object.keys(REGION_CONFIG).map((code) => ({
    code,
    rpm: REGION_CONFIG[code].rate * 1000,
    currency: REGION_CONFIG[code].currency,
  }));
}
