import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { rateLimit } from "@/lib/rate-limit";
import { revalidateWebsite } from "@/lib/revalidate";

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

/**
 * Site content access: any authenticated user with at least one
 * `urbancruise*` permission or admin role.
 */
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

// ============================================================
// GET all sections for a city
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 120 });
    if (!rl.ok) return rl.response!;

    await requireSiteContentAccess(request);

    const { searchParams } = new URL(request.url);
    const cityId = Number(searchParams.get("city_id"));

    if (!cityId) {
      return NextResponse.json({ error: "city_id is required" }, { status: 400 });
    }

    const [rows] = (await pool.query(
      `SELECT id, city_id, section_key, content, status, updated_at
       FROM site_home_content
       WHERE city_id = ?
       ORDER BY section_key ASC`,
      [cityId]
    )) as any;

    const sections = (rows as any[]).map((r) => ({
      ...r,
      content: typeof r.content === "string" ? JSON.parse(r.content) : r.content,
    }));

    return NextResponse.json({ sections });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/site-content/home GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================================
// PUT upsert section
// ============================================================
// export async function PUT(request: NextRequest) {
//   try {
//     const rl = rateLimit(request, { windowMs: 60000, max: 60 });
//     if (!rl.ok) return rl.response!;

//     const decoded = await requireSiteContentAccess(request);
//     const body = await request.json();

//     const { cityId, sectionKey, content, status } = body;

//     if (!cityId || !sectionKey || content === undefined) {
//       return NextResponse.json(
//         { error: "cityId, sectionKey, content required" },
//         { status: 400 }
//       );
//     }

//     await pool.query(
//       `INSERT INTO site_home_content
//          (city_id, section_key, content, status, updated_by)
//        VALUES (?, ?, ?, ?, ?)
//        ON DUPLICATE KEY UPDATE
//          content = VALUES(content),
//          status = VALUES(status),
//          updated_by = VALUES(updated_by)`,
//       [cityId, sectionKey, JSON.stringify(content), status || "draft", decoded.userId]
//     );

//     await logActivity({
//       actor: {
//         userId: decoded.userId,
//         userName: decoded.username || `User #${decoded.userId}`,
//       },
//       action: "update",
//       entityType: "profile",
//       entityId: cityId,
//       entityName: `home:${sectionKey}`,
//       changes: { cityId, sectionKey, status },
//       request,
//     });

//     return NextResponse.json({ success: true });
//   } catch (err: any) {
//     if (err.status) {
//       return NextResponse.json({ error: err.message }, { status: err.status });
//     }
//     console.error("[admin/site-content/home PUT]", err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }
export async function PUT(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 60 });
    if (!rl.ok) return rl.response!;

    const decoded = await requireSiteContentAccess(request);
    const body = await request.json();

    const { cityId, sectionKey, content, status } = body;

    if (!cityId || !sectionKey || content === undefined) {
      return NextResponse.json(
        { error: "cityId, sectionKey, content required" },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO site_home_content
         (city_id, section_key, content, status, updated_by)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         content = VALUES(content),
         status = VALUES(status),
         updated_by = VALUES(updated_by)`,
      [cityId, sectionKey, JSON.stringify(content), status || "draft", decoded.userId]
    );

    // ✅ Fetch city slug for tag naming
    const [cityRows] = (await pool.query(
      "SELECT name FROM cities WHERE id = ?",
      [cityId]
    )) as any;
    const citySlug = ((cityRows as any[])[0]?.name || "").toLowerCase();

    // ✅ Fire revalidation
    await revalidateWebsite({
      tags: [`home:${citySlug}`],
      paths: [`/${citySlug}`],
    });

    await logActivity({
      actor: {
        userId: decoded.userId,
        userName: decoded.username || `User #${decoded.userId}`,
      },
      action: "update",
      entityType: "profile",
      entityId: cityId,
      entityName: `home:${sectionKey}`,
      changes: { cityId, sectionKey, status },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/site-content/home PUT]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================================
// DELETE section
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 30 });
    if (!rl.ok) return rl.response!;

    await requireSiteContentAccess(request);

    const { searchParams } = new URL(request.url);
    const cityId = Number(searchParams.get("city_id"));
    const sectionKey = searchParams.get("section_key");

    if (!cityId || !sectionKey) {
      return NextResponse.json(
        { error: "city_id and section_key required" },
        { status: 400 }
      );
    }

    await pool.query(
      `DELETE FROM site_home_content WHERE city_id = ? AND section_key = ?`,
      [cityId, sectionKey]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
