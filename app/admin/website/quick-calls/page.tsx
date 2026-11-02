"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import {
  MdOutlineClose,
  MdOutlineContactSupport,
  MdOutlineDelete,
  MdOutlineEdit,
  MdOutlineSave,
  MdOutlineSearch,
  MdOutlineVisibility,
} from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import { api } from "@/lib/api";
import { fetcher } from "@/lib/swr-config";

interface QuickCallRequest {
  id: number;
  name: string;
  phone_number: string;
  city: string | null;
  created_at: string;
}

interface QuickCallsResponse {
  requests: QuickCallRequest[];
  total: number;
  cities: string[];
}

const UNASSIGNED_CITY_FILTER = "__unassigned__";
const QUICK_CALLS_PER_PAGE = 9;

export default function QuickCallsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [city, setCity] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [previewRequest, setPreviewRequest] = useState<QuickCallRequest | null>(null);
  const [editingRequest, setEditingRequest] = useState<QuickCallRequest | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const lastSeenRequestId = useRef<number | null>(null);
  const query = new URLSearchParams({
    limit: String(QUICK_CALLS_PER_PAGE),
    offset: String((page - 1) * QUICK_CALLS_PER_PAGE),
  });
  if (search.trim()) query.set("search", search.trim());
  if (city) query.set("city", city);
  if (dateFrom) query.set("date_from", dateFrom);
  if (dateTo) query.set("date_to", dateTo);

  const { data, error, isLoading, mutate } = useSWR<QuickCallsResponse>(
    `/api/admin/quick-calls?${query.toString()}`,
    fetcher
  );
  const { data: latestData } = useSWR<QuickCallsResponse>(
    "/api/admin/quick-calls?limit=1",
    fetcher,
    { refreshInterval: 10000 }
  );
  const requests = data?.requests ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / QUICK_CALLS_PER_PAGE);
  const latestRequest = latestData?.requests[0];

  useEffect(() => {
    if (!latestRequest) return;

    if (lastSeenRequestId.current === null) {
      lastSeenRequestId.current = latestRequest.id;
      return;
    }

    if (latestRequest.id > lastSeenRequestId.current) {
      lastSeenRequestId.current = latestRequest.id;
      toast.success(
        `New quick call request from ${latestRequest.name} (${latestRequest.phone_number})`
      );
      void mutate();
    }
  }, [latestRequest, mutate]);

  const handleEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingRequest) return;

    const formData = new FormData(event.currentTarget);
    const value = (name: string) => String(formData.get(name) || "").trim();

    setSaving(true);
    setActionError("");
    try {
      await api(`/api/admin/quick-calls/${editingRequest.id}`, {
        method: "PUT",
        body: {
          name: value("name"),
          phone_number: value("phone_number"),
          city: value("city") || null,
        },
      });
      setEditingRequest(null);
      await mutate();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not update this quick call request."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (request: QuickCallRequest) => {
    if (!window.confirm(`Delete the quick call request from ${request.name}? This cannot be undone.`)) {
      return;
    }

    setDeletingId(request.id);
    setActionError("");
    try {
      await api(`/api/admin/quick-calls/${request.id}`, { method: "DELETE" });
      const refreshedData = await mutate();
      if (refreshedData) {
        const lastPage = Math.max(
          1,
          Math.ceil(refreshedData.total / QUICK_CALLS_PER_PAGE)
        );
        if (page > lastPage) setPage(lastPage);
      }
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not delete this quick call request."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <ToastContainer position="top-right" autoClose={5000} newestOnTop />
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50">
          <MdOutlineContactSupport className="h-6 w-6 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Get a Quick Call</h1>
          <p className="mt-1 text-sm text-slate-500">
            View name and phone number requests submitted from the Urban Cruise website.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="relative w-full sm:max-w-sm sm:flex-1">
            <MdOutlineSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search name or phone"
              aria-label="Search quick call requests by name or phone"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <select
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
              setPage(1);
            }}
            aria-label="Filter quick call requests by city"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 sm:max-w-xs"
          >
            <option value="">All cities</option>
            <option value={UNASSIGNED_CITY_FILTER}>City not provided</option>
            {(data?.cities ?? []).map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
          <label className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 sm:w-auto">
            <span className="shrink-0">From</span>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setPage(1);
              }}
              aria-label="Filter quick call requests from date"
              className="min-w-0 bg-transparent text-slate-700 outline-none"
            />
          </label>
          <label className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 sm:w-auto">
            <span className="shrink-0">To</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => {
                setDateTo(event.target.value);
                setPage(1);
              }}
              aria-label="Filter quick call requests to date"
              className="min-w-0 bg-transparent text-slate-700 outline-none"
            />
          </label>
        </div>
        <p className="text-sm text-slate-500">
          {isLoading ? "Loading requests..." : `${data?.total ?? 0} quick call requests`}
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Could not load quick call requests: {error.message}
        </div>
      )}
      {actionError && (
        <div role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Phone number</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">Received</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!isLoading && requests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    No quick call requests found.
                  </td>
                </tr>
              )}
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-4 font-medium text-slate-900">{request.name}</td>
                  <td className="px-4 py-4">
                    <a
                      href={`tel:${request.phone_number}`}
                      className="text-teal-700 hover:underline"
                    >
                      {request.phone_number}
                    </a>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{request.city || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                    {request.created_at}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewRequest(request)}
                        disabled={deletingId === request.id || saving}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40"
                        aria-label={`Preview quick call request from ${request.name}`}
                        title="Preview"
                      >
                        <MdOutlineVisibility className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActionError("");
                          setEditingRequest(request);
                        }}
                        disabled={deletingId === request.id || saving}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-teal-50 hover:text-teal-700 disabled:opacity-40"
                        aria-label={`Edit quick call request from ${request.name}`}
                        title="Edit"
                      >
                        <MdOutlineEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(request)}
                        disabled={deletingId === request.id || saving}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        aria-label={`Delete quick call request from ${request.name}`}
                        title="Delete"
                      >
                        <MdOutlineDelete className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
            <p className="text-sm text-slate-500">
              Showing {(page - 1) * QUICK_CALLS_PER_PAGE + 1}-
              {Math.min(page * QUICK_CALLS_PER_PAGE, data?.total ?? 0)} of {data?.total ?? 0} quick call requests
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                disabled={page === 1 || isLoading}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-2 text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((currentPage) => Math.min(totalPages, currentPage + 1))
                }
                disabled={page >= totalPages || isLoading}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {previewRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewRequest(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-call-preview-title"
            className="w-full max-w-xl rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 id="quick-call-preview-title" className="text-lg font-semibold text-slate-900">
                  Quick call request
                </h2>
                <p className="mt-1 text-sm text-slate-500">Request #{previewRequest.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewRequest(null)}
                aria-label="Close quick call preview"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <MdOutlineClose className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <QuickCallDetail label="Name" value={previewRequest.name} />
              <QuickCallDetail label="Phone number" value={previewRequest.phone_number} />
              <QuickCallDetail label="City" value={previewRequest.city} />
              <QuickCallDetail label="Received" value={previewRequest.created_at} />
            </div>
          </section>
        </div>
      )}

      {editingRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setEditingRequest(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-call-edit-title"
            className="w-full max-w-xl rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 id="quick-call-edit-title" className="text-lg font-semibold text-slate-900">
                  Edit quick call request
                </h2>
                <p className="mt-1 text-sm text-slate-500">Request #{editingRequest.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingRequest(null)}
                disabled={saving}
                aria-label="Close edit quick call request"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <MdOutlineClose className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="grid gap-4 p-6 sm:grid-cols-2">
                <QuickCallInput label="Name" name="name" defaultValue={editingRequest.name} required />
                <QuickCallInput
                  label="Phone number"
                  name="phone_number"
                  type="tel"
                  defaultValue={editingRequest.phone_number}
                  required
                />
                <QuickCallInput
                  label="City"
                  name="city"
                  defaultValue={editingRequest.city}
                  className="sm:col-span-2"
                />
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setEditingRequest(null)}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  <MdOutlineSave className="h-4 w-4" />
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function QuickCallDetail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-900">{value ?? "—"}</p>
    </div>
  );
}

function QuickCallInput({
  label,
  name,
  defaultValue,
  type = "text",
  className = "",
  required = false,
}: {
  label: string;
  name: string;
  defaultValue: string | null;
  type?: string;
  className?: string;
  required?: boolean;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
      />
    </label>
  );
}
