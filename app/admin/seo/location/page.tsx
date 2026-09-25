"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineLocationOn,
  MdOutlineRefresh,
  MdOutlineSearch,
  MdOutlineEdit,
  MdOutlineCheckCircle,
} from "react-icons/md";

interface City {
  id: number;
  name: string;
  state: string | null;
}

interface SeoPage {
  id: number;
  city_id: number | null;
  page_path: string;
  page_type: string;
  meta_title: string | null;
  focus_keyword: string | null;
}

export default function SeoLocationPage() {
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const { data: citiesData } = useSWR<{ cities: City[] }>(
    "/api/admin/cities?active=true",
    fetcher
  );
  const cities = citiesData?.cities || [];

  const {
    data: pagesData,
    isLoading,
    mutate,
  } = useSWR<{ pages: SeoPage[] }>("/api/admin/seo/pages?limit=500", fetcher);
  const allPages = pagesData?.pages || [];

  const filtered = useMemo(() => {
    let list = allPages.filter((p) => p.city_id);
    if (selectedCity) list = list.filter((p) => p.city_id === selectedCity);
    const q = search.trim().toLowerCase();
    if (q)
      list = list.filter(
        (p) =>
          p.page_path.toLowerCase().includes(q) ||
          (p.meta_title || "").toLowerCase().includes(q)
      );
    return list;
  }, [allPages, selectedCity, search]);

  const cityStats = useMemo(() => {
    const map: Record<number, { total: number; optimized: number }> = {};
    allPages.forEach((p) => {
      if (!p.city_id) return;
      if (!map[p.city_id]) map[p.city_id] = { total: 0, optimized: 0 };
      map[p.city_id].total++;
      if (p.meta_title && p.focus_keyword) map[p.city_id].optimized++;
    });
    return map;
  }, [allPages]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <MdOutlineLocationOn className="w-8 h-8 text-teal-600" />
            Location SEO
          </h1>
          <p className="text-slate-500 mt-1">City-wise SEO optimization overview</p>
        </div>
        <button
          onClick={() => mutate()}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <MdOutlineRefresh className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <button
          onClick={() => setSelectedCity(null)}
          className={`p-4 rounded-xl border text-left transition-colors ${selectedCity === null ? "bg-teal-50 border-teal-300" : "bg-white border-slate-200 hover:border-teal-300"}`}
        >
          <p className="text-sm font-semibold text-slate-900">All Cities</p>
          <p className="text-xs text-slate-500 mt-1">
            {allPages.filter((p) => p.city_id).length} pages
          </p>
        </button>
        {cities.map((c) => {
          const stat = cityStats[c.id] || { total: 0, optimized: 0 };
          const pct =
            stat.total > 0 ? Math.round((stat.optimized / stat.total) * 100) : 0;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCity(c.id)}
              className={`p-4 rounded-xl border text-left transition-colors ${selectedCity === c.id ? "bg-teal-50 border-teal-300" : "bg-white border-slate-200 hover:border-teal-300"}`}
            >
              <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {stat.total} pages · {pct}% optimized
              </p>
              <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="relative mb-6 max-w-md">
        <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by page path..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white"
        />
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <MdOutlineLocationOn className="w-12 h-12 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500 font-medium">No city-specific pages found</p>
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
                  Page
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Meta Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Focus Keyword
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const optimized = Boolean(p.meta_title && p.focus_keyword);
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3">
                      {optimized ? (
                        <MdOutlineCheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <span className="w-5 h-5 inline-block rounded-full bg-amber-400" />
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-xs font-mono text-slate-800 truncate max-w-md">
                        {p.page_path}
                      </p>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-700 truncate max-w-xs">
                      {p.meta_title || (
                        <span className="text-red-500 italic">Missing</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600">
                      {p.focus_keyword || (
                        <span className="text-slate-400 italic">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <a
                        href="/admin/seo/pages"
                        className="inline-flex items-center gap-1 text-xs text-teal-600 hover:underline"
                      >
                        <MdOutlineEdit className="w-3.5 h-3.5" /> Edit
                      </a>
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
