"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineLink,
  MdOutlineRefresh,
  MdOutlineSearch,
  MdOutlineCheckCircle,
  MdOutlineWarning,
  MdOutlineError,
} from "react-icons/md";
import { TableSkeleton } from "@/app/components/UI/PageSkeletons";

interface SeoPage {
  id: number;
  page_path: string;
  page_type: string;
  canonical_url: string | null;
  is_indexable: boolean;
  updated_at: string;
}

export default function SeoUrlsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, mutate } = useSWR<{ pages: SeoPage[]; total: number }>(
    "/api/admin/seo/pages?limit=500",
    fetcher
  );
  const pages = data?.pages || [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((p) => p.page_path.toLowerCase().includes(q));
  }, [pages, search]);

  const stats = useMemo(() => {
    const total = pages.length;
    const missingCanonical = pages.filter((p) => !p.canonical_url).length;
    const tooLong = pages.filter((p) => p.page_path.length > 100).length;
    const good = pages.filter(
      (p) => p.canonical_url && p.page_path.length <= 100
    ).length;
    return { total, missingCanonical, tooLong, good };
  }, [pages]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <MdOutlineLink className="w-8 h-8 text-teal-600" />
            URL Management
          </h1>
          <p className="text-slate-500 mt-1">
            Canonical URLs and URL structure analysis
          </p>
        </div>
        <button
          onClick={() => mutate()}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <MdOutlineRefresh className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Total URLs</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {stats.total}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Optimal</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {stats.good}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Missing Canonical</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {stats.missingCanonical}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Too Long</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {stats.tooLong}
          </p>
        </div>
      </div>

      <div className="relative mb-6 max-w-md">
        <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search URLs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white"
        />
      </div>

      {isLoading && !data ? (
        <TableSkeleton rows={8} columns={4} />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <MdOutlineLink className="w-12 h-12 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500">No URLs to analyze</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Path
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Length
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Canonical
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const pathLen = p.page_path.length;
                const hasCanonical = Boolean(p.canonical_url);
                const tooLong = pathLen > 100;
                const status = !hasCanonical
                  ? "error"
                  : tooLong
                  ? "warning"
                  : "ok";
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3">
                      {status === "ok" && (
                        <MdOutlineCheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {status === "warning" && (
                        <MdOutlineWarning className="w-5 h-5 text-amber-500" />
                      )}
                      {status === "error" && (
                        <MdOutlineError className="w-5 h-5 text-red-500" />
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-sm font-mono text-slate-800 truncate max-w-lg">
                        {p.page_path}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {p.page_type}
                      </p>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-xs font-medium ${
                          tooLong ? "text-amber-600" : "text-slate-600"
                        }`}
                      >
                        {pathLen}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs">
                      {hasCanonical ? (
                        <span className="text-green-600">✓ Set</span>
                      ) : (
                        <span className="text-red-600">✕ Missing</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}