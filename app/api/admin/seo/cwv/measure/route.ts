import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { env } from "@/lib/env";
import { requireSeoAccess } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { HttpError } from "@/lib/http-error";
import { rateLimit } from "@/lib/rate-limit";

type PsiMetric = {
  percentile?: number;
};

interface PageSpeedResponse {
  loadingExperience?: {
    metrics?: Record<string, PsiMetric>;
  };
  originLoadingExperience?: {
    metrics?: Record<string, PsiMetric>;
  };
}

interface PageMeasurement {
  pagePath: string;
  device: "mobile" | "desktop";
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  inp: number | null;
  ttfb: number | null;
  status: "good" | "needs_improvement" | "poor" | "no_data";
}

function percentile(
  metrics: Record<string, PsiMetric> | undefined,
  key: string
): number | null {
  const value = metrics?.[key]?.percentile;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function classify(lcp: number | null, cls: number | null, inp: number | null) {
  if (lcp == null || cls == null || inp == null) return "no_data" as const;
  if (lcp > 4000 || cls > 0.25 || inp > 500) return "poor" as const;
  if (lcp > 2500 || cls > 0.1 || inp > 200) {
    return "needs_improvement" as const;
  }
  return "good" as const;
}

async function measurePage(
  pagePath: string,
  device: "mobile" | "desktop",
  origin: URL
): Promise<PageMeasurement> {
  const pageUrl = new URL(pagePath, origin);
  if (pageUrl.origin !== origin.origin) {
    throw new HttpError(400, `SEO page path must stay on the configured website: ${pagePath}`);
  }

  const params = new URLSearchParams({
    url: pageUrl.toString(),
    strategy: device,
    category: "performance",
  });
  if (process.env.GOOGLE_PAGESPEED_API_KEY) {
    params.set("key", process.env.GOOGLE_PAGESPEED_API_KEY);
  }

  const response = await fetch(
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`,
    { signal: AbortSignal.timeout(45_000) }
  );
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new HttpError(
      response.status === 429 ? 429 : 502,
      response.status === 429
        ? `PageSpeed Insights quota/rate limit reached for ${pageUrl.pathname}. Configure GOOGLE_PAGESPEED_API_KEY and retry after the quota resets.`
        : `PageSpeed Insights could not measure ${pageUrl.pathname} (${response.status}): ${errorBody?.error?.message || "Google returned an unspecified error."}`
    );
  }

  const result = (await response.json()) as PageSpeedResponse;
  const metrics =
    result.loadingExperience?.metrics ??
    result.originLoadingExperience?.metrics;
  const lcpMs = percentile(metrics, "LARGEST_CONTENTFUL_PAINT_MS");
  const fid = percentile(metrics, "FIRST_INPUT_DELAY_MS");
  const clsRaw = percentile(metrics, "CUMULATIVE_LAYOUT_SHIFT_SCORE");
  const inp = percentile(metrics, "INTERACTION_TO_NEXT_PAINT");
  const ttfb = percentile(metrics, "EXPERIMENTAL_TIME_TO_FIRST_BYTE");
  const lcp = lcpMs == null ? null : lcpMs / 1000;
  const cls = clsRaw == null ? null : clsRaw / 100;

  return {
    pagePath,
    device,
    lcp,
    fid,
    cls,
    inp,
    ttfb,
    status: classify(lcpMs, cls, inp),
  };
}

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 5 });
    if (!rl.ok) return rl.response;

    await requireSeoAccess(request);
    const [siteUrlRows] = (await pool.query(
      `SELECT setting_value FROM seo_settings
       WHERE setting_key = 'site_url'
       LIMIT 1`
    )) as any;
    const configuredSiteUrl = (siteUrlRows as Array<{ setting_value: string }>)[0]
      ?.setting_value
      ?.trim();
    const origin = new URL(configuredSiteUrl || env.WEBSITE_ORIGIN);
    const [pageRows] = (await pool.query(
      `SELECT page_path FROM seo_pages
       WHERE is_indexable = 1
       ORDER BY updated_at DESC
       LIMIT 5`
    )) as any;
    const pages = pageRows as Array<{ page_path: string }>;
    if (pages.length === 0) {
      throw new HttpError(400, "Add an indexable page before measuring Core Web Vitals.");
    }

    const measurements: PageMeasurement[] = [];
    for (const page of pages) {
      measurements.push(
        ...(await Promise.all(
          (["mobile", "desktop"] as const).map((device) =>
            measurePage(page.page_path, device, origin)
          )
        ))
      );
    }

    for (const result of measurements) {
      await pool.query(
        `INSERT INTO seo_core_web_vitals
         (page_path, device, lcp, fid, cls, inp, ttfb, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          result.pagePath,
          result.device,
          result.lcp,
          result.fid,
          result.cls,
          result.inp,
          result.ttfb,
          result.status,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      measured: measurements.length,
      source: "Google PageSpeed Insights field data",
    });
  } catch (err) {
    return respondError(err, "POST /api/admin/seo/cwv/measure");
  }
}
