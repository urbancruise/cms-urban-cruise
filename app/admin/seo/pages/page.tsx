"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineAdd,
  MdOutlineEdit,
  MdOutlineDelete,
  MdOutlineClose,
  MdOutlineSave,
  MdOutlineRefresh,
  MdOutlineSearch,
  MdOutlineDescription,
  MdOutlineWarning,
  MdOutlineCheckCircle,
} from "react-icons/md";
import { TableSkeleton } from "@/app/components/UI/PageSkeletons";

// ============================================================
// PAGE TYPES — includes all vehicle sub-types
// ============================================================
const PAGE_TYPE_GROUPS = [
  {
    group: "General",
    options: [
      { value: "home", label: "Home" },
      { value: "custom", label: "Custom Page" },
    ],
  },
  {
    group: "Vehicles — Car & SUVs",
    options: [
      { value: "vehicle:car-suvs", label: "Car & SUVs" },
      { value: "vehicle:ertiga", label: "Ertiga" },
      { value: "vehicle:innova-crysta", label: "Innova Crysta" },
      { value: "vehicle:hycross", label: "Hycross" },
    ],
  },
  {
    group: "Vehicles — Luxury Cars, SUVs, Vans",
    options: [
      { value: "vehicle:luxury-cars-suvs", label: "Luxury Cars & SUVs" },
      { value: "vehicle:mercedes-sprinter", label: "Mercedes Sprinter" },
      { value: "vehicle:luxury-vans", label: "Luxury Vans" },
    ],
  },
  {
    group: "Vehicles — Tempo Traveller",
    options: [
      { value: "vehicle:tempo-traveller", label: "Tempo Traveller" },
      {
        value: "vehicle:maharaja-tempo-traveller",
        label: "Maharaja Tempo Traveller",
      },
    ],
  },
  {
    group: "Vehicles — Urbania",
    options: [{ value: "vehicle:urbania", label: "Urbania" }],
  },
  {
    group: "Vehicles — Mini Bus",
    options: [{ value: "vehicle:mini-bus", label: "Mini Bus" }],
  },
  {
    group: "Vehicles — Luxury Buses",
    options: [
      { value: "vehicle:luxury-bus", label: "Luxury Bus" },
      { value: "vehicle:volvo-bus", label: "Volvo Bus" },
      { value: "vehicle:bharat-benz-bus", label: "Bharat Benz Bus" },
      { value: "vehicle:bus-with-washroom", label: "Bus With Washroom" },
      {
        value: "vehicle:sleeper-bus",
        label: "Sleeper | Semi Sleeper Bus",
      },
    ],
  },
];

const ALL_PAGE_TYPE_OPTIONS = PAGE_TYPE_GROUPS.flatMap((g) => g.options);

// Helper: friendly label for stored page_type
function getPageTypeLabel(value: string): string {
  const found = ALL_PAGE_TYPE_OPTIONS.find((o) => o.value === value);
  if (found) return found.label;
  return value;
}

// Helper: check if type is a vehicle
function isVehiclePageType(value: string): boolean {
  return value.startsWith("vehicle:");
}

// Helper: slugify a city name
function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "-");
}

interface SeoPage {
  id: number;
  city_id: number | null;
  city_name: string | null;
  page_path: string;
  page_type: string;
  meta_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  canonical_url: string | null;
  robots_meta: string | null;
  is_indexable: boolean;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  twitter_card: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  seo_score: number;
  updated_at: string;
}

interface City {
  id: number;
  name: string;
}

export default function SeoPagesPage() {
  const [cityFilter, setCityFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<SeoPage | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const { data: citiesData } = useSWR<{ cities: City[] }>(
    "/api/admin/cities?active=true",
    fetcher
  );
  const cities = citiesData?.cities || [];

  const pagesKey = useMemo(() => {
    const p = new URLSearchParams();
    if (cityFilter) p.set("city_id", cityFilter);
    if (typeFilter) p.set("page_type", typeFilter);
    if (debouncedSearch) p.set("search", debouncedSearch);
    return `/api/admin/seo/pages?${p.toString()}`;
  }, [cityFilter, typeFilter, debouncedSearch]);

  const { data, isLoading, mutate } = useSWR<{
    pages: SeoPage[];
    total: number;
  }>(pagesKey, fetcher, { keepPreviousData: true });

  const pages = data?.pages || [];

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (page: SeoPage) => {
    if (!confirm(`Delete SEO entry for "${page.page_path}"?`)) return;
    try {
      const res = await fetch(`/api/admin/seo/pages/${page.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      await mutate();
      showToast("success", "SEO entry deleted");
    } catch (e: any) {
      showToast("error", e.message);
    }
  };

  const getTitleStatus = (page: SeoPage) => {
    const len = page.meta_title?.length || 0;
    if (len === 0) return { color: "red", label: "Missing" };
    if (len > 60) return { color: "amber", label: `${len} chars` };
    return { color: "green", label: `${len} chars` };
  };

  const getDescStatus = (page: SeoPage) => {
    const len = page.meta_description?.length || 0;
    if (len === 0) return { color: "red", label: "Missing" };
    if (len > 160) return { color: "amber", label: `${len} chars` };
    return { color: "green", label: `${len} chars` };
  };

  // Filter dropdown — grouped
  const filterGroups = [
    {
      group: "General",
      options: [
        { value: "", label: "All Types" },
        { value: "home", label: "Home Only" },
        { value: "custom", label: "Custom Only" },
      ],
    },
    ...PAGE_TYPE_GROUPS.filter((g) => g.group.startsWith("Vehicles")),
  ];

  return (
    <div className="p-8">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border min-w-[260px] ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <MdOutlineCheckCircle className="w-5 h-5" />
          ) : (
            <MdOutlineWarning className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <MdOutlineDescription className="w-8 h-8 text-teal-600" />
            Page SEO Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage meta titles, descriptions, and keywords per page (
            {data?.total || 0} total)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => mutate()}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
            title="Refresh"
          >
            <MdOutlineRefresh className="w-5 h-5 text-slate-500" />
          </button>
          <button
            onClick={() => {
              setEditingPage(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <MdOutlineAdd className="w-4 h-4" /> Add Page
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by page path or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Cities</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[220px]"
        >
          {filterGroups.map((group) => (
            <optgroup key={group.group} label={group.group}>
              {group.options.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {isLoading && !data ? (
        <TableSkeleton rows={8} columns={6} />
      ) : pages.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <MdOutlineDescription className="w-12 h-12 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500 font-medium">No SEO pages found</p>
          <p className="text-xs text-slate-400 mt-1">
            Click &quot;Add Page&quot; to create your first SEO entry
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Page Path
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Meta Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Meta Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pages.map((page) => {
                  const titleStatus = getTitleStatus(page);
                  const descStatus = getDescStatus(page);
                  return (
                    <tr key={page.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs text-slate-800">
                          {page.page_path}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          {isVehiclePageType(page.page_type) && (
                            <span className="text-teal-600">🚗</span>
                          )}
                          {getPageTypeLabel(page.page_type)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {page.city_name || "—"}
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-sm text-slate-800 truncate">
                          {page.meta_title || (
                            <span className="text-red-500 italic">Missing</span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            titleStatus.color === "green"
                              ? "bg-green-50 text-green-700"
                              : titleStatus.color === "amber"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {titleStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-sm text-slate-800 truncate">
                          {page.meta_description || (
                            <span className="text-red-500 italic">Missing</span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            descStatus.color === "green"
                              ? "bg-green-50 text-green-700"
                              : descStatus.color === "amber"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {descStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-bold ${
                            page.seo_score >= 80
                              ? "bg-green-50 text-green-700"
                              : page.seo_score >= 60
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {page.seo_score}/100
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingPage(page);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-teal-50 rounded-lg"
                            title="Edit"
                          >
                            <MdOutlineEdit className="w-4 h-4 text-slate-400 hover:text-teal-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(page)}
                            className="p-1.5 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <MdOutlineDelete className="w-4 h-4 text-slate-400 hover:text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <SeoPageModal
          page={editingPage}
          cities={cities}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => {
            setIsModalOpen(false);
            mutate();
            showToast("success", "Saved successfully");
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// SEO PAGE MODAL
// ============================================================
function SeoPageModal({
  page,
  cities,
  onClose,
  onSaved,
}: {
  page: SeoPage | null;
  cities: City[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(page);

  const [formData, setFormData] = useState({
    city_id: page?.city_id ? String(page.city_id) : "",
    page_path: page?.page_path || "",
    page_type: page?.page_type || "home",
    meta_title: page?.meta_title || "",
    meta_description: page?.meta_description || "",
    focus_keyword: page?.focus_keyword || "",
    canonical_url: page?.canonical_url || "",
    robots_meta: page?.robots_meta || "index, follow",
    is_indexable: page?.is_indexable ?? true,
    og_title: page?.og_title || "",
    og_description: page?.og_description || "",
    og_image: page?.og_image || "",
    twitter_card: page?.twitter_card || "summary_large_image",
    twitter_title: page?.twitter_title || "",
    twitter_description: page?.twitter_description || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: string, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  // ----------------------------------------------------------
  // Auto-fill path when city + type is selected (only on create)
  // ----------------------------------------------------------
  useEffect(() => {
    if (isEdit) return;

    const cityObj = cities.find((c) => String(c.id) === formData.city_id);
    if (!cityObj) return;

    const citySlug = slugify(cityObj.name);

    if (isVehiclePageType(formData.page_type)) {
      const vehicleSlug = formData.page_type.replace("vehicle:", "");
      setFormData((prev) => ({
        ...prev,
        page_path: `/${citySlug}/vehicles/${vehicleSlug}`,
      }));
    } else if (formData.page_type === "home") {
      setFormData((prev) => ({
        ...prev,
        page_path: `/${citySlug}`,
      }));
    } else {
      // custom — leave whatever user typed
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.city_id, formData.page_type]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...formData,
        city_id: formData.city_id ? Number(formData.city_id) : null,
      };

      const url = isEdit
        ? `/api/admin/seo/pages/${page!.id}`
        : "/api/admin/seo/pages";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const titleLen = formData.meta_title.length;
  const descLen = formData.meta_description.length;

  const selectedTypeLabel = getPageTypeLabel(formData.page_type);
  const isVehicle = isVehiclePageType(formData.page_type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isEdit ? "Edit Page SEO" : "Add Page SEO"}
            </h2>
            <p className="text-xs text-slate-500">
              Configure meta tags and keywords
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <MdOutlineClose className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-auto p-6 space-y-5"
        >
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                City
              </label>
              <select
                value={formData.city_id}
                onChange={(e) => set("city_id", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">Global</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Page Type *
              </label>
              <select
                value={formData.page_type}
                onChange={(e) => set("page_type", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                required
              >
                {PAGE_TYPE_GROUPS.map((group) => (
                  <optgroup key={group.group} label={group.group}>
                    {group.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                {isVehicle
                  ? `🚗 Vehicle sub-page: ${selectedTypeLabel}`
                  : "General page"}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Page Path *
            </label>
            <input
              type="text"
              value={formData.page_path}
              onChange={(e) => set("page_path", e.target.value)}
              placeholder="/delhi/vehicles/ertiga"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
              required
            />
            {isVehicle && !isEdit && (
              <p className="text-[11px] text-teal-600 mt-1">
                Auto-filled based on selected city + vehicle. You can still
                edit it.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Indexable
            </label>
            <select
              value={formData.is_indexable ? "yes" : "no"}
              onChange={(e) => set("is_indexable", e.target.value === "yes")}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="yes">Yes (index, follow)</option>
              <option value="no">No (noindex)</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700">
                Meta Title
              </label>
              <span
                className={`text-[10px] font-medium ${
                  titleLen === 0
                    ? "text-red-500"
                    : titleLen > 60
                    ? "text-amber-500"
                    : "text-green-600"
                }`}
              >
                {titleLen}/60
              </span>
            </div>
            <input
              type="text"
              value={formData.meta_title}
              onChange={(e) => set("meta_title", e.target.value)}
              placeholder="Maruti Ertiga on Rent in Delhi — ₹16/km"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700">
                Meta Description
              </label>
              <span
                className={`text-[10px] font-medium ${
                  descLen === 0
                    ? "text-red-500"
                    : descLen > 160
                    ? "text-amber-500"
                    : "text-green-600"
                }`}
              >
                {descLen}/160
              </span>
            </div>
            <textarea
              rows={2}
              value={formData.meta_description}
              onChange={(e) => set("meta_description", e.target.value)}
              placeholder="Book Maruti Ertiga in Delhi at ₹16/km. 6-7 seater, AC, perfect for family trips."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Focus Keyword
              </label>
              <input
                type="text"
                value={formData.focus_keyword}
                onChange={(e) => set("focus_keyword", e.target.value)}
                placeholder="ertiga on rent in delhi"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Canonical URL
              </label>
              <input
                type="text"
                value={formData.canonical_url}
                onChange={(e) => set("canonical_url", e.target.value)}
                placeholder="https://urbancruise.com/delhi/vehicles/ertiga"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Open Graph (Social)
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={formData.og_title}
                onChange={(e) => set("og_title", e.target.value)}
                placeholder="OG Title"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <textarea
                rows={2}
                value={formData.og_description}
                onChange={(e) => set("og_description", e.target.value)}
                placeholder="OG Description"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <input
                type="text"
                value={formData.og_image}
                onChange={(e) => set("og_image", e.target.value)}
                placeholder="OG Image URL"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Twitter Card
            </h3>
            <div className="space-y-3">
              <select
                value={formData.twitter_card}
                onChange={(e) => set("twitter_card", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="summary">Summary</option>
                <option value="summary_large_image">Summary Large Image</option>
              </select>
              <input
                type="text"
                value={formData.twitter_title}
                onChange={(e) => set("twitter_title", e.target.value)}
                placeholder="Twitter Title"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <textarea
                rows={2}
                value={formData.twitter_description}
                onChange={(e) => set("twitter_description", e.target.value)}
                placeholder="Twitter Description"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium disabled:opacity-50"
          >
            <MdOutlineSave className="w-4 h-4" />
            {saving ? "Saving..." : isEdit ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
