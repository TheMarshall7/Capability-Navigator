// Simple sliding-window rate limiter using an in-memory Map.
//
// Trade-off: the Map resets on every cold start in serverless environments
// (Vercel, etc.), which means the limit is per-instance, not global.
// That's acceptable for V1 with low traffic.
//
// For production at scale, swap the store for Upstash Redis:
//   https://upstash.com/docs/oss/sdks/ratelimit/overview
//   npm install @upstash/ratelimit @upstash/redis

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

// Cleanup old entries periodically to prevent memory leaks
let lastClean = Date.now()
function cleanStore() {
  const now = Date.now()
  if (now - lastClean < 60_000) return
  lastClean = now
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number   // ms timestamp
  retryAfter: number // seconds until reset
}

/**
 * @param key     - Usually the user ID or IP address
 * @param limit   - Max requests in the window
 * @param windowMs - Window size in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  cleanStore()
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt, retryAfter: 0 }
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  entry.count++
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
    retryAfter: 0,
  }
}
