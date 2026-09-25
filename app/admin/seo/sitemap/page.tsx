"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineMap,
  MdOutlineRefresh,
  MdOutlineDownload,
  MdOutlineCheckCircle,
  MdOutlineLink,
  MdOutlineOpenInNew,
} from "react-icons/md";

interface SeoPage {
  id: number;
  page_path: string;
  page_type: string;
  is_indexable: boolean;
  updated_at: string;
  city_name: string | null;
}

export default function SeoSitemapPage() {
  const [copied, setCopied] = useState(false);

  const { data, isLoading, mutate } = useSWR<{ pages: SeoPage[]; total: number }>(
    "/api/admin/seo/pages?limit=200",
    fetcher
  );

  const pages = (data?.pages || []).filter((p) => p.is_indexable);

  const sitemapUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/sitemap.xml`
      : "/sitemap.xml";

  const generateXml = () => {
    const urls = pages
      .map(
        (p) =>
          `  <url>\n    <loc>${p.page_path}</loc>\n    <lastmod>${new Date(p.updated_at).toISOString().split("T")[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${p.page_type === "home" ? "1.0" : "0.8"}</priority>\n  </url>`
      )
      .join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
  };

  const downloadSitemap = () => {
    const xml = generateXml();
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sitemap.xml";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(sitemapUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <MdOutlineMap className="w-8 h-8 text-teal-600" />
            Sitemap Management
          </h1>
          <p className="text-slate-500 mt-1">{pages.length} indexable pages in sitemap</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => mutate()}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <MdOutlineRefresh className="w-5 h-5 text-slate-500" />
          </button>
          <button
            onClick={downloadSitemap}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm"
          >
            <MdOutlineDownload className="w-4 h-4" /> Download XML
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Sitemap URL</h2>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-700">
            {sitemapUrl}
          </code>
          <button
            onClick={copyUrl}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <MdOutlineOpenInNew className="w-4 h-4 text-slate-500" />
          </a>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Submit this URL to Google Search Console so search engines can discover your
          pages.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">
          Included Pages ({pages.length})
        </h2>
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : pages.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-12">
            No indexable pages. Add pages in Page SEO Management.
          </p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {pages.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
              >
                <MdOutlineCheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-slate-800 truncate">
                    {p.page_path}
                  </p>
                  <p className="text-xs text-slate-400">
                    {p.page_type} {p.city_name ? `· ${p.city_name}` : ""}
                  </p>
                </div>
                <MdOutlineLink className="w-3.5 h-3.5 text-slate-400" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
