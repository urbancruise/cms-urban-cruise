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
    if (!rl.ok) return withCors(rl.response);

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

    if (path) {
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
    } else if (slug) {
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
        NextResponse.json(
          { error: "SEO entry not found" },
          { status: 404 }
        )
      );
    }

    const pageSchemas = parseJsonValue(row.schema_json);
    const schemas: unknown[] = Array.isArray(pageSchemas)
      ? pageSchemas
      : pageSchemas
        ? [pageSchemas]
        : [];
    const [managedSchemaRows] = (await pool.query(
      `SELECT schema_json FROM seo_schemas
       WHERE is_active = 1
         AND (page_path = ? OR page_path IS NULL)
         AND (city_id = ? OR city_id IS NULL)
       ORDER BY city_id IS NULL, id`,
      [row.page_path, row.city_id || null]
    )) as any;
    for (const schemaRow of managedSchemaRows as Array<{ schema_json: unknown }>) {
      const schema = parseJsonValue(schemaRow.schema_json);
      if (Array.isArray(schema)) schemas.push(...schema);
      else if (schema) schemas.push(schema);
    }
    const [imageRows] = (await pool.query(
      `SELECT image_url, alt_text, title_text, caption
       FROM seo_images
       WHERE page_path = ? AND (city_id = ? OR city_id IS NULL)
       ORDER BY id`,
      [row.page_path, row.city_id || null]
    )) as any;

    const [integrationRows] = (await pool.query(
      `SELECT setting_key, setting_value FROM seo_settings
       WHERE setting_key IN (
         'gsc_verification',
         'bing_verification',
         'ga_measurement_id',
         'gtm_id',
         'facebook_pixel_id',
         'site_name',
         'site_url',
         'default_meta_title',
         'default_meta_description',
         'default_og_image',
         'default_twitter_handle',
         'default_twitter_card',
         'default_robots',
         'robots_txt_content'
       )`
    )) as any;
    const integrationSettings = Object.fromEntries(
      (integrationRows as Array<{ setting_key: string; setting_value: string }>).map(
        (setting) => [setting.setting_key, setting.setting_value]
      )
    );

    const siteName = integrationSettings.site_name || "Urban Cruise";
    const metaTitle =
      row.meta_title ||
      applyTitleTemplate(
        integrationSettings.default_meta_title,
        row.page_title || row.page_path,
        siteName
      );
    const metaDescription =
      row.meta_description || integrationSettings.default_meta_description || null;
    const canonicalUrl =
      row.canonical_url ||
      buildCanonicalUrl(
        row.page_path,
        integrationSettings.site_url || process.env.WEBSITE_ORIGIN || ""
      );
    const ogImage =
      row.og_image ||
      row.feature_image ||
      integrationSettings.default_og_image ||
      null;
    const robotsMeta =
      row.robots_meta || integrationSettings.default_robots || "index, follow";
    const keywords = row.meta_keywords
      ? row.meta_keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
      : [];

    const seo = {
      id: row.id,
      path: row.page_path,
      slug: row.slug,
      page_type: row.page_type,
      city_name: row.city_name,
      title: row.page_title || metaTitle,
      favicon_url: row.favicon_url || null,
      meta_title: metaTitle,
      meta_description: metaDescription,
      meta_keywords: keywords,
      focus_keyword: row.focus_keyword || null,
      canonical_url: canonicalUrl,
      robots_meta: robotsMeta,
      is_indexable: Boolean(row.is_indexable),
      feature_image: row.feature_image || null,
      og_title: row.og_title || metaTitle,
      og_description: row.og_description || metaDescription,
      og_image: ogImage,
      og_url: row.og_url || canonicalUrl,
      og_type: row.og_type || "website",
      twitter_card:
        row.twitter_card ||
        integrationSettings.default_twitter_card ||
        "summary_large_image",
      twitter_site: integrationSettings.default_twitter_handle || null,
      twitter_creator: integrationSettings.default_twitter_handle || null,
      twitter_domain: row.twitter_domain || null,
      twitter_url: row.twitter_url || canonicalUrl,
      twitter_image: row.twitter_image || ogImage,
      twitter_title: row.twitter_title || metaTitle,
      twitter_description:
        row.twitter_description || metaDescription,
      schemas,
      content_json: parseJsonValue(row.content_json),
      images: imageRows,
      integrations: {
        googleVerification: integrationSettings.gsc_verification || null,
        bingVerification: integrationSettings.bing_verification || null,
        gaMeasurementId: integrationSettings.ga_measurement_id || null,
        googleTagManagerId: integrationSettings.gtm_id || null,
        facebookPixelId: integrationSettings.facebook_pixel_id || null,
        robotsTxtContent: integrationSettings.robots_txt_content || null,
      },
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
      NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    );
  }
}

function applyTitleTemplate(
  template: string | undefined,
  pageTitle: string,
  siteName: string
): string | null {
  if (!template) return null;
  return template
    .replace(/%page%/gi, pageTitle)
    .replace(/%site(?:_name)?%/gi, siteName)
    .trim();
}

function buildCanonicalUrl(pagePath: string, siteUrl: string): string | null {
  try {
    const base = new URL(siteUrl);
    const canonical = new URL(pagePath, base);
    return canonical.origin === base.origin ? canonical.toString() : null;
  } catch {
    return null;
  }
}

function parseJsonValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}