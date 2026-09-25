import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

async function requireAuth(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) throw { status: 401, message: "Not authenticated" };

  return jwt.verify(token, process.env.JWT_SECRET || "fallback_secret") as {
    userId: number;
    role: string;
    roles?: string[];
  };
}

async function requireSeoAccess(request: NextRequest) {
  const decoded = await requireAuth(request);

  const isAdmin =
    decoded.role === "admin" ||
    (Array.isArray(decoded.roles) && decoded.roles.includes("admin"));
  if (isAdmin) return decoded;

  const [rows] = (await pool.query(
    `SELECT r.permissions FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = ? AND r.is_active = 1`,
    [decoded.userId]
  )) as any;

  const set = new Set<string>();
  (rows as any[]).forEach((r) => {
    let perms: string[] = [];
    try {
      perms = Array.isArray(r.permissions)
        ? r.permissions
        : typeof r.permissions === "string"
          ? JSON.parse(r.permissions)
          : [];
    } catch {
      perms = [];
    }
    perms.forEach((p) => set.add(p));
  });

  if (![...set].some((p) => p.startsWith("seo."))) {
    throw { status: 403, message: "Access denied." };
  }

  return decoded;
}

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 60 });
    if (!rl.ok) return rl.response!;

    await requireSeoAccess(request);

    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get("city_id")
      ? Number(searchParams.get("city_id"))
      : null;

    const where = cityId ? "WHERE city_id = ?" : "";
    const params = cityId ? [cityId] : [];

    const [pageStats] = (await pool.query(
      `SELECT
         COUNT(*) AS total_pages,
         SUM(CASE WHEN is_indexable = 1 THEN 1 ELSE 0 END) AS indexed_pages,
         SUM(CASE WHEN is_indexable = 0 THEN 1 ELSE 0 END) AS noindex_pages,
         SUM(CASE WHEN meta_title IS NULL OR meta_title = '' THEN 1 ELSE 0 END) AS missing_meta_title,
         SUM(CASE WHEN meta_description IS NULL OR meta_description = '' THEN 1 ELSE 0 END) AS missing_meta_description,
         AVG(seo_score) AS avg_score
       FROM seo_pages
       ${where}`,
      params
    )) as any;

    const pageRow = (pageStats as any[])[0] || {};

    const [imgStats] = (await pool.query(
      `SELECT COUNT(*) AS missing_alt FROM seo_images
       WHERE has_alt = 0 ${cityId ? "AND city_id = ?" : ""}`,
      params
    )) as any;
    const missingAlt = Number((imgStats as any[])[0]?.missing_alt) || 0;

    const [linkStats] = (await pool.query(
      `SELECT COUNT(*) AS broken FROM seo_internal_links WHERE is_broken = 1`
    )) as any;
    const brokenLinks = Number((linkStats as any[])[0]?.broken) || 0;

    const [canonStats] = (await pool.query(
      `SELECT COUNT(*) AS issues FROM seo_pages
       WHERE canonical_url IS NULL OR canonical_url = ''
       ${cityId ? "AND city_id = ?" : ""}`,
      params
    )) as any;
    const canonicalIssues = Number((canonStats as any[])[0]?.issues) || 0;

    const [schemaStats] = (await pool.query(
      `SELECT COUNT(*) AS errors FROM seo_schemas WHERE is_active = 0`
    )) as any;
    const schemaErrors = Number((schemaStats as any[])[0]?.errors) || 0;

    const total = Number(pageRow.total_pages) || 0;
    const indexable = Number(pageRow.indexed_pages) || 0;
    const missingTitle = Number(pageRow.missing_meta_title) || 0;
    const missingDesc = Number(pageRow.missing_meta_description) || 0;

    let score = 100;
    if (total > 0) {
      score -= Math.round((missingTitle / total) * 20);
      score -= Math.round((missingDesc / total) * 15);
      score -= Math.round((missingAlt / Math.max(total, 1)) * 10);
      score -= Math.round((brokenLinks / Math.max(total, 1)) * 10);
      score -= Math.round((canonicalIssues / total) * 15);
      score -= Math.round((schemaErrors / Math.max(total, 1)) * 10);
    }
    score = Math.max(0, Math.min(100, score));

    const [techRows] = (await pool.query(
      `SELECT check_type, status
       FROM seo_technical
       WHERE checked_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       GROUP BY check_type
       ORDER BY checked_at DESC`
    )) as any;

    const techMap: Record<string, string> = {};
    (techRows as any[]).forEach((r) => {
      techMap[r.check_type] = r.status;
    });

    const [cwvRows] = (await pool.query(
      `SELECT status, COUNT(*) AS count
       FROM seo_core_web_vitals
       GROUP BY status`
    )) as any;

    const cwvStatus = (cwvRows as any[]).find((r) => r.status === "poor")
      ? "poor"
      : (cwvRows as any[]).find((r) => r.status === "needs_improvement")
        ? "needs_improvement"
        : "good";

    return NextResponse.json(
      {
        healthScore: score,
        stats: {
          totalPages: total,
          indexedPages: indexable,
          noindexPages: Number(pageRow.noindex_pages) || 0,
          missingMetaTitle: missingTitle,
          missingMetaDescription: missingDesc,
          missingAltTags: missingAlt,
          brokenLinks,
          canonicalIssues,
          schemaErrors,
          sitemapStatus: techMap.sitemap || "ok",
          robotsStatus: techMap.robots || "ok",
          coreWebVitalsStatus: cwvStatus,
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
        },
      }
    );
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[seo/dashboard GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
