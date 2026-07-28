# YouTube API Quota Analysis for Svay

## Current Rate Limits (After Update)
- **Search endpoints**: 20 per hour, 30 per day per user/IP
- **Global API**: 120 requests per minute across all endpoints
- **Heavy endpoints**: 10 requests per minute
- **Tool endpoints**: 20 requests per minute

---

## YouTube API Quota Costs

Based on YouTube Data API v3 documentation, each operation has the following quota costs:

| Operation | Quota Cost | Used In |
|-----------|------------|---------|
| `search.list` | **100 units** | Video search, Channel search |
| `videos.list` | **1 unit** | Getting video statistics |
| `channels.list` | **1 unit** | Getting channel details |

---

## API Usage Per User Action

### 1. **Video Search** (`/api/youtube/search`)
**Without pagination (first search):**
- 1x `search.list` = **100 units**
- 1x `videos.list` (for 50 video IDs) = **1 unit**
- **Total: 101 units per search**

**With pagination (next page):**
- 1x `search.list` = **100 units**
- 1x `videos.list` = **1 unit**
- **Total: 101 units per page**

**Daily user limit**: 20 searches/hour, 30 searches/day
- Max quota per user/day = **30 × 101 = 3,030 units**

---

### 2. **Channel Search** (`/api/youtube/channel?q=...`)
**Broad search (no channelId):**
- 1x `search.list` (type=channel) = **100 units**
- 1x `channels.list` (get details for up to 25 channels) = **1 unit**
- **Total: 101 units per channel search**

**Rate limit**: Covered under global 120/min limit (no specific limit)

---

### 3. **Channel Deep Analysis** (`/api/youtube/channel?channelId=...`)

#### **First time (not cached):**
- 1x `channels.list` (channel details) = **1 unit**
- 1x `search.list` (get channel videos) = **100 units**
- 1x `videos.list` (stats for 50 videos) = **1 unit**
- 1x `search.list` (find competitors) = **100 units**
- 1-3x `channels.list` (competitor details) = **1-3 units**
- **Total: ~203-205 units** ⚠️

#### **Cached (within 24 hours):** ✅ FIXED!
- ✅ Channel + videos from Turso = **0 units**
- ✅ Competitors from cache = **0 units**
- **Total: 0 units** 🎉

**With pagination (next page):**
- 1x `search.list` = **100 units**
- 1x `videos.list` = **1 unit**
- **Total: 101 units per page**

**Rate limit**: Covered under global 120/min limit

---

### 4. **Competitor Fetching** (internal)
- 1x `search.list` (niche query) = **100 units**
- 1x `channels.list` (details for found channels) = **1 unit**
- Up to 2-3 fallback searches = **200-300 units** (if cascading)
- **Total: 101-401 units** (depending on fallback depth)

---

## Daily Quota Calculations

### **Daily Quota Limit**: 100,000 units

### Scenario 1: Video Search Users Only
- Each user maxes out at **30 searches × 101 units = 3,030 units/day**
- **Users supported per day**: 100,000 ÷ 3,030 = **~33 users**

### Scenario 2: Mixed Video Search (Realistic)
- Each user does **15 searches × 101 units = 1,515 units/day**
- **Users supported per day**: 100,000 ÷ 1,515 = **~66 users**

### Scenario 3: Channel Analysis Heavy ✅ (FIXED!)
**After competitor caching:**
- First channel view (uncached): **203 units** (channel + videos + competitors)
- Second+ view (cached): **0 units** (everything cached!) 🎉
- Average per channel view: **~20-40 units** (assuming 80% cache hit rate)

If users view channels frequently:
- 20 channel views/day × 30 units = **600 units per user** (with cache)
- **Users supported**: 100,000 ÷ 600 = **~166 users**

### Scenario 4: Mixed Usage (Most Realistic) ✅
Assuming:
- 10 video searches/day × 101 = 1,010 units
- 10 channel views/day × 30 = 300 units (mostly cached)
- **Total per user**: ~1,310 units/day
- **Users supported**: 100,000 ÷ 1,310 = **~76 users**

---

## Realistic Capacity Estimate

### With Current Rate Limits (20/hour, 30/day searches):

**Conservative estimate** (assuming users hit their daily limits):
- **30-50 active daily users** who max out their quota

**Realistic estimate** (average usage ~10-15 searches/day):
- **60-100 daily active users**

**Optimistic estimate** (light usage ~5-10 searches/day):
- **100-150 daily active users**

---

## Recommendations

### 1. **Implement Caching Aggressively**
- ✅ Already doing: Turso cache + vector search reduces API calls
- ✅ Cache channel data for 24 hours
- ✅ Background indexing reduces duplicate searches
- 💡 Consider extending cache to 48-72 hours for popular queries

### 2. **Quota Monitoring**
```javascript
// Add to apiKeyManager.js
let dailyQuotaUsed = 0;
const QUOTA_COSTS = {
  'search.list': 100,
  'videos.list': 1,
  'channels.list': 1
};

function trackQuota(callType) {
  dailyQuotaUsed += QUOTA_COSTS[callType] || 0;
  console.log(`[Quota] Used: ${dailyQuotaUsed}/100000`);
  
  if (dailyQuotaUsed > 95000) {
    console.warn('[Quota] Approaching daily limit!');
    // Alert admin, enable demo mode, etc.
  }
}
```

### 3. **Tiered Access Strategy**
- **Free tier**: 10 searches/day (uses ~1,010 quota → supports 99 users)
- **Basic tier**: 20 searches/day (uses ~2,020 quota → supports 49 users)
- **Pro tier**: 50 searches/day (uses ~5,050 quota → supports 19 users)

### 4. **Cost-Saving Optimizations**
- Reduce competitor search fallback cascades (currently 3 levels = 300 units max)
- Use database-first approach for popular channels
- Implement request deduplication (if 2 users search same thing within 1 hour)
- Consider YouTube search.list alternatives for simple queries

### 5. **Quota Exhaustion Fallback**
- ✅ Already have demo mode
- 💡 Add "quota exceeded" graceful degradation
- 💡 Show cached results even if older than 24h when quota is tight

---

## Current Protection Mechanisms
✅ Rate limiting per user/IP (20/hour, 30/day)
✅ Global rate limit (120/min)
✅ Cache layer (Turso + Zilliz)
✅ Background indexing to reduce duplicate fetches
✅ API key rotation with quota exhaustion detection
✅ Demo mode fallback

---

## Answer: How Many Users Can Actually Use This Site?

### **With 100k daily YouTube quota (AFTER FIX):**

| User Type | Activity Mix | Quota Per User | Max Users |
|-----------|-------------|----------------|-----------|
| **Video search only** | 30 searches/day | 3,030 | **33** |
| **Video search only** | 20 searches/day | 2,020 | **50** |
| **Video search only** | 10 searches/day | 1,010 | **99** |
| **Channel heavy** ✅ | 20 channel views/day (cached) | 600 | **166** |
| **Mixed usage** ✅ | 10 searches + 10 channels | 1,310 | **76** |

### **✅ Competitor Caching IMPLEMENTED!**

**Before fix:**
- Cached channel view = **101-401 units** (competitors fetched every time)
- Capacity: **50-60 daily users**

**After fix:**
- Cached channel view = **0 units** (everything cached for 24h) 🎉
- Capacity: **76-166 daily users** (depending on usage pattern)

**Impact: 1.5-3x increase in user capacity!**

### **Realistic capacity:**
- **76-100 daily active users** with mixed usage
- **Up to 166 users** if channel analysis heavy
- **Up to 99 users** if mostly video searches

### **What was fixed:**
1. ✅ Added `competitor_cache` table to Turso
2. ✅ Added `saveCompetitors()` and `getCompetitors()` functions
3. ✅ Updated channel API to check cache before fetching
4. ✅ Competitors now cached for 24 hours alongside channel data
5. ✅ Admin purge endpoints updated to clear competitor cache
