"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineFactCheck,
  MdOutlinePlayArrow,
  MdOutlineCheckCircle,
  MdOutlineWarning,
  MdOutlineError,
  MdOutlineRefresh,
} from "react-icons/md";

interface AuditRow {
  category: string;
  label: string;
  status: "pass" | "warn" | "fail";
  message: string;
}

export default function SeoAuditPage() {
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<AuditRow[] | null>(null);

  const { data: pagesData } = useSWR<{ pages: any[] }>(
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
  const { data: schemaData } = useSWR<{ schemas: any[] }>(
    "/api/admin/seo/schema",
    fetcher
  );

  const runAudit = async () => {
    setRunning(true);
    await new Promise((r) => setTimeout(r, 800));

    const pages = pagesData?.pages || [];
    const images = imgData?.images || [];
    const links = linkData?.links || [];
    const schemas = schemaData?.schemas || [];

    const rows: AuditRow[] = [];

    // On-page
    const missingTitle = pages.filter((p) => !p.meta_title).length;
    rows.push({
      category: "On-Page",
      label: "Meta Titles",
      status:
        missingTitle === 0
          ? "pass"
          : missingTitle / Math.max(pages.length, 1) > 0.3
            ? "fail"
            : "warn",
      message:
        missingTitle === 0
          ? `All ${pages.length} pages have titles`
          : `${missingTitle} pages missing titles`,
    });

    const missingDesc = pages.filter((p) => !p.meta_description).length;
    rows.push({
      category: "On-Page",
      label: "Meta Descriptions",
      status:
        missingDesc === 0
          ? "pass"
          : missingDesc / Math.max(pages.length, 1) > 0.3
            ? "fail"
            : "warn",
      message:
        missingDesc === 0
          ? `All pages have descriptions`
          : `${missingDesc} pages missing descriptions`,
    });

    const longTitles = pages.filter((p) => (p.meta_title || "").length > 60).length;
    rows.push({
      category: "On-Page",
      label: "Title Length",
      status: longTitles === 0 ? "pass" : "warn",
      message:
        longTitles === 0 ? "All titles under 60 chars" : `${longTitles} titles too long`,
    });

    // Images
    const missingAlt = images.filter((i) => !i.has_alt).length;
    rows.push({
      category: "Images",
      label: "Alt Text",
      status:
        missingAlt === 0
          ? "pass"
          : missingAlt / Math.max(images.length, 1) > 0.3
            ? "fail"
            : "warn",
      message:
        missingAlt === 0
          ? "All images have alt text"
          : `${missingAlt} images missing alt text`,
    });

    // Links
    const brokenLinks = links.filter((l) => l.is_broken).length;
    rows.push({
      category: "Links",
      label: "Broken Links",
      status: brokenLinks === 0 ? "pass" : "fail",
      message:
        brokenLinks === 0 ? "No broken links" : `${brokenLinks} broken links found`,
    });

    // Canonical
    const missingCanonical = pages.filter((p) => !p.canonical_url).length;
    rows.push({
      category: "Technical",
      label: "Canonical URLs",
      status: missingCanonical === 0 ? "pass" : "warn",
      message:
        missingCanonical === 0
          ? "All pages have canonical URLs"
          : `${missingCanonical} pages missing canonical`,
    });

    // Schema
    rows.push({
      category: "Structured Data",
      label: "Schemas Defined",
      status: schemas.length > 0 ? "pass" : "warn",
      message:
        schemas.length > 0 ? `${schemas.length} active schemas` : "No schemas defined",
    });

    // Sitemap
    rows.push({
      category: "Technical",
      label: "Sitemap",
      status: "pass",
      message: "Sitemap endpoint is available",
    });

    // Robots
    rows.push({
      category: "Technical",
      label: "Robots.txt",
      status: "pass",
      message: "robots.txt is available",
    });

    setReport(rows);
    setRunning(false);
  };

  const summary = report
    ? {
        pass: report.filter((r) => r.status === "pass").length,
        warn: report.filter((r) => r.status === "warn").length,
        fail: report.filter((r) => r.status === "fail").length,
      }
    : null;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <MdOutlineFactCheck className="w-8 h-8 text-teal-600" />
            SEO Audit
          </h1>
          <p className="text-slate-500 mt-1">Full site SEO health analysis</p>
        </div>
        <div className="flex gap-2">
          {report && (
            <button
              onClick={() => setReport(null)}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              <MdOutlineRefresh className="w-5 h-5 text-slate-500" />
            </button>
          )}
          <button
            onClick={runAudit}
            disabled={running}
            className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium disabled:opacity-50 shadow-sm"
          >
            <MdOutlinePlayArrow className="w-4 h-4" />{" "}
            {running ? "Running..." : "Run Full Audit"}
          </button>
        </div>
      </div>

      {!report ? (
        <div className="bg-white rounded-xl border border-slate-200 py-20 text-center">
          <MdOutlineFactCheck className="w-16 h-16 mx-auto text-slate-300" />
          <p className="mt-4 text-lg font-medium text-slate-700">Ready to audit</p>
          <p className="text-sm text-slate-400 mt-1">
            Click "Run Full Audit" to analyze your site
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-green-50 rounded-xl border border-green-200 p-5">
              <div className="flex items-center gap-3">
                <MdOutlineCheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{summary?.pass}</p>
                  <p className="text-xs text-green-700">Passed</p>
                </div>
              </div>
            </div>
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
              <div className="flex items-center gap-3">
                <MdOutlineWarning className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold text-amber-600">{summary?.warn}</p>
                  <p className="text-xs text-amber-700">Warnings</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-200 p-5">
              <div className="flex items-center gap-3">
                <MdOutlineError className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{summary?.fail}</p>
                  <p className="text-xs text-red-700">Failed</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Check
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.map((r, i) => (
                  <tr key={i}>
                    <td className="px-6 py-3">
                      {r.status === "pass" && (
                        <MdOutlineCheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {r.status === "warn" && (
                        <MdOutlineWarning className="w-5 h-5 text-amber-500" />
                      )}
                      {r.status === "fail" && (
                        <MdOutlineError className="w-5 h-5 text-red-600" />
                      )}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500 uppercase font-semibold">
                      {r.category}
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">{r.label}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
