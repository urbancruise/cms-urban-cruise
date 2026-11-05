import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { requireApiKey, withCors } from "@/lib/public-auth";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeWebsiteBlogHtml } from "@/lib/website-blog-html";
import {
  parseBlogCitySlugs,
  parseBlogCategories,
  WEBSITE_BLOG_CATEGORIES,
} from "@/lib/website-blogs";

interface PublicBlogRow extends RowDataPacket {
  id: number;
  title: string;
  slug: string;
  paragraph: string;
  image_url: string;
  categories: unknown;
  cities: unknown;
  author_name: string;
  created_at: string;
}

interface PublicBlogHeroRow extends RowDataPacket {
  content: unknown;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 300 });
    if (!rl.ok) return withCors(rl.response!);

    const auth = await requireApiKey(request);
    if (!auth.ok) {
      return withCors(NextResponse.json({ error: auth.error }, { status: 401 }));
    }

    const citySlug = new URL(request.url).searchParams.get("city")?.trim();
    if (citySlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(citySlug)) {
      return withCors(
        NextResponse.json({ error: "Invalid city" }, { status: 400 })
      );
    }

    const [rows] = await pool.query<PublicBlogRow[]>(
      `SELECT blog.id, blog.title, blog.slug, blog.paragraph, blog.image_url,
              blog.categories, blog.cities, blog.created_at,
              COALESCE(NULLIF(TRIM(author.full_name), ''), NULLIF(TRIM(author.username), ''), 'Urban Cruise') AS author_name
       FROM website_blogs AS blog
       LEFT JOIN users AS author ON author.id = blog.created_by
       WHERE blog.status = 'published'
         AND (? IS NULL OR JSON_LENGTH(blog.cities) = 0 OR JSON_CONTAINS(blog.cities, JSON_QUOTE(?), '$'))
       ORDER BY blog.created_at DESC, blog.id DESC`,
      [citySlug || null, citySlug || null]
    );
    const [heroRows] = await pool.query<PublicBlogHeroRow[]>(
      `SELECT content
       FROM website_blog_heroes AS hero
       JOIN cities AS city ON city.id = hero.city_id
       WHERE city.is_active = 1
         AND LOWER(REPLACE(TRIM(city.name), ' ', '-')) = ?
         AND hero.status = 'published'
       LIMIT 1`,
      [citySlug || ""]
    );
    const heroContent = heroRows[0]?.content;

    return withCors(
      NextResponse.json(
        {
          hero:
            typeof heroContent === "string"
              ? JSON.parse(heroContent)
              : heroContent || null,
          blogs: rows.map((row) => ({
            id: row.id,
            title: row.title,
            slug: row.slug,
            paragraph: sanitizeWebsiteBlogHtml(row.paragraph),
            image: row.image_url,
            categories: parseBlogCategories(row.categories),
            citySlugs: parseBlogCitySlugs(row.cities),
            authorName: row.author_name,
            createdAt: row.created_at,
          })),
          categories: WEBSITE_BLOG_CATEGORIES,
        },
        {
          headers: {
            "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
          },
        }
      )
    );
  } catch (error) {
    console.error("[public/blogs] error:", error);
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}
