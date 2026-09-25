import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiKey, withCors } from "@/lib/public-auth";
import { rateLimit } from "@/lib/rate-limit";

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 300 });
    if (!rl.ok) return rl.response!;

    const auth = await requireApiKey(request);
    if (!auth.ok) {
      return withCors(NextResponse.json({ error: auth.error }, { status: 401 }));
    }

    const { searchParams } = new URL(request.url);
    const citySlug = (searchParams.get("city") || "").trim().toLowerCase();

    if (!citySlug) {
      return withCors(
        NextResponse.json({ error: "Query param 'city' is required" }, { status: 400 })
      );
    }

    // ============================================================
    // Find city
    // ============================================================
    const [cityRows] = (await pool.query(
      `SELECT id, name, state, country, code
       FROM cities
       WHERE LOWER(name) = ? AND is_active = 1
       LIMIT 1`,
      [citySlug]
    )) as any;

    const city = (cityRows as any[])[0];
    if (!city) {
      return withCors(
        NextResponse.json(
          { error: `City '${citySlug}' not found or inactive` },
          { status: 404 }
        )
      );
    }

    // ============================================================
    // Fetch all published sections
    // ============================================================
    const [rows] = (await pool.query(
      `SELECT section_key, content, updated_at
       FROM site_home_content
       WHERE city_id = ? AND status = 'published'`,
      [city.id]
    )) as any;

    const sections: Record<string, any> = {};
    let latestUpdate = new Date(0);

    for (const row of rows as any[]) {
      sections[row.section_key] =
        typeof row.content === "string" ? JSON.parse(row.content) : row.content;

      const rowDate = new Date(row.updated_at);
      if (rowDate > latestUpdate) latestUpdate = rowDate;
    }

    return withCors(
      NextResponse.json(
        {
          city: {
            slug: citySlug,
            name: city.name,
            state: city.state,
            code: city.code,
          },
          sections,
          updatedAt: latestUpdate.toISOString(),
        },
        {
          headers: {
            "Cache-Control":
              "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
          },
        }
      )
    );
  } catch (err: any) {
    console.error("[public/home] error:", err);
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}
