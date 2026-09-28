import { NextResponse } from "next/server";
import {
  CSRF_COOKIE_NAME,
  generateCsrfToken,
  csrfCookieOptions,
} from "@/lib/csrf";

export async function GET() {
  const token = generateCsrfToken();
  const res = NextResponse.json({ csrfToken: token });
  res.cookies.set(CSRF_COOKIE_NAME, token, csrfCookieOptions());
  return res;
}