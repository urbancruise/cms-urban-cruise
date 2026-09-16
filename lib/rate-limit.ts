import { NextRequest, NextResponse } from "next/server";

// ============================================================
// In-memory rate limiter (per-IP, per-route).
// For multi-instance, replace with Redis.
// ============================================================
const buckets = new Map<string, { count: number; reset: number }>();

interface Options {
  windowMs?: number;
  max?: number;
}

export function rateLimit(
  request: NextRequest,
  { windowMs = 60000, max = 100 }: Options = {}
) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const key = `${ip}:${request.nextUrl.pathname}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true as const, remaining: max - 1, reset: now + windowMs };
  }

  bucket.count++;
  if (bucket.count > max) {
    return {
      ok: false as const,
      remaining: 0,
      reset: bucket.reset,
      response: NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((bucket.reset - now) / 1000)),
            "X-RateLimit-Limit": String(max),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(bucket.reset / 1000)),
          },
        }
      ),
    };
  }

  return { ok: true as const, remaining: max - bucket.count, reset: bucket.reset };
}

// Cleanup old buckets every 5 min
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of buckets.entries()) {
      if (val.reset < now) buckets.delete(key);
    }
  }, 300000);
}