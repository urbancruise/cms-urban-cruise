import { NextRequest, NextResponse } from "next/server";
import { RATE_LIMIT_WINDOW_MS } from "./constants";

// ============================================================
// In-memory rate limiter (per-IP, per-route).
// ⚠️ For multi-instance deployments, replace with Redis/Upstash.
// ============================================================

interface Bucket {
  count: number;
  reset: number;
}

const buckets = new Map<string, Bucket>();

interface Options {
  windowMs?: number;
  max?: number;
}

export type RateLimitResult =
  | { ok: true; remaining: number; reset: number }
  | { ok: false; remaining: 0; reset: number; response: NextResponse };

export function rateLimit(
  request: NextRequest,
  { windowMs = RATE_LIMIT_WINDOW_MS, max = 100 }: Options = {}
): RateLimitResult {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const key = `${ip}:${request.nextUrl.pathname}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: max - 1, reset: now + windowMs };
  }

  bucket.count++;

  if (bucket.count > max) {
    return {
      ok: false,
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

  return { ok: true, remaining: max - bucket.count, reset: bucket.reset };
}

// Periodic cleanup
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, val] of buckets.entries()) {
      if (val.reset < now) buckets.delete(key);
    }
  }, 300_000);
  // Prevent the interval from holding the process open in edge runtimes
  if (typeof timer === "object" && "unref" in timer) {
    (timer as any).unref?.();
  }
}
