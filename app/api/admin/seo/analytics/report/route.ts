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

interface AnalyticsReportResponse {
  totals?: Array<{
    metricValues?: Array<{ value?: string }>;
  }>;
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 30 });
    if (!rl.ok) return rl.response;

    await requireSeoAccess(request);
    const [settingsRows] = (await pool.query(
      `SELECT setting_value
       FROM seo_settings
       WHERE setting_key = 'ga_property_id'
       LIMIT 1`
    )) as any;
    const configuredProperty = (settingsRows as Array<{ setting_value: string }>)[0]
      ?.setting_value
      ?.trim();
    const propertyId = configuredProperty?.replace(/^properties\//, "");

    if (!propertyId) {
      throw new HttpError(
        400,
        "Set your Google Analytics 4 Property ID in SEO Settings."
      );
    }
    if (!/^\d+$/.test(propertyId)) {
      throw new HttpError(400, "Google Analytics Property ID must contain digits only.");
    }

    const accessToken = await getGoogleAccessToken(
      "https://www.googleapis.com/auth/analytics.readonly"
    );
    const { startDate, endDate } = defaultGoogleDateRange();
    const report = await googleApiPost<AnalyticsReportResponse>(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      accessToken,
      {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "pagePath" }],
        metrics: [
          { name: "totalUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "conversions" },
        ],
        metricAggregations: ["TOTAL"],
        orderBys: [
          { metric: { metricName: "screenPageViews" }, desc: true },
        ],
        limit: 25,
      }
    );

    const values = report.totals?.[0]?.metricValues || [];
    return NextResponse.json({
      propertyId,
      startDate,
      endDate,
      totals: {
        users: Number(values[0]?.value) || 0,
        sessions: Number(values[1]?.value) || 0,
        pageViews: Number(values[2]?.value) || 0,
        conversions: Number(values[3]?.value) || 0,
      },
      pages: (report.rows || []).map((row) => ({
        pagePath: row.dimensionValues?.[0]?.value || "",
        users: Number(row.metricValues?.[0]?.value) || 0,
        sessions: Number(row.metricValues?.[1]?.value) || 0,
        pageViews: Number(row.metricValues?.[2]?.value) || 0,
        conversions: Number(row.metricValues?.[3]?.value) || 0,
      })),
    });
  } catch (err) {
    return respondError(err, "GET /api/admin/seo/analytics/report");
  }
}
