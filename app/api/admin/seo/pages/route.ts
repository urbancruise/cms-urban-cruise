import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { rateLimit } from "@/lib/rate-limit";

async function requireAuth(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) throw { status: 401, message: "Not authenticated" };
  return jwt.verify(
    token,
    process.env.JWT_SECRET || "fallback_secret"
  ) as { userId: number; role: string; roles?: string[]; username?: string };
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
    } catch {}
    perms.forEach((p) => set.add(p));
  });

  if (![...set].some((p) => p.startsWith("seo."))) {
    throw { status: 403, message: "Access denied." };
  }
  return decoded;
}

// ============================================================
// GET — list all SEO pages with filters
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 120 });
    if (!rl.ok) return rl.response!;

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
      secondary_keywords:
        typeof r.secondary_keywords === "string"
          ? JSON.parse(r.secondary_keywords)
          : r.secondary_keywords || [],
    }));

    return NextResponse.json({
      pages,
      total: Number((countRows as any[])[0]?.total) || 0,
      limit,
      offset,
    });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[seo/pages GET]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST — create new SEO page entry
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 30 });
    if (!rl.ok) return rl.response!;

    const decoded = await requireSeoAccess(request);
    const body = await request.json();

    const {
      city_id,
      page_path,
      page_type,
      meta_title,
      meta_description,
      focus_keyword,
      canonical_url,
      robots_meta,
      is_indexable,
    } = body;

    if (!page_path || !page_type) {
      return NextResponse.json(
        { error: "page_path and page_type required" },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      `INSERT INTO seo_pages
       (city_id, page_path, page_type, meta_title, meta_description,
        focus_keyword, canonical_url, robots_meta, is_indexable)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        city_id || null,
        page_path,
        page_type,
        meta_title || null,
        meta_description || null,
        focus_keyword || null,
        canonical_url || null,
        robots_meta || "index, follow",
        is_indexable !== false ? 1 : 0,
      ]
    );

    const insertId = (result as any).insertId;

    await logActivity({
      actor: {
        userId: decoded.userId,
        userName: decoded.username || `User #${decoded.userId}`,
      },
      action: "create",
      entityType: "profile",
      entityId: insertId,
      entityName: `seo_page:${page_path}`,
      changes: { page_path, page_type, city_id },
      request,
    });

    return NextResponse.json(
      { success: true, id: insertId },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[seo/pages POST]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}