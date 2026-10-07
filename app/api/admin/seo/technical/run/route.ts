import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { env } from "@/lib/env";
import { requireSeoAccess } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";

type CheckStatus = "ok" | "warning" | "error";
type TechnicalCheck = [string, string, CheckStatus, string];

interface ProbeResult {
  ok: boolean;
  status: number | null;
  bodyPrefix: string;
  error: string | null;
}

async function probe(path: string): Promise<ProbeResult> {
  try {
    const response = await fetch(new URL(path, env.WEBSITE_ORIGIN), {
      signal: AbortSignal.timeout(12_000),
      headers: { Accept: "text/html,application/xml,text/plain,*/*" },
    });
    const bodyPrefix = response.ok ? await readPrefix(response, 4096) : "";
    return {
      ok: response.ok,
      status: response.status,
      bodyPrefix,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      bodyPrefix: "",
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

async function readPrefix(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let result = "";
  let bytesRead = 0;
  try {
    while (bytesRead < maxBytes) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      const chunk = value.subarray(0, maxBytes - bytesRead);
      bytesRead += chunk.byteLength;
      result += decoder.decode(chunk, { stream: bytesRead < maxBytes });
      if (chunk.byteLength < value.byteLength) break;
    }
    return result + decoder.decode();
  } finally {
    await reader.cancel();
  }
}

function probeMessage(path: string, result: ProbeResult): string {
  if (result.error) return `Could not reach ${path}: ${result.error}`;
  return `${path} returned HTTP ${result.status}`;
}

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 5 });
    if (!rl.ok) return rl.response;

    await requireSeoAccess(request);
    const baseUrl = new URL(env.WEBSITE_ORIGIN);
    const [pageStatsRows] = (await pool.query(
      `SELECT COUNT(*) AS total,
         SUM(CASE WHEN canonical_url IS NULL OR canonical_url = '' THEN 1 ELSE 0 END) AS missing_canonical,
         SUM(CASE WHEN meta_title IS NULL OR meta_title = '' THEN 1 ELSE 0 END) AS missing_title,
         SUM(CASE WHEN meta_description IS NULL OR meta_description = '' THEN 1 ELSE 0 END) AS missing_description
       FROM seo_pages`
    )) as any;
    const [imageRows] = (await pool.query(
      `SELECT COUNT(*) AS missing_alt FROM seo_images WHERE has_alt = 0`
    )) as any;
    const [linkRows] = (await pool.query(
      `SELECT COUNT(*) AS broken FROM seo_internal_links WHERE is_broken = 1`
    )) as any;
    const [schemaRows] = (await pool.query(
      `SELECT COUNT(*) AS inactive FROM seo_schemas WHERE is_active = 0`
    )) as any;
    const [cwvRows] = (await pool.query(
      `SELECT status FROM seo_core_web_vitals
       WHERE measured_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
       ORDER BY measured_at DESC LIMIT 100`
    )) as any;

    const [robots, sitemap, home] = await Promise.all([
      probe("/robots.txt"),
      probe("/sitemap.xml"),
      probe("/"),
    ]);
    const pages = (pageStatsRows as any[])[0] || {};
    const pageCount = Number(pages.total) || 0;
    const missingCanonical = Number(pages.missing_canonical) || 0;
    const missingTitle = Number(pages.missing_title) || 0;
    const missingDescription = Number(pages.missing_description) || 0;
    const missingAlt = Number((imageRows as any[])[0]?.missing_alt) || 0;
    const brokenLinks = Number((linkRows as any[])[0]?.broken) || 0;
    const inactiveSchemas = Number((schemaRows as any[])[0]?.inactive) || 0;
    const vitals = cwvRows as Array<{ status: string }>;
    const latestVitalsStatus = vitals.some((row) => row.status === "poor")
      ? "error"
      : vitals.some((row) => row.status === "needs_improvement")
        ? "warning"
        : vitals.some((row) => row.status === "good")
          ? "ok"
          : "warning";

    const checks: TechnicalCheck[] = [
      [
        "https",
        baseUrl.origin,
        baseUrl.protocol === "https:" ? "ok" : "error",
        baseUrl.protocol === "https:"
          ? "Configured website origin uses HTTPS"
          : `Configured website origin is not HTTPS: ${baseUrl.origin}`,
      ],
      [
        "robots",
        "/robots.txt",
        robots.ok ? (robots.bodyPrefix.includes("User-agent:") ? "ok" : "warning") : "error",
        robots.ok && robots.bodyPrefix.includes("User-agent:")
          ? probeMessage("/robots.txt", robots)
          : robots.ok
            ? "robots.txt returned a response without a User-agent directive"
            : probeMessage("/robots.txt", robots),
      ],
      [
        "sitemap",
        "/sitemap.xml",
        sitemap.ok
          ? (/<(?:urlset|sitemapindex)\b/i.test(sitemap.bodyPrefix) ? "ok" : "warning")
          : "error",
        sitemap.ok && /<(?:urlset|sitemapindex)\b/i.test(sitemap.bodyPrefix)
          ? probeMessage("/sitemap.xml", sitemap)
          : sitemap.ok
            ? "Sitemap responded, but no urlset or sitemapindex XML was found"
            : probeMessage("/sitemap.xml", sitemap),
      ],
      [
        "mobile",
        "/",
        home.ok
          ? (/<meta\b[^>]*name=["']viewport["']/i.test(home.bodyPrefix) ? "ok" : "warning")
          : "error",
        home.ok && /<meta\b[^>]*name=["']viewport["']/i.test(home.bodyPrefix)
          ? "Homepage responds and declares a viewport meta tag"
          : home.ok
            ? "Homepage does not declare a viewport meta tag"
            : probeMessage("/", home),
      ],
      [
        "canonical",
        "/",
        pageCount === 0 ? "warning" : missingCanonical ? "warning" : "ok",
        pageCount === 0
          ? "No SEO pages are configured"
          : missingCanonical
            ? `${missingCanonical} of ${pageCount} SEO pages have no canonical URL`
            : `All ${pageCount} SEO pages have canonical URLs`,
      ],
      [
        "meta_title",
        "/",
        pageCount === 0 ? "warning" : missingTitle ? "warning" : "ok",
        pageCount === 0
          ? "No SEO pages are configured"
          : missingTitle
            ? `${missingTitle} of ${pageCount} SEO pages have no meta title`
            : `All ${pageCount} SEO pages have a meta title`,
      ],
      [
        "meta_description",
        "/",
        pageCount === 0 ? "warning" : missingDescription ? "warning" : "ok",
        pageCount === 0
          ? "No SEO pages are configured"
          : missingDescription
            ? `${missingDescription} of ${pageCount} SEO pages have no meta description`
            : `All ${pageCount} SEO pages have a meta description`,
      ],
      [
        "image_alt",
        "/",
        missingAlt ? "warning" : "ok",
        missingAlt ? `${missingAlt} images have no alt text` : "All tracked images have alt text",
      ],
      [
        "broken_link",
        "/",
        brokenLinks ? "error" : "ok",
        brokenLinks ? `${brokenLinks} internal links are marked broken` : "No tracked internal links are marked broken",
      ],
      [
        "schema",
        "/",
        inactiveSchemas ? "warning" : "ok",
        inactiveSchemas
          ? `${inactiveSchemas} structured data entries are inactive`
          : "All structured data entries are active",
      ],
      [
        "speed",
        "/",
        latestVitalsStatus,
        vitals.length
          ? `Most recent PageSpeed field-data status: ${latestVitalsStatus}`
          : "No PageSpeed field data is available yet; run a Core Web Vitals measurement",
      ],
    ];

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query("DELETE FROM seo_technical");
      for (const [type, key, status, message] of checks) {
        await connection.query(
          `INSERT INTO seo_technical (check_type, check_key, status, message)
           VALUES (?, ?, ?, ?)`,
          [type, key, status, message]
        );
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return NextResponse.json({ success: true, count: checks.length });
  } catch (err) {
    return respondError(err, "POST /api/admin/seo/technical/run");
  }
}
