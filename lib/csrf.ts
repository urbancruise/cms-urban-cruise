import crypto from "crypto";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "./constants";

// ============================================================
// Node.js-only CSRF helpers.
//
// ⚠️ Import from this file ONLY in Node.js runtime contexts:
//   - Route handlers (app/api/**/route.ts)
//   - Server actions
//   - Server components
//
// For middleware (Edge Runtime), import from lib/csrf-edge.ts
// ============================================================

// Re-export constants so existing imports from "@/lib/csrf" keep working
export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };

/**
 * Generate a fresh random CSRF token (Node.js).
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Read the CSRF token from a raw Cookie header string.
 */
export function readCsrfFromCookieHeader(cookieHeader: string): string | null {
  const escaped = CSRF_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?:^|;\\s*)${escaped}=([^;]+)`);
  const match = cookieHeader.match(re);
  return match?.[1] ?? null;
}

/**
 * Verify CSRF token using constant-time comparison.
 */
export function verifyCsrf(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookieToken = readCsrfFromCookieHeader(cookieHeader);
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken)
    );
  } catch {
    return false;
  }
}

/**
 * Cookie options for the CSRF token.
 */
export function csrfCookieOptions() {
  return {
    httpOnly: false as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24,
  };
}