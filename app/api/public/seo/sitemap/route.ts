// ============================================================
// Public Sitemap API
//   GET /api/public/seo/sitemap
//
// Returns list of indexable pages for the public site's sitemap.xml.
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiKey, withCors } from "@/lib/public-auth";
import { rateLimit } from "@/lib/rate-limit";

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 60 });
    if (!rl.ok) return rl.response;

    const auth = await requireApiKey(request);
    if (!auth.ok) {
      return withCors(
        NextResponse.json({ error: auth.error }, { status: 401 })
      );
    }

    const [rows] = (await pool.query(
      `SELECT page_path, updated_at
       FROM seo_pages
       WHERE is_indexable = 1
       ORDER BY updated_at DESC
       LIMIT 5000`
    )) as any;

    return withCors(
      NextResponse.json(
        { pages: rows },
        {
          headers: {
            "Cache-Control":
              "public, max-age=600, s-maxage=3600, stale-while-revalidate=7200",
          },
        }
      )
    );
  } catch (err) {
    console.error("[public/seo/sitemap] error:", err);
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}