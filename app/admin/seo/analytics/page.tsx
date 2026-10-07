"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineAnalytics,
  MdOutlineSave,
  MdOutlineCheckCircle,
  MdOutlineInfo,
  MdOutlineOpenInNew,
  MdOutlineRefresh,
  MdOutlineWarning,
} from "react-icons/md";

interface AnalyticsReport {
  propertyId: string;
  startDate: string;
  endDate: string;
  totals: {
    users: number;
    sessions: number;
    pageViews: number;
    conversions: number;
  };
  pages: Array<{
    pagePath: string;
    users: number;
    sessions: number;
    pageViews: number;
    conversions: number;
  }>;
}

export default function SeoAnalyticsPage() {
  const { data, mutate: mutateSettings } = useSWR<{
    settings: Record<string, string>;
  }>(
    "/api/admin/seo/settings",
    fetcher
  );
  const {
    data: report,
    error: reportError,
    isLoading: reportLoading,
    mutate: mutateReport,
  } = useSWR<AnalyticsReport>("/api/admin/seo/analytics/report", fetcher);
  const [gaId, setGaId] = useState<string | undefined>();
  const [gaPropertyId, setGaPropertyId] = useState<string | undefined>();
  const [gtmId, setGtmId] = useState<string | undefined>();
  const [pixelId, setPixelId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(
    null
  );

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/seo/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ga_measurement_id:
            gaId ?? data?.settings.ga_measurement_id ?? "",
          ga_property_id:
            gaPropertyId ?? data?.settings.ga_property_id ?? "",
          gtm_id: gtmId ?? data?.settings.gtm_id ?? "",
          facebook_pixel_id:
            pixelId ?? data?.settings.facebook_pixel_id ?? "",
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Save failed");
      }
      await mutateSettings();
      await mutateReport();
      setToast({ message: "Saved successfully", error: false });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Save failed",
        error: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${toast.error ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"}`}
        >
          {toast.error ? (
            <MdOutlineWarning className="w-5 h-5" />
          ) : (
            <MdOutlineCheckCircle className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <MdOutlineAnalytics className="w-8 h-8 text-teal-600" />
            Google Analytics
          </h1>
          <p className="text-slate-500 mt-1">Track traffic, behavior, and conversions</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium disabled:opacity-50 shadow-sm"
        >
          <MdOutlineSave className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <MdOutlineInfo className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            These public tracking IDs are available from the public SEO API for your
            website to load. Analytics reports below use the GA4 Property ID and
            server-side Google credentials.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            GA4 Property ID
          </label>
          <input
            type="text"
            value={gaPropertyId ?? data?.settings.ga_property_id ?? ""}
            onChange={(e) => setGaPropertyId(e.target.value)}
            placeholder="123456789"
            className="w-full px-4 py-2 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            GA4 Measurement ID
          </label>
          <input
            type="text"
            value={gaId ?? data?.settings.ga_measurement_id ?? ""}
            onChange={(e) => setGaId(e.target.value)}
            placeholder="G-XXXXXXXXXX"
            className="w-full px-4 py-2 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Google Tag Manager ID
          </label>
          <input
            type="text"
            value={gtmId ?? data?.settings.gtm_id ?? ""}
            onChange={(e) => setGtmId(e.target.value)}
            placeholder="GTM-XXXXXX"
            className="w-full px-4 py-2 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Facebook Pixel ID
          </label>
          <input
            type="text"
            value={pixelId ?? data?.settings.facebook_pixel_id ?? ""}
            onChange={(e) => setPixelId(e.target.value)}
            placeholder="1234567890"
            className="w-full px-4 py-2 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Google Analytics 4 report
            </h2>
            {report && (
              <p className="text-xs text-slate-500 mt-1">
                {report.startDate} to {report.endDate} · Property{" "}
                {report.propertyId}
              </p>
            )}
          </div>
          <button
            onClick={() => mutateReport()}
            aria-label="Refresh Google Analytics report"
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <MdOutlineRefresh className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        {reportLoading ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Loading Google Analytics data...
          </p>
        ) : reportError ? (
          <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            {reportError.message}
          </p>
        ) : report ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
              {[
                ["Users", report.totals.users],
                ["Sessions", report.totals.sessions],
                ["Page views", report.totals.pageViews],
                ["Conversions", report.totals.conversions],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {Number(value).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Top pages</th>
                    <th className="py-2 px-2 text-right">Users</th>
                    <th className="py-2 px-2 text-right">Sessions</th>
                    <th className="py-2 px-2 text-right">Views</th>
                    <th className="py-2 pl-2 text-right">Conversions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.pages.map((row) => (
                    <tr key={row.pagePath}>
                      <td className="py-3 pr-4 font-mono text-slate-800">
                        {row.pagePath}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {row.users.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {row.sessions.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {row.pageViews.toLocaleString()}
                      </td>
                      <td className="py-3 pl-2 text-right">
                        {row.conversions.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {report.pages.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        No page data for this date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </section>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mt-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Quick Links</h2>
        <a
          href="https://analytics.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 hover:underline"
        >
          Open Google Analytics
          <MdOutlineOpenInNew className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
