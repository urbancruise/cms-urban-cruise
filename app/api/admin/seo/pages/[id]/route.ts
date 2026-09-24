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

// GET single page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 120 });
    if (!rl.ok) return rl.response!;

    await requireSeoAccess(request);
    const { id } = await params;

    const [rows] = (await pool.query(
      `SELECT sp.*, c.name AS city_name
       FROM seo_pages sp
       LEFT JOIN cities c ON c.id = sp.city_id
       WHERE sp.id = ?`,
      [id]
    )) as any;

    const page = (rows as any[])[0];
    if (!page) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    page.secondary_keywords =
      typeof page.secondary_keywords === "string"
        ? JSON.parse(page.secondary_keywords)
        : page.secondary_keywords || [];

    return NextResponse.json({ page });
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

// PUT update page
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 60 });
    if (!rl.ok) return rl.response!;

    const decoded = await requireSeoAccess(request);
    const { id } = await params;
    const body = await request.json();

    const fields: string[] = [];
    const values: any[] = [];

    const allowed = [
      "meta_title",
      "meta_description",
      "focus_keyword",
      "secondary_keywords",
      "canonical_url",
      "robots_meta",
      "is_indexable",
      "og_title",
      "og_description",
      "og_image",
      "og_type",
      "twitter_card",
      "twitter_title",
      "twitter_description",
      "twitter_image",
      "seo_score",
      "word_count",
      "readability_score",
    ];

    for (const key of allowed) {
      if (key in body) {
        fields.push(`${key} = ?`);
        values.push(
          key === "secondary_keywords"
            ? JSON.stringify(body[key])
            : key === "is_indexable"
            ? body[key]
              ? 1
              : 0
            : body[key]
        );
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

    await logActivity({
      actor: {
        userId: decoded.userId,
        userName: decoded.username || `User #${decoded.userId}`,
      },
      action: "update",
      entityType: "profile",
      entityId: Number(id),
      entityName: `seo_page:${body.page_path || id}`,
      changes: body,
      request,
    });

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

// DELETE page
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 20 });
    if (!rl.ok) return rl.response!;

    await requireSeoAccess(request);
    const { id } = await params;

    await pool.query("DELETE FROM seo_pages WHERE id = ?", [id]);

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