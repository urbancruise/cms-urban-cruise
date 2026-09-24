"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineLink,
  MdOutlineRefresh,
  MdOutlineWarning,
  MdOutlineCheckCircle,
  MdOutlineDelete,
} from "react-icons/md";

interface Link {
  id: number;
  source_path: string;
  target_path: string;
  anchor_text: string | null;
  is_broken: boolean;
  last_checked_at: string | null;
}

export default function SeoInternalLinksPage() {
  const [filter, setFilter] = useState<"all" | "broken">("all");

  const { data, isLoading, mutate } = useSWR<{ links: Link[]; total: number }>(
    `/api/admin/seo/internal-links${filter === "broken" ? "?broken=true" : ""}`,
    fetcher
  );

  const links = data?.links || [];
  const brokenCount = links.filter((l) => l.is_broken).length;

  const checkLinks = async () => {
    await fetch("/api/admin/seo/internal-links/check", { method: "POST" });
    mutate();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <MdOutlineLink className="w-8 h-8 text-teal-600" />
            Internal Linking
          </h1>
          <p className="text-slate-500 mt-1">
            {links.length} links · {brokenCount} broken
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => mutate()} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
            <MdOutlineRefresh className="w-5 h-5 text-slate-500" />
          </button>
          <button onClick={checkLinks} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm">
            Recheck Links
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setFilter("all")} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${filter === "all" ? "bg-teal-600 text-white" : "bg-white border border-slate-200 text-slate-700"}`}>
          All ({links.length})
        </button>
        <button onClick={() => setFilter("broken")} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${filter === "broken" ? "bg-red-600 text-white" : "bg-white border border-slate-200 text-slate-700"}`}>
          Broken ({brokenCount})
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : links.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <MdOutlineLink className="w-12 h-12 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500 font-medium">No internal links tracked</p>
          <p className="text-xs text-slate-400 mt-1">Click "Recheck Links" to scan</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {links.map((link) => (
              <div key={link.id} className="p-4 flex items-center gap-4">
                <div className="flex-shrink-0">
                  {link.is_broken ? (
                    <MdOutlineWarning className="w-5 h-5 text-red-500" />
                  ) : (
                    <MdOutlineCheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-slate-500 truncate">
                    From: <span className="text-slate-800">{link.source_path}</span>
                  </p>
                  <p className="text-sm font-mono text-slate-800 truncate mt-0.5">
                    → {link.target_path}
                  </p>
                  {link.anchor_text && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      Anchor: "{link.anchor_text}"
                    </p>
                  )}
                </div>
                {link.is_broken && (
                  <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium flex-shrink-0">
                    Broken
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}