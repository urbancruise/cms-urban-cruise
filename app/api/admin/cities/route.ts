import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { rateLimit } from "@/lib/rate-limit";
import { parseBody, CityCreateSchema } from "@/lib/validators";

// ============================================
// Auth helpers
// ============================================
async function requireAuth(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) throw { status: 401, message: "Not authenticated" };

  return jwt.verify(token, process.env.JWT_SECRET || "fallback_secret") as {
    userId: number;
    role: string;
    roles?: string[];
    username?: string;
  };
}

async function requireCityReadAccess(request: NextRequest) {
  const decoded = await requireAuth(request);

  const isAdmin =
    decoded.role === "admin" ||
    (Array.isArray(decoded.roles) && decoded.roles.includes("admin"));
  if (isAdmin) return decoded;

  const [rows] = (await pool.query(
    `SELECT r.slug, r.permissions
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = ? AND r.is_active = 1`,
    [decoded.userId]
  )) as any;

  const userRoles = rows as any[];
  if (userRoles.length === 0) {
    throw { status: 403, message: "Access denied." };
  }

  const permissionSet = new Set<string>();
  userRoles.forEach((r) => {
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
    perms.forEach((p) => permissionSet.add(p));
  });

  const allowed = [
    "cities.view",
    "urbancruisewebsite.view",
    "urbancruise.home.view",
    "urbancruise.vehicles.view",
  ];

  if (!allowed.some((p) => permissionSet.has(p))) {
    throw { status: 403, message: "Access denied." };
  }

  return decoded;
}

async function requireAdmin(request: NextRequest) {
  const decoded = await requireAuth(request);

  const isAdmin =
    decoded.role === "admin" ||
    (Array.isArray(decoded.roles) && decoded.roles.includes("admin"));

  if (!isAdmin) throw { status: 403, message: "Access denied. Admin only." };
  return decoded;
}

// ============================================
// GET all cities
// ============================================
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 120 });
    if (!rl.ok) return rl.response!;

    await requireCityReadAccess(request);

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const search = searchParams.get("search") || "";

    let query = `SELECT id, name, state, country, code, description, is_active, created_at
                 FROM cities WHERE 1=1`;
    const params: any[] = [];

    if (activeOnly) query += " AND is_active = 1";
    if (search) {
      query += " AND (name LIKE ? OR state LIKE ? OR code LIKE ?)";
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    query += " ORDER BY name ASC";

    const [rows] = await pool.query(query, params);

    return NextResponse.json(
      { cities: rows },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
        },
      }
    );
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Get cities error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================
// POST create city  (admin only)
// ============================================
export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 30 });
    if (!rl.ok) return rl.response!;

    const decoded = await requireAdmin(request);

    const body = await request.json();

    const parsed = parseBody(CityCreateSchema, body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { name, state, country, code, description, is_active } = parsed.data;

    const [existing] = await pool.query(
      "SELECT id FROM cities WHERE name = ? AND (state = ? OR (state IS NULL AND ? IS NULL))",
      [name, state || null, state || null]
    );
    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: "City already exists in this state" },
        { status: 409 }
      );
    }

    const [result] = await pool.query(
      `INSERT INTO cities (name, state, country, code, description, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        state || null,
        country || "India",
        code || null,
        description || null,
        is_active !== false ? 1 : 0,
      ]
    );

    const insertResult = result as any;
    const [newCity] = await pool.query("SELECT * FROM cities WHERE id = ?", [
      insertResult.insertId,
    ]);

    await logActivity({
      actor: {
        userId: decoded.userId,
        userName: decoded.username || `User #${decoded.userId}`,
      },
      action: "create",
      entityType: "city",
      entityId: insertResult.insertId,
      entityName: name,
      changes: {
        name,
        state: state || null,
        country: country || "India",
        code: code || null,
        is_active: is_active !== false,
      },
      request,
    });

    return NextResponse.json(
      {
        success: true,
        message: "City created successfully",
        city: (newCity as any[])[0],
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Create city error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
