"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineImage,
  MdOutlineRefresh,
  MdOutlineSave,
  MdOutlineWarning,
  MdOutlineCheckCircle,
  MdOutlineSearch,
} from "react-icons/md";
import { CardGridSkeleton } from "@/app/components/UI/PageSkeletons";

interface SeoImage {
  id: number;
  city_id: number | null;
  page_path: string;
  image_url: string;
  public_id: string | null;
  alt_text: string | null;
  title_text: string | null;
  caption: string | null;
  has_alt: boolean;
  updated_at: string;
}

export default function SeoImagesPage() {
  const [filter, setFilter] = useState<string>("missing_alt");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{
    alt_text: string;
    title_text: string;
    caption: string;
  }>({ alt_text: "", title_text: "", caption: "" });
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const url = `/api/admin/seo/images?filter=${filter}&limit=200`;

  const { data, isLoading, mutate } = useSWR<{
    images: SeoImage[];
    total: number;
  }>(url, fetcher, { keepPreviousData: true });

  const images = data?.images || [];

  const filtered = search.trim()
    ? images.filter(
        (img) =>
          img.page_path.toLowerCase().includes(search.toLowerCase()) ||
          (img.alt_text || "").toLowerCase().includes(search.toLowerCase())
      )
    : images;

  const startEdit = (img: SeoImage) => {
    setEditing(img.id);
    setEditValues({
      alt_text: img.alt_text || "",
      title_text: img.title_text || "",
      caption: img.caption || "",
    });
  };

  const saveEdit = async (id: number) => {
    try {
      const res = await fetch("/api/admin/seo/images", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editValues }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setEditing(null);
      await mutate();
      setToast({ type: "success", message: "Alt text saved" });
      setTimeout(() => setToast(null), 3000);
    } catch (e: any) {
      setToast({ type: "error", message: e.message });
    }
  };

  return (
    <div className="p-8">
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
            <MdOutlineImage className="w-8 h-8 text-teal-600" />
            Image SEO
          </h1>
          <p className="text-slate-500 mt-1">
            Manage alt tags, captions, and image optimization ({data?.total || 0} images)
          </p>
        </div>
        <button
          onClick={() => mutate()}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <MdOutlineRefresh className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by page path or alt text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="missing_alt">Missing Alt Text</option>
          <option value="">All Images</option>
        </select>
      </div>

      {isLoading && !data ? (
        <CardGridSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <MdOutlineImage className="w-12 h-12 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500 font-medium">
            {filter === "missing_alt"
              ? "No images with missing alt text 🎉"
              : "No images found"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((img) => (
            <div
              key={img.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className="relative aspect-video bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.image_url}
                  alt={img.alt_text || ""}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-slate-500 font-mono truncate">
                  {img.page_path}
                </p>

                {editing === img.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editValues.alt_text}
                      onChange={(e) =>
                        setEditValues({
                          ...editValues,
                          alt_text: e.target.value,
                        })
                      }
                      placeholder="Alt text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      value={editValues.title_text}
                      onChange={(e) =>
                        setEditValues({
                          ...editValues,
                          title_text: e.target.value,
                        })
                      }
                      placeholder="Title text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      value={editValues.caption}
                      onChange={(e) =>
                        setEditValues({
                          ...editValues,
                          caption: e.target.value,
                        })
                      }
                      placeholder="Caption"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(img.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-medium"
                      >
                        <MdOutlineSave className="w-3.5 h-3.5" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-xs">
                      <span className="text-slate-500">Alt: </span>
                      {img.has_alt ? (
                        <span className="text-slate-800">{img.alt_text}</span>
                      ) : (
                        <span className="text-red-500 italic">Missing</span>
                      )}
                    </div>
                    <button
                      onClick={() => startEdit(img)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50"
                    >
                      Edit Alt Text
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
