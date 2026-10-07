import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireSeoAccess } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 120 });
    if (!rl.ok) return rl.response;
    await requireSeoAccess(request);
    const [rows] = (await pool.query(
      `SELECT * FROM seo_technical ORDER BY checked_at DESC LIMIT 100`
    )) as any;
    return NextResponse.json({ checks: rows });
  } catch (err) {
    return respondError(err, "GET /api/admin/seo/technical");
  }
}
