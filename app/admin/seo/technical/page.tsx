"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineBuild,
  MdOutlineRefresh,
  MdOutlineCheckCircle,
  MdOutlineWarning,
  MdOutlineError,
} from "react-icons/md";

interface TechnicalCheck {
  id: number;
  check_type: string;
  check_key: string | null;
  status: "ok" | "warning" | "error";
  message: string | null;
  checked_at: string;
}

const STATUS_ICON = {
  ok: <MdOutlineCheckCircle className="w-5 h-5 text-green-600" />,
  warning: <MdOutlineWarning className="w-5 h-5 text-amber-500" />,
  error: <MdOutlineError className="w-5 h-5 text-red-600" />,
};

const CHECK_LABELS: Record<string, string> = {
  sitemap: "Sitemap",
  robots: "Robots.txt",
  https: "HTTPS / SSL",
  mobile: "Mobile Friendly",
  speed: "Page Speed",
  canonical: "Canonical Tags",
  broken_link: "Broken Links",
  indexability: "Indexability",
};

export default function SeoTechnicalPage() {
  const [running, setRunning] = useState(false);

  const { data, isLoading, mutate } = useSWR<{ checks: TechnicalCheck[] }>(
    "/api/admin/seo/technical",
    fetcher
  );

  const checks = data?.checks || [];

  const runAudit = async () => {
    setRunning(true);
    try {
      await fetch("/api/admin/seo/technical/run", { method: "POST" });
      await mutate();
    } finally {
      setRunning(false);
    }
  };

  const okCount = checks.filter((c) => c.status === "ok").length;
  const warnCount = checks.filter((c) => c.status === "warning").length;
  const errorCount = checks.filter((c) => c.status === "error").length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <MdOutlineBuild className="w-8 h-8 text-teal-600" />
            Technical SEO
          </h1>
          <p className="text-slate-500 mt-1">Monitor technical issues and site health</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => mutate()} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
            <MdOutlineRefresh className="w-5 h-5 text-slate-500" />
          </button>
          <button onClick={runAudit} disabled={running} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium disabled:opacity-50 shadow-sm">
            {running ? "Running..." : "Run Audit"}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <MdOutlineCheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-600">{okCount}</p>
              <p className="text-xs text-slate-500">Passing checks</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <MdOutlineWarning className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold text-amber-500">{warnCount}</p>
              <p className="text-xs text-slate-500">Warnings</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <MdOutlineError className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-600">{errorCount}</p>
              <p className="text-xs text-slate-500">Errors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Checks list */}
      {isLoading && !data ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 mt-3 text-sm">Loading checks...</p>
        </div>
      ) : checks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <MdOutlineBuild className="w-12 h-12 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500 font-medium">No technical checks yet</p>
          <p className="text-xs text-slate-400 mt-1">Click &quot;Run Audit&quot; to start</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {checks.map((c) => (
            <div key={c.id} className="p-5 flex items-center gap-4">
              <div className="flex-shrink-0">{STATUS_ICON[c.status]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-slate-900">{CHECK_LABELS[c.check_type] || c.check_type}</h3>
                  {c.check_key && <span className="text-xs font-mono text-slate-400">{c.check_key}</span>}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{c.message || "No details"}</p>
                <p className="text-[10px] text-slate-400 mt-1">Checked {new Date(c.checked_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}