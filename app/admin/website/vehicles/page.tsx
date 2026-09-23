"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineSave,
  MdOutlineRefresh,
  MdOutlineDirectionsCar,
  MdOutlineDelete,
  MdOutlineSearch,
  MdOutlineVisibility,
  MdOutlineEdit,
  MdOutlineWarning,
  MdOutlineClose,
  MdOutlineLocationOn,
} from "react-icons/md";
import { CardGridSkeleton } from "@/app/components/UI/PageSkeletons";
import ImageUpload from "@/app/components/UI/ImageUpload";
import { FormEditor, Field } from "@/app/components/UI/SectionEditors";
import { useAuth } from "@/app/context/AuthContext";

// ============================================================
// Vehicle slugs (with permissions)
// ============================================================
const VEHICLE_SLUGS = [
  {
    slug: "car-suvs",
    label: "Car & SUVs",
    perm: "urbancruise.vehicles.carsuvs.view",
  },
  {
    slug: "ertiga",
    label: "Ertiga",
    perm: "urbancruise.vehicles.ertiga.view",
  },
  {
    slug: "innova-crysta",
    label: "Innova Crysta",
    perm: "urbancruise.vehicles.innova.view",
  },
  {
    slug: "hycross",
    label: "Hycross",
    perm: "urbancruise.vehicles.hycross.view",
  },
  {
    slug: "luxury-cars-suvs",
    label: "Luxury Cars & SUVs",
    perm: "urbancruise.vehicles.luxurycars.view",
  },
  {
    slug: "mercedes-sprinter",
    label: "Mercedes Sprinter",
    perm: "urbancruise.vehicles.sprinter.view",
  },
  {
    slug: "luxury-vans",
    label: "Luxury Vans",
    perm: "urbancruise.vehicles.luxuryvans.view",
  },
  {
    slug: "tempo-traveller",
    label: "Tempo Traveller",
    perm: "urbancruise.vehicles.tempotraveller.view",
  },
  {
    slug: "maharaja-tempo-traveller",
    label: "Maharaja Tempo Traveller",
    perm: "urbancruise.vehicles.maharaja.view",
  },
  {
    slug: "urbania",
    label: "Urbania",
    perm: "urbancruise.vehicles.urbania.main.view",
  },
  {
    slug: "mini-bus",
    label: "Mini Bus",
    perm: "urbancruise.vehicles.minibus.main.view",
  },
  {
    slug: "luxury-bus",
    label: "Luxury Bus",
    perm: "urbancruise.vehicles.luxurybus.view",
  },
  {
    slug: "volvo-bus",
    label: "Volvo Bus",
    perm: "urbancruise.vehicles.volvo.view",
  },
  {
    slug: "bharat-benz-bus",
    label: "Bharat Benz Bus",
    perm: "urbancruise.vehicles.bharatbenz.view",
  },
  {
    slug: "bus-with-washroom",
    label: "Bus With Washroom",
    perm: "urbancruise.vehicles.washroom.view",
  },
  {
    slug: "sleeper-bus",
    label: "Sleeper | Semi Sleeper Bus",
    perm: "urbancruise.vehicles.sleeper.view",
  },
];

// ============================================================
// Vehicle sections
// ============================================================
const VEHICLE_SECTIONS = [
  {
    key: "meta",
    label: "Meta",
    hint: "Eyebrow, Title, Subtitle, Description, Price, Seats, Hero Image",
  },
  { key: "hero", label: "Hero" },
  { key: "quickcall", label: "Get a Quick Call" },
  { key: "about", label: "About" },
  { key: "howitworks", label: "How It Works" },
  { key: "vehiclebudget", label: "Vehicle For Every Budget" },
  { key: "groupsize", label: "Vehicle For Every Group Size" },
  { key: "occasion", label: "Vehicle For Every Occasion" },
  { key: "lookingvehicle", label: "Looking For Other Vehicle" },
  {
    key: "compare",
    label: "Compare With Vehicles",
    hiddenFor: [
      "car-suvs",
      "luxury-cars-suvs",
      "mercedes-sprinter",
      "luxury-vans",
      "mini-bus",
      "luxury-bus",
    ],
  },
  {
    key: "prices",
    label: "Prices & Charges",
    hiddenFor: [
      "car-suvs",
      "luxury-cars-suvs",
      "hycross",
      "innova-crysta",
      "ertiga",
      "mercedes-sprinter",
      "mini-bus",
      "luxury-bus",
    ],
  },
  { key: "whychoose", label: "Why Choose Urban Cruise" },
  { key: "testimonials", label: "Testimonials" },
  {
    key: "discover",
    label: "Discover Your Next Adventure",
    hiddenFor: [
      "ertiga",
      "innova-crysta",
      "hycross",
      "mercedes-sprinter",
      "maharaja-tempo-traveller",
      "volvo-bus",
      "bharat-benz-bus",
      "bus-with-washroom",
      "sleeper-bus",
    ],
  },
  { key: "faq", label: "FAQs" },
  { key: "servicelocations", label: "Vehicle Rental Service In India" },
  { key: "partners", label: "Our Trusted Partners" },
  { key: "downloadapp", label: "Download App" },
] as const;

const CONTENT_SECTIONS = VEHICLE_SECTIONS.filter((s) => s.key !== "meta");

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

const inputCls =
  "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500";

// ============================================================
// PAGE
// ============================================================
export default function WebsiteVehiclesPage() {
  const { user, hasCityPermission } = useAuth();

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
  const allCities = citiesData?.cities || [];

  // ✅ Restrict cities to user's accessible cities
  const cities = useMemo(() => {
    if (!user) return [];
    if (user.roles?.includes("admin")) return allCities;

    const allowedIds = new Set((user.cities || []).map((c) => c.id));
    return allCities.filter((c) => allowedIds.has(c.id));
  }, [allCities, user]);

  // ✅ Ensure selectedCityId is valid
  useEffect(() => {
    if (cities.length === 0) {
      if (selectedCityId !== null) setSelectedCityId(null);
      return;
    }
    const currentIsValid = cities.some((c) => c.id === selectedCityId);
    if (!currentIsValid) {
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

  // Filter by BOTH role + city permissions, then apply search
  const filteredSlugs = useMemo(() => {
    const allowed = VEHICLE_SLUGS.filter((s) =>
      hasCityPermission(s.perm, selectedCityId)
    );
    const q = search.trim().toLowerCase();
    if (!q) return allowed;
    return allowed.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q)
    );
  }, [search, hasCityPermission, selectedCityId]);

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
  // DELETE
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
  // LOAD FULL VEHICLE
  // ============================================================
  const ensureFullVehicle = async (slug: string) => {
    const existing = vehicleMap[slug];
    if (existing && existing.sections) return existing;

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
        return vehicle;
      }
    } catch {
      // ignore
    }
    return null;
  };

  const openEditor = async (slug: string) => {
    await ensureFullVehicle(slug);
    setEditingSlug(slug);
  };

  const openPreview = async (slug: string) => {
    await ensureFullVehicle(slug);
    setPreviewSlug(slug);
  };

  // ============================================================
  // Permission guard for modals
  // ============================================================
  const canAccessVehicle = (slug: string | null) => {
    if (!slug) return false;
    const v = VEHICLE_SLUGS.find((s) => s.slug === slug);
    return v ? hasCityPermission(v.perm, selectedCityId) : false;
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="p-8">
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

      {/* No cities at all */}
      {!isLoading && cities.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <MdOutlineLocationOn className="w-12 h-12 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500 font-medium">
            You don&apos;t have access to any city.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Contact your administrator to request city access.
          </p>
        </div>
      )}

      {/* City selector */}
      {cities.length > 0 && (
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
      )}

      {/* Search — only when cities exist */}
      {cities.length > 0 && (
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
      )}

      {/* Grid — only when cities exist */}
      {cities.length > 0 && (
        <>
          {isLoading ? (
            <CardGridSkeleton count={6} />
          ) : filteredSlugs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
              <MdOutlineDirectionsCar className="w-12 h-12 mx-auto text-slate-300" />
              <p className="mt-3 text-slate-500 font-medium">
                {search.trim()
                  ? "No vehicles match your search."
                  : "You don't have access to any vehicles."}
              </p>
              {!search.trim() && (
                <p className="text-xs text-slate-400 mt-1">
                  Contact your administrator to request access.
                </p>
              )}
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

                    <p className="text-xs text-slate-400 font-mono mb-1">
                      {slug}
                    </p>

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

                    <div className="flex items-center gap-1.5 mt-auto pt-3 border-t border-slate-100">
                      <button
                        onClick={() => openPreview(slug)}
                        disabled={!hasContent}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <MdOutlineVisibility className="w-3.5 h-3.5" />
                        Preview
                      </button>

                      <button
                        onClick={() => openEditor(slug)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 hover:border-teal-300 transition-colors"
                      >
                        <MdOutlineEdit className="w-3.5 h-3.5" />
                        {hasContent ? "Edit" : "Create"}
                      </button>

                      <button
                        onClick={() => setDeleteSlug(slug)}
                        disabled={!hasContent}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
        </>
      )}

      {/* Editor Modal */}
      {editingSlug && selectedCityId && canAccessVehicle(editingSlug) && (
        <VehicleEditor
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
      {previewSlug && selectedCityId && canAccessVehicle(previewSlug) && (
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

      {/* Delete Modal */}
      {deleteSlug && canAccessVehicle(deleteSlug) && (
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
// VEHICLE EDITOR
// ============================================================
function VehicleEditor({
  cityName,
  vehicleSlug,
  vehicleLabel,
  initial,
  onSave,
  onDelete,
  onClose,
}: {
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
    eyebrow: initial?.meta?.eyebrow || "",
    title: initial?.meta?.title || "",
    subtitle: initial?.meta?.subtitle || "",
    description: initial?.meta?.description || "",
    price: initial?.meta?.price ?? 0,
    seats: initial?.meta?.seats || "",
    image: initial?.meta?.image || "",
    imagePublicId: initial?.meta?.imagePublicId || "",
  }));

  const [sections, setSections] = useState<any>(() => {
    const base: any = {};
    CONTENT_SECTIONS.forEach((s) => {
      base[s.key] = initial?.sections?.[s.key] || {};
    });
    return base;
  });

  const [status, setStatus] = useState<
    "draft" | "published" | "archived"
  >(initial?.status || "draft");

  const [sortOrder, setSortOrder] = useState<number>(
    initial?.sort_order ?? 0
  );

  const [activeSection, setActiveSection] = useState<string>("meta");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const visibleSections = VEHICLE_SECTIONS.filter((s) => {
    const hiddenFor =
      "hiddenFor" in s ? (s.hiddenFor as readonly string[]) : undefined;
    return !hiddenFor || !hiddenFor.includes(vehicleSlug);
  });

  const updateSection = (key: string, value: any) => {
    setSections((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      await onSave(vehicleSlug, meta, sections, status, sortOrder);
      onClose();
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const currentSection = visibleSections.find(
    (s) => s.key === activeSection
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl max-h-[94vh] flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900 truncate">
              {vehicleLabel}
            </h2>
            <p className="text-xs text-slate-400 font-mono truncate">
              {cityName} · {vehicleSlug}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
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
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <MdOutlineClose className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center gap-3">
          <label
            htmlFor="section-select"
            className="text-xs font-semibold text-slate-500 uppercase tracking-wider sm:w-32 flex-shrink-0"
          >
            Section
          </label>
          <select
            id="section-select"
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 cursor-pointer"
          >
            {visibleSections.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>

          {currentSection && "hint" in currentSection && currentSection.hint && (
            <p className="text-[11px] text-slate-400 sm:w-64">
              {currentSection.hint}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-500">Editing:</span>
            <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-medium">
              {currentSection?.label || activeSection}
            </span>
          </div>

          {activeSection === "meta" ? (
            <MetaEditor meta={meta} setMeta={setMeta} />
          ) : (
            <FormEditor
              sectionKey={activeSection}
              value={sections[activeSection] || {}}
              onChange={(v: any) => updateSection(activeSection, v)}
            />
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-between flex-wrap gap-3">
          <button
            onClick={() => onDelete(vehicleSlug)}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
          >
            <MdOutlineDelete className="w-4 h-4" />
            Delete Vehicle
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
              {saving ? "Saving..." : "Save All"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// META EDITOR
// ============================================================
function MetaEditor({
  meta,
  setMeta,
}: {
  meta: any;
  setMeta: (m: any) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Eyebrow">
          <input
            type="text"
            value={meta.eyebrow || ""}
            onChange={(e) => setMeta({ ...meta, eyebrow: e.target.value })}
            className={inputCls}
            placeholder="Urban Cruise Delhi"
          />
        </Field>
        <Field label="Seats">
          <input
            type="text"
            value={meta.seats || ""}
            onChange={(e) => setMeta({ ...meta, seats: e.target.value })}
            className={inputCls}
            placeholder="6-7 Seater"
          />
        </Field>
        <Field label="Title">
          <input
            type="text"
            value={meta.title || ""}
            onChange={(e) => setMeta({ ...meta, title: e.target.value })}
            className={inputCls}
            placeholder="Maruti Suzuki Ertiga on Rent"
          />
        </Field>
        <Field label="Subtitle">
          <input
            type="text"
            value={meta.subtitle || ""}
            onChange={(e) => setMeta({ ...meta, subtitle: e.target.value })}
            className={inputCls}
            placeholder="Perfect family MPV..."
          />
        </Field>
        <Field label="Price (₹/km)">
          <input
            type="number"
            value={meta.price ?? 0}
            onChange={(e) =>
              setMeta({ ...meta, price: Number(e.target.value) })
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
          onChange={(e) => setMeta({ ...meta, description: e.target.value })}
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
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <MdOutlineClose className="w-6 h-6" />
          </button>
        </div>

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

        <div className="flex-1 overflow-auto p-6 bg-slate-50/40">
          {tab === "visual" ? (
            <VisualPreview
              meta={meta}
              sections={sections}
              vehicleSlug={vehicleSlug}
            />
          ) : (
            <pre className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-4 overflow-auto max-h-[60vh] font-mono">
              {JSON.stringify({ meta, sections }, null, 2)}
            </pre>
          )}
        </div>

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
// VISUAL PREVIEW
// ============================================================
function VisualPreview({
  meta,
  sections,
  vehicleSlug,
}: {
  meta: any;
  sections: any;
  vehicleSlug: string;
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

      {hasSections && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-teal-500 rounded-full" />
            Sections
          </h3>

          {CONTENT_SECTIONS.map((s) => {
            const hiddenFor =
              "hiddenFor" in s
                ? (s.hiddenFor as readonly string[])
                : undefined;
            if (hiddenFor && hiddenFor.includes(vehicleSlug)) return null;

            const value = sections[s.key];
            if (!value || Object.keys(value).length === 0) return null;

            return (
              <div
                key={s.key}
                className="bg-white border border-slate-200 rounded-lg p-5"
              >
                <p className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider mb-3">
                  {s.label}
                </p>
                <PreviewValue value={value} />
              </div>
            );
          })}
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
// DELETE CONFIRM MODAL
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
