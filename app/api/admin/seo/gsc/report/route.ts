import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireSeoAccess } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";
import {
  defaultGoogleDateRange,
  getGoogleAccessToken,
  googleApiPost,
} from "@/lib/google-seo";
import { HttpError } from "@/lib/http-error";

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 30 });
    if (!rl.ok) return rl.response;

    await requireSeoAccess(request);
    const [settingsRows] = (await pool.query(
      `SELECT setting_key, setting_value
       FROM seo_settings
       WHERE setting_key IN ('gsc_site_url', 'site_url')`
    )) as any;
    const settings = new Map<string, string>(
      (settingsRows as Array<{ setting_key: string; setting_value: string }>).map(
        (row) => [row.setting_key, row.setting_value]
      )
    );
    const siteUrl = settings.get("gsc_site_url") || settings.get("site_url");
    if (!siteUrl) {
      throw new HttpError(
        400,
        "Set a site URL in SEO Settings or add a Search Console property URL."
      );
    }

    const accessToken = await getGoogleAccessToken(
      "https://www.googleapis.com/auth/webmasters.readonly"
    );
    const { startDate, endDate } = defaultGoogleDateRange();
    const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
    const requestBody = { startDate, endDate };

    const [totals, rows] = await Promise.all([
      googleApiPost<{
        rows?: Array<{
          clicks?: number;
          impressions?: number;
          ctr?: number;
          position?: number;
        }>;
      }>(endpoint, accessToken, requestBody),
      googleApiPost<{
        rows?: Array<{
          keys?: string[];
          clicks?: number;
          impressions?: number;
          ctr?: number;
          position?: number;
        }>;
      }>(endpoint, accessToken, {
        ...requestBody,
        dimensions: ["query"],
        rowLimit: 25,
      }),
    ]);
    const total = totals.rows?.[0] ?? {};

    return NextResponse.json({
      siteUrl,
      startDate,
      endDate,
      totals: {
        clicks: total.clicks ?? 0,
        impressions: total.impressions ?? 0,
        ctr: total.ctr ?? 0,
        position: total.position ?? 0,
      },
      queries: (rows.rows || []).map((row) => ({
        query: row.keys?.[0] ?? "",
        clicks: row.clicks ?? 0,
        impressions: row.impressions ?? 0,
        ctr: row.ctr ?? 0,
        position: row.position ?? 0,
      })),
    });
  } catch (err) {
    return respondError(err, "GET /api/admin/seo/gsc/report");
  }
}
