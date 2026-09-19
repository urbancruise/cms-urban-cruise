"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineSave,
  MdOutlineRefresh,
  MdOutlineDirectionsCar,
  MdOutlineDelete,
  MdOutlineAdd,
  MdOutlineRemove,
  MdOutlineSearch,
  MdOutlineVisibility,
  MdOutlineEdit,
  MdOutlineWarning,
} from "react-icons/md";
import { CardGridSkeleton } from "@/app/components/UI/PageSkeletons";
import RichEditor from "@/app/components/UI/RichEditor";
import ImageUpload from "@/app/components/UI/ImageUpload";

// ============================================================
// All supported vehicle slugs
// ============================================================
const VEHICLE_SLUGS = [
  { slug: "car-suvs", label: "Car & SUVs" },
  { slug: "ertiga", label: "Ertiga" },
  { slug: "innova-crysta", label: "Innova Crysta" },
  { slug: "hycross", label: "Hycross" },
  { slug: "luxury-cars-suvs", label: "Luxury Cars & SUVs" },
  { slug: "mercedes-sprinter", label: "Mercedes Sprinter" },
  { slug: "luxury-vans", label: "Luxury Vans" },
  { slug: "tempo-traveller", label: "Tempo Traveller" },
  { slug: "maharaja-tempo-traveller", label: "Maharaja Tempo Traveller" },
  { slug: "urbania", label: "Urbania" },
  { slug: "mini-bus", label: "Mini Bus" },
  { slug: "luxury-bus", label: "Luxury Bus" },
  { slug: "volvo-bus", label: "Volvo Bus" },
  { slug: "bharat-benz-bus", label: "Bharat Benz Bus" },
  { slug: "bus-with-washroom", label: "Bus With Washroom" },
  { slug: "sleeper-bus", label: "Sleeper | Semi Sleeper Bus" },
];

// ============================================================
// Types
// ============================================================
interface City {
  id: number;
  name: string;
  state: string | null;
}

interface VehicleRow {
  id: number;
  vehicle_slug: string;
  meta: any;
  sections?: any;
  status: "draft" | "published" | "archived";
  sort_order: number;
  updated_at: string;
}

// ============================================================
// Shared classes
// ============================================================
const inputCls =
  "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500";

// ============================================================
// PAGE
// ============================================================
export default function WebsiteVehiclesPage() {
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");

  const { data: citiesData } = useSWR<{ cities: City[] }>(
    "/api/admin/cities?active=true",
    fetcher
  );
  const cities = citiesData?.cities || [];

  useEffect(() => {
    if (!selectedCityId && cities.length > 0) {
      setSelectedCityId(cities[0].id);
    }
  }, [cities, selectedCityId]);

  const listKey = selectedCityId
    ? `/api/admin/site-content/vehicles?city_id=${selectedCityId}`
    : null;

  const { data, isLoading, mutate } = useSWR<{ vehicles: VehicleRow[] }>(
    listKey,
    fetcher
  );

  const vehicles = data?.vehicles || [];

  const vehicleMap = useMemo(() => {
    const map: Record<string, VehicleRow> = {};
    vehicles.forEach((v) => (map[v.vehicle_slug] = v));
    return map;
  }, [vehicles]);

  const filteredSlugs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return VEHICLE_SLUGS;
    return VEHICLE_SLUGS.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q)
    );
  }, [search]);

  // ============================================================
  // SAVE
  // ============================================================
  const handleSave = async (
    vehicleSlug: string,
    meta: any,
    sections: any,
    status: "draft" | "published" | "archived",
    sortOrder: number
  ) => {
    if (!selectedCityId) throw new Error("No city selected");

    const res = await fetch("/api/admin/site-content/vehicles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cityId: selectedCityId,
        vehicleSlug,
        meta,
        sections,
        status,
        sortOrder,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || "Failed to save");
    await mutate();
  };

  // ============================================================
  // DELETE — triggered from confirm modal
  // ============================================================
  const confirmDelete = async () => {
    if (!selectedCityId || !deleteSlug) return;

    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/site-content/vehicles?city_id=${selectedCityId}&slug=${deleteSlug}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error || "Failed to delete");
        return;
      }
      await mutate();
      if (editingSlug === deleteSlug) setEditingSlug(null);
      setDeleteSlug(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  // ============================================================
  // OPEN EDITOR (ensures full sections loaded)
  // ============================================================
  const openEditor = async (slug: string) => {
    const existing = vehicleMap[slug];
    if (existing && existing.sections) {
      setEditingSlug(slug);
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/site-content/vehicles?city_id=${selectedCityId}&slug=${slug}`
      );
      if (res.ok) {
        const { vehicle } = await res.json();
        await mutate(
          (current) => {
            if (!current) return current;
            const others = current.vehicles.filter(
              (v) => v.vehicle_slug !== slug
            );
            return { ...current, vehicles: [...others, vehicle] };
          },
          false
        );
      }
    } catch {
      // Ignore
    }
    setEditingSlug(slug);
  };

  // ============================================================
  // OPEN PREVIEW (ensures full sections loaded)
  // ============================================================
  const openPreview = async (slug: string) => {
    const existing = vehicleMap[slug];
    if (existing && existing.sections) {
      setPreviewSlug(slug);
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/site-content/vehicles?city_id=${selectedCityId}&slug=${slug}`
      );
      if (res.ok) {
        const { vehicle } = await res.json();
        await mutate(
          (current) => {
            if (!current) return current;
            const others = current.vehicles.filter(
              (v) => v.vehicle_slug !== slug
            );
            return { ...current, vehicles: [...others, vehicle] };
          },
          false
        );
      }
    } catch {
      // Ignore
    }
    setPreviewSlug(slug);
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <MdOutlineDirectionsCar className="w-8 h-8 text-teal-600" />
            Website Vehicles
          </h1>
          <p className="text-slate-500 mt-1">
            Manage vehicle page content shown on the public website
          </p>
        </div>
        <button
          onClick={() => mutate()}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          title="Refresh"
        >
          <MdOutlineRefresh className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {/* City selector */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">
          City:
        </span>
        {cities.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setSelectedCityId(c.id);
              setEditingSlug(null);
              setPreviewSlug(null);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCityId === c.id
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-700 hover:border-teal-400"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6 relative max-w-md">
        <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search vehicles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : filteredSlugs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400">No vehicles match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSlugs.map(({ slug, label }) => {
            const v = vehicleMap[slug];
            const status = v?.status || "not-created";
            const lastUpdated = v?.updated_at
              ? new Date(v.updated_at).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : null;
            const hasContent = Boolean(v);

            return (
              <div
                key={slug}
                className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all flex flex-col"
              >
                {/* Image preview if exists */}
                {v?.meta?.image && (
                  <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-slate-100 mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.meta.image}
                      alt={label}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900">{label}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      status === "published"
                        ? "bg-teal-50 text-teal-700 border border-teal-200"
                        : status === "draft"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : status === "archived"
                        ? "bg-slate-100 text-slate-600 border border-slate-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 font-mono mb-1">{slug}</p>

                {v?.meta?.title && (
                  <p className="text-xs text-slate-500 truncate mb-1">
                    {v.meta.title}
                  </p>
                )}

                {lastUpdated && (
                  <p className="text-[10px] text-slate-400">
                    Updated {lastUpdated}
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-100">
                  {/* Preview */}
                  <button
                    onClick={() => openPreview(slug)}
                    disabled={!hasContent}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title={
                      hasContent ? "Preview content" : "No content to preview"
                    }
                  >
                    <MdOutlineVisibility className="w-3.5 h-3.5" />
                    Preview
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEditor(slug)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 hover:border-teal-300 transition-colors"
                    title={hasContent ? "Edit vehicle" : "Create vehicle"}
                  >
                    <MdOutlineEdit className="w-3.5 h-3.5" />
                    {hasContent ? "Edit" : "Create"}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setDeleteSlug(slug)}
                    disabled={!hasContent}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title={hasContent ? "Delete vehicle" : "Nothing to delete"}
                    aria-label="Delete"
                  >
                    <MdOutlineDelete className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      {editingSlug && selectedCityId && (
        <VehicleEditor
          cityId={selectedCityId}
          cityName={cities.find((c) => c.id === selectedCityId)?.name || ""}
          vehicleSlug={editingSlug}
          vehicleLabel={
            VEHICLE_SLUGS.find((s) => s.slug === editingSlug)?.label ||
            editingSlug
          }
          initial={vehicleMap[editingSlug] || null}
          onSave={handleSave}
          onDelete={async (slug) => {
            setEditingSlug(null);
            setDeleteSlug(slug);
          }}
          onClose={() => setEditingSlug(null)}
        />
      )}

      {/* Preview Modal */}
      {previewSlug && selectedCityId && (
        <VehiclePreviewModal
          vehicleLabel={
            VEHICLE_SLUGS.find((s) => s.slug === previewSlug)?.label ||
            previewSlug
          }
          vehicleSlug={previewSlug}
          cityName={cities.find((c) => c.id === selectedCityId)?.name || ""}
          meta={vehicleMap[previewSlug]?.meta || {}}
          sections={vehicleMap[previewSlug]?.sections || {}}
          status={vehicleMap[previewSlug]?.status || "draft"}
          updatedAt={vehicleMap[previewSlug]?.updated_at}
          onClose={() => setPreviewSlug(null)}
          onEdit={() => {
            const slug = previewSlug;
            setPreviewSlug(null);
            if (slug) setEditingSlug(slug);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteSlug && (
        <DeleteConfirmModal
          vehicleLabel={
            VEHICLE_SLUGS.find((s) => s.slug === deleteSlug)?.label ||
            deleteSlug
          }
          vehicleSlug={deleteSlug}
          cityName={cities.find((c) => c.id === selectedCityId)?.name || ""}
          loading={deleting}
          onCancel={() => setDeleteSlug(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

// ============================================================
// VEHICLE EDITOR MODAL
// ============================================================
function VehicleEditor({
  cityId,
  cityName,
  vehicleSlug,
  vehicleLabel,
  initial,
  onSave,
  onDelete,
  onClose,
}: {
  cityId: number;
  cityName: string;
  vehicleSlug: string;
  vehicleLabel: string;
  initial: VehicleRow | null;
  onSave: (
    slug: string,
    meta: any,
    sections: any,
    status: "draft" | "published" | "archived",
    sortOrder: number
  ) => Promise<void>;
  onDelete: (slug: string) => Promise<void>;
  onClose: () => void;
}) {
  const [meta, setMeta] = useState<any>(() => ({
    title: initial?.meta?.title || "",
    subtitle: initial?.meta?.subtitle || "",
    description: initial?.meta?.description || "",
    price: initial?.meta?.price ?? 0,
    seats: initial?.meta?.seats || "",
    image: initial?.meta?.image || "",
    imagePublicId: initial?.meta?.imagePublicId || "",
    eyebrow: initial?.meta?.eyebrow || "",
  }));

  const [sections, setSections] = useState<any>(() => ({
    about: initial?.sections?.about || {
      title: "About",
      paragraphs: [],
    },
    features: initial?.sections?.features || [],
    features_title: initial?.sections?.features_title || "Key Features",
    prices: initial?.sections?.prices || [],
    prices_title: initial?.sections?.prices_title || "Prices & Charges",
    faqs: initial?.sections?.faqs || [],
    faqs_title: initial?.sections?.faqs_title || "FAQs",
  }));

  const [status, setStatus] = useState<
    "draft" | "published" | "archived"
  >(initial?.status || "draft");

  const [sortOrder, setSortOrder] = useState<number>(
    initial?.sort_order ?? 0
  );

  const [mode, setMode] = useState<"form" | "json">("form");
  const [jsonText, setJsonText] = useState(() =>
    JSON.stringify(
      {
        meta: initial?.meta || meta,
        sections: initial?.sections || sections,
      },
      null,
      2
    )
  );
  const [jsonError, setJsonError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const switchToJson = () => {
    setJsonText(JSON.stringify({ meta, sections }, null, 2));
    setJsonError("");
    setMode("json");
  };

  const switchToForm = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed.meta) setMeta(parsed.meta);
      if (parsed.sections) setSections(parsed.sections);
      setJsonError("");
      setMode("form");
    } catch {
      setJsonError("Fix JSON errors before switching to Form mode");
    }
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);

    try {
      let finalMeta = meta;
      let finalSections = sections;

      if (mode === "json") {
        const parsed = JSON.parse(jsonText);
        finalMeta = parsed.meta || {};
        finalSections = parsed.sections || {};
      }

      await onSave(vehicleSlug, finalMeta, finalSections, status, sortOrder);
      onClose();
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl max-h-[94vh] flex flex-col">
        {/* HEADER */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {vehicleLabel}
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              {cityName} · {vehicleSlug}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={mode === "json" ? switchToForm : undefined}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === "form"
                    ? "bg-teal-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Form
              </button>
              <button
                type="button"
                onClick={mode === "form" ? switchToJson : undefined}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === "json"
                    ? "bg-teal-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                JSON
              </button>
            </div>

            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
              title="Sort order"
              placeholder="Order"
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-xl leading-none px-2"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}
          {jsonError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {jsonError}
            </div>
          )}

          {mode === "json" ? (
            <JsonEditor value={jsonText} onChange={setJsonText} />
          ) : (
            <>
              <SectionHeader title="Meta" hint="Top-of-page info" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Eyebrow">
                  <input
                    type="text"
                    value={meta.eyebrow || ""}
                    onChange={(e) =>
                      setMeta({ ...meta, eyebrow: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Urban Cruise Delhi"
                  />
                </Field>

                <Field label="Seats">
                  <input
                    type="text"
                    value={meta.seats || ""}
                    onChange={(e) =>
                      setMeta({ ...meta, seats: e.target.value })
                    }
                    className={inputCls}
                    placeholder="6-7 Seater"
                  />
                </Field>

                <Field label="Title">
                  <input
                    type="text"
                    value={meta.title || ""}
                    onChange={(e) =>
                      setMeta({ ...meta, title: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Maruti Suzuki Ertiga on Rent in Delhi"
                  />
                </Field>

                <Field label="Subtitle">
                  <input
                    type="text"
                    value={meta.subtitle || ""}
                    onChange={(e) =>
                      setMeta({ ...meta, subtitle: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Perfect family MPV for city & outstation"
                  />
                </Field>

                <Field label="Price (₹/km)">
                  <input
                    type="number"
                    value={meta.price ?? 0}
                    onChange={(e) =>
                      setMeta({
                        ...meta,
                        price: Number(e.target.value),
                      })
                    }
                    className={inputCls}
                    placeholder="16"
                  />
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  rows={3}
                  value={meta.description || ""}
                  onChange={(e) =>
                    setMeta({ ...meta, description: e.target.value })
                  }
                  className={inputCls}
                  placeholder="Short description shown on the hero card"
                />
              </Field>

              <Field label="Hero Image">
                <ImageUpload
                  value={meta.image || null}
                  publicId={meta.imagePublicId || null}
                  onChange={(url, publicId) =>
                    setMeta({
                      ...meta,
                      image: url || "",
                      imagePublicId: publicId || "",
                    })
                  }
                  scope="vehicle"
                  aspect="16 / 9"
                  hint="JPG, PNG, WEBP · Max 300 KB · Recommended 1200×675"
                />
              </Field>

              <SectionHeader
                title="About"
                hint="Body copy describing the vehicle"
              />

              <Field label="About Title">
                <input
                  type="text"
                  value={sections.about?.title || ""}
                  onChange={(e) =>
                    setSections({
                      ...sections,
                      about: {
                        ...sections.about,
                        title: e.target.value,
                      },
                    })
                  }
                  className={inputCls}
                  placeholder="About the Ertiga"
                />
              </Field>

              <RichList
                label="Paragraphs"
                items={sections.about?.paragraphs || []}
                onChange={(items) =>
                  setSections({
                    ...sections,
                    about: {
                      ...sections.about,
                      paragraphs: items,
                    },
                  })
                }
                emptyItem=""
                renderItem={(item, update) => (
                  <RichEditor
                    value={normalizeToEditorDoc(item)}
                    onChange={(data) => update(editorDocToPlain(data))}
                    placeholder="Write a paragraph..."
                    minHeight={140}
                  />
                )}
              />

              <SectionHeader
                title="Features"
                hint="Short badges like '6-7 Seater', 'AC', etc."
              />

              <Field label="Features Title">
                <input
                  type="text"
                  value={sections.features_title || ""}
                  onChange={(e) =>
                    setSections({
                      ...sections,
                      features_title: e.target.value,
                    })
                  }
                  className={inputCls}
                  placeholder="Key Features"
                />
              </Field>

              <RichList
                label="Feature items"
                items={sections.features || []}
                onChange={(items) =>
                  setSections({ ...sections, features: items })
                }
                emptyItem={{ label: "" }}
                renderItem={(item, update) => (
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <Field label="Label">
                      <input
                        type="text"
                        value={item.label || ""}
                        onChange={(e) =>
                          update({ ...item, label: e.target.value })
                        }
                        className={inputCls}
                        placeholder="6-7 Seater"
                      />
                    </Field>
                  </div>
                )}
              />

              <SectionHeader title="Prices" hint="Tabular pricing rows" />

              <Field label="Prices Title">
                <input
                  type="text"
                  value={sections.prices_title || ""}
                  onChange={(e) =>
                    setSections({
                      ...sections,
                      prices_title: e.target.value,
                    })
                  }
                  className={inputCls}
                  placeholder="Prices & Charges"
                />
              </Field>

              <RichList
                label="Price rows"
                items={sections.prices || []}
                onChange={(items) =>
                  setSections({ ...sections, prices: items })
                }
                emptyItem={{
                  seater: "",
                  price: 0,
                  seating: "",
                }}
                renderItem={(item, update) => (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <Field label="Vehicle">
                      <input
                        type="text"
                        value={item.seater || ""}
                        onChange={(e) =>
                          update({ ...item, seater: e.target.value })
                        }
                        className={inputCls}
                        placeholder="Ertiga – 6 Seater"
                      />
                    </Field>
                    <Field label="Price (₹/km)">
                      <input
                        type="number"
                        value={item.price ?? 0}
                        onChange={(e) =>
                          update({
                            ...item,
                            price: Number(e.target.value),
                          })
                        }
                        className={inputCls}
                        placeholder="16"
                      />
                    </Field>
                    <Field label="Seating">
                      <input
                        type="text"
                        value={item.seating || ""}
                        onChange={(e) =>
                          update({ ...item, seating: e.target.value })
                        }
                        className={inputCls}
                        placeholder="2 x 3"
                      />
                    </Field>
                  </div>
                )}
              />

              <SectionHeader
                title="FAQs"
                hint="Question / answer pairs (answer supports rich text)"
              />

              <Field label="FAQs Title">
                <input
                  type="text"
                  value={sections.faqs_title || ""}
                  onChange={(e) =>
                    setSections({
                      ...sections,
                      faqs_title: e.target.value,
                    })
                  }
                  className={inputCls}
                  placeholder="FAQs"
                />
              </Field>

              <RichList
                label="FAQ items"
                items={sections.faqs || []}
                onChange={(items) =>
                  setSections({ ...sections, faqs: items })
                }
                emptyItem={{ question: "", answer: "" }}
                renderItem={(item, update) => (
                  <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <Field label="Question">
                      <input
                        type="text"
                        value={item.question || ""}
                        onChange={(e) =>
                          update({
                            ...item,
                            question: e.target.value,
                          })
                        }
                        className={inputCls}
                        placeholder="Is the Ertiga good for a family of 6?"
                      />
                    </Field>

                    <Field label="Answer">
                      <RichEditor
                        value={normalizeToEditorDoc(item.answer || "")}
                        onChange={(data) =>
                          update({
                            ...item,
                            answer: editorDocToPlain(data),
                          })
                        }
                        placeholder="Write the answer..."
                        minHeight={120}
                      />
                    </Field>
                  </div>
                )}
              />
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-slate-200 flex justify-between">
          <button
            onClick={() => onDelete(vehicleSlug)}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
          >
            <MdOutlineDelete className="w-4 h-4" />
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              <MdOutlineSave className="w-4 h-4" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VEHICLE PREVIEW MODAL
// ============================================================
function VehiclePreviewModal({
  vehicleLabel,
  vehicleSlug,
  cityName,
  meta,
  sections,
  status,
  updatedAt,
  onClose,
  onEdit,
}: {
  vehicleLabel: string;
  vehicleSlug: string;
  cityName: string;
  meta: any;
  sections: any;
  status: "draft" | "published" | "archived";
  updatedAt?: string;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [tab, setTab] = useState<"visual" | "json">("visual");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl max-h-[94vh] flex flex-col">
        {/* HEADER */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <MdOutlineVisibility className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl font-bold text-slate-900">
                {vehicleLabel}
              </h2>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  status === "published"
                    ? "bg-teal-50 text-teal-700 border border-teal-200"
                    : status === "draft"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {status}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {cityName} · {vehicleSlug}
              {updatedAt && (
                <>
                  {" · "}
                  Updated{" "}
                  {new Date(updatedAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none px-2 flex-shrink-0"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* TABS */}
        <div className="px-6 pt-4 border-b border-slate-200">
          <div className="flex gap-1">
            <button
              onClick={() => setTab("visual")}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                tab === "visual"
                  ? "bg-slate-50 text-teal-700 border-b-2 border-teal-600"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              Visual
            </button>
            <button
              onClick={() => setTab("json")}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                tab === "json"
                  ? "bg-slate-50 text-teal-700 border-b-2 border-teal-600"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              JSON
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50/40">
          {tab === "visual" ? (
            <VisualPreview meta={meta} sections={sections} />
          ) : (
            <pre className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-4 overflow-auto max-h-[60vh] font-mono">
              {JSON.stringify({ meta, sections }, null, 2)}
            </pre>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
          >
            <MdOutlineEdit className="w-4 h-4" />
            Edit Vehicle
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VISUAL PREVIEW RENDERER
// ============================================================
function VisualPreview({
  meta,
  sections,
}: {
  meta: any;
  sections: any;
}) {
  const hasMeta = meta && Object.keys(meta).length > 0;
  const hasSections = sections && Object.keys(sections).length > 0;

  if (!hasMeta && !hasSections) {
    return (
      <p className="text-sm text-slate-400 text-center py-12">
        No content available for this vehicle.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero image */}
      {meta?.image && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={meta.image}
            alt={meta.title || "preview"}
            className="w-full max-h-64 object-cover"
          />
        </div>
      )}

      {/* Meta block */}
      {hasMeta && (
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-teal-500 rounded-full" />
            Meta
          </h3>

          <div className="space-y-3">
            {meta.title && (
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Title
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {meta.title}
                </p>
              </div>
            )}

            {meta.subtitle && (
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Subtitle
                </p>
                <p className="text-sm text-slate-700">{meta.subtitle}</p>
              </div>
            )}

            {meta.eyebrow && (
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Eyebrow
                </p>
                <p className="text-sm text-slate-700">{meta.eyebrow}</p>
              </div>
            )}

            {meta.description && (
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Description
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {meta.description}
                </p>
              </div>
            )}

            <div className="flex gap-6 flex-wrap pt-2">
              {meta.price !== undefined && meta.price !== null && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Price
                  </p>
                  <p className="text-sm font-mono text-slate-900">
                    ₹{meta.price}/km
                  </p>
                </div>
              )}
              {meta.seats && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Seats
                  </p>
                  <p className="text-sm text-slate-900">{meta.seats}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sections block */}
      {hasSections && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-teal-500 rounded-full" />
            Sections
          </h3>

          {Object.entries(sections).map(([key, value]) => (
            <div
              key={key}
              className="bg-white border border-slate-200 rounded-lg p-5"
            >
              <p className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider mb-3">
                {key.replace(/_/g, " ")}
              </p>
              <PreviewValue value={value} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewValue({ value }: { value: any }) {
  if (value === null || value === undefined) {
    return <span className="text-sm text-slate-400 italic">null</span>;
  }

  if (typeof value === "string") {
    if (/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|avif)$/i.test(value)) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt="preview"
          className="max-w-full max-h-64 rounded-lg border border-slate-200 object-contain bg-slate-50"
        />
      );
    }
    if (value.length > 120) {
      return (
        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
          {value}
        </p>
      );
    }
    return <p className="text-sm text-slate-700">{value}</p>;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return (
      <span className="text-sm font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
        {String(value)}
      </span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-sm text-slate-400 italic">Empty list</span>;
    }
    return (
      <ul className="space-y-2">
        {value.map((item, i) => (
          <li
            key={i}
            className="text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-3"
          >
            <span className="text-[10px] font-mono text-slate-400 block mb-1">
              #{i + 1}
            </span>
            <PreviewValue value={item} />
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object") {
    return (
      <div className="space-y-2 pl-3 border-l-2 border-slate-200">
        {Object.entries(value).map(([k, v]) => (
          <div key={k}>
            <p className="text-xs font-medium text-slate-500 mb-1">{k}</p>
            <PreviewValue value={v} />
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// ============================================================
// DELETE CONFIRMATION MODAL
// ============================================================
function DeleteConfirmModal({
  vehicleLabel,
  vehicleSlug,
  cityName,
  loading,
  onCancel,
  onConfirm,
}: {
  vehicleLabel: string;
  vehicleSlug: string;
  cityName: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdOutlineWarning className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Delete Vehicle Content?
          </h2>
          <p className="text-slate-500 text-sm mb-1">
            You are about to delete content for:
          </p>
          <p className="font-semibold text-slate-900 mb-1">{vehicleLabel}</p>
          <p className="text-xs text-slate-400 font-mono mb-4">
            {cityName} · {vehicleSlug}
          </p>
          <p className="text-xs text-slate-400 mb-4">
            This action cannot be undone.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <MdOutlineDelete className="w-4 h-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// REUSABLE SUB-COMPONENTS
// ============================================================

function SectionHeader({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="border-t border-slate-100 pt-5 first:border-0 first:pt-0">
      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
        {title}
      </h3>
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <span className="block text-xs font-medium text-slate-700 mb-1.5">
        {label}
      </span>
      {children}
    </div>
  );
}

function RichList<T>({
  label,
  items,
  onChange,
  renderItem,
  emptyItem,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (
    item: T,
    update: (next: T) => void,
    remove: () => void
  ) => React.ReactNode;
  emptyItem: T;
}) {
  const add = () => {
    onChange([...items, JSON.parse(JSON.stringify(emptyItem))]);
  };

  const update = (index: number, next: T) => {
    const copy = [...items];
    copy[index] = next;
    onChange(copy);
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-700">
          {label}
        </span>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
        >
          <MdOutlineAdd className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-slate-400 italic">
          No items yet — click Add to create one.
        </p>
      ) : (
        items.map((item, i) => (
          <div key={i} className="relative">
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-colors"
              title="Remove this item"
              aria-label="Remove"
            >
              <MdOutlineRemove className="w-3.5 h-3.5" />
            </button>

            {renderItem(
              item,
              (next) => update(i, next),
              () => remove(i)
            )}
          </div>
        ))
      )}
    </div>
  );
}

function JsonEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-2">
        Raw JSON view of <code>meta</code> and <code>sections</code>.
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[560px] font-mono text-xs p-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50"
        spellCheck={false}
      />
    </div>
  );
}

// ============================================================
// Editor.js <-> plain text helpers
// ============================================================
function normalizeToEditorDoc(input: any) {
  if (!input) return undefined;

  if (typeof input === "object" && Array.isArray(input.blocks)) {
    return input;
  }

  if (typeof input === "string") {
    return {
      time: Date.now(),
      blocks: [{ type: "paragraph", data: { text: input } }],
      version: "2.28.0",
    };
  }

  return {
    time: Date.now(),
    blocks: [
      { type: "paragraph", data: { text: JSON.stringify(input) } },
    ],
    version: "2.28.0",
  };
}

function editorDocToPlain(doc: any): string {
  if (!doc || !Array.isArray(doc.blocks)) return "";

  return doc.blocks
    .map((block: any) => {
      const d = block.data || {};
      switch (block.type) {
        case "paragraph":
        case "header":
          return stripHtml(d.text || "");
        case "list":
          return (d.items || [])
            .map((it: any) => {
              const text =
                typeof it === "string" ? it : it.content || "";
              return `• ${stripHtml(text)}`;
            })
            .join("\n");
        case "quote":
          return stripHtml(d.text || "");
        case "checklist":
          return (d.items || [])
            .map(
              (it: any) =>
                `${it.checked ? "☑" : "☐"} ${stripHtml(it.text || "")}`
            )
            .join("\n");
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}