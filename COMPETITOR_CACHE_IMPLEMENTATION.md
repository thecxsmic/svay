# Competitor Caching Implementation - Summary

**Date**: 2026-07-28  
**Issue**: Competitors were fetched fresh on every channel view, burning 100-401 YouTube API quota units per "cached" request  
**Solution**: Implement 24-hour caching for competitors alongside channel/video data

---

## Changes Made

### 1. Database Schema (`/home/ubuntu/svay/web/src/lib/cache/turso.js`)

Added new `competitor_cache` table:
```sql
CREATE TABLE IF NOT EXISTS competitor_cache (
  channel_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  last_updated INTEGER NOT NULL
)
```

### 2. Cache Functions (`/home/ubuntu/svay/web/src/lib/cache/turso.js`)

**Added `saveCompetitors(channelId, competitors)`:**
- Saves competitor array to cache with current timestamp
- Uses `INSERT OR REPLACE` for upsert behavior

**Added `getCompetitors(channelId)`:**
- Retrieves cached competitors for a channel
- Checks 24-hour TTL (86400 seconds)
- Returns `null` if expired or not found
- Returns `{ data: [...], last_updated: timestamp }` if fresh

### 3. Channel API Route (`/home/ubuntu/svay/web/src/app/api/youtube/channel/route.js`)

**Updated logic:**
```javascript
// Check competitor cache first (24-hour TTL)
const cachedCompetitors = await getCompetitors(channelId);
if (cachedCompetitors) {
  console.log(`[Channel API] Using cached competitors for ${channelId}`);
  results.competitors = cachedCompetitors.data;
} else if (results.channel && results.videos) {
  console.log(`[Channel API] Fetching fresh competitors for ${channelId}`);
  const freshCompetitors = await getCompetitorsForChannel(results.channel, results.videos);
  results.competitors = freshCompetitors;
  
  // Save to cache for future requests
  if (freshCompetitors && freshCompetitors.length > 0) {
    saveCompetitors(channelId, freshCompetitors).catch(err => {
      console.error("[Channel API] Error caching competitors:", err);
    });
  }
}
```

### 4. Admin Purge Endpoints (`/home/ubuntu/svay/web/src/app/api/admin/channels/route.js`)

**Updated purge operations:**
- `DELETE FROM competitor_cache` added to purgeAll operation
- `DELETE FROM competitor_cache WHERE channel_id = ?` added to individual channel purge

---

## Impact

### Before Fix
- **First channel view**: 203 units (channel + videos + competitors)
- **Cached channel view**: 101-401 units (competitors still fetched fresh!)
- **Daily capacity**: ~50-60 users

### After Fix ✅
- **First channel view**: 203 units (same)
- **Cached channel view**: **0 units** (everything cached!)
- **Daily capacity**: ~76-166 users (depending on usage pattern)

### Quota Savings
- **1.5-3x increase in user capacity**
- Cached channel views save 100-401 units each
- With 80% cache hit rate, channel analysis becomes extremely efficient

---

## Technical Details

### Cache Behavior
- **TTL**: 24 hours (86400 seconds)
- **Invalidation**: Automatic via timestamp check in `getCompetitors()`
- **Manual purge**: Available via admin endpoints
- **Storage**: JSON serialized array in Turso/LibSQL

### Table Creation
- Uses `CREATE TABLE IF NOT EXISTS` pattern
- Table created automatically on first use
- No migration needed - backwards compatible

### Error Handling
- Cache read failures fall back to fresh fetch
- Cache write failures logged but don't block response
- Non-blocking save operation (fire-and-forget)

---

## Question: Trend Radar Auto-Refresh

**Q**: Does trend radar auto-refresh after 24 hours without user trigger?  
**A**: No. Trend radar has proper 24-hour caching, but it only refreshes when:
1. User explicitly clicks "Run Analysis" (POST to `/api/trends`)
2. Dashboard/components read existing cache (GET to `/api/trends`)

There's no background job that auto-regenerates trend radar. It's fully user-triggered.

---

## Files Modified

1. `/home/ubuntu/svay/web/src/lib/cache/turso.js` - Added cache table and functions
2. `/home/ubuntu/svay/web/src/app/api/youtube/channel/route.js` - Updated to use cache
3. `/home/ubuntu/svay/web/src/app/api/admin/channels/route.js` - Updated purge operations
4. `/home/ubuntu/svay/QUOTA_ANALYSIS.md` - Updated with new capacity calculations

---

## Testing Recommendations

1. **First Load**: Verify competitors are fetched and saved to cache
2. **Second Load**: Verify competitors come from cache (check logs for "Using cached competitors")
3. **After 24h**: Verify cache expires and fresh fetch occurs
4. **Admin Purge**: Verify cache clears properly

## Monitoring

Watch for these log messages:
- `[Turso] Saved X competitors for channel Y` - Cache write success
- `[Channel API] Using cached competitors for X` - Cache hit
- `[Channel API] Fetching fresh competitors for X` - Cache miss or expired
- `[Turso] Competitor cache expired for X` - TTL check
