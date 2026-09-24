import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

async function requireAuth(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) throw { status: 401, message: "Not authenticated" };
  return jwt.verify(token, process.env.JWT_SECRET || "fallback_secret") as { userId: number; role: string; roles?: string[] };
}

async function requireSeoAccess(request: NextRequest) {
  const decoded = await requireAuth(request);
  const isAdmin = decoded.role === "admin" || (Array.isArray(decoded.roles) && decoded.roles.includes("admin"));
  if (isAdmin) return decoded;
  const [rows] = (await pool.query(`SELECT r.permissions FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ? AND r.is_active = 1`, [decoded.userId])) as any;
  const set = new Set<string>();
  (rows as any[]).forEach((r) => {
    let perms: string[] = [];
    try { perms = Array.isArray(r.permissions) ? r.permissions : typeof r.permissions === "string" ? JSON.parse(r.permissions) : []; } catch {}
    perms.forEach((p) => set.add(p));
  });
  if (![...set].some((p) => p.startsWith("seo."))) throw { status: 403, message: "Access denied." };
  return decoded;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSeoAccess(request);
    const { id } = await params;
    const body = await request.json();
    await pool.query(
      `UPDATE seo_schemas SET schema_type = ?, page_path = ?, schema_json = ?, is_active = ? WHERE id = ?`,
      [body.schema_type, body.page_path, JSON.stringify(body.schema_json), body.is_active ? 1 : 0, id]
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.status) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSeoAccess(request);
    const { id } = await params;
    await pool.query("DELETE FROM seo_schemas WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.status) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}