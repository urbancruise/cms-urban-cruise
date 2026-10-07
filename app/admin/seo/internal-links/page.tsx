"use client";

import { useState, type FormEvent } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import { api } from "@/lib/api";
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
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [addError, setAddError] = useState("");
  const [sourcePath, setSourcePath] = useState("");
  const [targetPath, setTargetPath] = useState("");
  const [anchorText, setAnchorText] = useState("");

  const { data, isLoading, mutate } = useSWR<{ links: Link[]; total: number }>(
    `/api/admin/seo/internal-links${filter === "broken" ? "?broken=true" : ""}`,
    fetcher
  );

  const links = data?.links || [];
  const brokenCount = links.filter((l) => l.is_broken).length;

  const checkLinks = async () => {
    setChecking(true);
    setCheckError("");
    try {
      await api("/api/admin/seo/internal-links/check", { method: "POST" });
      await mutate();
    } catch (error) {
      setCheckError(
        error instanceof Error ? error.message : "Failed to check internal links"
      );
    } finally {
      setChecking(false);
    }
  };

  const addLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAdding(true);
    setAddError("");
    try {
      await api("/api/admin/seo/internal-links", {
        method: "POST",
        body: {
          source_path: sourcePath,
          target_path: targetPath,
          anchor_text: anchorText,
        },
      });
      setSourcePath("");
      setTargetPath("");
      setAnchorText("");
      await mutate();
    } catch (error) {
      setAddError(
        error instanceof Error ? error.message : "Failed to add internal link"
      );
    } finally {
      setAdding(false);
    }
  };

  const deleteLink = async (id: number) => {
    setDeletingId(id);
    setCheckError("");
    try {
      await api(`/api/admin/seo/internal-links?id=${id}`, {
        method: "DELETE",
      });
      await mutate();
    } catch (error) {
      setCheckError(
        error instanceof Error ? error.message : "Failed to delete internal link"
      );
    } finally {
      setDeletingId(null);
    }
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
          <button
            onClick={() => mutate()}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <MdOutlineRefresh className="w-5 h-5 text-slate-500" />
          </button>
          <button
            onClick={checkLinks}
            disabled={checking}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm disabled:opacity-50"
          >
            {checking ? "Checking..." : "Recheck Links"}
          </button>
        </div>
      </div>

      {checkError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {checkError}
        </div>
      )}

      <form
        onSubmit={addLink}
        className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-4"
      >
        <input
          required
          value={sourcePath}
          onChange={(event) => setSourcePath(event.target.value)}
          placeholder="Source path (e.g. /about)"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          required
          value={targetPath}
          onChange={(event) => setTargetPath(event.target.value)}
          placeholder="Target path (e.g. /destinations)"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          value={anchorText}
          onChange={(event) => setAnchorText(event.target.value)}
          placeholder="Anchor text (optional)"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={adding}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {adding ? "Adding..." : "Add internal link"}
        </button>
        {addError && (
          <p className="text-sm text-red-700 md:col-span-4">{addError}</p>
        )}
      </form>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium ${filter === "all" ? "bg-teal-600 text-white" : "bg-white border border-slate-200 text-slate-700"}`}
        >
          All ({links.length})
        </button>
        <button
          onClick={() => setFilter("broken")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium ${filter === "broken" ? "bg-red-600 text-white" : "bg-white border border-slate-200 text-slate-700"}`}
        >
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
                  {link.last_checked_at == null ? (
                    <MdOutlineWarning className="w-5 h-5 text-slate-400" />
                  ) : link.is_broken ? (
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
                {!link.last_checked_at && (
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200 font-medium flex-shrink-0">
                    Not checked
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => deleteLink(link.id)}
                  disabled={deletingId === link.id}
                  aria-label={`Delete link to ${link.target_path}`}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <MdOutlineDelete className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
