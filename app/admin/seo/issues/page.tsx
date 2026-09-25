"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineError,
  MdOutlineCheckCircle,
  MdOutlineWarning,
  MdOutlineRefresh,
} from "react-icons/md";

interface Issue {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  page_path?: string;
  fix_url?: string;
}

const SEV_COLORS = {
  critical: "bg-red-50 text-red-700 border-red-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-50 text-slate-700 border-slate-200",
};

export default function SeoIssuesPage() {
  const { data: pagesData, mutate } = useSWR<{ pages: any[] }>(
    "/api/admin/seo/pages?limit=500",
    fetcher
  );
  const { data: imgData } = useSWR<{ images: any[] }>(
    "/api/admin/seo/images?limit=500",
    fetcher
  );
  const { data: linkData } = useSWR<{ links: any[] }>(
    "/api/admin/seo/internal-links",
    fetcher
  );

  const issues = useMemo<Issue[]>(() => {
    const pages = pagesData?.pages || [];
    const images = imgData?.images || [];
    const links = linkData?.links || [];

    const list: Issue[] = [];

    const missingTitle = pages.filter((p) => !p.meta_title);
    if (missingTitle.length > 0) {
      list.push({
        id: "missing-title",
        severity: missingTitle.length > 5 ? "critical" : "high",
        title: `${missingTitle.length} pages missing meta title`,
        description:
          "Meta titles are critical for SEO. Each page should have a unique title.",
        fix_url: "/admin/seo/pages?filter=missing_title",
      });
    }

    const missingDesc = pages.filter((p) => !p.meta_description);
    if (missingDesc.length > 0) {
      list.push({
        id: "missing-desc",
        severity: missingDesc.length > 5 ? "high" : "medium",
        title: `${missingDesc.length} pages missing meta description`,
        description: "Meta descriptions improve click-through rates in search results.",
        fix_url: "/admin/seo/pages?filter=missing_description",
      });
    }

    const missingAlt = images.filter((i) => !i.has_alt);
    if (missingAlt.length > 0) {
      list.push({
        id: "missing-alt",
        severity: missingAlt.length > 10 ? "high" : "medium",
        title: `${missingAlt.length} images missing alt text`,
        description: "Alt text improves accessibility and image SEO.",
        fix_url: "/admin/seo/images?filter=missing_alt",
      });
    }

    const missingCanonical = pages.filter((p) => !p.canonical_url);
    if (missingCanonical.length > 0) {
      list.push({
        id: "missing-canonical",
        severity: "medium",
        title: `${missingCanonical.length} pages missing canonical URLs`,
        description: "Canonical URLs prevent duplicate content issues.",
        fix_url: "/admin/seo/urls",
      });
    }

    const brokenLinks = links.filter((l) => l.is_broken);
    if (brokenLinks.length > 0) {
      list.push({
        id: "broken-links",
        severity: brokenLinks.length > 5 ? "critical" : "high",
        title: `${brokenLinks.length} broken internal links`,
        description: "Broken links harm user experience and SEO.",
        fix_url: "/admin/seo/internal-links",
      });
    }

    const longTitles = pages.filter((p) => (p.meta_title || "").length > 60);
    if (longTitles.length > 0) {
      list.push({
        id: "long-title",
        severity: "low",
        title: `${longTitles.length} pages have titles > 60 chars`,
        description: "Google truncates titles over 60 characters.",
        fix_url: "/admin/seo/pages",
      });
    }

    return list;
  }, [pagesData, imgData, linkData]);

  const grouped = useMemo(() => {
    const map: Record<string, Issue[]> = { critical: [], high: [], medium: [], low: [] };
    issues.forEach((i) => map[i.severity].push(i));
    return map;
  }, [issues]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <MdOutlineError className="w-8 h-8 text-teal-600" />
            SEO Issues Center
          </h1>
          <p className="text-slate-500 mt-1">
            {issues.length === 0
              ? "No issues found 🎉"
              : `${issues.length} issue${issues.length > 1 ? "s" : ""} detected`}
          </p>
        </div>
        <button
          onClick={() => mutate()}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <MdOutlineRefresh className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {issues.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-20 text-center">
          <MdOutlineCheckCircle className="w-16 h-16 mx-auto text-green-500" />
          <p className="mt-4 text-lg font-medium text-slate-700">All clear!</p>
          <p className="text-sm text-slate-400 mt-1">
            No SEO issues detected on your site
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {(["critical", "high", "medium", "low"] as const).map((severity) => {
            const items = grouped[severity];
            if (items.length === 0) return null;
            return (
              <div key={severity}>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                  {severity} ({items.length})
                </h2>
                <div className="space-y-3">
                  {items.map((issue) => (
                    <div
                      key={issue.id}
                      className={`bg-white rounded-xl border p-5 ${SEV_COLORS[severity]}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{issue.title}</p>
                          <p className="text-sm text-slate-600 mt-1">
                            {issue.description}
                          </p>
                        </div>
                        {issue.fix_url && (
                          <a
                            href={issue.fix_url}
                            className="flex-shrink-0 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
                          >
                            Fix →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
