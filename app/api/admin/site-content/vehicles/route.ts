import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { rateLimit } from "@/lib/rate-limit";

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

async function requireSiteContentAccess(request: NextRequest) {
  const decoded = await requireAuth(request);

  const isAdmin =
    decoded.role === "admin" ||
    (Array.isArray(decoded.roles) && decoded.roles.includes("admin"));
  if (isAdmin) return decoded;

  const [rows] = (await pool.query(
    `SELECT r.permissions
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = ? AND r.is_active = 1`,
    [decoded.userId]
  )) as any;

  const permissionSet = new Set<string>();
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
    perms.forEach((p) => permissionSet.add(p));
  });

  const allowed = [
    "urbancruisewebsite.view",
    "urbancruise.home.view",
    "urbancruise.vehicles.view",
  ];

  if (!allowed.some((p) => permissionSet.has(p))) {
    throw { status: 403, message: "Access denied." };
  }

  return decoded;
}

// ============================================
// GET list or single vehicle
// ============================================
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 120 });
    if (!rl.ok) return rl.response!;

    await requireSiteContentAccess(request);

    const { searchParams } = new URL(request.url);
    const cityId = Number(searchParams.get("city_id"));
    const slug = searchParams.get("slug");

    if (!cityId) {
      return NextResponse.json({ error: "city_id required" }, { status: 400 });
    }

    if (slug) {
      const [rows] = (await pool.query(
        `SELECT * FROM site_vehicle_content WHERE city_id = ? AND vehicle_slug = ?`,
        [cityId, slug]
      )) as any;
      const row = (rows as any[])[0];
      if (!row) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({
        vehicle: {
          ...row,
          meta: typeof row.meta === "string" ? JSON.parse(row.meta) : row.meta,
          sections:
            typeof row.sections === "string" ? JSON.parse(row.sections) : row.sections,
        },
      });
    }

    const [rows] = (await pool.query(
      `SELECT id, vehicle_slug, meta, status, sort_order, updated_at
       FROM site_vehicle_content
       WHERE city_id = ?
       ORDER BY sort_order ASC, vehicle_slug ASC`,
      [cityId]
    )) as any;

    const vehicles = (rows as any[]).map((r) => ({
      ...r,
      meta: typeof r.meta === "string" ? JSON.parse(r.meta) : r.meta,
    }));

    return NextResponse.json({ vehicles });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/site-content/vehicles GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================
// PUT upsert vehicle
// ============================================
export async function PUT(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 60 });
    if (!rl.ok) return rl.response!;

    const decoded = await requireSiteContentAccess(request);
    const body = await request.json();

    const { cityId, vehicleSlug, meta, sections, status, sortOrder } = body;

    if (!cityId || !vehicleSlug || !meta || !sections) {
      return NextResponse.json(
        { error: "cityId, vehicleSlug, meta, sections required" },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO site_vehicle_content
         (city_id, vehicle_slug, meta, sections, status, sort_order, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         meta = VALUES(meta),
         sections = VALUES(sections),
         status = VALUES(status),
         sort_order = VALUES(sort_order),
         updated_by = VALUES(updated_by)`,
      [
        cityId,
        vehicleSlug,
        JSON.stringify(meta),
        JSON.stringify(sections),
        status || "draft",
        sortOrder ?? 0,
        decoded.userId,
      ]
    );

    await logActivity({
      actor: {
        userId: decoded.userId,
        userName: decoded.username || `User #${decoded.userId}`,
      },
      action: "update",
      entityType: "profile",
      entityId: cityId,
      entityName: `vehicle:${vehicleSlug}`,
      changes: { cityId, vehicleSlug, status },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/site-content/vehicles PUT]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================
// DELETE vehicle content
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 30 });
    if (!rl.ok) return rl.response!;

    await requireSiteContentAccess(request);

    const { searchParams } = new URL(request.url);
    const cityId = Number(searchParams.get("city_id"));
    const slug = searchParams.get("slug");

    if (!cityId || !slug) {
      return NextResponse.json({ error: "city_id and slug required" }, { status: 400 });
    }

    await pool.query(
      `DELETE FROM site_vehicle_content WHERE city_id = ? AND vehicle_slug = ?`,
      [cityId, slug]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
