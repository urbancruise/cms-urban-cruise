"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineAnalytics,
  MdOutlineSave,
  MdOutlineCheckCircle,
  MdOutlineInfo,
  MdOutlineOpenInNew,
} from "react-icons/md";

export default function SeoAnalyticsPage() {
  const { data, mutate } = useSWR<{ settings: Record<string, string> }>(
    "/api/admin/seo/settings",
    fetcher
  );
  const [gaId, setGaId] = useState("");
  const [gtmId, setGtmId] = useState("");
  const [pixelId, setPixelId] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (data?.settings) {
      setGaId(data.settings.ga_measurement_id || "");
      setGtmId(data.settings.gtm_id || "");
      setPixelId(data.settings.facebook_pixel_id || "");
    }
  }, [data]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/seo/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ga_measurement_id: gaId,
          gtm_id: gtmId,
          facebook_pixel_id: pixelId,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      await mutate();
      setToast("Saved successfully");
      setTimeout(() => setToast(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      {toast && (
        <div className="fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border bg-green-50 border-green-200 text-green-800">
          <MdOutlineCheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <MdOutlineAnalytics className="w-8 h-8 text-teal-600" />
            Google Analytics
          </h1>
          <p className="text-slate-500 mt-1">Track traffic, behavior, and conversions</p>
        </div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium disabled:opacity-50 shadow-sm">
          <MdOutlineSave className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <MdOutlineInfo className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            Add your tracking IDs here. They will be injected into the public website's head automatically.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">GA4 Measurement ID</label>
          <input
            type="text"
            value={gaId}
            onChange={(e) => setGaId(e.target.value)}
            placeholder="G-XXXXXXXXXX"
            className="w-full px-4 py-2 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">Google Tag Manager ID</label>
          <input
            type="text"
            value={gtmId}
            onChange={(e) => setGtmId(e.target.value)}
            placeholder="GTM-XXXXXX"
            className="w-full px-4 py-2 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">Facebook Pixel ID</label>
          <input
            type="text"
            value={pixelId}
            onChange={(e) => setPixelId(e.target.value)}
            placeholder="1234567890"
            className="w-full px-4 py-2 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mt-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Quick Links</h2>
        <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 hover:underline">
          Open Google Analytics
          <MdOutlineOpenInNew className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}