import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { rateLimit } from "@/lib/rate-limit";
import { parseBody, CityUpdateSchema } from "@/lib/validators";

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
// GET single city
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 120 });
    if (!rl.ok) return rl.response!;

    await requireCityReadAccess(request);

    const { id } = await params;
    const cityId = parseInt(id, 10);
    if (isNaN(cityId)) {
      return NextResponse.json({ error: "Invalid city ID" }, { status: 400 });
    }

    const [rows] = (await pool.query(
      `SELECT id, name, state, country, code, description, is_active, created_at, updated_at
       FROM cities WHERE id = ?`,
      [cityId]
    )) as any;

    const city = (rows as any[])[0];
    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    const [userCountRows] = (await pool.query(
      "SELECT COUNT(*) as count FROM user_cities WHERE city_id = ?",
      [cityId]
    )) as any;

    return NextResponse.json(
      {
        city: {
          ...city,
          user_count: Number((userCountRows as any[])[0]?.count) || 0,
        },
      },
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
    console.error("Get city error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================
// PUT — update city  (admin only)
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 30 });
    if (!rl.ok) return rl.response!;

    const decoded = await requireAdmin(request);
    const { id } = await params;
    const cityId = parseInt(id, 10);

    if (isNaN(cityId)) {
      return NextResponse.json({ error: "Invalid city ID" }, { status: 400 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = parseBody(CityUpdateSchema, body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { name, state, country, code, description, is_active } = parsed.data;

    const [existingRows] = (await pool.query(
      "SELECT name, state, country, code, description, is_active FROM cities WHERE id = ?",
      [cityId]
    )) as any;
    const existing = (existingRows as any[])[0];
    if (!existing) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    if (name || state !== undefined) {
      const newName = name || existing.name;
      const newState = state !== undefined ? state : existing.state;
      const [dupCheck] = (await pool.query(
        `SELECT id FROM cities
         WHERE name = ? AND (state = ? OR (state IS NULL AND ? IS NULL)) AND id != ?`,
        [newName, newState || null, newState || null, cityId]
      )) as any;
      if ((dupCheck as any[]).length > 0) {
        return NextResponse.json(
          { error: "Another city with this name already exists in this state" },
          { status: 409 }
        );
      }
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (name) {
      fields.push("name = ?");
      values.push(name);
    }
    if (state !== undefined) {
      fields.push("state = ?");
      values.push(state || null);
    }
    if (country) {
      fields.push("country = ?");
      values.push(country);
    }
    if (code !== undefined) {
      fields.push("code = ?");
      values.push(code || null);
    }
    if (description !== undefined) {
      fields.push("description = ?");
      values.push(description || null);
    }
    if (is_active !== undefined) {
      fields.push("is_active = ?");
      values.push(is_active ? 1 : 0);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(cityId);
    await pool.query(`UPDATE cities SET ${fields.join(", ")} WHERE id = ?`, values);

    const [updated] = await pool.query("SELECT * FROM cities WHERE id = ?", [cityId]);
    const updatedCity = (updated as any[])[0];

    try {
      await logActivity({
        actor: {
          userId: decoded.userId,
          userName: decoded.username || `User #${decoded.userId}`,
        },
        action: "update",
        entityType: "city",
        entityId: cityId,
        entityName: name || existing.name,
        changes: {
          before: {
            name: existing.name,
            state: existing.state,
            country: existing.country,
            code: existing.code,
            is_active: Boolean(existing.is_active),
          },
          after: {
            name: name || existing.name,
            state: state ?? existing.state,
            country: country || existing.country,
            code: code ?? existing.code,
            is_active: is_active !== undefined ? is_active : Boolean(existing.is_active),
          },
        },
        request,
      });
    } catch (logErr) {
      console.error("Log activity failed (non-fatal):", logErr);
    }

    return NextResponse.json({
      success: true,
      message: "City updated successfully",
      city: updatedCity,
    });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Update city error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================
// DELETE — delete city  (admin only)
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 20 });
    if (!rl.ok) return rl.response!;

    const decoded = await requireAdmin(request);
    const { id } = await params;
    const cityId = parseInt(id, 10);

    if (isNaN(cityId)) {
      return NextResponse.json({ error: "Invalid city ID" }, { status: 400 });
    }

    const [rows] = await pool.query("SELECT id, name FROM cities WHERE id = ?", [cityId]);
    const city = (rows as any[])[0];
    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    const [userRows] = (await pool.query(
      "SELECT COUNT(*) as count FROM user_cities WHERE city_id = ?",
      [cityId]
    )) as any;
    const userCount = Number((userRows as any[])[0]?.count) || 0;
    if (userCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete city. ${userCount} user(s) have access to it. Please remove their access first.`,
        },
        { status: 400 }
      );
    }

    await pool.query("DELETE FROM cities WHERE id = ?", [cityId]);

    try {
      await logActivity({
        actor: {
          userId: decoded.userId,
          userName: decoded.username || `User #${decoded.userId}`,
        },
        action: "delete",
        entityType: "city",
        entityId: cityId,
        entityName: city.name,
        changes: { deleted: true },
        request,
      });
    } catch (logErr) {
      console.error("Log activity failed (non-fatal):", logErr);
    }

    return NextResponse.json({
      success: true,
      message: "City deleted successfully",
    });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Delete city error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
