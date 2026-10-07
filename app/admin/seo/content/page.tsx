"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import RichEditor from "@/app/components/UI/RichEditor";
import { MdOutlineEdit, MdOutlineRefresh, MdOutlineSearch } from "react-icons/md";
import { TableSkeleton } from "@/app/components/UI/PageSkeletons";
import { api } from "@/lib/api";

interface SeoPage {
  id: number;
  page_path: string;
  page_type: string;
  focus_keyword: string | null;
  word_count: number;
  readability_score: number;
  seo_score: number;
  meta_title: string | null;
  meta_description: string | null;
  updated_at: string;
  content_json: unknown;
}

export default function SeoContentPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SeoPage | null>(null);

  const { data, isLoading, mutate } = useSWR<{ pages: SeoPage[]; total: number }>(
    "/api/admin/seo/pages?limit=200",
    fetcher
  );

  const filtered = useMemo(() => {
    const pages = data?.pages || [];
    const q = search.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter(
      (p) =>
        p.page_path.toLowerCase().includes(q) ||
        (p.meta_title || "").toLowerCase().includes(q)
    );
  }, [data?.pages, search]);

  const analyze = (page: SeoPage) => {
    // Content analysis scoring
    const wc = page.word_count || 0;
    const readability = page.readability_score || 0;
    const title = page.meta_title || "";
    const desc = page.meta_description || "";
    const keyword = page.focus_keyword || "";

    const checks = {
      wordCount: wc >= 300,
      titleLength: title.length >= 30 && title.length <= 60,
      descLength: desc.length >= 120 && desc.length <= 160,
      titleHasKeyword: keyword
        ? title.toLowerCase().includes(keyword.toLowerCase())
        : false,
      descHasKeyword: keyword
        ? desc.toLowerCase().includes(keyword.toLowerCase())
        : false,
      readable: readability >= 60,
    };

    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { checks, passed, total, percentage: Math.round((passed / total) * 100) };
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <MdOutlineEdit className="w-8 h-8 text-teal-600" />
            SEO Content Editor
          </h1>
          <p className="text-slate-500 mt-1">Analyze and optimize your page content</p>
        </div>
        <button
          onClick={() => mutate()}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <MdOutlineRefresh className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="relative mb-6 max-w-md">
        <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search pages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white"
        />
      </div>

      {isLoading && !data ? (
        <TableSkeleton rows={6} columns={5} />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <MdOutlineEdit className="w-12 h-12 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500">
            No pages found. Create SEO pages first in Page SEO Management.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((page) => {
            const analysis = analyze(page);
            return (
              <button
                key={page.id}
                onClick={() => setSelected(page)}
                className="text-left bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs font-mono text-slate-500 truncate">
                    {page.page_path}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${analysis.percentage >= 80 ? "bg-green-50 text-green-700" : analysis.percentage >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}
                  >
                    {analysis.percentage}%
                  </span>
                </div>

                <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                  {page.meta_title || (
                    <span className="text-red-500 italic text-sm">No title</span>
                  )}
                </h3>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Word count</span>
                    <span
                      className={
                        page.word_count >= 300
                          ? "text-green-600 font-medium"
                          : "text-slate-600"
                      }
                    >
                      {page.word_count} {page.word_count >= 300 ? "✓" : "(target 300+)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Readability</span>
                    <span
                      className={
                        page.readability_score >= 60
                          ? "text-green-600 font-medium"
                          : "text-slate-600"
                      }
                    >
                      {page.readability_score}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Focus keyword</span>
                    <span className="text-slate-700 truncate max-w-[120px]">
                      {page.focus_keyword || "—"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <ContentAnalysisModal
          page={selected}
          onClose={() => setSelected(null)}
          onSaved={async () => {
            await mutate();
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

function ContentAnalysisModal({
  page,
  onClose,
  onSaved,
}: {
  page: SeoPage;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [content, setContent] = useState<unknown>(page.content_json);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const contentText = extractEditorText(content);
  const wordCount = countWords(contentText);
  const readabilityScore = estimateReadability(contentText);
  const title = page.meta_title || "";
  const desc = page.meta_description || "";
  const keyword = page.focus_keyword || "";

  const checks = [
    {
      label: "Word count ≥ 300",
      passed: wordCount >= 300,
      hint: `Current: ${wordCount}`,
    },
    {
      label: "Meta title 30-60 chars",
      passed: title.length >= 30 && title.length <= 60,
      hint: `Current: ${title.length}`,
    },
    {
      label: "Meta description 120-160 chars",
      passed: desc.length >= 120 && desc.length <= 160,
      hint: `Current: ${desc.length}`,
    },
    {
      label: "Focus keyword in title",
      passed: keyword ? title.toLowerCase().includes(keyword.toLowerCase()) : false,
      hint: keyword ? "Required" : "Set focus keyword first",
    },
    {
      label: "Focus keyword in description",
      passed: keyword ? desc.toLowerCase().includes(keyword.toLowerCase()) : false,
      hint: keyword ? "Required" : "Set focus keyword first",
    },
    {
      label: "Readability ≥ 60",
      passed: readabilityScore >= 60,
      hint: `Estimated: ${readabilityScore}/100`,
    },
  ];

  const passed = checks.filter((c) => c.passed).length;
  const total = checks.length;

  const saveContent = async () => {
    setSaving(true);
    setError("");
    try {
      await api(`/api/admin/seo/pages/${page.id}`, {
        method: "PUT",
        body: {
          content_json: content,
          word_count: wordCount,
          readability_score: readabilityScore,
        },
      });
      await onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save page content"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">SEO Content Editor</h2>
            <p className="text-xs text-slate-400 font-mono mt-1">{page.page_path}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none px-2"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Page content
              </h3>
              <p className="text-xs text-slate-500">
                {wordCount} words · Estimated readability {readabilityScore}/100
              </p>
            </div>
            <RichEditor
              value={content}
              onChange={setContent}
              placeholder="Write search-friendly page content..."
              minHeight={280}
            />
          </section>

          <div
            className={`rounded-xl p-4 border ${passed === total ? "bg-green-50 border-green-200" : passed >= total / 2 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">Score</span>
              <span
                className={`text-2xl font-bold ${passed === total ? "text-green-600" : passed >= total / 2 ? "text-amber-600" : "text-red-600"}`}
              >
                {passed}/{total}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {checks.map((c, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg border ${c.passed ? "bg-green-50/50 border-green-100" : "bg-red-50/50 border-red-100"}`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${c.passed ? "bg-green-500" : "bg-red-500"}`}
                >
                  {c.passed ? "✓" : "✕"}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{c.label}</p>
                  <p className="text-xs text-slate-500">{c.hint}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Google Preview</h3>
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">{page.page_path}</p>
              <p className="text-base text-blue-700 font-medium line-clamp-1">
                {title || "No title set"}
              </p>
              <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                {desc || "No description set"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200">
          {error && (
            <p className="mb-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
          >
            Close
          </button>
          <button
            onClick={saveContent}
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save content"}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function extractEditorText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(extractEditorText).join(" ");
  if (value && typeof value === "object") {
    return Object.entries(value)
      .filter(([key]) => !["url", "id", "time", "version", "type"].includes(key))
      .map(([, child]) => extractEditorText(child))
      .join(" ");
  }
  return "";
}

function countWords(value: string): number {
  const plainText = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .trim();
  return plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
}

function estimateReadability(value: string): number {
  const words = value
    .replace(/<[^>]*>/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return 0;

  const sentences = value.split(/[.!?]+/).filter((sentence) => sentence.trim()).length || 1;
  const averageSentenceLength = words.length / sentences;
  const averageWordLength =
    words.reduce((total, word) => total + word.length, 0) / words.length;
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 -
          Math.max(0, averageSentenceLength - 15) * 2 -
          Math.max(0, averageWordLength - 5) * 10
      )
    )
  );
}
