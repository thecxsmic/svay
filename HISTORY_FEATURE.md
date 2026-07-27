# Svay History & Contextual Intelligence Feature

## Overview

Svay now remembers past ideas from Trend Radar and Competitor analyses to provide **contextual, evolving insights** instead of repeating the same suggestions every day.

## Features

### 1. **Trend Radar Memory**
- Stores last 10 trend scans per channel
- AI analyzes past trends to identify:
  - **New & emerging trends** (not seen before)
  - **Evolving trends** (changed since last scan)
  - **Trend momentum** (hot → rising → stable)
- Displays badge showing number of past scans analyzed
- Focuses on what has **changed** rather than repeating old ideas

### 2. **Competitor Analysis Memory**
- Stores last 10 competitor comparisons per channel
- Tracks how the competitive landscape evolves
- Displays badge showing number of past comparisons
- Provides context on competitor trajectory over time

## How It Works

### Day 1 - No History
```
User scans Trend Radar
  ↓
AI generates fresh trends based on current market
  ↓
Results saved to history table
```

### Day 2+ - With History
```
User scans Trend Radar
  ↓
System loads last 3 scans from history
  ↓
AI receives context: "3 days ago you tracked X, Y, Z"
  ↓
AI instruction: "Focus on NEW and EVOLVING trends"
  ↓
AI generates ideas that BUILD ON past insights
  ↓
Results saved to history table
```

## Database Setup

Run the migration script to create history tables:

```bash
cd /home/ubuntu/svay/web
node --env-file=.env scripts/init-history-tables.mjs
```

**Output:**
```
🔄 Initializing history tables...
[Turso] History tables initialized
✅ History tables initialized successfully!

Tables created:
  - trend_radar_history (tracks past trend scans)
  - competitor_history (tracks past competitor analyses)

Features enabled:
  ✓ Trend Radar remembers past ideas
  ✓ AI generates contextual suggestions based on history
  ✓ Competitor analyses track changes over time
```

## Files Modified

1. **src/lib/cache/turso.js**
   - Added `saveTrendRadarHistory()`
   - Added `getTrendRadarHistory()`
   - Added `saveCompetitorHistory()`
   - Added `getCompetitorHistory()`
   - Added `initHistoryTables()`

2. **src/app/api/trends/route.js**
   - Fetches past scans before AI generation
   - Includes historical context in AI prompt
   - Saves to history after generation
   - Returns `historyCount` in response

3. **src/app/api/competitors/save/route.js**
   - Accepts `summary` field for history
   - Saves summary to history table

4. **src/app/api/competitors/history/route.js** (NEW)
   - Endpoint to fetch past competitor analyses

5. **src/app/components/TrendRadar.js**
   - Added `pastScansCount` state
   - Added history indicator badge

6. **src/app/competitors/page.js**
   - Added `pastAnalysesCount` state
   - Added `loadCompetitorHistory()` function
   - Added history indicator badge
   - Sends summary data when saving

## Example Output

### Trend Radar - First Scan
```
✓ AI productivity tips (Score: 85)
✓ Best AI tools 2026 (Score: 82)
✓ ChatGPT workflows (Score: 78)
```

### Trend Radar - Second Scan (With History)
```
📊 3 past scans analyzed

Historical Context: Previously tracked AI productivity, tools, ChatGPT

NEW Trends:
✓ AI video editing automation (Score: 88) ← NEW category
✓ Open source AI alternatives (Score: 85) ← Evolving from tools
✓ AI voice cloning tutorials (Score: 80) ← NEW emerging trend

Note: Focused on what's CHANGED in the market
```

## Technical Details

### History Tables Schema

**trend_radar_history:**
- Stores JSON of complete radar results
- Indexed by channel_id and created_at
- Keeps last 10 records per channel

**competitor_history:**
- Stores summary data (titles, subs, top videos)
- Indexed by user_id, subject_id, and created_at
- Keeps last 10 records per user+channel

### Data Flow

```
┌──────────────┐
│   User       │
│   Action     │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  Load History (3-5)  │
│  getTrendHistory()   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  AI Generation with  │
│  Historical Context  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Save New Result to  │
│  Cache + History     │
└──────────────────────┘
```

## Benefits

1. **No Repetition**: AI explicitly avoids repeating old ideas
2. **Evolving Insights**: Track how trends change over time
3. **Better Context**: AI understands what user already knows
4. **Smarter Suggestions**: Build on previous scans
5. **User Feedback**: Badges show intelligence at work

## Deployment

The feature is production-ready. Just run the migration script to create the history tables.

---

**Status**: ✅ Complete and Ready
