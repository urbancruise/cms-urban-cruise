// import { NextRequest, NextResponse } from "next/server";
// import pool from "@/lib/db";
// import { logActivity } from "@/lib/activity";
// import { rateLimit } from "@/lib/rate-limit";
// import { requireSeoAccess } from "@/lib/auth-guard";
// import { respondError } from "@/lib/api-error";

// // ============================================================
// // GET single page
// // ============================================================
// export async function GET(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const rl = rateLimit(request, { windowMs: 60_000, max: 120 });
//     if (!rl.ok) return rl.response;

//     await requireSeoAccess(request);
//     const { id } = await params;

//     const [rows] = (await pool.query(
//       `SELECT sp.*, c.name AS city_name
//        FROM seo_pages sp
//        LEFT JOIN cities c ON c.id = sp.city_id
//        WHERE sp.id = ?`,
//       [id]
//     )) as any;

//     const page = (rows as any[])[0];
//     if (!page) {
//       return NextResponse.json({ error: "Not found" }, { status: 404 });
//     }

//     page.is_indexable = Boolean(page.is_indexable);
//     page.secondary_keywords =
//       typeof page.secondary_keywords === "string"
//         ? JSON.parse(page.secondary_keywords)
//         : page.secondary_keywords || [];
//     page.schema_json =
//       typeof page.schema_json === "string"
//         ? JSON.parse(page.schema_json)
//         : page.schema_json || null;

//     return NextResponse.json({ page });
//   } catch (err) {
//     return respondError(err, "GET /api/admin/seo/pages/[id]");
//   }
// }

// // ============================================================
// // PUT — update page
// // ============================================================
// export async function PUT(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const rl = rateLimit(request, { windowMs: 60_000, max: 60 });
//     if (!rl.ok) return rl.response;

//     const decoded = await requireSeoAccess(request);
//     const { id } = await params;
//     const body = await request.json();

//     const fields: string[] = [];
//     const values: any[] = [];

//     const allowed = [
//       "page_title",
//       "favicon_url",
//       "slug",
//       "meta_title",
//       "meta_description",
//       "focus_keyword",
//       "meta_keywords",
//       "secondary_keywords",
//       "canonical_url",
//       "robots_meta",
//       "is_indexable",
//       "og_title",
//       "og_description",
//       "og_image",
//       "og_url",
//       "og_type",
//       "feature_image",
//       "feature_image_public_id",
//       "twitter_card",
//       "twitter_domain",
//       "twitter_url",
//       "twitter_image",
//       "twitter_title",
//       "twitter_description",
//       "schema_json",
//       "seo_score",
//       "word_count",
//       "readability_score",
//     ];

//     for (const key of allowed) {
//       if (key in body) {
//         fields.push(`${key} = ?`);
//         let val = body[key];

//         if (key === "secondary_keywords" || key === "schema_json") {
//           val = val == null ? null : JSON.stringify(val);
//         } else if (key === "is_indexable") {
//           val = val ? 1 : 0;
//         }

//         values.push(val);
//       }
//     }

//     if (fields.length === 0) {
//       return NextResponse.json(
//         { error: "No fields to update" },
//         { status: 400 }
//       );
//     }

//     values.push(id);
//     await pool.query(
//       `UPDATE seo_pages SET ${fields.join(", ")} WHERE id = ?`,
//       values
//     );

//     await logActivity({
//       actor: {
//         userId: decoded.userId,
//         userName: decoded.username || `User #${decoded.userId}`,
//       },
//       action: "update",
//       entityType: "profile",
//       entityId: Number(id),
//       entityName: `seo_page:${body.slug || id}`,
//       changes: body,
//       request,
//     });

//     return NextResponse.json({ success: true });
//   } catch (err) {
//     return respondError(err, "PUT /api/admin/seo/pages/[id]");
//   }
// }

// // ============================================================
// // DELETE page
// // ============================================================
// export async function DELETE(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const rl = rateLimit(request, { windowMs: 60_000, max: 20 });
//     if (!rl.ok) return rl.response;

//     await requireSeoAccess(request);
//     const { id } = await params;

//     await pool.query("DELETE FROM seo_pages WHERE id = ?", [id]);

//     return NextResponse.json({ success: true });
//   } catch (err) {
//     return respondError(err, "DELETE /api/admin/seo/pages/[id]");
//   }
// }

// ============================================================
// GET    /api/admin/seo/pages/[id]  — fetch single page
// PUT    /api/admin/seo/pages/[id]  — update page
// DELETE /api/admin/seo/pages/[id]  — delete page
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { rateLimit } from "@/lib/rate-limit";
import { requireSeoAccess } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { revalidateWebsite } from "@/lib/revalidate";

// ============================================================
// GET single page
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 120 });
    if (!rl.ok) return rl.response;

    await requireSeoAccess(request);
    const { id } = await params;

    const [rows] = (await pool.query(
      `SELECT sp.*, c.name AS city_name
       FROM seo_pages sp
       LEFT JOIN cities c ON c.id = sp.city_id
       WHERE sp.id = ?
       LIMIT 1`,
      [id]
    )) as any;

    const page = (rows as any[])[0];
    if (!page) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    page.is_indexable = Boolean(page.is_indexable);
    page.secondary_keywords =
      typeof page.secondary_keywords === "string"
        ? safeJsonParse(page.secondary_keywords, [])
        : page.secondary_keywords || [];
    page.schema_json =
      typeof page.schema_json === "string"
        ? safeJsonParse(page.schema_json, null)
        : page.schema_json || null;

    return NextResponse.json({ page });
  } catch (err) {
    return respondError(err, "GET /api/admin/seo/pages/[id]");
  }
}

// ============================================================
// PUT — update page
// ============================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 60 });
    if (!rl.ok) return rl.response;

    const decoded = await requireSeoAccess(request);
    const { id } = await params;
    const body = await request.json();

    // Load existing row so we can diff for revalidation
    const [existingRows] = (await pool.query(
      "SELECT id, page_path FROM seo_pages WHERE id = ? LIMIT 1",
      [id]
    )) as any;
    const existing = (existingRows as any[])[0];
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const fields: string[] = [];
    const values: any[] = [];

    const allowed = [
      "page_title",
      "favicon_url",
      "slug",
      "meta_title",
      "meta_description",
      "focus_keyword",
      "meta_keywords",
      "secondary_keywords",
      "canonical_url",
      "robots_meta",
      "is_indexable",
      "og_title",
      "og_description",
      "og_image",
      "og_url",
      "og_type",
      "feature_image",
      "feature_image_public_id",
      "twitter_card",
      "twitter_domain",
      "twitter_url",
      "twitter_image",
      "twitter_title",
      "twitter_description",
      "schema_json",
      "seo_score",
      "word_count",
      "readability_score",
      "page_path",
      "page_type",
      "city_id",
    ];

    for (const key of allowed) {
      if (key in body) {
        fields.push(`${key} = ?`);
        let val = body[key];

        if (key === "secondary_keywords" || key === "schema_json") {
          val = val == null ? null : JSON.stringify(val);
        } else if (key === "is_indexable") {
          val = val ? 1 : 0;
        } else if (key === "city_id") {
          val = val ? Number(val) : null;
        }

        values.push(val);
      }
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    values.push(id);
    await pool.query(
      `UPDATE seo_pages SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    // ─── Fire revalidation ───
    // If page_path changed, revalidate both old and new paths.
    const newPath = body.page_path || existing.page_path;
    const tags = new Set<string>([`seo:${newPath}`]);
    const paths = new Set<string>([newPath, "/sitemap.xml"]);

    if (existing.page_path && existing.page_path !== newPath) {
      tags.add(`seo:${existing.page_path}`);
      paths.add(existing.page_path);
    }

    await revalidateWebsite({
      tags: Array.from(tags),
      paths: Array.from(paths),
    });

    // ─── Log activity ───
    await logActivity({
      actor: {
        userId: decoded.userId,
        userName: decoded.username || `User #${decoded.userId}`,
      },
      action: "update",
      entityType: "profile",
      entityId: Number(id),
      entityName: `seo_page:${body.slug || newPath}`,
      changes: body,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return respondError(err, "PUT /api/admin/seo/pages/[id]");
  }
}

// ============================================================
// DELETE — delete page
// ============================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 20 });
    if (!rl.ok) return rl.response;

    const decoded = await requireSeoAccess(request);
    const { id } = await params;

    // Load path before deletion (for revalidation)
    const [rows] = (await pool.query(
      "SELECT page_path FROM seo_pages WHERE id = ? LIMIT 1",
      [id]
    )) as any;
    const row = (rows as any[])[0];

    await pool.query("DELETE FROM seo_pages WHERE id = ?", [id]);

    if (row?.page_path) {
      await revalidateWebsite({
        tags: [`seo:${row.page_path}`],
        paths: [row.page_path, "/sitemap.xml"],
      });
    }

    await logActivity({
      actor: {
        userId: decoded.userId,
        userName: decoded.username || `User #${decoded.userId}`,
      },
      action: "delete",
      entityType: "profile",
      entityId: Number(id),
      entityName: `seo_page:${row?.page_path || id}`,
      changes: { deleted: true },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return respondError(err, "DELETE /api/admin/seo/pages/[id]");
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
