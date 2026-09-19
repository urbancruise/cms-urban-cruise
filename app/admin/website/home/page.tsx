"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineSave,
  MdOutlineRefresh,
  MdOutlinePublic,
  MdOutlineDelete,
  MdOutlineAdd,
  MdOutlineRemove,
  MdOutlineVisibility,
  MdOutlineEdit,
  MdOutlineWarning,
} from "react-icons/md";
import { TableSkeleton } from "@/app/components/UI/PageSkeletons";
import RichEditor from "@/app/components/UI/RichEditor";
import ImageUpload from "@/app/components/UI/ImageUpload";
import ImageList from "@/app/components/UI/ImageList";

// ============================================================
// Section definitions
// ============================================================
const HOME_SECTIONS = [
  { key: "hero", label: "Hero" },
  { key: "about", label: "About" },
  { key: "howitworks", label: "How It Works" },
  { key: "vehiclebudget", label: "Vehicle For Every Budget" },
  { key: "groupsize", label: "Vehicle For Every Group Size" },
  { key: "occasion", label: "Vehicle For Every Occasion" },
  { key: "whychoose", label: "Why Choose Urban Cruise" },
  { key: "testimonials", label: "Testimonials" },
  { key: "faq", label: "FAQs" },
  { key: "servicelocations", label: "Vehicle Rental Service In India" },
  { key: "partners", label: "Our Trusted Partners" },
  { key: "downloadapp", label: "Download App" },
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
// Shared classes
// ============================================================
const inputCls =
  "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500";

// ============================================================
// PAGE
// ============================================================
export default function WebsiteHomePage() {
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
  const cities = citiesData?.cities || [];

  useEffect(() => {
    if (!selectedCityId && cities.length > 0) {
      setSelectedCityId(cities[0].id);
    }
  }, [cities, selectedCityId]);

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
  // RENDER
  // ============================================================
  return (
    <div className="p-8">
      {/* HEADER */}
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

      {/* Sections grid */}
      {isLoading ? (
        <TableSkeleton rows={5} columns={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {HOME_SECTIONS.map((s) => {
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
                  <h3 className="font-semibold text-slate-900">{s.label}</h3>
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

                <p className="text-xs text-slate-400 font-mono mb-1">{s.key}</p>

                {lastUpdated && (
                  <p className="text-[10px] text-slate-400 mb-3">
                    Updated {lastUpdated}
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 mt-auto pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setPreviewSection(s.key)}
                    disabled={!hasContent}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title={
                      hasContent ? "Preview content" : "No content to preview"
                    }
                  >
                    <MdOutlineVisibility className="w-3.5 h-3.5" />
                    Preview
                  </button>

                  <button
                    onClick={() => setSelectedSection(s.key)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 hover:border-teal-300 transition-colors"
                    title={hasContent ? "Edit section" : "Create section"}
                  >
                    <MdOutlineEdit className="w-3.5 h-3.5" />
                    {hasContent ? "Edit" : "Create"}
                  </button>

                  <button
                    onClick={() => setDeleteSection(s.key)}
                    disabled={!hasContent}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title={hasContent ? "Delete section" : "Nothing to delete"}
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
      {selectedSection && selectedCityId && (
        <SectionEditor
          cityId={selectedCityId}
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
      {previewSection && selectedCityId && (
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

      {/* Delete Confirmation Modal */}
      {deleteSection && (
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
  cityId,
  cityName,
  sectionKey,
  sectionLabel,
  initial,
  initialStatus,
  onSave,
  onDelete,
  onClose,
}: {
  cityId: number;
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
        {/* HEADER */}
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
            <FormEditor
              sectionKey={sectionKey}
              value={content}
              onChange={setContent}
            />
          )}
        </div>

        {/* FOOTER */}
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
        {/* HEADER */}
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
            <VisualPreview content={content} />
          ) : (
            <pre className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-4 overflow-auto max-h-[60vh] font-mono">
              {JSON.stringify(content, null, 2)}
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
            Edit Section
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VISUAL PREVIEW RENDERER
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
// DELETE CONFIRMATION MODAL
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

// ============================================================
// FORM EDITOR — renders per-section form
// ============================================================
function FormEditor({
  sectionKey,
  value,
  onChange,
}: {
  sectionKey: string;
  value: any;
  onChange: (v: any) => void;
}) {
  const set = (key: string, val: any) => onChange({ ...value, [key]: val });

  // ============================================================
  // HERO
  // ============================================================
  if (sectionKey === "hero") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="Urban Cruise bus & car rental"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Title">
            <input
              type="text"
              value={value.title || ""}
              onChange={(e) => set("title", e.target.value)}
              className={inputCls}
              placeholder="No. 1 Vehicle Rental Service"
            />
          </Field>

          <Field label="Title Highlight">
            <input
              type="text"
              value={value.titleHighlight || ""}
              onChange={(e) => set("titleHighlight", e.target.value)}
              className={inputCls}
              placeholder="Provider Company in Delhi"
            />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            rows={3}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="Short intro shown under the hero title"
          />
        </Field>

        <Field label="Background Image">
          <ImageUpload
            value={value.backgroundImage || null}
            publicId={value.backgroundImagePublicId || null}
            onChange={(url, publicId) =>
              onChange({
                ...value,
                backgroundImage: url || "",
                backgroundImagePublicId: publicId || "",
              })
            }
            scope="hero"
            aspect="21 / 9"
            hint="Wide banner · JPG, PNG, WEBP · Max 300 KB · Recommended 1920×820"
          />
        </Field>

        <Field label="Vehicles Image">
          <ImageUpload
            value={value.vehiclesImage || null}
            publicId={value.vehiclesImagePublicId || null}
            onChange={(url, publicId) =>
              onChange({
                ...value,
                vehiclesImage: url || "",
                vehiclesImagePublicId: publicId || "",
              })
            }
            scope="hero"
            aspect="16 / 9"
            hint="Transparent PNG recommended · Max 300 KB"
          />
        </Field>
      </div>
    );
  }

  // ============================================================
  // ABOUT
  // ============================================================
  if (sectionKey === "about") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="About Urban Cruise"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Small text shown above the section title
          </p>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Title">
            <input
              type="text"
              value={value.title || ""}
              onChange={(e) => set("title", e.target.value)}
              className={inputCls}
              placeholder="URBAN CRUISE"
            />
          </Field>

          <Field label="Tagline">
            <input
              type="text"
              value={value.tagline || ""}
              onChange={(e) => set("tagline", e.target.value)}
              className={inputCls}
              placeholder="Your Journey, Our Passion"
            />
          </Field>
        </div>

        <Field label="Video URL (YouTube embed)">
          <input
            type="text"
            value={value.videoUrl || ""}
            onChange={(e) => set("videoUrl", e.target.value)}
            className={inputCls}
            placeholder="https://www.youtube.com/embed/..."
          />
        </Field>

        <RichList
          label="Paragraphs"
          items={value.paragraphs || []}
          onChange={(items) => set("paragraphs", items)}
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
      </div>
    );
  }

  // ============================================================
  // HOW IT WORKS
  // ============================================================
  if (sectionKey === "howitworks") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="Simple Process"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Small text shown above the section title
          </p>
        </Field>

        <Field label="Title">
          <input
            type="text"
            value={value.title || ""}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="HOW IT WORKS"
          />
        </Field>

        <Field label="Subtitle">
          <input
            type="text"
            value={value.subtitle || ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className={inputCls}
            placeholder="Simple Steps, Smooth Journey"
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={3}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="Brief intro describing how the process works..."
          />
        </Field>

        <RichList
          label="Steps"
          items={value.steps || []}
          onChange={(items) => set("steps", items)}
          emptyItem={{
            number: "",
            title: "",
            description: "",
            image: "",
            imagePublicId: "",
          }}
          renderItem={(item, update) => (
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Number">
                  <input
                    type="text"
                    value={item.number || ""}
                    onChange={(e) =>
                      update({ ...item, number: e.target.value })
                    }
                    className={inputCls}
                    placeholder="01"
                  />
                </Field>
                <Field label="Title">
                  <input
                    type="text"
                    value={item.title || ""}
                    onChange={(e) =>
                      update({ ...item, title: e.target.value })
                    }
                    className={inputCls}
                    placeholder="ENQUIRY"
                  />
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  rows={2}
                  value={item.description || ""}
                  onChange={(e) =>
                    update({ ...item, description: e.target.value })
                  }
                  className={inputCls}
                  placeholder="Share your travel plan with us..."
                />
              </Field>

              <Field label="Step Image">
                <ImageUpload
                  value={item.image || null}
                  publicId={item.imagePublicId || null}
                  onChange={(url, publicId) =>
                    update({
                      ...item,
                      image: url || "",
                      imagePublicId: publicId || "",
                    })
                  }
                  scope="general"
                  aspect="4 / 3"
                  hint="JPG, PNG, WEBP · Max 300 KB · Recommended 800×600"
                />
              </Field>
            </div>
          )}
        />
      </div>
    );
  }

  // ============================================================
  // VEHICLE FOR EVERY BUDGET
  // ============================================================
  if (sectionKey === "vehiclebudget") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="Vehicle Options"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Small text shown above the section title
          </p>
        </Field>

        <Field label="Title">
          <input
            type="text"
            value={value.title || ""}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="A VEHICLE FOR EVERY BUDGET"
          />
        </Field>

        <Field label="Subtitle">
          <input
            type="text"
            value={value.subtitle || ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className={inputCls}
            placeholder="Vehicles For Every Journey, Every Budget"
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={3}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="Short paragraph shown below the section subtitle..."
          />
        </Field>

        <RichList
          label="Categories"
          items={value.items || []}
          onChange={(items) => set("items", items)}
          emptyItem={{
            title: "",
            description: "",
            image: "",
            imagePublicId: "",
          }}
          renderItem={(item, update) => (
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <Field label="Title">
                <input
                  type="text"
                  value={item.title || ""}
                  onChange={(e) =>
                    update({ ...item, title: e.target.value })
                  }
                  className={inputCls}
                  placeholder="ECONOMY"
                />
              </Field>

              <Field label="Description">
                <textarea
                  rows={2}
                  value={item.description || ""}
                  onChange={(e) =>
                    update({ ...item, description: e.target.value })
                  }
                  className={inputCls}
                  placeholder="Vehicles with basic amenities for budget travellers"
                />
              </Field>

              <Field label="Category Image">
                <ImageUpload
                  value={item.image || null}
                  publicId={item.imagePublicId || null}
                  onChange={(url, publicId) =>
                    update({
                      ...item,
                      image: url || "",
                      imagePublicId: publicId || "",
                    })
                  }
                  scope="general"
                  aspect="4 / 3"
                  hint="JPG, PNG, WEBP · Max 300 KB · Recommended 800×600"
                />
              </Field>
            </div>
          )}
        />
      </div>
    );
  }

  // ============================================================
  // VEHICLE FOR EVERY GROUP SIZE
  // ============================================================
  if (sectionKey === "groupsize") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="Fleet Options"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Small text shown above the section title
          </p>
        </Field>

        <Field label="Title">
          <input
            type="text"
            value={value.title || ""}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="VEHICLES FOR EVERY GROUP SIZE"
          />
        </Field>

        <Field label="Subtitle">
          <input
            type="text"
            value={value.subtitle || ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className={inputCls}
            placeholder="The Right Vehicle For Every Group Size"
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={3}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="Intro copy for the section"
          />
        </Field>

        <RichList
          label="Vehicles"
          items={value.vehicles || []}
          onChange={(items) => set("vehicles", items)}
          emptyItem={{
            name: "",
            tagline: "",
            seats: "",
            price: "",
            description: "",
            images: [],
          }}
          renderItem={(item, update) => (
            <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Name">
                  <input
                    type="text"
                    value={item.name || ""}
                    onChange={(e) =>
                      update({ ...item, name: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Maruti Suzuki Dzire"
                  />
                </Field>
                <Field label="Tagline">
                  <input
                    type="text"
                    value={item.tagline || ""}
                    onChange={(e) =>
                      update({ ...item, tagline: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Perfect Sedan for City & Outstation"
                  />
                </Field>
                <Field label="Seats">
                  <input
                    type="text"
                    value={item.seats || ""}
                    onChange={(e) =>
                      update({ ...item, seats: e.target.value })
                    }
                    className={inputCls}
                    placeholder="4 Seater"
                  />
                </Field>
                <Field label="Price (₹/day)">
                  <input
                    type="text"
                    value={item.price || ""}
                    onChange={(e) =>
                      update({ ...item, price: e.target.value })
                    }
                    className={inputCls}
                    placeholder="1999"
                  />
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  rows={3}
                  value={item.description || ""}
                  onChange={(e) =>
                    update({ ...item, description: e.target.value })
                  }
                  className={inputCls}
                  placeholder="Detailed description of this vehicle..."
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Full description shown on the vehicle detail page
                </p>
              </Field>

              <Field label="Vehicle Images">
                <ImageList
                  items={item.images || []}
                  onChange={(images) => update({ ...item, images })}
                  scope="vehicle"
                  aspect="4 / 3"
                  maxImages={8}
                />
                <p className="text-[11px] text-slate-400 mt-2">
                  Add multiple images (max 8) · JPG, PNG, WEBP · Max 300 KB each
                </p>
              </Field>
            </div>
          )}
        />
      </div>
    );
  }

  // ============================================================
  // VEHICLE FOR EVERY OCCASION
  // ============================================================
  if (sectionKey === "occasion") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="TEMPO TRAVELLER FOR EVERY OCCASION"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Small label shown above the title (usually uppercase)
          </p>
        </Field>

        <Field label="Title">
          <input
            type="text"
            value={value.title || ""}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="FOR EVERY OCCASION"
          />
        </Field>

        <Field label="Subtitle">
          <input
            type="text"
            value={value.subtitle || ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className={inputCls}
            placeholder="The Right Tempo Traveller For Every Occasion"
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={4}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="Hire Tempo Traveller rent in Delhi for every occasion—weddings, pilgrimages, trips, corporate events, tours..."
          />
        </Field>

        <RichList
          label="Tabs (Occasions)"
          items={value.tabs || []}
          onChange={(items) => set("tabs", items)}
          emptyItem={{ label: "", slug: "", cards: [] }}
          renderItem={(tab, updateTab) => (
            <div className="space-y-4 p-4 rounded-xl border-2 border-teal-200 bg-teal-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Tab Label">
                  <input
                    type="text"
                    value={tab.label || ""}
                    onChange={(e) =>
                      updateTab({ ...tab, label: e.target.value })
                    }
                    className={inputCls}
                    placeholder="WEDDING TRAVEL"
                  />
                </Field>
                <Field label="Tab Slug (optional)">
                  <input
                    type="text"
                    value={tab.slug || ""}
                    onChange={(e) =>
                      updateTab({ ...tab, slug: e.target.value })
                    }
                    className={inputCls}
                    placeholder="wedding-travel"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Auto-generated from label if left blank
                  </p>
                </Field>
              </div>

              <div className="border-t border-teal-200 pt-4">
                <RichList
                  label="Cards"
                  items={tab.cards || []}
                  onChange={(cards) => updateTab({ ...tab, cards })}
                  emptyItem={{
                    image: "",
                    imagePublicId: "",
                    title: "",
                    seats: "",
                    price: "",
                    location: "",
                    description: "",
                    features: [],
                  }}
                  renderItem={(card, updateCard) => (
                    <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-white">
                      <Field label="Card Image">
                        <ImageUpload
                          value={card.image || null}
                          publicId={card.imagePublicId || null}
                          onChange={(url, publicId) =>
                            updateCard({
                              ...card,
                              image: url || "",
                              imagePublicId: publicId || "",
                            })
                          }
                          scope="vehicle"
                          aspect="4 / 3"
                          hint="JPG, PNG, WEBP · Max 300 KB · Recommended 800×600"
                        />
                      </Field>

                      <Field label="Card Title">
                        <input
                          type="text"
                          value={card.title || ""}
                          onChange={(e) =>
                            updateCard({ ...card, title: e.target.value })
                          }
                          className={inputCls}
                          placeholder="Tempo Traveller For Wedding"
                        />
                      </Field>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Field label="Seats Chip">
                          <input
                            type="text"
                            value={card.seats || ""}
                            onChange={(e) =>
                              updateCard({ ...card, seats: e.target.value })
                            }
                            className={inputCls}
                            placeholder="17 to 26 Seater"
                          />
                        </Field>
                        <Field label="Price Chip">
                          <input
                            type="text"
                            value={card.price || ""}
                            onChange={(e) =>
                              updateCard({ ...card, price: e.target.value })
                            }
                            className={inputCls}
                            placeholder="Starts from ₹21/km"
                          />
                        </Field>
                        <Field label="Location Chip">
                          <input
                            type="text"
                            value={card.location || ""}
                            onChange={(e) =>
                              updateCard({
                                ...card,
                                location: e.target.value,
                              })
                            }
                            className={inputCls}
                            placeholder="Delhi NCR"
                          />
                        </Field>
                      </div>

                      <Field label="Description">
                        <textarea
                          rows={4}
                          value={card.description || ""}
                          onChange={(e) =>
                            updateCard({
                              ...card,
                              description: e.target.value,
                            })
                          }
                          className={inputCls}
                          placeholder="A Tempo Traveller for weddings in Delhi, such as our Standard and Premium variants..."
                        />
                      </Field>

                      <Field label="Key Features">
                        <StringList
                          items={card.features || []}
                          onChange={(features) =>
                            updateCard({ ...card, features })
                          }
                          placeholder="AC"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                          Short feature tags shown as chips (e.g. AC, Music
                          System, Luggage Space)
                        </p>
                      </Field>
                    </div>
                  )}
                />
              </div>
            </div>
          )}
        />
      </div>
    );
  }

  // ============================================================
  // WHY CHOOSE URBAN CRUISE
  // ============================================================
  if (sectionKey === "whychoose") {
    return (
      <div className="space-y-5">
        {/* Eyebrow */}
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="WHY CHOOSE URBAN CRUISE"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Small label shown above the title (usually uppercase)
          </p>
        </Field>

        <Field label="Title">
          <input
            type="text"
            value={value.title || ""}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="WHY CHOOSE URBAN CRUISE"
          />
        </Field>

        <Field label="Subtitle">
          <input
            type="text"
            value={value.subtitle || ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className={inputCls}
            placeholder="Reliable, Comfortable & Hassle-Free Travel"
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={3}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="Choose Urban Cruise for reliable vehicle rentals in Delhi NCR..."
          />
        </Field>

        <RichList
          label="Benefit Cards"
          items={value.benefits || []}
          onChange={(items) => set("benefits", items)}
          emptyItem={{
            number: "",
            title: "",
            color: "green",
            items: [],
            image: "",
            imagePublicId: "",
          }}
          renderItem={(item, update) => (
            <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              {/* Row 1: Number + Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Number">
                  <input
                    type="text"
                    value={item.number || ""}
                    onChange={(e) =>
                      update({ ...item, number: e.target.value })
                    }
                    className={inputCls}
                    placeholder="01"
                  />
                </Field>

                <Field label="Badge Color">
                  <select
                    value={item.color || "green"}
                    onChange={(e) =>
                      update({ ...item, color: e.target.value })
                    }
                    className={inputCls}
                  >
                    <option value="green">Green</option>
                    <option value="orange">Orange</option>
                    <option value="teal">Teal</option>
                    <option value="blue">Blue</option>
                  </select>
                </Field>
              </div>

              {/* Title — single field now */}
              <Field label="Title">
                <input
                  type="text"
                  value={item.title || ""}
                  onChange={(e) =>
                    update({ ...item, title: e.target.value })
                  }
                  className={inputCls}
                  placeholder="WIDEST RANGE OF VEHICLES"
                />
              </Field>

              {/* Checklist items */}
              <Field label="Checklist Items">
                <StringList
                  items={item.items || []}
                  onChange={(items) => update({ ...item, items })}
                  placeholder="5 seater to 56 seater luxury & Royal VIP Class Vehicles"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Each line becomes a ✓ bullet point in the card
                </p>
              </Field>

              {/* Card Image */}
              <Field label="Card Illustration">
                <ImageUpload
                  value={item.image || null}
                  publicId={item.imagePublicId || null}
                  onChange={(url, publicId) =>
                    update({
                      ...item,
                      image: url || "",
                      imagePublicId: publicId || "",
                    })
                  }
                  scope="general"
                  aspect="1 / 1"
                  hint="Transparent PNG recommended · Max 300 KB"
                />
              </Field>
            </div>
          )}
        />
      </div>
    );
  }

  // ============================================================
  // TESTIMONIALS
  // ============================================================
  if (sectionKey === "testimonials") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="WHAT OUR CUSTOMERS SAY"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Small label shown above the title (usually uppercase)
          </p>
        </Field>

        <Field label="Title">
          <input
            type="text"
            value={value.title || ""}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="REAL PEOPLE. REAL EXPERIENCES."
          />
        </Field>

        <Field label="Subtitle">
          <input
            type="text"
            value={value.subtitle || ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className={inputCls}
            placeholder="Hear from our happy customers"
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={3}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="We take pride in delivering comfortable rides, on-time service and memorable journeys for every customer."
          />
        </Field>

        <RichList
          label="Testimonials"
          items={value.items || []}
          onChange={(items) => set("items", items)}
          emptyItem={{
            name: "",
            location: "",
            message: "",
            rating: 5,
            avatar: "",
            avatarPublicId: "",
            featured: false,
            youtubeUrl: "",
          }}
          renderItem={(item, update) => (
            <div
              className={`space-y-4 p-4 rounded-xl border ${
                item.featured
                  ? "border-teal-300 bg-teal-50/40"
                  : "border-slate-200 bg-slate-50/50"
              }`}
            >
              {/* Featured toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={Boolean(item.featured)}
                  onChange={(e) =>
                    update({ ...item, featured: e.target.checked })
                  }
                  className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Featured / Highlighted Card
                </span>
                <span className="text-[11px] text-slate-400">
                  (larger card with quote icon)
                </span>
              </label>

              {/* Name + Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Name">
                  <input
                    type="text"
                    value={item.name || ""}
                    onChange={(e) =>
                      update({ ...item, name: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Priya Mehta"
                  />
                </Field>
                <Field label="Location">
                  <input
                    type="text"
                    value={item.location || ""}
                    onChange={(e) =>
                      update({ ...item, location: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Gurugram"
                  />
                </Field>
              </div>

              {/* Rating + Message */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Rating (1-5)">
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={item.rating ?? 5}
                    onChange={(e) =>
                      update({
                        ...item,
                        rating: Number(e.target.value),
                      })
                    }
                    className={inputCls}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Message">
                    <textarea
                      rows={4}
                      value={item.message || ""}
                      onChange={(e) =>
                        update({ ...item, message: e.target.value })
                      }
                      className={inputCls}
                      placeholder="Booked an SUV for a family trip. The comfort and space were excellent..."
                    />
                  </Field>
                </div>
              </div>

              {/* Avatar */}
              <Field label="Avatar">
                <ImageUpload
                  value={item.avatar || null}
                  publicId={item.avatarPublicId || null}
                  onChange={(url, publicId) =>
                    update({
                      ...item,
                      avatar: url || "",
                      avatarPublicId: publicId || "",
                    })
                  }
                  scope="general"
                  aspect="1 / 1"
                  variant="compact"
                  hint="Square image · JPG, PNG, WEBP · Max 300 KB"
                />
              </Field>

              {/* ✅ YouTube URL — now available on EVERY testimonial */}
              <Field label="YouTube Video URL">
                <input
                  type="text"
                  value={item.youtubeUrl || ""}
                  onChange={(e) =>
                    update({ ...item, youtubeUrl: e.target.value })
                  }
                  className={inputCls}
                  placeholder="https://www.youtube.com/watch?v=xxxxxxxxxxx"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Optional. Paste a YouTube link — video plays behind the
                  testimonial card. Accepts:
                  <br />
                  • <code>youtube.com/watch?v=ID</code>
                  <br />
                  • <code>youtu.be/ID</code>
                  <br />
                  • <code>youtube.com/embed/ID</code>
                </p>

                {/* Live preview of the parsed ID */}
                {item.youtubeUrl && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    {extractYouTubeId(item.youtubeUrl) ? (
                      <>
                        <p className="text-[11px] text-slate-500 mb-2">
                          ✅ Video ID:{" "}
                          <span className="font-mono text-slate-700">
                            {extractYouTubeId(item.youtubeUrl)}
                          </span>
                        </p>
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-200">
                          <iframe
                            src={`https://www.youtube.com/embed/${extractYouTubeId(
                              item.youtubeUrl
                            )}`}
                            title="YouTube preview"
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </>
                    ) : (
                      <p className="text-[11px] text-red-600">
                        ⚠️ Could not detect a valid YouTube video ID. Please
                        check the URL.
                      </p>
                    )}
                  </div>
                )}
              </Field>
            </div>
          )}
        />
      </div>
    );
  }

  // ============================================================
  // FAQS
  // ============================================================
  if (sectionKey === "faq") {
    return (
      <div className="space-y-5">
        {/* ---------------- LEFT SIDE ---------------- */}
        <SectionHeader
          title="Left Panel"
          hint="Info block shown on the left side"
        />

        {/* Eyebrow + Badge icon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Eyebrow Badge Text">
            <input
              type="text"
              value={value.eyebrow || ""}
              onChange={(e) => set("eyebrow", e.target.value)}
              className={inputCls}
              placeholder="HELP & SUPPORT"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Small badge at the top (uppercase)
            </p>
          </Field>

          <Field label="Badge Icon">
            <select
              value={value.badgeIcon || "help"}
              onChange={(e) => set("badgeIcon", e.target.value)}
              className={inputCls}
            >
              <option value="help">❓ Help</option>
              <option value="headset">🎧 Headset</option>
              <option value="shield">🛡 Shield</option>
              <option value="star">⭐ Star</option>
              <option value="info">ℹ️ Info</option>
            </select>
          </Field>
        </div>

        {/* Title / Highlight / Accent */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Title">
            <input
              type="text"
              value={value.title || ""}
              onChange={(e) => set("title", e.target.value)}
              className={inputCls}
              placeholder="FAQs"
            />
          </Field>

          <Field label="Title Highlight (green)">
            <input
              type="text"
              value={value.titleHighlight || ""}
              onChange={(e) => set("titleHighlight", e.target.value)}
              className={inputCls}
              placeholder="Frequently Asked"
            />
          </Field>

          <Field label="Title Accent (orange)">
            <input
              type="text"
              value={value.titleAccent || ""}
              onChange={(e) => set("titleAccent", e.target.value)}
              className={inputCls}
              placeholder="Question"
            />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            rows={3}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="Everything you need to know before you book your ride."
          />
        </Field>

        {/* Decorative image */}
        <Field label="Decorative Image (bus illustration)">
          <ImageUpload
            value={value.illustration || null}
            publicId={value.illustrationPublicId || null}
            onChange={(url, publicId) =>
              onChange({
                ...value,
                illustration: url || "",
                illustrationPublicId: publicId || "",
              })
            }
            scope="general"
            aspect="16 / 9"
            hint="Transparent PNG recommended · Max 300 KB"
          />
        </Field>

        {/* Feature icons row */}
        <Field label="Feature Icons">
          <StringList
            items={value.icons || []}
            onChange={(icons) => set("icons", icons)}
            placeholder="shield"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Small round icons around the illustration. Use names like:
            <code> shield</code>, <code>calendar</code>, <code>headset</code>,{" "}
            <code>rupee</code>
          </p>
        </Field>

        {/* Support box */}
        <SectionHeader
          title="Support Box"
          hint="'Still have questions?' callout"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Support Title">
            <input
              type="text"
              value={value.supportTitle || ""}
              onChange={(e) => set("supportTitle", e.target.value)}
              className={inputCls}
              placeholder="Still have questions?"
            />
          </Field>

          <Field label="Support Subtitle">
            <input
              type="text"
              value={value.supportSubtitle || ""}
              onChange={(e) => set("supportSubtitle", e.target.value)}
              className={inputCls}
              placeholder="Our support team is here to help you!"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Support CTA Label">
            <input
              type="text"
              value={value.supportCtaLabel || ""}
              onChange={(e) => set("supportCtaLabel", e.target.value)}
              className={inputCls}
              placeholder="Contact Us"
            />
          </Field>

          <Field label="Support CTA Link">
            <input
              type="text"
              value={value.supportCtaLink || ""}
              onChange={(e) => set("supportCtaLink", e.target.value)}
              className={inputCls}
              placeholder="/contact or https://..."
            />
          </Field>
        </div>

        {/* ---------------- RIGHT SIDE ---------------- */}
        <SectionHeader
          title="FAQ Items"
          hint="Accordion on the right side"
        />

        <RichList
          label="Questions"
          items={value.items || []}
          onChange={(items) => set("items", items)}
          emptyItem={{
            number: "",
            question: "",
            answer: "",
          }}
          renderItem={(item, update) => (
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Number">
                  <input
                    type="text"
                    value={item.number || ""}
                    onChange={(e) =>
                      update({ ...item, number: e.target.value })
                    }
                    className={inputCls}
                    placeholder="01"
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Question">
                    <input
                      type="text"
                      value={item.question || ""}
                      onChange={(e) =>
                        update({ ...item, question: e.target.value })
                      }
                      className={inputCls}
                      placeholder="What documents do I need to book a car?"
                    />
                  </Field>
                </div>
              </div>

              <Field label="Answer (rich text)">
                <RichEditor
                  value={normalizeToEditorDoc(item.answer || "")}
                  onChange={(data) =>
                    update({
                      ...item,
                      answer: editorDocToPlain(data),
                    })
                  }
                  placeholder="You need a valid driving license, ID proof (Aadhaar/PAN/Passport)..."
                  minHeight={120}
                />
              </Field>
            </div>
          )}
        />
      </div>
    );
  }

  // ============================================================
  // SERVICE LOCATIONS
  // ============================================================
  if (sectionKey === "servicelocations") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="Pan-India Presence"
          />
        </Field>

        <Field label="Title">
          <input
            type="text"
            value={value.title || ""}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="INDIA COVERAGE"
          />
        </Field>

        <Field label="Subtitle">
          <input
            type="text"
            value={value.subtitle || ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className={inputCls}
            placeholder="Explore our presence across India"
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={3}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="Intro copy"
          />
        </Field>

        <RichList
          label="Cities"
          items={value.cities || []}
          onChange={(items) => set("cities", items)}
          emptyItem={{ name: "", state: "", image: "", imagePublicId: "" }}
          renderItem={(item, update) => (
            <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="City Name">
                  <input
                    type="text"
                    value={item.name || ""}
                    onChange={(e) =>
                      update({ ...item, name: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Delhi"
                  />
                </Field>
                <Field label="State">
                  <input
                    type="text"
                    value={item.state || ""}
                    onChange={(e) =>
                      update({ ...item, state: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Delhi NCR"
                  />
                </Field>
              </div>

              <Field label="City Image">
                <ImageUpload
                  value={item.image || null}
                  publicId={item.imagePublicId || null}
                  onChange={(url, publicId) =>
                    update({
                      ...item,
                      image: url || "",
                      imagePublicId: publicId || "",
                    })
                  }
                  scope="general"
                  aspect="4 / 3"
                  hint="JPG, PNG, WEBP · Max 300 KB"
                />
              </Field>
            </div>
          )}
        />
      </div>
    );
  }

  // ============================================================
  // PARTNERS
  // ============================================================
  if (sectionKey === "partners") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="Trusted By"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Small label shown above the title (usually uppercase)
          </p>
        </Field>

        <Field label="Title">
          <input
            type="text"
            value={value.title || ""}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="Trusted by 100+ Companies"
          />
        </Field>

        <Field label="Subtitle">
          <input
            type="text"
            value={value.subtitle || ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className={inputCls}
            placeholder="India's most trusted travel partner"
          />
        </Field>

        {/* ✅ NEW: Description */}
        <Field label="Description">
          <textarea
            rows={3}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="We are proud to partner with leading brands and companies across India..."
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Short paragraph shown below the subtitle
          </p>
        </Field>

        <RichList
          label="Partner logos"
          items={value.logos || []}
          onChange={(items) => set("logos", items)}
          emptyItem={{ name: "", logo: "", logoPublicId: "" }}
          renderItem={(item, update) => (
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <Field label="Partner Name">
                <input
                  type="text"
                  value={item.name || ""}
                  onChange={(e) =>
                    update({ ...item, name: e.target.value })
                  }
                  className={inputCls}
                  placeholder="TATA"
                />
              </Field>

              <Field label="Logo">
                <ImageUpload
                  value={item.logo || null}
                  publicId={item.logoPublicId || null}
                  onChange={(url, publicId) =>
                    update({
                      ...item,
                      logo: url || "",
                      logoPublicId: publicId || "",
                    })
                  }
                  scope="partner"
                  aspect="3 / 2"
                  variant="compact"
                  hint="JPG, PNG, WEBP · Max 300 KB"
                />
              </Field>
            </div>
          )}
        />
      </div>
    );
  }

  // ============================================================
  // DOWNLOAD APP
  // ============================================================
  if (sectionKey === "downloadapp") {
    return (
      <div className="space-y-5">
        {/* ---------- HEADER TEXT ---------- */}
        <SectionHeader title="Header" hint="Section heading and copy" />

        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="DOWNLOAD OUR APP"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Small label shown above the title (uppercase)
          </p>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Title">
            <input
              type="text"
              value={value.title || ""}
              onChange={(e) => set("title", e.target.value)}
              className={inputCls}
              placeholder="Your Journey,"
            />
          </Field>

          <Field label="Title Highlight (green)">
            <input
              type="text"
              value={value.titleHighlight || ""}
              onChange={(e) => set("titleHighlight", e.target.value)}
              className={inputCls}
              placeholder="Simplified."
            />
          </Field>
        </div>

        <Field label="Accent (italic green line)">
          <input
            type="text"
            value={value.accent || ""}
            onChange={(e) => set("accent", e.target.value)}
            className={inputCls}
            placeholder="In Your Pocket."
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Smaller italic line under the main title
          </p>
        </Field>

        <Field label="Description">
          <textarea
            rows={3}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="Book rides, track in real-time, manage trips and more – all from the Urban Cruise app. Experience seamless travel management at your fingertips."
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Plain text. Use the inline <strong>Urban Cruise</strong> bolding on
            the frontend if needed.
          </p>
        </Field>

        {/* ---------- FEATURE CARDS ---------- */}
        <SectionHeader
          title="Feature Cards"
          hint="4 icon cards with title + subtitle"
        />

        <RichList
          label="Features"
          items={value.features || []}
          onChange={(items) => set("features", items)}
          emptyItem={{
            icon: "",
            title: "",
            subtitle: "",
          }}
          renderItem={(item, update) => (
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Icon (emoji or name)">
                  <input
                    type="text"
                    value={item.icon || ""}
                    onChange={(e) =>
                      update({ ...item, icon: e.target.value })
                    }
                    className={inputCls}
                    placeholder="📅 or calendar"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Emoji works best (📅 📍 📄 🛡)
                  </p>
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Title">
                    <input
                      type="text"
                      value={item.title || ""}
                      onChange={(e) =>
                        update({ ...item, title: e.target.value })
                      }
                      className={inputCls}
                      placeholder="Easy Booking"
                    />
                  </Field>
                </div>
              </div>

              <Field label="Subtitle">
                <input
                  type="text"
                  value={item.subtitle || ""}
                  onChange={(e) =>
                    update({ ...item, subtitle: e.target.value })
                  }
                  className={inputCls}
                  placeholder="Book in just a few taps"
                />
              </Field>
            </div>
          )}
        />

        {/* ---------- APP DOWNLOAD BOX ---------- */}
        <SectionHeader
          title="App Download Box"
          hint="Logo, store buttons, and QR code"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Box Title">
            <input
              type="text"
              value={value.boxTitle || ""}
              onChange={(e) => set("boxTitle", e.target.value)}
              className={inputCls}
              placeholder="Download the App"
            />
          </Field>

          <Field label="Box Subtitle">
            <input
              type="text"
              value={value.boxSubtitle || ""}
              onChange={(e) => set("boxSubtitle", e.target.value)}
              className={inputCls}
              placeholder="Available on Android and iOS"
            />
          </Field>
        </div>

        <Field label="App Logo (square, e.g. 'UC' badge)">
          <ImageUpload
            value={value.appLogo || null}
            publicId={value.appLogoPublicId || null}
            onChange={(url, publicId) =>
              onChange({
                ...value,
                appLogo: url || "",
                appLogoPublicId: publicId || "",
              })
            }
            scope="general"
            aspect="1 / 1"
            variant="compact"
            hint="Square PNG · Max 300 KB"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Google Play Button Image">
            <ImageUpload
              value={value.googlePlayImage || null}
              publicId={value.googlePlayImagePublicId || null}
              onChange={(url, publicId) =>
                onChange({
                  ...value,
                  googlePlayImage: url || "",
                  googlePlayImagePublicId: publicId || "",
                })
              }
              scope="general"
              aspect="3 / 1"
              variant="compact"
              hint="Official Google Play badge · Max 300 KB"
            />
          </Field>

          <Field label="Google Play URL">
            <input
              type="text"
              value={value.googlePlayUrl || value.androidUrl || ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  googlePlayUrl: e.target.value,
                  androidUrl: e.target.value,
                })
              }
              className={inputCls}
              placeholder="https://play.google.com/store/..."
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="App Store Button Image">
            <ImageUpload
              value={value.appStoreImage || null}
              publicId={value.appStoreImagePublicId || null}
              onChange={(url, publicId) =>
                onChange({
                  ...value,
                  appStoreImage: url || "",
                  appStoreImagePublicId: publicId || "",
                })
              }
              scope="general"
              aspect="3 / 1"
              variant="compact"
              hint="Official App Store badge · Max 300 KB"
            />
          </Field>

          <Field label="App Store URL">
            <input
              type="text"
              value={value.appStoreUrl || value.iosUrl || ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  appStoreUrl: e.target.value,
                  iosUrl: e.target.value,
                })
              }
              className={inputCls}
              placeholder="https://apps.apple.com/..."
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Scan Text">
            <input
              type="text"
              value={value.scanText || ""}
              onChange={(e) => set("scanText", e.target.value)}
              className={inputCls}
              placeholder="OR SCAN TO DOWNLOAD"
            />
          </Field>

          <Field label="QR Code Image">
            <ImageUpload
              value={value.qrCode || null}
              publicId={value.qrCodePublicId || null}
              onChange={(url, publicId) =>
                onChange({
                  ...value,
                  qrCode: url || "",
                  qrCodePublicId: publicId || "",
                })
              }
              scope="general"
              aspect="1 / 1"
              variant="compact"
              hint="Square QR code PNG · Max 300 KB"
            />
          </Field>
        </div>

        {/* ---------- STATS BOXES ---------- */}
        <SectionHeader
          title="Stats Boxes"
          hint="3 stat cards shown below the download box"
        />

        <RichList
          label="Stats"
          items={value.stats || []}
          onChange={(items) => set("stats", items)}
          emptyItem={{
            icon: "",
            value: "",
            label: "",
          }}
          renderItem={(item, update) => (
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Icon">
                  <input
                    type="text"
                    value={item.icon || ""}
                    onChange={(e) =>
                      update({ ...item, icon: e.target.value })
                    }
                    className={inputCls}
                    placeholder="⬇ or download"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Emoji (⬇ ⭐ 👥)
                  </p>
                </Field>

                <Field label="Value">
                  <input
                    type="text"
                    value={item.value || ""}
                    onChange={(e) =>
                      update({ ...item, value: e.target.value })
                    }
                    className={inputCls}
                    placeholder="10K+"
                  />
                </Field>

                <Field label="Label">
                  <input
                    type="text"
                    value={item.label || ""}
                    onChange={(e) =>
                      update({ ...item, label: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Downloads"
                  />
                </Field>
              </div>
            </div>
          )}
        />

        {/* ---------- PHONE MOCKUP ---------- */}
        <SectionHeader
          title="Phone Mockup"
          hint="Right-side phone preview image"
        />

        <Field label="Phone Screenshot / Mockup">
          <ImageUpload
            value={value.phoneMockup || value.appImage || null}
            publicId={
              value.phoneMockupPublicId || value.appImagePublicId || null
            }
            onChange={(url, publicId) =>
              onChange({
                ...value,
                phoneMockup: url || "",
                phoneMockupPublicId: publicId || "",
              })
            }
            scope="general"
            aspect="9 / 16"
            hint="Vertical phone screenshot · PNG · Max 300 KB"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Shown on the right side of the section (tall vertical image)
          </p>
        </Field>
      </div>
    );
  }

  // ============================================================
  // FALLBACK
  // ============================================================
  return (
    <div>
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
        No custom form for <code>{sectionKey}</code>. Switch to the JSON tab to
        edit raw content.
      </p>
      <pre className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-auto max-h-[400px]">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

// ============================================================
// REUSABLE SUB-COMPONENTS
// ============================================================

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

// ============================================================
// SECTION HEADER — small divider used inside form editors
// ============================================================
function SectionHeader({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline gap-3 pt-4 pb-2 border-b border-slate-200">
      <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
        {title}
      </h3>
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
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
        <span className="text-xs font-medium text-slate-700">{label}</span>
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

// ============================================================
// STRING LIST — simple array of strings
// ============================================================
function StringList({
  items,
  onChange,
  placeholder = "Add item",
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  const add = () => onChange([...items, ""]);

  const update = (index: number, value: string) => {
    const copy = [...items];
    copy[index] = value;
    onChange(copy);
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={item}
            onChange={(e) => update(i, e.target.value)}
            className={inputCls}
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors"
            title="Remove"
            aria-label="Remove"
          >
            <MdOutlineRemove className="w-4 h-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
      >
        <MdOutlineAdd className="w-3.5 h-3.5" />
        Add item
      </button>
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
        Raw JSON view of this section. Edit carefully — invalid JSON will
        prevent saving.
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

function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}
