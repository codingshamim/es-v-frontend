/**
 * In-memory rate limiter. For multi-instance production, use Redis (e.g. @upstash/ratelimit).
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

const WINDOW_MS = 60 * 1000; // 1 minute
const CLEANUP_INTERVAL_MS = 60 * 1000; // cleanup every minute

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}

let cleanupTimer: ReturnType<typeof setInterval> | null = null;
function scheduleCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(cleanup, CLEANUP_INTERVAL_MS);
  if (cleanupTimer.unref) cleanupTimer.unref();
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check and consume one request. Returns success: false if over limit.
 */
export function rateLimit(
  key: string,
  maxRequests: number,
): RateLimitResult {
  scheduleCleanup();
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + WINDOW_MS };
    store.set(key, entry);
    return { success: true, remaining: maxRequests - 1, resetAt: entry.resetAt };
  }

  entry.count += 1;
  if (entry.count > maxRequests) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }
  return {
    success: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/** Contact form: 10 submissions per minute per IP */
export const CONTACT_LIMIT = 10;

/** Admin APIs: 120 requests per minute per user (generous) */
export const ADMIN_LIMIT = 120;

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
