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
  MdOutlineTune,
  MdOutlineInfo,
  MdOutlineShare,
  MdOutlineCode,
  MdOutlineLanguage,
} from "react-icons/md";
import { TableSkeleton } from "@/app/components/UI/PageSkeletons";
import ImageUpload from "@/app/components/UI/ImageUpload";
import SchemaEditor from "@/app/components/UI/SchemaEditor";
import { slugify } from "@/lib/format";

// ============================================================
// PAGE TYPES
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

function getPageTypeLabel(value: string): string {
  const found = ALL_PAGE_TYPE_OPTIONS.find((o) => o.value === value);
  if (found) return found.label;
  return value;
}

function isVehiclePageType(value: string): boolean {
  return value.startsWith("vehicle:");
}

// Open Graph type options
const OG_TYPE_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "article", label: "Article" },
  { value: "product", label: "Product" },
  { value: "profile", label: "Profile" },
  { value: "video.other", label: "Video" },
  { value: "book", label: "Book" },
];

// Twitter card type options
const TWITTER_CARD_OPTIONS = [
  { value: "summary", label: "Summary" },
  { value: "summary_large_image", label: "Summary Large Image" },
  { value: "app", label: "App" },
  { value: "player", label: "Player" },
];

// ============================================================
// Types
// ============================================================
interface SeoPage {
  id: number;
  city_id: number | null;
  city_name: string | null;
  page_path: string;
  slug: string | null;
  page_type: string;
  page_title: string | null;
  favicon_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  meta_keywords: string | null;
  canonical_url: string | null;
  robots_meta: string | null;
  is_indexable: boolean;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_url: string | null;
  og_type: string | null;
  feature_image: string | null;
  feature_image_public_id: string | null;
  twitter_card: string | null;
  twitter_domain: string | null;
  twitter_url: string | null;
  twitter_image: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  schema_json: any | null;
  seo_score: number;
  updated_at: string;
}

interface City {
  id: number;
  name: string;
}

// ============================================================
// Schema helpers
// ============================================================
function formatSchemaForEditor(schema: any): string {
  if (!schema) return "";

  if (Array.isArray(schema)) {
    return schema
      .map((s) => JSON.stringify(s, null, 2))
      .join("\n\n---\n\n");
  }

  return JSON.stringify(schema, null, 2);
}

function parseSchemaFromEditor(text: string): any[] | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const parts = trimmed
    .split(/^\s*---\s*$/m)
    .map((b) => b.trim())
    .filter(Boolean);

  const parsed: any[] = [];
  for (let i = 0; i < parts.length; i++) {
    try {
      parsed.push(JSON.parse(parts[i]));
    } catch (err: any) {
      throw new Error(`Block #${i + 1}: ${err.message}`);
    }
  }
  return parsed.length > 0 ? parsed : null;
}

// Small helper: score → color tokens, reused by the table pill and the
// progress bar in the modal so the language stays consistent everywhere.
function scoreTone(score: number): {
  text: string;
  bg: string;
  bar: string;
} {
  if (score >= 80) return { text: "text-emerald-700", bg: "bg-emerald-50", bar: "bg-emerald-500" };
  if (score >= 60) return { text: "text-amber-700", bg: "bg-amber-50", bar: "bg-amber-500" };
  return { text: "text-rose-700", bg: "bg-rose-50", bar: "bg-rose-500" };
}

// ============================================================
// Page
// ============================================================
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

  const needsAttention = useMemo(
    () =>
      pages.filter(
        (p) => !p.meta_title || !p.meta_description || p.seo_score < 60
      ).length,
    [pages]
  );

  const hasActiveFilters = Boolean(cityFilter || typeFilter || debouncedSearch);
  const clearFilters = () => {
    setCityFilter("");
    setTypeFilter("");
    setSearchTerm("");
  };

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
    if (len === 0) return { color: "rose", label: "Missing" };
    if (len > 60) return { color: "amber", label: `${len} chars` };
    return { color: "emerald", label: `${len} chars` };
  };

  const getDescStatus = (page: SeoPage) => {
    const len = page.meta_description?.length || 0;
    if (len === 0) return { color: "rose", label: "Missing" };
    if (len > 160) return { color: "amber", label: `${len} chars` };
    return { color: "emerald", label: `${len} chars` };
  };

  const badgeClass = (color: "rose" | "amber" | "emerald") =>
    ({
      rose: "bg-rose-50 text-rose-700",
      amber: "bg-amber-50 text-amber-700",
      emerald: "bg-emerald-50 text-emerald-700",
    }[color]);

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
    <div className="p-8 max-w-[1400px] mx-auto">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border min-w-[280px] animate-in fade-in slide-in-from-top-2 duration-200 ${
            toast.type === "success"
              ? "bg-white border-emerald-200"
              : "bg-white border-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <MdOutlineCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <MdOutlineWarning className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-medium text-slate-700">
            {toast.message}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2.5">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-50 text-teal-600">
              <MdOutlineDescription className="w-5 h-5" />
            </span>
            Page SEO Management
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 ml-[46px]">
            Meta tags, social cards and structured data for every page
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data && data.total > 0 && (
            <div className="hidden sm:flex items-center gap-4 pr-4 mr-1 border-r border-slate-200 text-sm">
              <span className="text-slate-500">
                <span className="font-semibold text-slate-800">
                  {data.total}
                </span>{" "}
                page{data.total !== 1 ? "s" : ""}
              </span>
              {needsAttention > 0 && (
                <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {needsAttention} need attention
                </span>
              )}
            </div>
          )}
          <button
            onClick={() => mutate()}
            className="p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors"
            title="Refresh"
          >
            <MdOutlineRefresh className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => {
              setEditingPage(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-teal-600/20"
          >
            <MdOutlineAdd className="w-4 h-4" /> Add Page
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 relative">
          <MdOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by page path or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
          />
        </div>

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-3.5 py-2.5 border border-slate-200 rounded-lg bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
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
          className="px-3.5 py-2.5 border border-slate-200 rounded-lg bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 min-w-[200px]"
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

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm text-slate-500 hover:text-slate-700 whitespace-nowrap"
          >
            <MdOutlineClose className="w-4 h-4" /> Clear filters
          </button>
        )}
      </div>

      {isLoading && !data ? (
        <TableSkeleton rows={8} columns={8} />
      ) : pages.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <MdOutlineDescription className="w-10 h-10 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-600 font-medium">
            {hasActiveFilters ? "No pages match these filters" : "No SEO pages yet"}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {hasActiveFilters
              ? "Try a different search term or clear your filters."
              : "Add your first page to start managing its meta tags and social cards."}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="mt-4 text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              Clear filters
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingPage(null);
                setIsModalOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg"
            >
              <MdOutlineAdd className="w-4 h-4" /> Add Page
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="w-14 px-4 py-3"></th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Page
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Meta Title
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Meta Description
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Score
                  </th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pages.map((page) => {
                  const titleStatus = getTitleStatus(page);
                  const descStatus = getDescStatus(page);
                  const tone = scoreTone(page.seo_score);
                  return (
                    <tr key={page.id} className="group hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col items-center gap-1.5">
                          {page.favicon_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={page.favicon_url}
                              alt=""
                              className="w-5 h-5 object-contain rounded"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded bg-slate-100" />
                          )}
                          {page.feature_image && (
                            <div className="w-9 h-6 rounded overflow-hidden bg-slate-100 border border-slate-200">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={page.feature_image}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-mono text-xs text-slate-800">
                          {page.page_path}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                          {isVehiclePageType(page.page_type) && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-teal-500"
                              title="Vehicle sub-page"
                            />
                          )}
                          {getPageTypeLabel(page.page_type)}
                          {!page.is_indexable && (
                            <span className="ml-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium">
                              noindex
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-600">
                        {page.city_name || (
                          <span className="text-slate-300">Global</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 max-w-[220px]">
                        <div
                          className="text-sm text-slate-800 truncate"
                          title={page.meta_title || undefined}
                        >
                          {page.meta_title || (
                            <span className="text-slate-400 italic">
                              Not set
                            </span>
                          )}
                        </div>
                        <span
                          className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badgeClass(
                            titleStatus.color as any
                          )}`}
                        >
                          {titleStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 max-w-[240px]">
                        <div
                          className="text-sm text-slate-800 truncate"
                          title={page.meta_description || undefined}
                        >
                          {page.meta_description || (
                            <span className="text-slate-400 italic">
                              Not set
                            </span>
                          )}
                        </div>
                        <span
                          className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badgeClass(
                            descStatus.color as any
                          )}`}
                        >
                          {descStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${tone.bar}`}
                              style={{ width: `${Math.min(page.seo_score, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold ${tone.text}`}>
                            {page.seo_score}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
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
                            className="p-1.5 hover:bg-rose-50 rounded-lg"
                            title="Delete"
                          >
                            <MdOutlineDelete className="w-4 h-4 text-slate-400 hover:text-rose-600" />
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
// Preview widgets — grounded in what the fields actually control
// ============================================================
function GoogleSerpPreview({
  favicon,
  siteName,
  title,
  path,
  description,
}: {
  favicon: string;
  siteName: string;
  title: string;
  path: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-1.5">
        {favicon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={favicon} alt="" className="w-4 h-4 rounded-full object-contain" />
        ) : (
          <div className="w-4 h-4 rounded-full bg-slate-200" />
        )}
        <span className="text-xs text-slate-700">{siteName || "yoursite.com"}</span>
      </div>
      <div className="text-[13px] text-slate-500 truncate mb-0.5">{path}</div>
      <div className="text-[19px] leading-snug text-[#1a0dab] truncate">
        {title || "Meta title will appear here"}
      </div>
      <p className="text-sm text-[#4d5156] mt-0.5 line-clamp-2">
        {description || "Add a meta description to see how it will read in search results."}
      </p>
    </div>
  );
}

function SocialCardPreview({
  image,
  domain,
  title,
  description,
}: {
  image: string;
  domain: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden max-w-sm">
      <div className="aspect-[1.91/1] bg-slate-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
            No image set
          </div>
        )}
      </div>
      <div className="p-3 border-t border-slate-200">
        <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
          {domain || "yoursite.com"}
        </div>
        <div className="text-sm font-medium text-slate-800 truncate">
          {title || "Title will appear here"}
        </div>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
          {description || "Description will appear here"}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// SEO PAGE MODAL
// ============================================================
const TABS = [
  { id: "details", label: "Page Details", icon: MdOutlineInfo },
  { id: "meta", label: "Search & Meta", icon: MdOutlineLanguage },
  { id: "social", label: "Social Cards", icon: MdOutlineShare },
  { id: "schema", label: "Schema", icon: MdOutlineCode },
] as const;

type TabId = (typeof TABS)[number]["id"];

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
  const [activeTab, setActiveTab] = useState<TabId>("details");

  const [formData, setFormData] = useState({
    city_id: page?.city_id ? String(page.city_id) : "",
    page_path: page?.page_path || "",
    slug: page?.slug || "",
    page_type: page?.page_type || "home",
    page_title: page?.page_title || "",
    favicon_url: page?.favicon_url || "",
    meta_title: page?.meta_title || "",
    meta_description: page?.meta_description || "",
    focus_keyword: page?.focus_keyword || "",
    meta_keywords: page?.meta_keywords || "",
    canonical_url: page?.canonical_url || "",
    robots_meta: page?.robots_meta || "index, follow",
    is_indexable: page?.is_indexable ?? true,

    // Open Graph
    og_title: page?.og_title || "",
    og_description: page?.og_description || "",
    og_image: page?.og_image || "",
    og_url: page?.og_url || "",
    og_type: page?.og_type || "website",

    // Feature image
    feature_image: page?.feature_image || "",
    feature_image_public_id: page?.feature_image_public_id || "",

    // Twitter
    twitter_card: page?.twitter_card || "summary_large_image",
    twitter_domain: page?.twitter_domain || "",
    twitter_url: page?.twitter_url || "",
    twitter_image: page?.twitter_image || "",
    twitter_title: page?.twitter_title || "",
    twitter_description: page?.twitter_description || "",

    // Schema
    schema_text: formatSchemaForEditor(page?.schema_json),
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [faviconError, setFaviconError] = useState(false);

  const set = (key: string, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  // Auto-fill page_path + slug when city + type changes (create only)
  useEffect(() => {
    if (isEdit) return;

    const cityObj = cities.find((c) => String(c.id) === formData.city_id);
    if (!cityObj) return;

    const citySlug = slugify(cityObj.name);
    let newPath = "";
    let newSlug = "";

    if (isVehiclePageType(formData.page_type)) {
      const vehicleSlug = formData.page_type.replace("vehicle:", "");
      newPath = `/${citySlug}/vehicles/${vehicleSlug}`;
      newSlug = vehicleSlug;
    } else if (formData.page_type === "home") {
      newPath = `/${citySlug}`;
      newSlug = "home";
    } else {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      page_path: newPath,
      slug: newSlug,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.city_id, formData.page_type]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setError("");

    let parsedSchema: any[] | null = null;
    try {
      parsedSchema = parseSchemaFromEditor(formData.schema_text);
    } catch (err: any) {
      setActiveTab("schema");
      setError(err.message);
      setSaving(false);
      return;
    }

    try {
      const payload = {
        city_id: formData.city_id ? Number(formData.city_id) : null,
        page_path: formData.page_path,
        slug: formData.slug || null,
        page_type: formData.page_type,
        page_title: formData.page_title || null,
        favicon_url: formData.favicon_url || null,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        focus_keyword: formData.focus_keyword || null,
        meta_keywords: formData.meta_keywords || null,
        canonical_url: formData.canonical_url || null,
        robots_meta: formData.robots_meta || "index, follow",
        is_indexable: formData.is_indexable,

        // OG
        og_title: formData.og_title || null,
        og_description: formData.og_description || null,
        og_image: formData.og_image || null,
        og_url: formData.og_url || null,
        og_type: formData.og_type || "website",

        // Feature image
        feature_image: formData.feature_image || null,
        feature_image_public_id: formData.feature_image_public_id || null,

        // Twitter
        twitter_card: formData.twitter_card || null,
        twitter_domain: formData.twitter_domain || null,
        twitter_url: formData.twitter_url || null,
        twitter_image: formData.twitter_image || null,
        twitter_title: formData.twitter_title || null,
        twitter_description: formData.twitter_description || null,

        // Schema
        schema_json: parsedSchema,
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
  const pageTitleLen = formData.page_title.length;
  const selectedTypeLabel = getPageTypeLabel(formData.page_type);
  const isVehicle = isVehiclePageType(formData.page_type);

  const keywordCount = formData.meta_keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean).length;

  const cityName = cities.find((c) => String(c.id) === formData.city_id)?.name;

  // Fields that still need attention, surfaced as a small tab badge so
  // issues are visible without opening every section.
  const metaIssues =
    (formData.meta_title ? 0 : 1) + (formData.meta_description ? 0 : 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? "Edit Page SEO" : "Add Page SEO"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {formData.page_path || "New page"}
              {cityName ? ` · ${cityName}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <MdOutlineClose className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 shrink-0 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const badge = tab.id === "meta" && metaIssues > 0 ? metaIssues : 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-3.5 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  isActive
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {badge > 0 && (
                  <span className="ml-0.5 w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-auto px-6 py-6"
        >
          {error && (
            <div className="mb-5 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* ── Tab: Page Details ── */}
          {activeTab === "details" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    City
                  </label>
                  <select
                    value={formData.city_id}
                    onChange={(e) => set("city_id", e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
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
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Page Type *
                  </label>
                  <select
                    value={formData.page_type}
                    onChange={(e) => set("page_type", e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
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
                  <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                    {isVehicle && (
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    )}
                    {isVehicle ? `Vehicle sub-page: ${selectedTypeLabel}` : "General page"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Page Path *
                  </label>
                  <input
                    type="text"
                    value={formData.page_path}
                    onChange={(e) => set("page_path", e.target.value)}
                    placeholder="/delhi/vehicles/ertiga"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => set("slug", e.target.value)}
                    placeholder="ertiga"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Short identifier — used in URLs and sitemap
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-700">
                      Browser Tab Title
                    </label>
                    <span
                      className={`text-[10px] font-medium ${
                        pageTitleLen === 0
                          ? "text-slate-400"
                          : pageTitleLen > 60
                          ? "text-amber-500"
                          : "text-emerald-600"
                      }`}
                    >
                      {pageTitleLen}/60
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.page_title}
                    onChange={(e) => set("page_title", e.target.value)}
                    placeholder="Falls back to Meta Title if empty"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Indexable
                  </label>
                  <select
                    value={formData.is_indexable ? "yes" : "no"}
                    onChange={(e) => set("is_indexable", e.target.value === "yes")}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                  >
                    <option value="yes">Yes — index, follow</option>
                    <option value="no">No — noindex</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Link Icon (Favicon) URL
                </label>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 shrink-0 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                    {formData.favicon_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={formData.favicon_url}
                        alt="Favicon preview"
                        className="w-6 h-6 object-contain"
                        onError={() => setFaviconError(true)}
                        onLoad={() => setFaviconError(false)}
                      />
                    ) : (
                      <MdOutlineLanguage className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.favicon_url}
                      onChange={(e) => {
                        set("favicon_url", e.target.value);
                        setFaviconError(false);
                      }}
                      placeholder="https://www.simplytrip.in/images/fav-logo-sm.png"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      {faviconError
                        ? "Couldn't load this image — check the URL."
                        : "Rendered as the page's <link rel=\"icon\"> tag."}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Feature Image
                </label>
                <ImageUpload
                  value={formData.feature_image || null}
                  publicId={formData.feature_image_public_id || null}
                  onChange={(url, publicId) => {
                    setFormData((prev) => ({
                      ...prev,
                      feature_image: url || "",
                      feature_image_public_id: publicId || "",
                    }));
                  }}
                  scope="general"
                  aspect="16 / 9"
                  hint="JPG, PNG, WEBP · Max 300 KB · Recommended 1200×630"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Used as the Open Graph and Twitter Card image, and doubles
                  as the page hero image.
                </p>
              </div>
            </div>
          )}

          {/* ── Tab: Search & Meta ── */}
          {activeTab === "meta" && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-700">
                      Meta Title
                    </label>
                    <span
                      className={`text-[10px] font-medium ${
                        titleLen === 0
                          ? "text-rose-500"
                          : titleLen > 60
                          ? "text-amber-500"
                          : "text-emerald-600"
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
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-700">
                      Meta Description
                    </label>
                    <span
                      className={`text-[10px] font-medium ${
                        descLen === 0
                          ? "text-rose-500"
                          : descLen > 160
                          ? "text-amber-500"
                          : "text-emerald-600"
                      }`}
                    >
                      {descLen}/160
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.meta_description}
                    onChange={(e) => set("meta_description", e.target.value)}
                    placeholder="Book Maruti Ertiga in Delhi at ₹16/km..."
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Focus Keyword
                    </label>
                    <input
                      type="text"
                      value={formData.focus_keyword}
                      onChange={(e) => set("focus_keyword", e.target.value)}
                      placeholder="ertiga on rent in delhi"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-slate-700">
                        Meta Keywords
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {keywordCount} keyword{keywordCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.meta_keywords}
                      onChange={(e) => set("meta_keywords", e.target.value)}
                      placeholder="ertiga, car rental delhi"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Canonical URL
                  </label>
                  <input
                    type="text"
                    value={formData.canonical_url}
                    onChange={(e) => set("canonical_url", e.target.value)}
                    placeholder="https://urbancruise.com/delhi/vehicles/ertiga"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="lg:sticky lg:top-0">
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    Google search preview
                  </p>
                  <GoogleSerpPreview
                    favicon={formData.favicon_url}
                    siteName={formData.canonical_url || formData.page_path}
                    title={formData.meta_title}
                    path={formData.canonical_url || formData.page_path}
                    description={formData.meta_description}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Social Cards ── */}
          {activeTab === "social" && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Open Graph
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      OG Title
                    </label>
                    <input
                      type="text"
                      value={formData.og_title}
                      onChange={(e) => set("og_title", e.target.value)}
                      placeholder="Defaults to Meta Title"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      OG Description
                    </label>
                    <textarea
                      rows={2}
                      value={formData.og_description}
                      onChange={(e) => set("og_description", e.target.value)}
                      placeholder="Defaults to Meta Description"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      OG Image URL
                    </label>
                    <input
                      type="text"
                      value={formData.og_image}
                      onChange={(e) => set("og_image", e.target.value)}
                      placeholder="Leave empty to use the Feature Image"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        OG URL
                      </label>
                      <input
                        type="text"
                        value={formData.og_url}
                        onChange={(e) => set("og_url", e.target.value)}
                        placeholder="Canonical social URL"
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        OG Type
                      </label>
                      <select
                        value={formData.og_type}
                        onChange={(e) => set("og_type", e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                      >
                        {OG_TYPE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-5 border-t border-slate-200">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Twitter Card
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Card Type
                    </label>
                    <select
                      value={formData.twitter_card}
                      onChange={(e) => set("twitter_card", e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                    >
                      {TWITTER_CARD_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Twitter Domain
                      </label>
                      <input
                        type="text"
                        value={formData.twitter_domain}
                        onChange={(e) => set("twitter_domain", e.target.value)}
                        placeholder="@UrbanCruise"
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Twitter URL
                      </label>
                      <input
                        type="text"
                        value={formData.twitter_url}
                        onChange={(e) => set("twitter_url", e.target.value)}
                        placeholder="Canonical Twitter URL"
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Twitter Image
                    </label>
                    <input
                      type="text"
                      value={formData.twitter_image}
                      onChange={(e) => set("twitter_image", e.target.value)}
                      placeholder="Leave empty to fall back to Feature Image"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Twitter Title
                    </label>
                    <input
                      type="text"
                      value={formData.twitter_title}
                      onChange={(e) => set("twitter_title", e.target.value)}
                      placeholder="Defaults to Meta Title"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Twitter Description
                    </label>
                    <textarea
                      rows={2}
                      value={formData.twitter_description}
                      onChange={(e) => set("twitter_description", e.target.value)}
                      placeholder="Defaults to Meta Description"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="lg:sticky lg:top-0 space-y-5">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">
                      Open Graph preview
                    </p>
                    <SocialCardPreview
                      image={formData.og_image || formData.feature_image}
                      domain={formData.og_url || formData.canonical_url}
                      title={formData.og_title || formData.meta_title}
                      description={formData.og_description || formData.meta_description}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">
                      Twitter card preview
                    </p>
                    <SocialCardPreview
                      image={formData.twitter_image || formData.feature_image}
                      domain={formData.twitter_domain || formData.twitter_url}
                      title={formData.twitter_title || formData.meta_title}
                      description={
                        formData.twitter_description || formData.meta_description
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Schema ── */}
          {activeTab === "schema" && (
            <div>
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-slate-800">
                  Structured Data
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Add one or more JSON-LD blocks. Separate blocks with{" "}
                  <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">
                    ---
                  </code>
                  . Each block is injected as its own script tag on the
                  public page.
                </p>
              </div>
              <SchemaEditor
                value={formData.schema_text}
                onChange={(v) => set("schema_text", v)}
              />
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1">
            {TABS.map((tab) => (
              <span
                key={tab.id}
                className={`w-1.5 h-1.5 rounded-full ${
                  activeTab === tab.id ? "bg-teal-600" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-sm text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-lg font-medium disabled:opacity-50 shadow-sm shadow-teal-600/20"
            >
              <MdOutlineSave className="w-4 h-4" />
              {saving ? "Saving..." : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}