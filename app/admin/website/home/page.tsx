"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineSave,
  MdOutlineRefresh,
  MdOutlinePublic,
  MdOutlineDelete,
  MdOutlineVisibility,
  MdOutlineEdit,
  MdOutlineWarning,
  MdOutlineLocationOn,
} from "react-icons/md";
import { TableSkeleton } from "@/app/components/UI/PageSkeletons";
import {
  FormEditor,
  JsonEditor,
} from "@/app/components/UI/SectionEditors";
import { useAuth } from "@/app/context/AuthContext";

// ============================================================
// Section definitions (with permissions)
// ============================================================
const HOME_SECTIONS = [
  { key: "hero", label: "Hero", perm: "urbancruise.home.hero.view" },
  {
    key: "quickcall",
    label: "Get a Quick Call",
    perm: "urbancruise.home.quickcall.view",
  },
  { key: "about", label: "About", perm: "urbancruise.home.about.view" },
  {
    key: "howitworks",
    label: "How It Works",
    perm: "urbancruise.home.howitworks.view",
  },
  {
    key: "vehiclebudget",
    label: "Vehicle For Every Budget",
    perm: "urbancruise.home.services.view",
  },
  {
    key: "groupsize",
    label: "Vehicle For Every Group Size",
    perm: "urbancruise.home.groupsize.view",
  },
  {
    key: "occasion",
    label: "Vehicle For Every Occasion",
    perm: "urbancruise.home.tempotraveller.view",
  },
  {
    key: "whychoose",
    label: "Why Choose Urban Cruise",
    perm: "urbancruise.home.whychoose.view",
  },
  {
    key: "testimonials",
    label: "Testimonials",
    perm: "urbancruise.home.testimonials.view",
  },
  { key: "faq", label: "FAQs", perm: "urbancruise.home.faqs.view" },
  {
    key: "servicelocations",
    label: "Vehicle Rental Service In India",
    perm: "urbancruise.home.locations.view",
  },
  {
    key: "partners",
    label: "Our Trusted Partners",
    perm: "urbancruise.home.partners.view",
  },
  {
    key: "downloadapp",
    label: "Download App",
    perm: "urbancruise.home.downloadapp.view",
  },
] as const;

type SectionKey = (typeof HOME_SECTIONS)[number]["key"];

// ============================================================
// Types
// ============================================================
interface City {
  id: number;
  name: string;
  state: string | null;
}

interface Section {
  id: number;
  city_id: number;
  section_key: string;
  content: any;
  status: "draft" | "published" | "archived";
  updated_at: string;
}

// ============================================================
// PAGE
// ============================================================
export default function WebsiteHomePage() {
  const { user, hasCityPermission } = useAuth();

  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<SectionKey | null>(
    null
  );
  const [previewSection, setPreviewSection] = useState<SectionKey | null>(null);
  const [deleteSection, setDeleteSection] = useState<SectionKey | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: citiesData } = useSWR<{ cities: City[] }>(
    "/api/admin/cities?active=true",
    fetcher
  );
  const allCities = citiesData?.cities || [];

  // ✅ Restrict cities to user's accessible cities (admin sees all)
  const cities = useMemo(() => {
    if (!user) return [];

    // Admin sees all
    if (user.roles?.includes("admin")) {
      return allCities;
    }

    // Non-admin: only cities from user.cities
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

  // Filter sections by BOTH role permission AND city permission
  const visibleSections = useMemo(
    () =>
      HOME_SECTIONS.filter((s) =>
        hasCityPermission(s.perm, selectedCityId)
      ),
    [hasCityPermission, selectedCityId]
  );

  const sectionsKey = selectedCityId
    ? `/api/admin/site-content/home?city_id=${selectedCityId}`
    : null;

  const { data, isLoading, mutate } = useSWR<{ sections: Section[] }>(
    sectionsKey,
    fetcher
  );

  const sections = data?.sections || [];

  const sectionMap = useMemo(() => {
    const map: Record<string, Section> = {};
    sections.forEach((s) => (map[s.section_key] = s));
    return map;
  }, [sections]);

  // ============================================================
  // SAVE
  // ============================================================
  const handleSave = async (
    sectionKey: string,
    content: any,
    status: "draft" | "published" | "archived"
  ) => {
    if (!selectedCityId) throw new Error("No city selected");

    const res = await fetch("/api/admin/site-content/home", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cityId: selectedCityId,
        sectionKey,
        content,
        status,
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
    if (!selectedCityId || !deleteSection) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/site-content/home?city_id=${selectedCityId}&section_key=${deleteSection}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error || "Failed to delete");
        return;
      }
      await mutate();
      if (selectedSection === deleteSection) setSelectedSection(null);
      setDeleteSection(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  // ============================================================
  // Permission guard for modals
  // ============================================================
  const canAccessSection = (key: string | null) => {
    if (!key) return false;
    const sec = HOME_SECTIONS.find((s) => s.key === key);
    return sec ? hasCityPermission(sec.perm, selectedCityId) : false;
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <MdOutlinePublic className="w-8 h-8 text-teal-600" />
            Website Home
          </h1>
          <p className="text-slate-500 mt-1">
            Manage Home page content shown on the public website
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
                setSelectedSection(null);
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

      {/* Sections grid — only when we have a city selected */}
      {cities.length > 0 && (
        <>
          {isLoading ? (
            <TableSkeleton rows={5} columns={3} />
          ) : visibleSections.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
              <MdOutlinePublic className="w-12 h-12 mx-auto text-slate-300" />
              <p className="mt-3 text-slate-500 font-medium">
                You don&apos;t have access to any Home sections.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Contact your administrator to request access.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleSections.map((s) => {
                const existing = sectionMap[s.key];
                const status = existing?.status || "not-created";
                const lastUpdated = existing?.updated_at
                  ? new Date(existing.updated_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : null;
                const hasContent = Boolean(existing);

                return (
                  <div
                    key={s.key}
                    className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-slate-900">
                        {s.label}
                      </h3>
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
                      {s.key}
                    </p>

                    {lastUpdated && (
                      <p className="text-[10px] text-slate-400 mb-3">
                        Updated {lastUpdated}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 mt-auto pt-3 border-t border-slate-100">
                      <button
                        onClick={() => setPreviewSection(s.key)}
                        disabled={!hasContent}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <MdOutlineVisibility className="w-3.5 h-3.5" />
                        Preview
                      </button>

                      <button
                        onClick={() => setSelectedSection(s.key)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 hover:border-teal-300 transition-colors"
                      >
                        <MdOutlineEdit className="w-3.5 h-3.5" />
                        {hasContent ? "Edit" : "Create"}
                      </button>

                      <button
                        onClick={() => setDeleteSection(s.key)}
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
      {selectedSection &&
        selectedCityId &&
        canAccessSection(selectedSection) && (
          <SectionEditor
            cityName={cities.find((c) => c.id === selectedCityId)?.name || ""}
            sectionKey={selectedSection}
            sectionLabel={
              HOME_SECTIONS.find((s) => s.key === selectedSection)?.label ||
              selectedSection
            }
            initial={sectionMap[selectedSection]?.content || {}}
            initialStatus={sectionMap[selectedSection]?.status || "draft"}
            onSave={handleSave}
            onDelete={async (key) => {
              setSelectedSection(null);
              setDeleteSection(key as SectionKey);
            }}
            onClose={() => setSelectedSection(null)}
          />
        )}

      {/* Preview Modal */}
      {previewSection &&
        selectedCityId &&
        canAccessSection(previewSection) && (
          <PreviewModal
            sectionLabel={
              HOME_SECTIONS.find((s) => s.key === previewSection)?.label ||
              previewSection
            }
            sectionKey={previewSection}
            cityName={cities.find((c) => c.id === selectedCityId)?.name || ""}
            content={sectionMap[previewSection]?.content || {}}
            status={sectionMap[previewSection]?.status || "draft"}
            updatedAt={sectionMap[previewSection]?.updated_at}
            onClose={() => setPreviewSection(null)}
            onEdit={() => {
              setPreviewSection(null);
              setSelectedSection(previewSection);
            }}
          />
        )}

      {/* Delete Modal */}
      {deleteSection && canAccessSection(deleteSection) && (
        <DeleteConfirmModal
          sectionLabel={
            HOME_SECTIONS.find((s) => s.key === deleteSection)?.label ||
            deleteSection
          }
          cityName={cities.find((c) => c.id === selectedCityId)?.name || ""}
          loading={deleting}
          onCancel={() => setDeleteSection(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

// ============================================================
// SECTION EDITOR MODAL
// ============================================================
function SectionEditor({
  cityName,
  sectionKey,
  sectionLabel,
  initial,
  initialStatus,
  onSave,
  onDelete,
  onClose,
}: {
  cityName: string;
  sectionKey: string;
  sectionLabel: string;
  initial: any;
  initialStatus: "draft" | "published" | "archived";
  onSave: (
    key: string,
    content: any,
    status: "draft" | "published" | "archived"
  ) => Promise<void>;
  onDelete: (key: string) => Promise<void>;
  onClose: () => void;
}) {
  const [content, setContent] = useState<any>(() => initial || {});
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    initialStatus
  );
  const [mode, setMode] = useState<"form" | "json">("form");
  const [jsonText, setJsonText] = useState(() =>
    JSON.stringify(initial || {}, null, 2)
  );
  const [jsonError, setJsonError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const switchToJson = () => {
    setJsonText(JSON.stringify(content, null, 2));
    setJsonError("");
    setMode("json");
  };

  const switchToForm = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setContent(parsed);
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
      let finalContent = content;
      if (mode === "json") {
        finalContent = JSON.parse(jsonText);
      }
      await onSave(sectionKey, finalContent, status);
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
        <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {sectionLabel}
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              {cityName} · {sectionKey}
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
            <FormEditor
              sectionKey={sectionKey}
              value={content}
              onChange={setContent}
            />
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-between">
          <button
            onClick={() => onDelete(sectionKey)}
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
// PREVIEW MODAL
// ============================================================
function PreviewModal({
  sectionLabel,
  sectionKey,
  cityName,
  content,
  status,
  updatedAt,
  onClose,
  onEdit,
}: {
  sectionLabel: string;
  sectionKey: string;
  cityName: string;
  content: any;
  status: "draft" | "published" | "archived";
  updatedAt?: string;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [tab, setTab] = useState<"visual" | "json">("visual");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[94vh] flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MdOutlineVisibility className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl font-bold text-slate-900">
                {sectionLabel}
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
              {cityName} · {sectionKey}
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
            className="text-slate-400 hover:text-slate-600 text-xl leading-none px-2"
            aria-label="Close"
          >
            ✕
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
            <VisualPreview content={content} />
          ) : (
            <pre className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-4 overflow-auto max-h-[60vh] font-mono">
              {JSON.stringify(content, null, 2)}
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
            Edit Section
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VISUAL PREVIEW
// ============================================================
function VisualPreview({ content }: { content: any }) {
  if (!content || Object.keys(content).length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-12">
        No content available for this section.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(content).map(([key, value]) => (
        <div
          key={key}
          className="bg-white border border-slate-200 rounded-lg p-4"
        >
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {key}
          </p>
          <PreviewValue value={value} />
        </div>
      ))}
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
  sectionLabel,
  cityName,
  loading,
  onCancel,
  onConfirm,
}: {
  sectionLabel: string;
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
            Delete Section?
          </h2>
          <p className="text-slate-500 text-sm mb-1">
            You are about to delete content for:
          </p>
          <p className="font-semibold text-slate-900 mb-1">{sectionLabel}</p>
          <p className="text-xs text-slate-400 font-mono mb-4">{cityName}</p>
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
