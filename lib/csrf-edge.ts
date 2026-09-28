// ============================================================
// Edge-safe CSRF helpers
//
// Uses only Web Crypto APIs available in the Edge Runtime.
// Imported by middleware.ts.
//
// For Node-only helpers (timingSafeEqual etc.) see lib/csrf.ts
// ============================================================
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "./constants";

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };

/**
 * Generate a fresh random CSRF token.
 * Uses the Web Crypto API — works in Edge Runtime.
 */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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
 * Cookie options for the CSRF token.
 * httpOnly must be FALSE so client JS can read it.
 */
export function csrfCookieOptions() {
  return {
    httpOnly: false as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  };
}