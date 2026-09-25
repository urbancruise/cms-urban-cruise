import crypto from "crypto";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "./constants";

// ============================================================
// CSRF token — generate, read, verify
//
// ⚠️ Cookies can only be SET in:
//   - Proxy (middleware)
//   - Server Actions
//   - Route Handlers
//
// We set it in proxy.ts on the response. This module provides
// read + verify helpers for all other contexts.
// ============================================================

/**
 * Generate a fresh random CSRF token.
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Read the CSRF token from a raw Cookie header string.
 * Used by proxy.ts (which has access to request.headers).
 */
export function readCsrfFromCookieHeader(cookieHeader: string): string | null {
  const re = new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]+)`);
  const match = cookieHeader.match(re);
  return match?.[1] ?? null;
}

/**
 * Verify CSRF token on an incoming request.
 * Compares cookie value with the header value.
 */
export function verifyCsrf(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookieToken = readCsrfFromCookieHeader(cookieHeader);
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) return false;

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken)
    );
  } catch {
    // Buffer length mismatch → not equal
    return false;
  }
}

/**
 * Cookie options for the CSRF token — used by proxy.ts.
 * Note: httpOnly must be FALSE so client JS can read it
 * and send it as a header.
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