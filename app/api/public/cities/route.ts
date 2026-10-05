// app/api/public/cities/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiKey, withCors } from "@/lib/public-auth";
import { rateLimit } from "@/lib/rate-limit";

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 300 });
    if (!rl.ok) return withCors(rl.response!);

    const auth = await requireApiKey(request);
    if (!auth.ok) {
      return withCors(
        NextResponse.json({ error: auth.error }, { status: 401 })
      );
    }

    const [rows] = (await pool.query(
      `SELECT id, name, state, country, code, image_url
       FROM cities
       WHERE is_active = 1
       ORDER BY name ASC`
    )) as any;

    const cities = (rows as any[]).map((c) => ({
      id: c.id,
      name: c.name,
      state: c.state,
      country: c.country,
      code: c.code,
      image_url: c.image_url || null,
      slug: String(c.name).toLowerCase().trim().replace(/\s+/g, "-"),
    }));

    return withCors(
      NextResponse.json(
        { cities },
        {
          headers: {
            "Cache-Control":
              "public, max-age=300, s-maxage=600, stale-while-revalidate=1200",
          },
        }
      )
    );
  } catch (err) {
    console.error("[public/cities] error:", err);
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}