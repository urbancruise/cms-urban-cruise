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
    const vehicleSlug = (searchParams.get("slug") || "").trim().toLowerCase();

    if (!citySlug) {
      return withCors(
        NextResponse.json({ error: "Query param 'city' is required" }, { status: 400 })
      );
    }

    // ============================================================
    // Find city
    // ============================================================
    const [cityRows] = (await pool.query(
      `SELECT id, name, state, code
       FROM cities
       WHERE LOWER(name) = ? AND is_active = 1
       LIMIT 1`,
      [citySlug]
    )) as any;

    const city = (cityRows as any[])[0];
    if (!city) {
      return withCors(
        NextResponse.json({ error: `City '${citySlug}' not found` }, { status: 404 })
      );
    }

    // ============================================================
    // DETAIL VIEW: single vehicle
    // ============================================================
    if (vehicleSlug) {
      const [rows] = (await pool.query(
        `SELECT vehicle_slug, meta, sections, updated_at
         FROM site_vehicle_content
         WHERE city_id = ? AND vehicle_slug = ? AND status = 'published'
         LIMIT 1`,
        [city.id, vehicleSlug]
      )) as any;

      const vehicle = (rows as any[])[0];
      if (!vehicle) {
        return withCors(
          NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
        );
      }

      return withCors(
        NextResponse.json(
          {
            city: { slug: citySlug, name: city.name },
            vehicle: {
              slug: vehicle.vehicle_slug,
              meta:
                typeof vehicle.meta === "string"
                  ? JSON.parse(vehicle.meta)
                  : vehicle.meta,
              sections:
                typeof vehicle.sections === "string"
                  ? JSON.parse(vehicle.sections)
                  : vehicle.sections,
            },
            updatedAt: vehicle.updated_at,
          },
          {
            headers: {
              "Cache-Control":
                "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
            },
          }
        )
      );
    }

    // ============================================================
    // LIST VIEW: all vehicles for city
    // ============================================================
    const [rows] = (await pool.query(
      `SELECT vehicle_slug, meta, sort_order, updated_at
       FROM site_vehicle_content
       WHERE city_id = ? AND status = 'published'
       ORDER BY sort_order ASC, vehicle_slug ASC`,
      [city.id]
    )) as any;

    const vehicles = (rows as any[]).map((r) => ({
      slug: r.vehicle_slug,
      ...(typeof r.meta === "string" ? JSON.parse(r.meta) : r.meta),
      updatedAt: r.updated_at,
    }));

    return withCors(
      NextResponse.json(
        {
          city: { slug: citySlug, name: city.name },
          vehicles,
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
    console.error("[public/vehicles] error:", err);
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}
