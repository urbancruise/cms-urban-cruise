"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineShare,
  MdOutlineSave,
  MdOutlineCheckCircle,
  MdOutlineFacebook,
  MdOutlineImage,
} from "react-icons/md";

export default function SeoSocialPage() {
  const { data, mutate } = useSWR<{ settings: Record<string, string> }>(
    "/api/admin/seo/settings",
    fetcher
  );
  const [ogImage, setOgImage] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [twitterCard, setTwitterCard] = useState("summary_large_image");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (data?.settings) {
      setOgImage(data.settings.default_og_image || "");
      setTwitterHandle(data.settings.default_twitter_handle || "");
      setTwitterCard(data.settings.default_twitter_card || "summary_large_image");
    }
  }, [data]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/seo/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          default_og_image: ogImage,
          default_twitter_handle: twitterHandle,
          default_twitter_card: twitterCard,
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
            <MdOutlineShare className="w-8 h-8 text-teal-600" />
            Open Graph / Social SEO
          </h1>
          <p className="text-slate-500 mt-1">
            Configure how your site appears when shared on social media
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium disabled:opacity-50 shadow-sm"
        >
          <MdOutlineSave className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">
            Default Open Graph Image
          </h2>
          <input
            type="text"
            value={ogImage}
            onChange={(e) => setOgImage(e.target.value)}
            placeholder="https://res.cloudinary.com/.../default-og.jpg"
            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm font-mono"
          />
          <p className="text-xs text-slate-500 mt-2">
            Recommended: 1200×630 px. Used when a page doesn't have its own OG image.
          </p>
          {ogImage && (
            <div className="mt-3 border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ogImage} alt="OG Preview" className="w-full max-w-md" />
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Twitter / X</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Twitter Handle
              </label>
              <input
                type="text"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                placeholder="@UrbanCruise"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Card Type
              </label>
              <select
                value={twitterCard}
                onChange={(e) => setTwitterCard(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="summary">Summary (small)</option>
                <option value="summary_large_image">Summary Large Image</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Preview</h2>
          <div className="border border-slate-200 rounded-lg overflow-hidden max-w-lg">
            {ogImage && (
              <div className="aspect-[1.91/1] bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ogImage} alt="preview" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-3 bg-slate-50">
              <p className="text-xs text-slate-500 uppercase">urbancruise.com</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">
                Your page title will appear here
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Your page description will appear here when shared.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
