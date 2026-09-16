import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { rateLimit } from "@/lib/rate-limit";
import { parseBody, UserCreateSchema } from "@/lib/validators";

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) throw { status: 401, message: "Not authenticated" };

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || "fallback_secret"
  ) as { userId: number; role: string; roles?: string[]; username?: string };

  const isAdmin =
    decoded.role === "admin" ||
    (Array.isArray(decoded.roles) && decoded.roles.includes("admin"));

  if (!isAdmin) throw { status: 403, message: "Access denied. Admin only." };
  return decoded;
}

// ============================================
// GET - paginated list
// ============================================
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 120 });
    if (!rl.ok) return rl.response!;

    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 100);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);
    const search = searchParams.get("search")?.trim() || "";
    const roleSlug = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    const where: string[] = ["1=1"];
    const params: any[] = [];

    if (search) {
      where.push("(u.username LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (status === "Active") where.push("u.is_active = 1");
    if (status === "Inactive") where.push("u.is_active = 0");
    if (roleSlug) {
      where.push(
        `EXISTS (SELECT 1 FROM user_roles ur
                 JOIN roles r ON r.id = ur.role_id
                 WHERE ur.user_id = u.id AND r.slug = ?)`
      );
      params.push(roleSlug);
    }

    const whereClause = where.join(" AND ");

    const [[countRows], [rows]] = (await Promise.all([
      pool.query(
        `SELECT COUNT(*) as total FROM users u WHERE ${whereClause}`,
        params
      ) as any,
      // ✅ avatar_url in SELECT
      pool.query(
        `SELECT u.id, u.username, u.email, u.full_name, u.avatar_url,
                u.role, u.role_id, u.is_active, u.created_at, u.last_login
         FROM users u
         WHERE ${whereClause}
         ORDER BY u.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        params
      ) as any,
    ])) as any;

    const users = rows as any[];
    const total = Number((countRows as any)[0]?.total) || 0;

    if (users.length > 0) {
      const userIds = users.map((u) => u.id);

      const [[roleRows], [cityRows], [permRows]] = (await Promise.all([
        pool.query(
          `SELECT ur.user_id, r.id, r.name, r.slug
           FROM user_roles ur JOIN roles r ON r.id = ur.role_id
           WHERE ur.user_id IN (?)`,
          [userIds]
        ) as any,
        pool.query(
          `SELECT uc.user_id, c.id, c.name, c.state, c.code
           FROM user_cities uc JOIN cities c ON c.id = uc.city_id
           WHERE uc.user_id IN (?)`,
          [userIds]
        ) as any,
        pool.query(
          `SELECT user_id, city_id, permission_key
           FROM user_city_permissions
           WHERE user_id IN (?)`,
          [userIds]
        ) as any,
      ])) as any;

      const roleMap: Record<number, any[]> = {};
      (roleRows as any[]).forEach((row) => {
        if (!roleMap[row.user_id]) roleMap[row.user_id] = [];
        roleMap[row.user_id].push({
          id: row.id,
          name: row.name,
          slug: row.slug,
        });
      });

      const cityMap: Record<number, any[]> = {};
      (cityRows as any[]).forEach((row) => {
        if (!cityMap[row.user_id]) cityMap[row.user_id] = [];
        cityMap[row.user_id].push({
          id: row.id,
          name: row.name,
          state: row.state,
          code: row.code,
        });
      });

      const permMap: Record<number, Record<number, string[]>> = {};
      (permRows as any[]).forEach((row) => {
        if (!permMap[row.user_id]) permMap[row.user_id] = {};
        if (!permMap[row.user_id][row.city_id])
          permMap[row.user_id][row.city_id] = [];
        permMap[row.user_id][row.city_id].push(row.permission_key);
      });

      users.forEach((u) => {
        const roles = roleMap[u.id] || [];
        u.roles = roles;
        u.role_ids = roles.map((r) => r.id);
        const primary = roles.find((r) => r.slug === "admin") || roles[0];
        u.role_name = primary?.name || u.role;
        u.role_slug = primary?.slug || u.role;

        u.cities = cityMap[u.id] || [];
        u.city_ids = (cityMap[u.id] || []).map((c) => c.id);

        const userPerms = permMap[u.id] || {};
        u.city_permissions = Object.entries(userPerms).map(([cid, perms]) => ({
          city_id: Number(cid),
          permissions: perms,
        }));
      });
    }

    return NextResponse.json(
      { users, total },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=10, stale-while-revalidate=60",
        },
      }
    );
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Get users error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================
// POST - create user
// ============================================
export async function POST(request: NextRequest) {
  const connection = await pool.getConnection();
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 30 });
    if (!rl.ok) return rl.response!;

    const decoded = await requireAdmin(request);

    const body = await request.json();
    const parsed = parseBody(UserCreateSchema, body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const {
      username,
      email,
      password,
      full_name,
      avatar_url, // ✅
      role_ids,
      is_active,
      city_ids,
      city_permissions,
    } = parsed.data;

    const [roleRows] = await connection.query(
      `SELECT id, slug FROM roles WHERE id IN (?) AND is_active = 1`,
      [role_ids]
    );
    const validRoles = roleRows as any[];
    if (validRoles.length !== role_ids.length) {
      return NextResponse.json(
        { error: "One or more selected roles are invalid or inactive" },
        { status: 400 }
      );
    }

    const [existingUsers] = await connection.query(
      "SELECT id, username, email FROM users WHERE username = ? OR email = ?",
      [username, email]
    );
    const existing = existingUsers as any[];
    if (existing.length > 0) {
      const found = existing[0];
      if (found.username === username) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 }
        );
      }
      if (found.email === email) {
        return NextResponse.json(
          { error: "Email is already registered" },
          { status: 409 }
        );
      }
    }

    const roleSlugs = validRoles.map((r) => r.slug);
    const primarySlug = roleSlugs.includes("admin") ? "admin" : roleSlugs[0];
    const primaryRoleId =
      validRoles.find((r) => r.slug === primarySlug)?.id ?? validRoles[0].id;

    await connection.beginTransaction();
    try {
      const passwordHash = await bcrypt.hash(password, 10);

      // ✅ avatar_url in INSERT
      const [result] = await connection.query(
        `INSERT INTO users 
         (username, email, password_hash, full_name, avatar_url, role, role_id, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          username,
          email,
          passwordHash,
          full_name || username,
          avatar_url || null,
          primarySlug,
          primaryRoleId,
          is_active !== undefined ? (is_active ? 1 : 0) : 1,
        ]
      );

      const newUserId = (result as any).insertId;

      const roleValues = role_ids.map((rid: number) => [newUserId, rid]);
      await connection.query(
        "INSERT INTO user_roles (user_id, role_id) VALUES ?",
        [roleValues]
      );

      const cityList: number[] = Array.isArray(city_ids) ? [...city_ids] : [];
      const permList: { city_id: number; permissions: string[] }[] =
        Array.isArray(city_permissions) ? city_permissions : [];

      const citySet = new Set<number>(cityList);
      permList.forEach((cp) => {
        if (cp.permissions && cp.permissions.length > 0) {
          citySet.add(cp.city_id);
        }
      });

      if (citySet.size > 0) {
        const cityValues = Array.from(citySet).map((cid) => [newUserId, cid]);
        await connection.query(
          "INSERT INTO user_cities (user_id, city_id) VALUES ?",
          [cityValues]
        );
      }

      const permValues: any[] = [];
      permList.forEach((cp) => {
        (cp.permissions || []).forEach((p) => {
          permValues.push([newUserId, cp.city_id, p]);
        });
      });
      if (permValues.length > 0) {
        await connection.query(
          "INSERT INTO user_city_permissions (user_id, city_id, permission_key) VALUES ?",
          [permValues]
        );
      }

      await connection.commit();

      // ✅ avatar_url in SELECT
      const [newUserRows] = await connection.query(
        `SELECT id, username, email, full_name, avatar_url, role, role_id, is_active, created_at
         FROM users WHERE id = ?`,
        [newUserId]
      );
      const created = (newUserRows as any[])[0];

      const [createdRoles] = await connection.query(
        `SELECT r.id, r.name, r.slug FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ?`,
        [newUserId]
      );
      const [createdCities] = await connection.query(
        `SELECT c.id, c.name, c.state, c.code FROM user_cities uc
         JOIN cities c ON c.id = uc.city_id WHERE uc.user_id = ?`,
        [newUserId]
      );
      const [createdPerms] = await connection.query(
        `SELECT city_id, permission_key FROM user_city_permissions WHERE user_id = ?`,
        [newUserId]
      );

      created.roles = createdRoles;
      created.role_ids = (createdRoles as any[]).map((r) => r.id);
      created.cities = createdCities;
      created.city_ids = (createdCities as any[]).map((c) => c.id);

      const grouped: Record<number, string[]> = {};
      (createdPerms as any[]).forEach((row) => {
        if (!grouped[row.city_id]) grouped[row.city_id] = [];
        grouped[row.city_id].push(row.permission_key);
      });
      created.city_permissions = Object.entries(grouped).map(([cid, perms]) => ({
        city_id: Number(cid),
        permissions: perms,
      }));

      await logActivity({
        actor: {
          userId: decoded.userId,
          userName: decoded.username || `User #${decoded.userId}`,
        },
        action: "create",
        entityType: "user",
        entityId: newUserId,
        entityName: username,
        changes: {
          username,
          email,
          full_name: full_name || username,
          avatar_url: avatar_url || null,
          role_ids,
          city_permissions: permList,
          is_active: is_active !== undefined ? is_active : true,
        },
        request,
      });

      return NextResponse.json(
        { success: true, message: "User created successfully", user: created },
        { status: 201 }
      );
    } catch (txErr) {
      await connection.rollback();
      throw txErr;
    }
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Create user error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
