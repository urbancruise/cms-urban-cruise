"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineSpeed,
  MdOutlineRefresh,
  MdOutlineCheckCircle,
  MdOutlineWarning,
  MdOutlineError,
} from "react-icons/md";

interface CwvEntry {
  id: number;
  page_path: string;
  device: "mobile" | "desktop";
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  inp: number | null;
  ttfb: number | null;
  status: "good" | "needs_improvement" | "poor";
  measured_at: string;
}

const METRIC_THRESHOLDS: Record<string, { good: number; poor: number; unit: string }> = {
  lcp: { good: 2.5, poor: 4.0, unit: "s" },
  fid: { good: 100, poor: 300, unit: "ms" },
  cls: { good: 0.1, poor: 0.25, unit: "" },
  inp: { good: 200, poor: 500, unit: "ms" },
  ttfb: { good: 800, poor: 1800, unit: "ms" },
};

export default function SeoCwvPage() {
  const { data, isLoading, mutate } = useSWR<{ entries: CwvEntry[] }>(
    "/api/admin/seo/cwv",
    fetcher
  );

  const entries = data?.entries || [];

  const checkVitals = async () => {
    await fetch("/api/admin/seo/cwv/measure", { method: "POST" });
    mutate();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <MdOutlineSpeed className="w-8 h-8 text-teal-600" />
            Core Web Vitals
          </h1>
          <p className="text-slate-500 mt-1">Monitor LCP, FID, CLS, INP, TTFB</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => mutate()} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
            <MdOutlineRefresh className="w-5 h-5 text-slate-500" />
          </button>
          <button onClick={checkVitals} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm">
            Measure Now
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <MdOutlineSpeed className="w-12 h-12 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500 font-medium">No measurements yet</p>
          <p className="text-xs text-slate-400 mt-1">Click "Measure Now" to start</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono text-slate-800">{entry.page_path}</p>
                  <p className="text-xs text-slate-500 capitalize">{entry.device}</p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                    entry.status === "good"
                      ? "bg-green-50 text-green-700"
                      : entry.status === "needs_improvement"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {entry.status === "good" && <MdOutlineCheckCircle className="w-3.5 h-3.5" />}
                  {entry.status === "needs_improvement" && <MdOutlineWarning className="w-3.5 h-3.5" />}
                  {entry.status === "poor" && <MdOutlineError className="w-3.5 h-3.5" />}
                  {entry.status.replace("_", " ")}
                </span>
              </div>

              <div className="grid grid-cols-5 divide-x divide-slate-100">
                {(["lcp", "fid", "cls", "inp", "ttfb"] as const).map((metric) => {
                  const val = entry[metric];
                  const threshold = METRIC_THRESHOLDS[metric];
                  const status = val == null ? "missing" : val <= threshold.good ? "good" : val <= threshold.poor ? "warn" : "bad";
                  return (
                    <div key={metric} className="p-4 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{metric}</p>
                      <p className={`text-lg font-bold mt-1 ${status === "good" ? "text-green-600" : status === "warn" ? "text-amber-600" : status === "bad" ? "text-red-600" : "text-slate-400"}`}>
                        {val != null ? `${val}${threshold.unit}` : "—"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}