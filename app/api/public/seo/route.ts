// ============================================================
// Public SEO API
//   GET /api/public/seo?path=/delhi
//   GET /api/public/seo?slug=ertiga&city=delhi
//
// Returns everything needed for a page's <head>:
//   - title, favicon
//   - meta_title, meta_description, meta_keywords
//   - canonical_url, robots_meta, is_indexable
//   - feature_image
//   - og_* (title, description, image, url, type)
//   - twitter_* (card, domain, url, image, title, description)
//   - schemas (array of JSON-LD objects)
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
    const rl = rateLimit(request, { windowMs: 60_000, max: 300 });
    if (!rl.ok) return rl.response;

    const auth = await requireApiKey(request);
    if (!auth.ok) {
      return withCors(
        NextResponse.json({ error: auth.error }, { status: 401 })
      );
    }

    const { searchParams } = new URL(request.url);
    const path = (searchParams.get("path") || "").trim();
    const slug = (searchParams.get("slug") || "").trim();
    const citySlug = (searchParams.get("city") || "").trim().toLowerCase();

    let row: any = null;

    // ── Lookup by path ──
    if (path) {
      // Normalize: strip trailing slash, ensure leading slash
      const normalized = "/" + path.replace(/^\/+|\/+$/g, "");

      const [rows] = (await pool.query(
        `SELECT sp.*, c.name AS city_name
         FROM seo_pages sp
         LEFT JOIN cities c ON c.id = sp.city_id
         WHERE sp.page_path = ?
         LIMIT 1`,
        [normalized]
      )) as any;
      row = (rows as any[])[0] || null;

      // Fallback: try the raw path as-is
      if (!row && normalized !== path) {
        const [rows2] = (await pool.query(
          `SELECT sp.*, c.name AS city_name
           FROM seo_pages sp
           LEFT JOIN cities c ON c.id = sp.city_id
           WHERE sp.page_path = ?
           LIMIT 1`,
          [path]
        )) as any;
        row = (rows2 as any[])[0] || null;
      }
    }
    // ── Lookup by slug ──
    else if (slug) {
      if (citySlug) {
        const [rows] = (await pool.query(
          `SELECT sp.*, c.name AS city_name
           FROM seo_pages sp
           INNER JOIN cities c ON c.id = sp.city_id
           WHERE sp.slug = ? AND LOWER(c.name) = ?
           LIMIT 1`,
          [slug, citySlug]
        )) as any;
        row = (rows as any[])[0] || null;
      } else {
        const [rows] = (await pool.query(
          `SELECT sp.*, c.name AS city_name
           FROM seo_pages sp
           LEFT JOIN cities c ON c.id = sp.city_id
           WHERE sp.slug = ?
           ORDER BY sp.updated_at DESC
           LIMIT 1`,
          [slug]
        )) as any;
        row = (rows as any[])[0] || null;
      }
    } else {
      return withCors(
        NextResponse.json(
          { error: "Provide either ?path=/... or ?slug=..." },
          { status: 400 }
        )
      );
    }

    if (!row) {
      return withCors(
        NextResponse.json({ error: "SEO entry not found" }, { status: 404 })
      );
    }

    // ── Normalize ──
    const schemas: any[] = Array.isArray(row.schema_json)
      ? row.schema_json
      : row.schema_json
      ? [row.schema_json]
      : [];

    const keywords = row.meta_keywords
      ? row.meta_keywords
          .split(",")
          .map((k: string) => k.trim())
          .filter(Boolean)
      : [];

    const seo = {
      id: row.id,
      path: row.page_path,
      slug: row.slug,
      page_type: row.page_type,
      city_name: row.city_name,

      // <title> and <link rel="icon">
      title: row.page_title || row.meta_title || null,
      favicon_url: row.favicon_url || null,

      // Meta tags
      meta_title: row.meta_title || null,
      meta_description: row.meta_description || null,
      meta_keywords: keywords,
      focus_keyword: row.focus_keyword || null,

      // Canonical + Robots
      canonical_url: row.canonical_url || null,
      robots_meta: row.robots_meta || "index, follow",
      is_indexable: Boolean(row.is_indexable),

      // Feature image (used as fallback for og/twitter images)
      feature_image: row.feature_image || null,

      // Open Graph
      og_title: row.og_title || row.meta_title || null,
      og_description: row.og_description || row.meta_description || null,
      og_image: row.og_image || row.feature_image || null,
      og_url: row.og_url || row.canonical_url || null,
      og_type: row.og_type || "website",

      // Twitter
      twitter_card: row.twitter_card || "summary_large_image",
      twitter_domain: row.twitter_domain || null,
      twitter_url: row.twitter_url || row.canonical_url || null,
      twitter_image: row.twitter_image || row.feature_image || null,
      twitter_title: row.twitter_title || row.meta_title || null,
      twitter_description:
        row.twitter_description || row.meta_description || null,

      // JSON-LD array — each becomes its own <script type="application/ld+json">
      schemas,

      updated_at: row.updated_at,
    };

    return withCors(
      NextResponse.json(
        { seo },
        {
          headers: {
            "Cache-Control":
              "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
          },
        }
      )
    );
  } catch (err: any) {
    console.error("[public/seo] error:", err);
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}