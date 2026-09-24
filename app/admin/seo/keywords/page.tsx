"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineAdd,
  MdOutlineEdit,
  MdOutlineDelete,
  MdOutlineClose,
  MdOutlineSave,
  MdOutlineRefresh,
  MdOutlineSearch,
  MdOutlineTrendingUp,
  MdOutlineCheckCircle,
  MdOutlineWarning,
} from "react-icons/md";
import { TableSkeleton } from "@/app/components/UI/PageSkeletons";

interface Keyword {
  id: number;
  keyword: string;
  keyword_type: "primary" | "secondary" | "long_tail" | "lsi";
  search_volume: number;
  difficulty: number;
  current_rank: number | null;
  target_rank: number | null;
  page_path: string | null;
  city_id: number | null;
  is_tracked: boolean;
  updated_at: string;
}

interface City {
  id: number;
  name: string;
}

const TYPE_COLORS = {
  primary: "bg-red-50 text-red-700 border-red-200",
  secondary: "bg-teal-50 text-teal-700 border-teal-200",
  long_tail: "bg-purple-50 text-purple-700 border-purple-200",
  lsi: "bg-sky-50 text-sky-700 border-sky-200",
};

export default function SeoKeywordsPage() {
  const [cityFilter, setCityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Keyword | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data: citiesData } = useSWR<{ cities: City[] }>(
    "/api/admin/cities?active=true",
    fetcher
  );
  const cities = citiesData?.cities || [];

  const key = useMemo(() => {
    const p = new URLSearchParams();
    if (cityFilter) p.set("city_id", cityFilter);
    if (typeFilter) p.set("keyword_type", typeFilter);
    if (debouncedSearch) p.set("search", debouncedSearch);
    return `/api/admin/seo/keywords?${p.toString()}`;
  }, [cityFilter, typeFilter, debouncedSearch]);

  const { data, isLoading, mutate } = useSWR<{ keywords: Keyword[]; total: number }>(
    key,
    fetcher,
    { keepPreviousData: true }
  );
  const keywords = data?.keywords || [];

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (kw: Keyword) => {
    if (!confirm(`Delete keyword "${kw.keyword}"?`)) return;
    try {
      const res = await fetch(`/api/admin/seo/keywords/${kw.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await mutate();
      showToast("success", "Keyword deleted");
    } catch (e: any) {
      showToast("error", e.message);
    }
  };

  return (
    <div className="p-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border min-w-[260px] ${toast.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          {toast.type === "success" ? <MdOutlineCheckCircle className="w-5 h-5" /> : <MdOutlineWarning className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <MdOutlineTrendingUp className="w-8 h-8 text-teal-600" />
            Keyword Management
          </h1>
          <p className="text-slate-500 mt-1">Track keyword rankings, volume, and difficulty ({data?.total || 0} total)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => mutate()} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
            <MdOutlineRefresh className="w-5 h-5 text-slate-500" />
          </button>
          <button onClick={() => { setEditing(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm">
            <MdOutlineAdd className="w-4 h-4" /> Add Keyword
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search keywords..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg bg-white">
          <option value="">All Cities</option>
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg bg-white">
          <option value="">All Types</option>
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <option value="long_tail">Long Tail</option>
          <option value="lsi">LSI</option>
        </select>
      </div>

      {isLoading && !data ? (
        <TableSkeleton rows={8} columns={6} />
      ) : keywords.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <MdOutlineTrendingUp className="w-12 h-12 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500 font-medium">No keywords tracked</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Keyword</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Volume</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Difficulty</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Page</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {keywords.map((kw) => (
                  <tr key={kw.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{kw.keyword}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium border ${TYPE_COLORS[kw.keyword_type]}`}>{kw.keyword_type.replace("_", " ")}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{kw.search_volume.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${kw.difficulty >= 70 ? "bg-red-500" : kw.difficulty >= 40 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${kw.difficulty}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{kw.difficulty}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {kw.current_rank ? (
                        <span className={`font-bold ${kw.current_rank <= 3 ? "text-green-600" : kw.current_rank <= 10 ? "text-amber-600" : "text-slate-600"}`}>#{kw.current_rank}</span>
                      ) : (
                        <span className="text-xs text-slate-400">Not ranked</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono truncate max-w-[200px]">{kw.page_path || "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditing(kw); setIsModalOpen(true); }} className="p-1.5 hover:bg-teal-50 rounded-lg">
                          <MdOutlineEdit className="w-4 h-4 text-slate-400 hover:text-teal-600" />
                        </button>
                        <button onClick={() => handleDelete(kw)} className="p-1.5 hover:bg-red-50 rounded-lg">
                          <MdOutlineDelete className="w-4 h-4 text-slate-400 hover:text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <KeywordModal
          keyword={editing}
          cities={cities}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => { setIsModalOpen(false); mutate(); showToast("success", "Saved"); }}
        />
      )}
    </div>
  );
}

function KeywordModal({ keyword, cities, onClose, onSaved }: { keyword: Keyword | null; cities: City[]; onClose: () => void; onSaved: () => void; }) {
  const isEdit = Boolean(keyword);
  const [form, setForm] = useState({
    keyword: keyword?.keyword || "",
    keyword_type: keyword?.keyword_type || "secondary",
    search_volume: keyword?.search_volume ?? 0,
    difficulty: keyword?.difficulty ?? 0,
    current_rank: keyword?.current_rank ?? "",
    target_rank: keyword?.target_rank ?? "",
    page_path: keyword?.page_path || "",
    city_id: keyword?.city_id ? String(keyword.city_id) : "",
    is_tracked: keyword?.is_tracked ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        search_volume: Number(form.search_volume),
        difficulty: Number(form.difficulty),
        current_rank: form.current_rank === "" ? null : Number(form.current_rank),
        target_rank: form.target_rank === "" ? null : Number(form.target_rank),
        city_id: form.city_id ? Number(form.city_id) : null,
      };
      const url = isEdit ? `/api/admin/seo/keywords/${keyword!.id}` : "/api/admin/seo/keywords";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">{isEdit ? "Edit Keyword" : "Add Keyword"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><MdOutlineClose className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={submit} className="flex-1 overflow-auto p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Keyword *</label>
            <input type="text" value={form.keyword} onChange={(e) => set("keyword", e.target.value)} placeholder="ertiga on rent in delhi" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
              <select value={form.keyword_type} onChange={(e) => set("keyword_type", e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="long_tail">Long Tail</option>
                <option value="lsi">LSI</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
              <select value={form.city_id} onChange={(e) => set("city_id", e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Global</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Search Volume /mo</label>
              <input type="number" min={0} value={form.search_volume} onChange={(e) => set("search_volume", e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Difficulty (0-100)</label>
              <input type="number" min={0} max={100} value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Current Rank</label>
              <input type="number" min={1} value={form.current_rank} onChange={(e) => set("current_rank", e.target.value)} placeholder="e.g., 3" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Target Rank</label>
              <input type="number" min={1} value={form.target_rank} onChange={(e) => set("target_rank", e.target.value)} placeholder="e.g., 1" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Page Path</label>
            <input type="text" value={form.page_path} onChange={(e) => set("page_path", e.target.value)} placeholder="/delhi/vehicles/ertiga" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.is_tracked} onChange={(e) => set("is_tracked", e.target.checked)} className="w-4 h-4 text-teal-600" />
            <span className="text-sm text-slate-700">Track this keyword</span>
          </label>
        </form>
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium disabled:opacity-50">
            <MdOutlineSave className="w-4 h-4" /> {saving ? "Saving..." : isEdit ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}