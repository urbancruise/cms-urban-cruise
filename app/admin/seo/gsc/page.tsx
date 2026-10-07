"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineTravelExplore,
  MdOutlineSave,
  MdOutlineCheckCircle,
  MdOutlineOpenInNew,
  MdOutlineInfo,
  MdOutlineRefresh,
  MdOutlineWarning,
} from "react-icons/md";

interface SearchConsoleReport {
  siteUrl: string;
  startDate: string;
  endDate: string;
  totals: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  queries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

export default function SeoGscPage() {
  const {
    data,
    mutate: mutateSettings,
  } = useSWR<{ settings: Record<string, string> }>(
    "/api/admin/seo/settings",
    fetcher
  );
  const {
    data: report,
    error: reportError,
    isLoading: reportLoading,
    mutate: mutateReport,
  } = useSWR<SearchConsoleReport>("/api/admin/seo/gsc/report", fetcher);
  const [code, setCode] = useState<string | undefined>();
  const [siteUrl, setSiteUrl] = useState<string | undefined>();
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
          gsc_verification:
            code ?? data?.settings.gsc_verification ?? "",
          gsc_site_url:
            siteUrl ??
            data?.settings.gsc_site_url ??
            data?.settings.site_url ??
            "",
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

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <MdOutlineTravelExplore className="w-8 h-8 text-teal-600" />
          Google Search Console
        </h1>
        <p className="text-slate-500 mt-1">
          Connect your site for search performance data
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <MdOutlineInfo className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">How to connect</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Go to Google Search Console</li>
              <li>Add your site property</li>
              <li>Choose verification method: HTML tag</li>
              <li>Copy the content value of the meta tag</li>
              <li>Paste it below and save</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <label className="block text-sm font-medium text-slate-900 mb-2">
          Search Console Property
        </label>
        <input
          type="text"
          value={
            siteUrl ??
            data?.settings.gsc_site_url ??
            data?.settings.site_url ??
            ""
          }
          onChange={(e) => setSiteUrl(e.target.value)}
          placeholder="https://urbancruise.com/ or sc-domain:urbancruise.com"
          className="w-full px-4 py-2 mb-5 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <label className="block text-sm font-medium text-slate-900 mb-2">
          Verification Code
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={code ?? data?.settings.gsc_verification ?? ""}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g., aBcD1234...xyz"
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium disabled:opacity-50"
          >
            <MdOutlineSave className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          This verification code is available to the public website through the SEO API as{" "}
          <code className="font-mono bg-slate-100 px-1 rounded">
            &lt;meta name="google-site-verification" content="..."&gt;
          </code>
        </p>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Search performance
            </h2>
            {report && (
              <p className="text-xs text-slate-500 mt-1">
                {report.startDate} to {report.endDate} · {report.siteUrl}
              </p>
            )}
          </div>
          <button
            onClick={() => mutateReport()}
            aria-label="Refresh Search Console report"
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <MdOutlineRefresh className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        {reportLoading ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Loading Google Search Console data...
          </p>
        ) : reportError ? (
          <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            {reportError.message}
          </p>
        ) : report ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
              {[
                ["Clicks", report.totals.clicks.toLocaleString()],
                ["Impressions", report.totals.impressions.toLocaleString()],
                ["Average CTR", `${(report.totals.ctr * 100).toFixed(2)}%`],
                ["Average position", report.totals.position.toFixed(1)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Top search queries</th>
                    <th className="py-2 px-2 text-right">Clicks</th>
                    <th className="py-2 px-2 text-right">Impressions</th>
                    <th className="py-2 px-2 text-right">CTR</th>
                    <th className="py-2 pl-2 text-right">Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.queries.map((row) => (
                    <tr key={row.query}>
                      <td className="py-3 pr-4 text-slate-800">{row.query}</td>
                      <td className="py-3 px-2 text-right">
                        {row.clicks.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {row.impressions.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {(row.ctr * 100).toFixed(2)}%
                      </td>
                      <td className="py-3 pl-2 text-right">
                        {row.position.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                  {report.queries.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        No query data for this date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </section>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Quick Links</h2>
        <div className="space-y-2">
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 hover:underline"
          >
            Open Google Search Console
            <MdOutlineOpenInNew className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://search.google.com/test/rich-results"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 hover:underline"
          >
            Rich Results Test
            <MdOutlineOpenInNew className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://pagespeed.web.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 hover:underline"
          >
            PageSpeed Insights
            <MdOutlineOpenInNew className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
