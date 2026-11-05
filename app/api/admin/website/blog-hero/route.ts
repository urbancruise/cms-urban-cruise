import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { z } from "zod";
import pool from "@/lib/db";
import { requirePermission } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";

interface BlogHeroRow extends RowDataPacket {
  city_id: number;
  content: unknown;
  status: "draft" | "published";
  updated_at: string;
}

interface ActiveCityRow extends RowDataPacket {
  id: number;
}

const BlogHeroSchema = z.object({
  cityId: z.number().int().positive(),
  content: z.object({
    eyebrow: z.string().max(160).default(""),
    title: z.string().trim().min(1, "Hero title is required.").max(255),
    titleHighlight: z.string().max(255).default(""),
    description: z.string().max(2000).default(""),
    backgroundImage: z.string().max(2000).default(""),
    backgroundImagePublicId: z.string().max(255).default(""),
    backgroundImageAlt: z.string().max(255).default(""),
    vehiclesImage: z.string().max(2000).default(""),
    vehiclesImagePublicId: z.string().max(255).default(""),
    vehiclesImageAlt: z.string().max(255).default(""),
  }),
  status: z.enum(["draft", "published"]),
});

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 120 });
    if (!rl.ok) return rl.response!;
    await requirePermission(request, ["urbancruise.blogs.view"]);

    const [rows] = await pool.query<BlogHeroRow[]>(
      "SELECT city_id, content, status, updated_at FROM website_blog_heroes"
    );
    return NextResponse.json({
      heroes: rows.map((row) => ({
        ...row,
        content:
          typeof row.content === "string"
            ? JSON.parse(row.content)
            : row.content,
      })),
    });
  } catch (error) {
    return respondError(error, "admin/website/blog-hero GET");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 30 });
    if (!rl.ok) return rl.response!;
    const actor = await requirePermission(request, ["urbancruise.blogs.view"]);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = BlogHeroSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid blog hero details" },
        { status: 400 }
      );
    }

    const [cities] = await pool.query<ActiveCityRow[]>(
      "SELECT id FROM cities WHERE id = ? AND is_active = 1 LIMIT 1",
      [parsed.data.cityId]
    );
    if (cities.length === 0) {
      return NextResponse.json(
        { error: "Choose an active city for this blog hero." },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO website_blog_heroes (city_id, content, status, updated_by)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         content = VALUES(content),
         status = VALUES(status),
         updated_by = VALUES(updated_by)`,
      [
        parsed.data.cityId,
        JSON.stringify(parsed.data.content),
        parsed.data.status,
        actor.userId,
      ]
    );

    await logActivity({
      actor: {
        userId: actor.userId,
        userName: actor.username || actor.email || `User #${actor.userId}`,
      },
      action: "update",
      entityType: "blog",
      entityId: parsed.data.cityId,
      entityName: `Blog hero (city #${parsed.data.cityId})`,
      changes: { cityId: parsed.data.cityId, status: parsed.data.status },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return respondError(error, "admin/website/blog-hero PUT");
  }
}
