// ============================================================
// Next.js 16 — proxy.ts (replaces middleware.ts)
//
// Responsibilities:
//   1. Issue CSRF cookie if missing (on response)
//   2. Enforce CSRF token on API mutations
//   3. Auth redirect for /admin/* pages
//   4. Add noindex to admin pages
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  JWT_COOKIE_NAME,
} from "@/lib/constants";
import {
  generateCsrfToken,
  readCsrfFromCookieHeader,
  csrfCookieOptions,
} from "@/lib/csrf";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Endpoints exempt from CSRF (no cookie exists yet during login flow)
const CSRF_EXEMPT = new Set([
  "/api/auth/login",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
]);

const PROTECTED_PAGE_ROUTES = ["/admin"];
const AUTH_ROUTES = ["/login", "/forgot-password", "/reset-password"];

function readCookie(cookieHeader: string, name: string): string | null {
  const re = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`);
  return cookieHeader.match(re)?.[1] ?? null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();
  const cookieHeader = request.headers.get("cookie") || "";

  // ── 1. CSRF enforcement on API mutations ──
  if (
    MUTATION_METHODS.has(method) &&
    pathname.startsWith("/api/") &&
    !CSRF_EXEMPT.has(pathname)
  ) {
    const cookieToken = readCsrfFromCookieHeader(cookieHeader);
    const headerToken = request.headers.get(CSRF_HEADER_NAME);

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return NextResponse.json(
        { error: "CSRF token invalid or missing" },
        { status: 403 }
      );
    }
  }

  // ── 2. Auth redirect for /admin/* pages ──
  const isProtectedPage = PROTECTED_PAGE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthPage = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const token = readCookie(cookieHeader, JWT_COOKIE_NAME);

  if (isProtectedPage && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthPage && token) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  // ── 3. Build response + ensure CSRF cookie ──
  const response = NextResponse.next();

  // If no CSRF token yet, issue one
  const existingCsrf = readCookie(cookieHeader, CSRF_COOKIE_NAME);
  if (!existingCsrf) {
    response.cookies.set(
      CSRF_COOKIE_NAME,
      generateCsrfToken(),
      csrfCookieOptions()
    );
  }

  // ── 4. Add noindex to admin pages ──
  if (isProtectedPage) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static files, images, favicon, and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|public|images|fonts).*)",
  ],
};