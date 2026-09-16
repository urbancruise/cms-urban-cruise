import crypto from "crypto";
import { cookies } from "next/headers";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

// Server-side: generate CSRF token
export async function ensureCsrfCookie(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_COOKIE)?.value;
  if (!token) {
    token = crypto.randomBytes(32).toString("hex");
    cookieStore.set(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  }
  return token;
}

// Server-side: verify CSRF token on mutations
export function verifyCsrf(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/csrf_token=([^;]+)/);
  const cookieToken = match?.[1];
  const headerToken = request.headers.get(CSRF_HEADER);
  return Boolean(cookieToken && headerToken && cookieToken === headerToken);
}