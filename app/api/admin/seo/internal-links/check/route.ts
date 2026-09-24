import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

async function requireAuth(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) throw { status: 401, message: "Not authenticated" };
  return jwt.verify(token, process.env.JWT_SECRET || "fallback_secret") as { userId: number; role: string; roles?: string[] };
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    // Simple heuristic: any internal link whose target is not in seo_pages is marked broken
    const [pageRows] = (await pool.query("SELECT page_path FROM seo_pages")) as any;
    const validPaths = new Set((pageRows as any[]).map((p) => p.page_path));

    const [linkRows] = (await pool.query("SELECT id, target_path FROM seo_internal_links")) as any;

    for (const link of linkRows as any[]) {
      const isBroken = !validPaths.has(link.target_path);
      await pool.query(
        "UPDATE seo_internal_links SET is_broken = ?, last_checked_at = NOW() WHERE id = ?",
        [isBroken ? 1 : 0, link.id]
      );
    }

    return NextResponse.json({ success: true, checked: (linkRows as any[]).length });
  } catch (err: any) {
    if (err.status) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}