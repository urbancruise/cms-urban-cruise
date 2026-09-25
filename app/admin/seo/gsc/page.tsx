"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineTravelExplore,
  MdOutlineSave,
  MdOutlineCheckCircle,
  MdOutlineOpenInNew,
  MdOutlineInfo,
} from "react-icons/md";

export default function SeoGscPage() {
  const { data, mutate } = useSWR<{ settings: Record<string, string> }>(
    "/api/admin/seo/settings",
    fetcher
  );
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string>("");

  useEffect(() => {
    if (data?.settings) {
      setCode(data.settings.gsc_verification || "");
    }
  }, [data]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/seo/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gsc_verification: code }),
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

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <MdOutlineTravelExplore className="w-8 h-8 text-teal-600" />
          Google Search Console
        </h1>
        <p className="text-slate-500 mt-1">
          Connect your site for search performance data
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <MdOutlineInfo className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">How to connect</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Go to Google Search Console</li>
              <li>Add your site property</li>
              <li>Choose verification method: HTML tag</li>
              <li>Copy the content value of the meta tag</li>
              <li>Paste it below and save</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <label className="block text-sm font-medium text-slate-900 mb-2">
          Verification Code
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g., aBcD1234...xyz"
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium disabled:opacity-50"
          >
            <MdOutlineSave className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          This will be rendered as{" "}
          <code className="font-mono bg-slate-100 px-1 rounded">
            &lt;meta name="google-site-verification" content="..."&gt;
          </code>
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Quick Links</h2>
        <div className="space-y-2">
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 hover:underline"
          >
            Open Google Search Console
            <MdOutlineOpenInNew className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://search.google.com/test/rich-results"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 hover:underline"
          >
            Rich Results Test
            <MdOutlineOpenInNew className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://pagespeed.web.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 hover:underline"
          >
            PageSpeed Insights
            <MdOutlineOpenInNew className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
