import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { requirePermission } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";
import {
  hasWebsiteBlogText,
  sanitizeWebsiteBlogHtml,
} from "@/lib/website-blog-html";
import {
  areWebsiteBlogCitiesActive,
  isDuplicateWebsiteBlogSlugError,
  WebsiteBlogInputSchema,
  WebsiteBlogSlugSchema,
} from "@/lib/website-blogs";

interface BlogIdRow extends RowDataPacket {
  id: number;
  title: string;
}

interface BlogSlugRow extends RowDataPacket {
  id: number;
}

interface ActiveCityRow extends RowDataPacket {
  name: string;
}

function getBlogId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 30 });
    if (!rl.ok) return rl.response!;
    const actor = await requirePermission(request, ["urbancruise.blogs.view"]);

    const blogId = getBlogId((await params).id);
    if (!blogId) {
      return NextResponse.json({ error: "Invalid blog ID" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = WebsiteBlogSlugSchema.safeParse(
      typeof body === "object" && body !== null && "slug" in body
        ? body.slug
        : undefined
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid blog slug" },
        { status: 400 }
      );
    }

    const [existing] = await pool.query<BlogIdRow[]>(
      "SELECT id, title FROM website_blogs WHERE id = ? LIMIT 1",
      [blogId]
    );
    if (!existing[0]) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    const [duplicates] = await pool.query<BlogSlugRow[]>(
      "SELECT id FROM website_blogs WHERE slug = ? AND id <> ? LIMIT 1",
      [parsed.data, blogId]
    );
    if (duplicates.length > 0) {
      return NextResponse.json(
        { error: "This blog URL slug is already in use." },
        { status: 409 }
      );
    }

    await pool.query(
      "UPDATE website_blogs SET slug = ?, updated_by = ? WHERE id = ?",
      [parsed.data, actor.userId, blogId]
    );

    await logActivity({
      actor: {
        userId: actor.userId,
        userName: actor.username || actor.email || `User #${actor.userId}`,
      },
      action: "update",
      entityType: "blog",
      entityId: blogId,
      entityName: existing[0].title,
      changes: { slug: parsed.data },
      request,
    });

    return NextResponse.json({ success: true, id: blogId, slug: parsed.data });
  } catch (error) {
    if (isDuplicateWebsiteBlogSlugError(error)) {
      return NextResponse.json(
        { error: "This blog URL slug is already in use." },
        { status: 409 }
      );
    }
    return respondError(error, "admin/website/blogs slug update");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 30 });
    if (!rl.ok) return rl.response!;
    const actor = await requirePermission(request, ["urbancruise.blogs.view"]);

    const blogId = getBlogId((await params).id);
    if (!blogId) {
      return NextResponse.json({ error: "Invalid blog ID" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = WebsiteBlogInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid blog details" },
        { status: 400 }
      );
    }
    const paragraph = sanitizeWebsiteBlogHtml(parsed.data.paragraph);
    if (!hasWebsiteBlogText(paragraph)) {
      return NextResponse.json(
        { error: "Paragraph is required." },
        { status: 400 }
      );
    }
    const [existingSlugs] = await pool.query<BlogSlugRow[]>(
      "SELECT id FROM website_blogs WHERE slug = ? AND id <> ? LIMIT 1",
      [parsed.data.slug, blogId]
    );
    if (existingSlugs.length > 0) {
      return NextResponse.json(
        { error: "This blog URL slug is already in use." },
        { status: 409 }
      );
    }
    const [cityRows] = await pool.query<ActiveCityRow[]>(
      "SELECT name FROM cities WHERE is_active = 1"
    );
    if (
      !areWebsiteBlogCitiesActive(
        parsed.data.citySlugs,
        cityRows.map((city) => city.name)
      )
    ) {
      return NextResponse.json(
        { error: "Choose only active cities." },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE website_blogs
       SET title = ?, slug = ?, paragraph = ?, image_url = ?, image_public_id = ?,
           categories = ?, cities = ?, status = ?, updated_by = ?
       WHERE id = ?`,
      [
        parsed.data.title,
        parsed.data.slug,
        paragraph,
        parsed.data.imageUrl,
        parsed.data.imagePublicId,
        JSON.stringify(parsed.data.categories),
        JSON.stringify(parsed.data.citySlugs),
        parsed.data.status,
        actor.userId,
        blogId,
      ]
    );
    let previousTitle = parsed.data.title;
    if (result.affectedRows === 0) {
      const [existing] = await pool.query<BlogIdRow[]>(
        "SELECT id, title FROM website_blogs WHERE id = ?",
        [blogId]
      );
      if (!existing[0]) {
        return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
      }
      previousTitle = existing[0].title;
    }

    await logActivity({
      actor: {
        userId: actor.userId,
        userName: actor.username || actor.email || `User #${actor.userId}`,
      },
      action: "update",
      entityType: "blog",
      entityId: blogId,
      entityName: parsed.data.title || previousTitle,
      changes: {
        slug: parsed.data.slug,
        status: parsed.data.status,
        categories: parsed.data.categories,
        citySlugs: parsed.data.citySlugs,
      },
      request,
    });

    return NextResponse.json({ success: true, id: blogId });
  } catch (error) {
    if (isDuplicateWebsiteBlogSlugError(error)) {
      return NextResponse.json(
        { error: "This blog URL slug is already in use." },
        { status: 409 }
      );
    }
    return respondError(error, "admin/website/blogs update");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 30 });
    if (!rl.ok) return rl.response!;
    const actor = await requirePermission(request, ["urbancruise.blogs.view"]);

    const blogId = getBlogId((await params).id);
    if (!blogId) {
      return NextResponse.json({ error: "Invalid blog ID" }, { status: 400 });
    }

    const [existing] = await pool.query<BlogIdRow[]>(
      "SELECT id, title FROM website_blogs WHERE id = ?",
      [blogId]
    );
    if (!existing[0]) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    await pool.query("DELETE FROM website_blogs WHERE id = ?", [blogId]);
    await logActivity({
      actor: {
        userId: actor.userId,
        userName: actor.username || actor.email || `User #${actor.userId}`,
      },
      action: "delete",
      entityType: "blog",
      entityId: blogId,
      entityName: existing[0].title,
      request,
    });

    return NextResponse.json({ success: true, id: blogId });
  } catch (error) {
    return respondError(error, "admin/website/blogs delete");
  }
}
