"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import { CardGridSkeleton, ModalFormSkeleton } from "@/app/components/UI/PageSkeletons";
import {
  MdOutlineAdd,
  MdOutlineEdit,
  MdOutlineDelete,
  MdOutlineClose,
  MdOutlineSave,
  MdOutlineRefresh,
  MdOutlineLocationOn,
  MdOutlineSearch,
} from "react-icons/md";

interface City {
  id: number;
  name: string;
  state: string | null;
  country: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
}

const emptyForm = {
  name: "",
  state: "",
  country: "India",
  code: "",
  description: "",
  is_active: true,
};

export default function CitiesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<City | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ✅ SWR — cached + dedup
  const citiesKey = useMemo(() => {
    const p = new URLSearchParams();
    if (debouncedSearch) p.set("search", debouncedSearch);
    const qs = p.toString();
    return `/api/admin/cities${qs ? `?${qs}` : ""}`;
  }, [debouncedSearch]);

  const { data, isLoading, mutate } = useSWR<{ cities: City[] }>(
    citiesKey,
    fetcher,
    { keepPreviousData: true }
  );

  const cities = data?.cities || [];

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEdit = (city: City) => {
    setEditing(city);
    setFormData({
      name: city.name,
      state: city.state || "",
      country: city.country,
      code: city.code || "",
      description: city.description || "",
      is_active: city.is_active,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const url = editing
        ? `/api/admin/cities/${editing.id}`
        : "/api/admin/cities";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save city");
      await mutate();
      setIsModalOpen(false);
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (city: City) => {
    if (!confirm(`Delete city "${city.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/cities/${city.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await mutate();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Cities Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage cruise destination cities ({cities.length} total)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => mutate()}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <MdOutlineRefresh className="w-5 h-5 text-slate-500" />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <MdOutlineAdd className="w-4 h-4" /> Add City
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search cities by name, state, or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
      </div>

      {/* ✅ Skeleton */}
      {isLoading && !data ? (
        <CardGridSkeleton count={6} />
      ) : cities.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <p className="text-slate-400">
            No cities found. Click "Add City" to create one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cities.map((city) => (
            <div
              key={city.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-center">
                    <MdOutlineLocationOn className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {city.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {city.state || "—"}, {city.country}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    city.is_active
                      ? "bg-teal-50 text-teal-700 border border-teal-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {city.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              {city.code && (
                <p className="text-xs text-slate-500 mb-3">
                  Code:{" "}
                  <span className="font-mono font-medium text-slate-700">
                    {city.code}
                  </span>
                </p>
              )}
              {city.description && (
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                  {city.description}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => openEdit(city)}
                  className="p-1.5 hover:bg-teal-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <MdOutlineEdit className="w-4 h-4 text-slate-400 hover:text-teal-600" />
                </button>
                <button
                  onClick={() => handleDelete(city)}
                  className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <MdOutlineDelete className="w-4 h-4 text-slate-400 hover:text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-900">
                {editing ? "Edit City" : "Add New City"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <MdOutlineClose className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    City Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g., Mumbai"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Airport / Port Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g., BOM"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g., Maharashtra"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.is_active ? "active" : "inactive"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_active: e.target.value === "active",
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={2}
                  placeholder="Optional notes about this city"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 shadow-sm"
                >
                  <MdOutlineSave className="w-4 h-4" />
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
