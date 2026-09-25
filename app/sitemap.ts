import type { MetadataRoute } from "next";
import pool from "@/lib/db";
import { env } from "@/lib/env";

export const revalidate = 3600; // regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [rows] = (await pool.query(
      `SELECT page_path, updated_at
       FROM seo_pages
       WHERE is_indexable = 1
       ORDER BY updated_at DESC
       LIMIT 5000`
    )) as any;

    const base = env.WEBSITE_ORIGIN.replace(/\/$/, "");

    return (rows as any[]).map((r) => ({
      url: `${base}${r.page_path.startsWith("/") ? "" : "/"}${r.page_path}`,
      lastModified: new Date(r.updated_at),
      changeFrequency: "weekly" as const,
      priority: r.page_path === "/" ? 1.0 : 0.8,
    }));
  } catch (err) {
    console.error("[sitemap] failed to build", err);
    return [];
  }
}
