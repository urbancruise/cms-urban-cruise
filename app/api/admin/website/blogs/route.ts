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
  getWebsiteBlogCitySlug,
  parseBlogCitySlugs,
  parseBlogCategories,
  isDuplicateWebsiteBlogSlugError,
  WEBSITE_BLOG_CATEGORIES,
  WebsiteBlogInputSchema,
} from "@/lib/website-blogs";

interface WebsiteBlogRow extends RowDataPacket {
  id: number;
  title: string;
  slug: string;
  paragraph: string;
  image_url: string;
  image_public_id: string;
  categories: unknown;
  cities: unknown;
  author_name: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}

interface BlogSlugRow extends RowDataPacket {
  id: number;
}

interface ActiveCityRow extends RowDataPacket {
  id: number;
  name: string;
}

function mapBlog(row: WebsiteBlogRow) {
  return {
    ...row,
    authorName: row.author_name,
    paragraph: sanitizeWebsiteBlogHtml(row.paragraph),
    categories: parseBlogCategories(row.categories),
    citySlugs: parseBlogCitySlugs(row.cities),
  };
}

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 120 });
    if (!rl.ok) return rl.response!;
    await requirePermission(request, ["urbancruise.blogs.view"]);

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || 20);
    const offset = Number(searchParams.get("offset") || 0);
    const search = (searchParams.get("search") || "").trim();
    const category = searchParams.get("category") || "";
    const city = searchParams.get("city") || "";
    const status = searchParams.get("status") || "";

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      !Number.isSafeInteger(offset) ||
      offset < 0
    ) {
      return NextResponse.json(
        { error: "limit must be 1-100 and offset must be a non-negative integer" },
        { status: 400 }
      );
    }
    if (search.length > 120) {
      return NextResponse.json(
        { error: "search must be at most 120 characters" },
        { status: 400 }
      );
    }
    if (
      category &&
      !WEBSITE_BLOG_CATEGORIES.some((value) => value === category)
    ) {
      return NextResponse.json({ error: "Invalid category filter" }, { status: 400 });
    }
    if (city && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(city)) {
      return NextResponse.json({ error: "Invalid city filter" }, { status: 400 });
    }
    if (status && status !== "draft" && status !== "published") {
      return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
    }

    const filters: string[] = [];
    const values: string[] = [];
    if (search) {
      filters.push("(blog.title LIKE ? OR blog.paragraph LIKE ?)");
      values.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      filters.push("JSON_CONTAINS(blog.categories, JSON_QUOTE(?), '$')");
      values.push(category);
    }
    if (city) {
      filters.push(
        "(JSON_LENGTH(blog.cities) = 0 OR JSON_CONTAINS(blog.cities, JSON_QUOTE(?), '$'))"
      );
      values.push(city);
    }
    if (status) {
      filters.push("blog.status = ?");
      values.push(status);
    }
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const [blogs] = await pool.query<WebsiteBlogRow[]>(
      `SELECT blog.id, blog.title, blog.paragraph, blog.image_url, blog.image_public_id,
         blog.slug, blog.categories, blog.cities, blog.status, blog.created_at, blog.updated_at,
         COALESCE(NULLIF(TRIM(author.full_name), ''), NULLIF(TRIM(author.username), ''), 'Urban Cruise') AS author_name
       FROM website_blogs AS blog
       LEFT JOIN users AS author ON author.id = blog.created_by
       ${where}
       ORDER BY blog.created_at DESC, blog.id DESC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM website_blogs AS blog ${where}`,
      values
    );
    const [cityRows] = await pool.query<ActiveCityRow[]>(
      "SELECT id, name FROM cities WHERE is_active = 1 ORDER BY name ASC"
    );

    return NextResponse.json({
      blogs: blogs.map(mapBlog),
      cities: cityRows.map((city) => ({
        id: city.id,
        name: city.name,
        slug: getWebsiteBlogCitySlug(city.name),
      })),
      total: Number(countRows[0]?.total || 0),
      limit,
      offset,
    });
  } catch (error) {
    return respondError(error, "admin/website/blogs list");
  }
}

export async function POST(request: NextRequest) {
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
      "SELECT id FROM website_blogs WHERE slug = ? LIMIT 1",
      [parsed.data.slug]
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
      `INSERT INTO website_blogs
         (title, slug, paragraph, image_url, image_public_id, categories, cities, status, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        actor.userId,
      ]
    );

    await logActivity({
      actor: {
        userId: actor.userId,
        userName: actor.username || actor.email || `User #${actor.userId}`,
      },
      action: "create",
      entityType: "blog",
      entityId: result.insertId,
      entityName: parsed.data.title,
      changes: {
        slug: parsed.data.slug,
        status: parsed.data.status,
        categories: parsed.data.categories,
        citySlugs: parsed.data.citySlugs,
      },
      request,
    });

    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch (error) {
    if (isDuplicateWebsiteBlogSlugError(error)) {
      return NextResponse.json(
        { error: "This blog URL slug is already in use." },
        { status: 409 }
      );
    }
    return respondError(error, "admin/website/blogs create");
  }
}
