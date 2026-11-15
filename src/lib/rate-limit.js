
/**
 * Very small in-memory rate limiter.
 *
 * It protects a single Node.js process, which is enough for local development
 * and a single server. On serverless or multi-instance deployments replace the
 * Map with Redis (or another shared store) so limits apply across instances.
 */
const buckets = new Map();
let lastSweep = 0;
const SWEEP_INTERVAL_MS = 60 * 1000;

function sweep(now) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) {
    return;
  }

  lastSweep = now;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function consumeAttempt(
  key,
  { limit = 10, windowMs = 15 * 60 * 1000 } = {}
) {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return { allowed: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

export function resetAttempts(key) {
  buckets.delete(key);
}

export function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") || "unknown";
}
