import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import pool from "@/lib/db";
import { env } from "@/lib/env";
import { requireSeoAccess } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { HttpError } from "@/lib/http-error";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 120 });
    if (!rl.ok) return rl.response;
    await requireSeoAccess(request);

    const broken = new URL(request.url).searchParams.get("broken") === "true";
    const where = broken ? "WHERE is_broken = 1" : "";
    const [rows] = (await pool.query(
      `SELECT * FROM seo_internal_links
       ${where}
       ORDER BY COALESCE(last_checked_at, created_at) DESC, id DESC
       LIMIT 500`
    )) as any;
    return NextResponse.json({ links: rows, total: rows.length });
  } catch (err) {
    return respondError(err, "GET /api/admin/seo/internal-links");
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 30 });
    if (!rl.ok) return rl.response;
    await requireSeoAccess(request);

    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new HttpError(400, "A link object is required.");
    }
    const record = body as Record<string, unknown>;
    const source = typeof record.source_path === "string"
      ? record.source_path.trim()
      : "";
    const target = typeof record.target_path === "string"
      ? record.target_path.trim()
      : "";
    const anchorText = typeof record.anchor_text === "string"
      ? record.anchor_text.trim()
      : "";

    if (!source || !target || source.length > 500 || target.length > 2048) {
      throw new HttpError(
        400,
        "Valid source_path and target_path values are required."
      );
    }
    if (anchorText.length > 1000) {
      throw new HttpError(400, "anchor_text must be 1000 characters or fewer.");
    }

    let origin: URL;
    try {
      origin = new URL(env.WEBSITE_ORIGIN);
    } catch {
      throw new HttpError(500, "WEBSITE_ORIGIN must be a valid absolute URL.");
    }
    const sourceUrl = new URL(source, origin);
    const targetUrl = new URL(target, origin);
    if (sourceUrl.origin !== origin.origin || targetUrl.origin !== origin.origin) {
      throw new HttpError(
        400,
        "Internal links must use paths on the configured website."
      );
    }

    const sourcePath = `${sourceUrl.pathname}${sourceUrl.search}`;
    const targetPath = `${targetUrl.pathname}${targetUrl.search}`;
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO seo_internal_links (source_path, target_path, anchor_text)
       VALUES (?, ?, ?)`,
      [sourcePath, targetPath, anchorText || null]
    );

    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch (err) {
    return respondError(err, "POST /api/admin/seo/internal-links");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 30 });
    if (!rl.ok) return rl.response;
    await requireSeoAccess(request);

    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new HttpError(400, "A valid link id is required.");
    }

    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM seo_internal_links WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      throw new HttpError(404, "Internal link not found.");
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return respondError(err, "DELETE /api/admin/seo/internal-links");
  }
}
