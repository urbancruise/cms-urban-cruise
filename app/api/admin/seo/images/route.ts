import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

async function requireAuth(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) throw { status: 401, message: "Not authenticated" };
  return jwt.verify(
    token,
    process.env.JWT_SECRET || "fallback_secret"
  ) as { userId: number; role: string; roles?: string[] };
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

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 120 });
    if (!rl.ok) return rl.response!;

    await requireSeoAccess(request);

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter");
    const pagePath = searchParams.get("page_path");
    const cityId = searchParams.get("city_id");
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

    const where: string[] = ["1=1"];
    const params: any[] = [];

    if (filter === "missing_alt") where.push("has_alt = 0");
    if (pagePath) {
      where.push("page_path = ?");
      params.push(pagePath);
    }
    if (cityId) {
      where.push("city_id = ?");
      params.push(Number(cityId));
    }

    const whereClause = where.join(" AND ");

    const [rows] = (await pool.query(
      `SELECT * FROM seo_images
       WHERE ${whereClause}
       ORDER BY updated_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    )) as any;

    const [countRows] = (await pool.query(
      `SELECT COUNT(*) AS total FROM seo_images WHERE ${whereClause}`,
      params
    )) as any;

    return NextResponse.json({
      images: rows,
      total: Number((countRows as any[])[0]?.total) || 0,
    });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 60 });
    if (!rl.ok) return rl.response!;

    await requireSeoAccess(request);
    const body = await request.json();

    const { city_id, page_path, image_url, public_id, alt_text } = body;

    if (!page_path || !image_url) {
      return NextResponse.json(
        { error: "page_path and image_url required" },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      `INSERT INTO seo_images
       (city_id, page_path, image_url, public_id, alt_text, has_alt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        city_id || null,
        page_path,
        image_url,
        public_id || null,
        alt_text || null,
        alt_text && alt_text.trim() ? 1 : 0,
      ]
    );

    return NextResponse.json(
      { success: true, id: (result as any).insertId },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 60 });
    if (!rl.ok) return rl.response!;

    await requireSeoAccess(request);
    const body = await request.json();
    const { id, alt_text, title_text, caption } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const hasAlt = alt_text && alt_text.trim() ? 1 : 0;

    await pool.query(
      `UPDATE seo_images
       SET alt_text = ?, title_text = ?, caption = ?, has_alt = ?
       WHERE id = ?`,
      [alt_text || null, title_text || null, caption || null, hasAlt, id]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}