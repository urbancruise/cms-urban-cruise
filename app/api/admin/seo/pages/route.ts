// import { NextRequest, NextResponse } from "next/server";
// import pool from "@/lib/db";
// import { logActivity } from "@/lib/activity";
// import { rateLimit } from "@/lib/rate-limit";
// import { requireSeoAccess } from "@/lib/auth-guard";
// import { respondError } from "@/lib/api-error";

// // ============================================================
// // GET — list all SEO pages with filters
// // ============================================================
// export async function GET(request: NextRequest) {
//   try {
//     const rl = rateLimit(request, { windowMs: 60_000, max: 120 });
//     if (!rl.ok) return rl.response;

//     await requireSeoAccess(request);

//     const { searchParams } = new URL(request.url);
//     const cityId = searchParams.get("city_id");
//     const pageType = searchParams.get("page_type");
//     const filter = searchParams.get("filter");
//     const search = searchParams.get("search");
//     const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
//     const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

//     const where: string[] = ["1=1"];
//     const params: any[] = [];

//     if (cityId) {
//       where.push("sp.city_id = ?");
//       params.push(Number(cityId));
//     }
//     if (pageType) {
//       where.push("sp.page_type = ?");
//       params.push(pageType);
//     }
//     if (search) {
//       where.push("(sp.page_path LIKE ? OR sp.meta_title LIKE ?)");
//       const term = `%${search}%`;
//       params.push(term, term);
//     }
//     if (filter === "missing_title") {
//       where.push("(sp.meta_title IS NULL OR sp.meta_title = '')");
//     } else if (filter === "missing_description") {
//       where.push("(sp.meta_description IS NULL OR sp.meta_description = '')");
//     } else if (filter === "noindex") {
//       where.push("sp.is_indexable = 0");
//     }

//     const whereClause = where.join(" AND ");

//     const [rows] = (await pool.query(
//       `SELECT
//          sp.*,
//          c.name AS city_name
//        FROM seo_pages sp
//        LEFT JOIN cities c ON c.id = sp.city_id
//        WHERE ${whereClause}
//        ORDER BY sp.updated_at DESC
//        LIMIT ${limit} OFFSET ${offset}`,
//       params
//     )) as any;

//     const [countRows] = (await pool.query(
//       `SELECT COUNT(*) AS total
//        FROM seo_pages sp
//        WHERE ${whereClause}`,
//       params
//     )) as any;

//     const pages = (rows as any[]).map((r) => ({
//       ...r,
//       is_indexable: Boolean(r.is_indexable),
//       secondary_keywords:
//         typeof r.secondary_keywords === "string"
//           ? JSON.parse(r.secondary_keywords)
//           : r.secondary_keywords || [],
//       schema_json:
//         typeof r.schema_json === "string"
//           ? JSON.parse(r.schema_json)
//           : r.schema_json || null,
//     }));

//     return NextResponse.json({
//       pages,
//       total: Number((countRows as any[])[0]?.total) || 0,
//       limit,
//       offset,
//     });
//   } catch (err) {
//     return respondError(err, "GET /api/admin/seo/pages");
//   }
// }

// // ============================================================
// // POST — create new SEO page entry
// // ============================================================
// export async function POST(request: NextRequest) {
//   try {
//     const rl = rateLimit(request, { windowMs: 60_000, max: 30 });
//     if (!rl.ok) return rl.response;

//     const decoded = await requireSeoAccess(request);
//     const body = await request.json();

//     const {
//       city_id,
//       page_path,
//       slug,
//       page_type,
//       page_title,
//       favicon_url,
//       meta_title,
//       meta_description,
//       focus_keyword,
//       meta_keywords,
//       canonical_url,
//       robots_meta,
//       is_indexable,
//       og_title,
//       og_description,
//       og_image,
//       og_url,
//       og_type,
//       feature_image,
//       feature_image_public_id,
//       twitter_card,
//       twitter_domain,
//       twitter_url,
//       twitter_image,
//       twitter_title,
//       twitter_description,
//       schema_json,
//     } = body;

//     if (!page_path || !page_type) {
//       return NextResponse.json(
//         { error: "page_path and page_type required" },
//         { status: 400 }
//       );
//     }

//     const [result] = await pool.query(
//       `INSERT INTO seo_pages
//        (city_id, page_path, slug, page_type,
//         page_title, favicon_url,
//         meta_title, meta_description,
//         focus_keyword, meta_keywords,
//         canonical_url, robots_meta, is_indexable,
//         og_title, og_description, og_image, og_url, og_type,
//         feature_image, feature_image_public_id,
//         twitter_card, twitter_domain, twitter_url, twitter_image,
//         twitter_title, twitter_description,
//         schema_json)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         city_id || null,
//         page_path,
//         slug || null,
//         page_type,
//         page_title || null,
//         favicon_url || null,
//         meta_title || null,
//         meta_description || null,
//         focus_keyword || null,
//         meta_keywords || null,
//         canonical_url || null,
//         robots_meta || "index, follow",
//         is_indexable !== false ? 1 : 0,
//         og_title || null,
//         og_description || null,
//         og_image || null,
//         og_url || null,
//         og_type || "website",
//         feature_image || null,
//         feature_image_public_id || null,
//         twitter_card || null,
//         twitter_domain || null,
//         twitter_url || null,
//         twitter_image || null,
//         twitter_title || null,
//         twitter_description || null,
//         schema_json ? JSON.stringify(schema_json) : null,
//       ]
//     );

//     const insertId = (result as any).insertId;

//     await logActivity({
//       actor: {
//         userId: decoded.userId,
//         userName: decoded.username || `User #${decoded.userId}`,
//       },
//       action: "create",
//       entityType: "profile",
//       entityId: insertId,
//       entityName: `seo_page:${page_path}`,
//       changes: { page_path, slug, page_type, city_id },
//       request,
//     });

//     return NextResponse.json(
//       { success: true, id: insertId },
//       { status: 201 }
//     );
//   } catch (err) {
//     return respondError(err, "POST /api/admin/seo/pages");
//   }
// }

// ============================================================
// GET  /api/admin/seo/pages    — list with filters + pagination
// POST /api/admin/seo/pages    — create new SEO page
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { rateLimit } from "@/lib/rate-limit";
import { requireSeoAccess } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { revalidateWebsite } from "@/lib/revalidate";

// ============================================================
// GET — list all SEO pages with filters
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 120 });
    if (!rl.ok) return rl.response;

    await requireSeoAccess(request);

    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get("city_id");
    const pageType = searchParams.get("page_type");
    const filter = searchParams.get("filter");
    const search = searchParams.get("search");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

    const where: string[] = ["1=1"];
    const params: any[] = [];

    if (cityId) {
      where.push("sp.city_id = ?");
      params.push(Number(cityId));
    }
    if (pageType) {
      where.push("sp.page_type = ?");
      params.push(pageType);
    }
    if (search) {
      where.push("(sp.page_path LIKE ? OR sp.meta_title LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term);
    }
    if (filter === "missing_title") {
      where.push("(sp.meta_title IS NULL OR sp.meta_title = '')");
    } else if (filter === "missing_description") {
      where.push("(sp.meta_description IS NULL OR sp.meta_description = '')");
    } else if (filter === "noindex") {
      where.push("sp.is_indexable = 0");
    }

    const whereClause = where.join(" AND ");

    const [rows] = (await pool.query(
      `SELECT
         sp.*,
         c.name AS city_name
       FROM seo_pages sp
       LEFT JOIN cities c ON c.id = sp.city_id
       WHERE ${whereClause}
       ORDER BY sp.updated_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    )) as any;

    const [countRows] = (await pool.query(
      `SELECT COUNT(*) AS total
       FROM seo_pages sp
       WHERE ${whereClause}`,
      params
    )) as any;

    const pages = (rows as any[]).map((r) => ({
      ...r,
      is_indexable: Boolean(r.is_indexable),
      secondary_keywords:
        typeof r.secondary_keywords === "string"
          ? safeJsonParse(r.secondary_keywords, [])
          : r.secondary_keywords || [],
      schema_json:
        typeof r.schema_json === "string"
          ? safeJsonParse(r.schema_json, null)
          : r.schema_json || null,
    }));

    return NextResponse.json({
      pages,
      total: Number((countRows as any[])[0]?.total) || 0,
      limit,
      offset,
    });
  } catch (err) {
    return respondError(err, "GET /api/admin/seo/pages");
  }
}

// ============================================================
// POST — create new SEO page entry
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 30 });
    if (!rl.ok) return rl.response;

    const decoded = await requireSeoAccess(request);
    const body = await request.json();

    const {
      city_id,
      page_path,
      slug,
      page_type,
      page_title,
      favicon_url,
      meta_title,
      meta_description,
      focus_keyword,
      meta_keywords,
      canonical_url,
      robots_meta,
      is_indexable,
      og_title,
      og_description,
      og_image,
      og_url,
      og_type,
      feature_image,
      feature_image_public_id,
      twitter_card,
      twitter_domain,
      twitter_url,
      twitter_image,
      twitter_title,
      twitter_description,
      schema_json,
    } = body;

    if (!page_path || !page_type) {
      return NextResponse.json(
        { error: "page_path and page_type required" },
        { status: 400 }
      );
    }

    // Uniqueness guard for page_path
    const [existing] = (await pool.query(
      "SELECT id FROM seo_pages WHERE page_path = ? LIMIT 1",
      [page_path]
    )) as any;
    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: `An SEO entry already exists for ${page_path}` },
        { status: 409 }
      );
    }

    // Normalize schema_json to array (SchemaEditor already sends an array)
    const schemaToStore = Array.isArray(schema_json)
      ? schema_json
      : schema_json
      ? [schema_json]
      : null;

    const [result] = await pool.query(
      `INSERT INTO seo_pages
       (city_id, page_path, slug, page_type,
        page_title, favicon_url,
        meta_title, meta_description,
        focus_keyword, meta_keywords,
        canonical_url, robots_meta, is_indexable,
        og_title, og_description, og_image, og_url, og_type,
        feature_image, feature_image_public_id,
        twitter_card, twitter_domain, twitter_url, twitter_image,
        twitter_title, twitter_description,
        schema_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        city_id || null,
        page_path,
        slug || null,
        page_type,
        page_title || null,
        favicon_url || null,
        meta_title || null,
        meta_description || null,
        focus_keyword || null,
        meta_keywords || null,
        canonical_url || null,
        robots_meta || "index, follow",
        is_indexable !== false ? 1 : 0,
        og_title || null,
        og_description || null,
        og_image || null,
        og_url || null,
        og_type || "website",
        feature_image || null,
        feature_image_public_id || null,
        twitter_card || "summary_large_image",
        twitter_domain || null,
        twitter_url || null,
        twitter_image || null,
        twitter_title || null,
        twitter_description || null,
        schemaToStore ? JSON.stringify(schemaToStore) : null,
      ]
    );

    const insertId = (result as any).insertId;

    // ─── Fire revalidation on the public website ───
    await revalidateWebsite({
      tags: [`seo:${page_path}`],
      paths: [page_path, "/sitemap.xml"],
    });

    // ─── Log activity ───
    await logActivity({
      actor: {
        userId: decoded.userId,
        userName: decoded.username || `User #${decoded.userId}`,
      },
      action: "create",
      entityType: "profile",
      entityId: insertId,
      entityName: `seo_page:${page_path}`,
      changes: { page_path, slug, page_type, city_id },
      request,
    });

    return NextResponse.json(
      { success: true, id: insertId },
      { status: 201 }
    );
  } catch (err) {
    return respondError(err, "POST /api/admin/seo/pages");
  }
}

// ============================================================
// Helpers
// ============================================================
function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
