"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineSave,
  MdOutlineSettings,
  MdOutlineCheckCircle,
  MdOutlineWarning,
} from "react-icons/md";

interface Settings {
  [key: string]: string;
}

const GROUPS = [
  {
    title: "Site Information",
    fields: [
      { key: "site_name", label: "Site Name", placeholder: "Urban Cruise" },
      { key: "site_url", label: "Site URL", placeholder: "https://urbancruise.com" },
    ],
  },
  {
    title: "Default Meta",
    fields: [
      { key: "default_meta_title", label: "Default Meta Title Template", placeholder: "%page% | Urban Cruise" },
      { key: "default_meta_description", label: "Default Meta Description", type: "textarea", placeholder: "Book cars, buses, and tempo travellers..." },
      { key: "default_og_image", label: "Default OG Image URL", placeholder: "https://..." },
      { key: "default_twitter_handle", label: "Twitter Handle", placeholder: "@UrbanCruise" },
      { key: "default_twitter_card", label: "Twitter Card Type", placeholder: "summary_large_image" },
      { key: "default_robots", label: "Default Robots", placeholder: "index, follow" },
    ],
  },
  {
    title: "Google Integration",
    fields: [
      { key: "gsc_verification", label: "Search Console Verification Code", placeholder: "google-site-verification=..." },
      { key: "ga_measurement_id", label: "Google Analytics Measurement ID", placeholder: "G-XXXXXXXXXX" },
      { key: "ga_property_id", label: "Google Analytics Property ID", placeholder: "123456789" },
      { key: "gtm_id", label: "Google Tag Manager ID", placeholder: "GTM-XXXXXX" },
    ],
  },
  {
    title: "Other Integrations",
    fields: [
      { key: "facebook_pixel_id", label: "Facebook Pixel ID", placeholder: "1234567890" },
      { key: "bing_verification", label: "Bing Webmaster Verification", placeholder: "..." },
    ],
  },
  {
    title: "Sitemap & Robots",
    fields: [
      { key: "sitemap_auto_update", label: "Auto-update Sitemap", placeholder: "true / false" },
      { key: "robots_txt_content", label: "Robots.txt Content", type: "textarea", rows: 6, placeholder: "User-agent: *\nAllow: /" },
    ],
  },
];

export default function SeoSettingsPage() {
  const { data, isLoading, mutate } = useSWR<{ settings: Settings }>(
    "/api/admin/seo/settings",
    fetcher
  );

  const [form, setForm] = useState<Settings>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (data?.settings) setForm(data.settings);
  }, [data]);

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/seo/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      await mutate();
      setToast({ type: "success", message: "Settings saved successfully" });
      setTimeout(() => setToast(null), 3000);
    } catch (e: any) {
      setToast({ type: "error", message: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
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
            <MdOutlineSettings className="w-8 h-8 text-teal-600" />
            SEO Settings
          </h1>
          <p className="text-slate-500 mt-1">Global SEO configuration</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || isLoading}
          className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium disabled:opacity-50 shadow-sm"
        >
          <MdOutlineSave className="w-4 h-4" />
          {saving ? "Saving..." : "Save All"}
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 mt-3 text-sm">Loading settings...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {GROUPS.map((group) => (
            <div
              key={group.title}
              className="bg-white rounded-xl border border-slate-200 p-6"
            >
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {group.title}
              </h2>
              <div className="space-y-4">
                {group.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {field.label}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        rows={field.rows || 3}
                        value={form[field.key] || ""}
                        onChange={(e) => set(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    ) : (
                      <input
                        type="text"
                        value={form[field.key] || ""}
                        onChange={(e) => set(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}