"use client";

import { useState, useEffect } from "react";
import {
  MdOutlineSmartToy,
  MdOutlineSave,
  MdOutlineCheckCircle,
  MdOutlineWarning,
  MdOutlineRestartAlt,
} from "react-icons/md";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";

const DEFAULT_ROBOTS = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /login

Sitemap: https://urbancruise.com/sitemap.xml`;

const PRESETS = {
  "Allow All": `User-agent: *
Allow: /

Sitemap: https://urbancruise.com/sitemap.xml`,
  "Block Admin": `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /login

Sitemap: https://urbancruise.com/sitemap.xml`,
  "Block Everything (Staging)": `User-agent: *
Disallow: /`,
};

export default function SeoRobotsPage() {
  const { data, mutate } = useSWR<{ settings: Record<string, string> }>(
    "/api/admin/seo/settings",
    fetcher
  );
  const [content, setContent] = useState(DEFAULT_ROBOTS);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (data?.settings?.robots_txt_content) {
      setContent(data.settings.robots_txt_content);
    }
  }, [data]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/seo/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ robots_txt_content: content }),
      });
      if (!res.ok) throw new Error("Failed to save");
      await mutate();
      setToast({ type: "success", message: "Robots.txt saved" });
      setTimeout(() => setToast(null), 3000);
    } catch (e: any) {
      setToast({ type: "error", message: e.message });
    } finally {
      setSaving(false);
    }
  };

  const lines = content.split("\n").length;
  const disallowCount = (content.match(/Disallow:/g) || []).length;

  return (
    <div className="p-8 max-w-4xl">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border min-w-[260px] ${toast.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          {toast.type === "success" ? <MdOutlineCheckCircle className="w-5 h-5" /> : <MdOutlineWarning className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <MdOutlineSmartToy className="w-8 h-8 text-teal-600" />
            Robots.txt Management
          </h1>
          <p className="text-slate-500 mt-1">Control how search engines crawl your site</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setContent(DEFAULT_ROBOTS)} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
            <MdOutlineRestartAlt className="w-4 h-4" /> Reset
          </button>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium disabled:opacity-50 shadow-sm">
            <MdOutlineSave className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        {Object.entries(PRESETS).map(([name, preset]) => (
          <button key={name} onClick={() => setContent(preset)} className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50">
            {name}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <span className="text-xs font-mono text-slate-500">robots.txt</span>
          <div className="flex gap-4 text-xs text-slate-500">
            <span>{lines} lines</span>
            <span>{disallowCount} rules</span>
          </div>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={20}
          spellCheck={false}
          className="w-full p-5 font-mono text-sm text-slate-800 bg-white focus:outline-none resize-none"
        />
      </div>

      <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Tip</h3>
        <p className="text-sm text-slate-600">
          After saving, test your robots.txt at{" "}
          <a href="https://support.google.com/webmasters/answer/6062598" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
            Google Search Console → robots.txt Tester
          </a>
          .
        </p>
      </div>
    </div>
  );
}