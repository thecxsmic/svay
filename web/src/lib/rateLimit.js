// Memory store for rate limits
const rateLimitStore = new Map();

/**
 * Checks rate limiting details for a request.
 * Uses a sliding window algorithm.
 * 
 * @param {string} key Unique identifier for the client (e.g. user ID or IP)
 * @param {number} limit Maximum number of requests allowed in the window
 * @param {number} windowMs Time window in milliseconds
 * @returns {{limited: boolean, limit: number, remaining: number, reset: number}} Rate limit status and metadata
 */
export function checkRateLimit(key, limit, windowMs = 60000) {
  const now = Date.now();
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, [now]);
    return {
      limited: false,
      limit,
      remaining: limit - 1,
      reset: now + windowMs
    };
  }
  
  const timestamps = rateLimitStore.get(key);
  // Filter out expired timestamps
  const validTimestamps = timestamps.filter(time => now - time < windowMs);
  
  const oldestTimestamp = validTimestamps.length > 0 ? validTimestamps[0] : now;
  const resetTime = oldestTimestamp + windowMs;
  
  if (validTimestamps.length >= limit) {
    // Keep valid timestamps in store
    rateLimitStore.set(key, validTimestamps);
    return {
      limited: true,
      limit,
      remaining: 0,
      reset: resetTime
    };
  }
  
  validTimestamps.push(now);
  rateLimitStore.set(key, validTimestamps);
  
  return {
    limited: false,
    limit,
    remaining: limit - validTimestamps.length,
    reset: resetTime
  };
}

/**
 * Checks if a request should be rate-limited.
 * Uses a sliding window algorithm.
 * 
 * @param {string} key Unique identifier for the client (e.g. user ID or IP)
 * @param {number} limit Maximum number of requests allowed in the window
 * @param {number} windowMs Time window in milliseconds
 * @returns {boolean} True if rate limited, false otherwise
 */
export function isRateLimited(key, limit, windowMs = 60000) {
  return checkRateLimit(key, limit, windowMs).limited;
}


// Periodically clean up extremely old keys to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of rateLimitStore.entries()) {
      const validTimestamps = timestamps.filter(time => now - time < 3600000); // 1 hour
      if (validTimestamps.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, validTimestamps);
      }
    }
  }, 600000); // every 10 minutes
}
