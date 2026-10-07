"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import { api } from "@/lib/api";
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

interface TechnicalCheck {
  check_type: string;
  check_key: string | null;
  status: "ok" | "warning" | "error";
  message: string | null;
}

interface AuditPageRecord {
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
}

interface AuditImageRecord {
  has_alt: boolean;
}

interface AuditLinkRecord {
  is_broken: boolean;
}

interface AuditSchemaRecord {
  is_active: boolean;
}

export default function SeoAuditPage() {
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<AuditRow[] | null>(null);
  const [auditError, setAuditError] = useState("");

  const { mutate: mutatePages } = useSWR<{ pages: AuditPageRecord[] }>(
    "/api/admin/seo/pages?limit=500",
    fetcher
  );
  const { mutate: mutateImages } = useSWR<{ images: AuditImageRecord[] }>(
    "/api/admin/seo/images?limit=500",
    fetcher
  );
  const { mutate: mutateLinks } = useSWR<{ links: AuditLinkRecord[] }>(
    "/api/admin/seo/internal-links",
    fetcher
  );
  const { mutate: mutateSchemas } = useSWR<{
    schemas: AuditSchemaRecord[];
  }>(
    "/api/admin/seo/schema",
    fetcher
  );
  const { mutate: mutateTechnical } = useSWR<{ checks: TechnicalCheck[] }>(
    "/api/admin/seo/technical",
    fetcher
  );

  const runAudit = async () => {
    setRunning(true);
    setAuditError("");
    try {
      await api("/api/admin/seo/technical/run", { method: "POST" });

      const [pageResult, imageResult, linkResult, schemaResult, technicalResult] =
        await Promise.all([
          mutatePages(),
          mutateImages(),
          mutateLinks(),
          mutateSchemas(),
          mutateTechnical(),
        ]);
      const pages = pageResult?.pages || [];
      const images = imageResult?.images || [];
      const links = linkResult?.links || [];
      const schemas = schemaResult?.schemas || [];
      const rows: AuditRow[] = [];

      const missingTitle = pages.filter((page) => !page.meta_title).length;
      rows.push({
        category: "On-Page",
        label: "Meta Titles",
        status:
          pages.length === 0
            ? "warn"
            : missingTitle === 0
              ? "pass"
              : missingTitle / pages.length > 0.3
                ? "fail"
                : "warn",
        message: pages.length === 0
          ? "No SEO pages are configured"
          : missingTitle === 0
            ? `All ${pages.length} pages have titles`
            : `${missingTitle} pages missing titles`,
      });

      const missingDesc = pages.filter((page) => !page.meta_description).length;
      rows.push({
        category: "On-Page",
        label: "Meta Descriptions",
        status:
          pages.length === 0
            ? "warn"
            : missingDesc === 0
              ? "pass"
              : missingDesc / pages.length > 0.3
                ? "fail"
                : "warn",
        message: pages.length === 0
          ? "No SEO pages are configured"
          : missingDesc === 0
            ? "All pages have descriptions"
            : `${missingDesc} pages missing descriptions`,
      });

      const longTitles = pages.filter(
        (page) => (page.meta_title || "").length > 60
      ).length;
      rows.push({
        category: "On-Page",
        label: "Title Length",
        status: longTitles === 0 && pages.length > 0 ? "pass" : "warn",
        message:
          pages.length === 0
            ? "No SEO pages are configured"
            : longTitles === 0
              ? "All titles are 60 characters or fewer"
              : `${longTitles} titles are longer than 60 characters`,
      });

      const missingAlt = images.filter((image) => !image.has_alt).length;
      rows.push({
        category: "Images",
        label: "Alt Text",
        status:
          images.length === 0
            ? "warn"
            : missingAlt === 0
              ? "pass"
              : missingAlt / images.length > 0.3
                ? "fail"
                : "warn",
        message:
          images.length === 0
            ? "No images are tracked"
            : missingAlt === 0
              ? "All tracked images have alt text"
              : `${missingAlt} of ${images.length} tracked images have no alt text`,
      });

      const brokenLinks = links.filter((link) => link.is_broken).length;
      rows.push({
        category: "Links",
        label: "Broken Links",
        status:
          links.length === 0 ? "warn" : brokenLinks === 0 ? "pass" : "fail",
        message:
          links.length === 0
            ? "No internal links have been checked"
            : brokenLinks === 0
              ? "No tracked broken links"
              : `${brokenLinks} tracked links are broken`,
      });

      const missingCanonical = pages.filter((page) => !page.canonical_url).length;
      rows.push({
        category: "Technical",
        label: "Canonical URLs",
        status:
          pages.length === 0
            ? "warn"
            : missingCanonical === 0
              ? "pass"
              : "warn",
        message:
          pages.length === 0
            ? "No SEO pages are configured"
            : missingCanonical === 0
              ? "All pages have canonical URLs"
              : `${missingCanonical} pages missing canonical URLs`,
      });

      const activeSchemas = schemas.filter((schema) => schema.is_active).length;
      rows.push({
        category: "Structured Data",
        label: "Active Schemas",
        status: activeSchemas > 0 ? "pass" : "warn",
        message:
          activeSchemas > 0
            ? `${activeSchemas} active schemas`
            : "No active schemas are defined",
      });

      const technicalLabels: Record<string, [string, string]> = {
        https: ["Technical", "HTTPS"],
        mobile: ["Technical", "Mobile Viewport"],
        speed: ["Performance", "Core Web Vitals"],
        sitemap: ["Technical", "Sitemap"],
        robots: ["Technical", "Robots.txt"],
      };
      for (const check of technicalResult?.checks || []) {
        const label = technicalLabels[check.check_type];
        if (!label) continue;
        rows.push({
          category: label[0],
          label: label[1],
          status:
            check.status === "ok"
              ? "pass"
              : check.status === "warning"
                ? "warn"
                : "fail",
          message: check.message || "No details",
        });
      }

      setReport(rows);
    } catch (error) {
      setAuditError(
        error instanceof Error ? error.message : "Failed to run SEO audit"
      );
    } finally {
      setRunning(false);
    }
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

      {auditError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {auditError}
        </div>
      )}

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
