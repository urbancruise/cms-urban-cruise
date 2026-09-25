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
    `SELECT r.permissions FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ? AND r.is_active = 1`,
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
  if (![...set].some((p) => p.startsWith("seo.")))
    throw { status: 403, message: "Access denied." };
  return decoded;
}

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 120 });
    if (!rl.ok) return rl.response!;
    await requireSeoAccess(request);

    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get("city_id");
    const type = searchParams.get("keyword_type");
    const search = searchParams.get("search");

    const where: string[] = ["1=1"];
    const params: any[] = [];
    if (cityId) {
      where.push("city_id = ?");
      params.push(Number(cityId));
    }
    if (type) {
      where.push("keyword_type = ?");
      params.push(type);
    }
    if (search) {
      where.push("keyword LIKE ?");
      params.push(`%${search}%`);
    }

    const wc = where.join(" AND ");
    const [rows] = (await pool.query(
      `SELECT * FROM seo_keywords WHERE ${wc} ORDER BY updated_at DESC LIMIT 500`,
      params
    )) as any;
    const [countRows] = (await pool.query(
      `SELECT COUNT(*) AS total FROM seo_keywords WHERE ${wc}`,
      params
    )) as any;

    return NextResponse.json({
      keywords: rows,
      total: Number((countRows as any[])[0]?.total) || 0,
    });
  } catch (err: any) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 30 });
    if (!rl.ok) return rl.response!;
    await requireSeoAccess(request);
    const body = await request.json();

    const [result] = await pool.query(
      `INSERT INTO seo_keywords (keyword, keyword_type, search_volume, difficulty, current_rank, target_rank, page_path, city_id, is_tracked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.keyword,
        body.keyword_type || "secondary",
        body.search_volume || 0,
        body.difficulty || 0,
        body.current_rank,
        body.target_rank,
        body.page_path,
        body.city_id,
        body.is_tracked ? 1 : 0,
      ]
    );

    return NextResponse.json(
      { success: true, id: (result as any).insertId },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
