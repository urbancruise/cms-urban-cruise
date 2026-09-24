"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineDataObject,
  MdOutlineAdd,
  MdOutlineDelete,
  MdOutlineEdit,
  MdOutlineClose,
  MdOutlineSave,
  MdOutlineRefresh,
  MdOutlineCheckCircle,
  MdOutlineWarning,
} from "react-icons/md";

interface Schema {
  id: number;
  city_id: number | null;
  page_path: string | null;
  schema_type: string;
  schema_json: any;
  is_active: boolean;
  updated_at: string;
}

const SCHEMA_TYPES = [
  "organization",
  "website",
  "faq",
  "breadcrumb",
  "local_business",
  "product",
  "article",
  "review",
];

const TYPE_ICONS: Record<string, string> = {
  organization: "🏢",
  website: "🌐",
  faq: "❓",
  breadcrumb: "🧭",
  local_business: "📍",
  product: "📦",
  article: "📄",
  review: "⭐",
};

export default function SeoSchemaPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Schema | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { data, isLoading, mutate } = useSWR<{ schemas: Schema[] }>(
    "/api/admin/seo/schema",
    fetcher
  );

  const schemas = data?.schemas || [];

  const grouped = useMemo(() => {
    const map: Record<string, Schema[]> = {};
    schemas.forEach((s) => {
      if (!map[s.schema_type]) map[s.schema_type] = [];
      map[s.schema_type].push(s);
    });
    return map;
  }, [schemas]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this schema?")) return;
    try {
      const res = await fetch(`/api/admin/seo/schema/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      await mutate();
      showToast("success", "Schema deleted");
    } catch (e: any) {
      showToast("error", e.message);
    }
  };

  return (
    <div className="p-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border min-w-[260px] ${toast.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          {toast.type === "success" ? <MdOutlineCheckCircle className="w-5 h-5" /> : <MdOutlineWarning className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <MdOutlineDataObject className="w-8 h-8 text-teal-600" />
            Schema / Structured Data
          </h1>
          <p className="text-slate-500 mt-1">Manage JSON-LD structured data for rich results</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => mutate()} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
            <MdOutlineRefresh className="w-5 h-5 text-slate-500" />
          </button>
          <button onClick={() => { setEditing(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm">
            <MdOutlineAdd className="w-4 h-4" /> Add Schema
          </button>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : schemas.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <MdOutlineDataObject className="w-12 h-12 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500 font-medium">No schemas defined</p>
          <p className="text-xs text-slate-400 mt-1">Add structured data to enable rich results in Google</p>
        </div>
      ) : (
        <div className="space-y-6">
          {SCHEMA_TYPES.map((type) => {
            const items = grouped[type] || [];
            if (items.length === 0) return null;
            return (
              <div key={type} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <span className="text-lg">{TYPE_ICONS[type]}</span>
                  <h2 className="font-semibold text-slate-900 capitalize">{type.replace("_", " ")}</h2>
                  <span className="text-xs text-slate-500 ml-auto">{items.length}</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {items.map((s) => (
                    <div key={s.id} className="p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono text-slate-700 truncate">{s.page_path || "(global)"}</p>
                        <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full mt-1 font-medium ${s.is_active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                          {s.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <button onClick={() => { setEditing(s); setIsModalOpen(true); }} className="p-1.5 hover:bg-teal-50 rounded-lg">
                        <MdOutlineEdit className="w-4 h-4 text-slate-400 hover:text-teal-600" />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                        <MdOutlineDelete className="w-4 h-4 text-slate-400 hover:text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <SchemaModal
          schema={editing}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => { setIsModalOpen(false); mutate(); showToast("success", "Schema saved"); }}
        />
      )}
    </div>
  );
}

function SchemaModal({ schema, onClose, onSaved }: { schema: Schema | null; onClose: () => void; onSaved: () => void; }) {
  const isEdit = Boolean(schema);
  const [form, setForm] = useState({
    schema_type: schema?.schema_type || "organization",
    page_path: schema?.page_path || "",
    is_active: schema?.is_active ?? true,
    json_text: schema?.schema_json ? JSON.stringify(schema.schema_json, null, 2) : getTemplate("organization"),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [jsonError, setJsonError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setJsonError("");

    let parsed: any;
    try {
      parsed = JSON.parse(form.json_text);
    } catch (err: any) {
      setJsonError("Invalid JSON: " + err.message);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        schema_type: form.schema_type,
        page_path: form.page_path || null,
        is_active: form.is_active,
        schema_json: parsed,
      };
      const url = isEdit ? `/api/admin/seo/schema/${schema!.id}` : "/api/admin/seo/schema";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">{isEdit ? "Edit Schema" : "Add Schema"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><MdOutlineClose className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={submit} className="flex-1 overflow-auto p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
          {jsonError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{jsonError}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Schema Type *</label>
              <select
                value={form.schema_type}
                onChange={(e) => {
                  const type = e.target.value;
                  setForm((p) => ({ ...p, schema_type: type, json_text: getTemplate(type) }));
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                {SCHEMA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Page Path (empty = global)</label>
              <input type="text" value={form.page_path} onChange={(e) => setForm((p) => ({ ...p, page_path: e.target.value }))} placeholder="/delhi" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">JSON-LD</label>
            <textarea
              value={form.json_text}
              onChange={(e) => setForm((p) => ({ ...p, json_text: e.target.value }))}
              rows={16}
              spellCheck={false}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 text-teal-600" />
            <span className="text-sm text-slate-700">Active</span>
          </label>
        </form>
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium disabled:opacity-50">
            <MdOutlineSave className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getTemplate(type: string): string {
  const base: Record<string, any> = {
    organization: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Urban Cruise",
      url: "https://urbancruise.com",
      logo: "https://urbancruise.com/logo.png",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+91-98765-43210",
        contactType: "customer service",
      },
    },
    website: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Urban Cruise",
      url: "https://urbancruise.com",
    },
    faq: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What documents do I need?",
          acceptedAnswer: { "@type": "Answer", text: "You need a valid driving license and ID proof." },
        },
      ],
    },
    breadcrumb: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://urbancruise.com" },
      ],
    },
    local_business: {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Urban Cruise Delhi",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Delhi",
        addressCountry: "IN",
      },
      telephone: "+91-98765-43210",
    },
    product: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Maruti Ertiga on Rent",
      description: "7-seater MPV available in Delhi",
      offers: { "@type": "Offer", price: "16", priceCurrency: "INR" },
    },
    article: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Article title",
      author: { "@type": "Person", name: "Author" },
    },
    review: {
      "@context": "https://schema.org",
      "@type": "Review",
      reviewRating: { "@type": "Rating", ratingValue: "5" },
      author: { "@type": "Person", name: "Customer" },
    },
  };
  return JSON.stringify(base[type] || base.organization, null, 2);
}