"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import {
  MdOutlineClose,
  MdOutlineContactSupport,
  MdOutlineDelete,
  MdOutlineEdit,
  MdOutlineSearch,
  MdOutlineSave,
  MdOutlineVisibility,
} from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import { api } from "@/lib/api";
import { fetcher } from "@/lib/swr-config";

interface Quote {
  id: number;
  full_name: string;
  phone_number: string;
  email: string | null;
  message: string | null;
  city: string | null;
  pickup_address: string | null;
  pickup_date: string | null;
  drop_address: string | null;
  drop_date: string | null;
  travel_itinerary: string | null;
  passenger_count: number | null;
  luggage_count: number | null;
  vehicle_category: string | null;
  vehicle_name: string | null;
  status: "draft" | "submitted";
  created_at: string;
}

interface QuotesResponse {
  quotes: Quote[];
  total: number;
  cities: string[];
  vehicleCategories: string[];
  vehicles: string[];
}

interface QuoteEvent {
  id: number;
  event_type: "verified" | "submitted";
  full_name: string;
  phone_number: string;
}

interface QuoteEventsResponse {
  events: QuoteEvent[];
  latestEventId: number;
}

const STATUSES = ["all", "submitted", "draft"] as const;
const UNASSIGNED_CITY_FILTER = "__unassigned__";
const QUOTES_PER_PAGE = 6;

export default function GetAQuotePage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [city, setCity] = useState("");
  const [vehicleCategory, setVehicleCategory] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const eventCursor = useRef<number | null>(null);
  const query = new URLSearchParams({
    limit: String(QUOTES_PER_PAGE),
    offset: String((page - 1) * QUOTES_PER_PAGE),
  });
  if (search.trim()) query.set("search", search.trim());
  if (status !== "all") query.set("status", status);
  if (city) query.set("city", city);
  if (vehicleCategory) query.set("vehicle_category", vehicleCategory);
  if (vehicle) query.set("vehicle_name", vehicle);
  if (dateFrom) query.set("date_from", dateFrom);
  if (dateTo) query.set("date_to", dateTo);

  const { data, error, isLoading, mutate } = useSWR<QuotesResponse>(
    `/api/admin/quotes?${query.toString()}`,
    fetcher
  );
  const quotes = data?.quotes ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / QUOTES_PER_PAGE);
  const { data: eventData } = useSWR<QuoteEventsResponse>(
    "/api/admin/quotes/events",
    () =>
      fetcher(
        eventCursor.current === null
          ? "/api/admin/quotes/events"
          : `/api/admin/quotes/events?after_id=${eventCursor.current}`
      ),
    { refreshInterval: 5000 }
  );

  useEffect(() => {
    if (!eventData) return;
    if (eventCursor.current === null) {
      eventCursor.current = eventData.latestEventId;
      return;
    }
    if (eventData.events.length === 0) {
      eventCursor.current = eventData.latestEventId;
      return;
    }

    for (const event of eventData.events) {
      if (event.event_type === "verified") {
        toast.info(
          `New quote verification from ${event.full_name} (${event.phone_number})`
        );
      } else {
        toast.success(
          `Quote submitted by ${event.full_name} (${event.phone_number})`
        );
      }
    }
    eventCursor.current =
      eventData.events[eventData.events.length - 1].id;
    void mutate();
  }, [eventData, mutate]);

  const handleEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingQuote) return;

    const formData = new FormData(event.currentTarget);
    const value = (name: string) => String(formData.get(name) || "").trim();
    const numberOrNull = (name: string) => {
      const fieldValue = value(name);
      return fieldValue ? Number(fieldValue) : null;
    };

    setSaving(true);
    setActionError("");
    try {
      await api(`/api/admin/quotes/${editingQuote.id}`, {
        method: "PUT",
        body: {
          full_name: value("full_name"),
          phone_number: value("phone_number"),
          city: value("city") || null,
          email: value("email") || null,
          message: value("message") || null,
          pickup_address: value("pickup_address") || null,
          pickup_date: value("pickup_date") || null,
          drop_address: value("drop_address") || null,
          drop_date: value("drop_date") || null,
          travel_itinerary: value("travel_itinerary") || null,
          passenger_count: numberOrNull("passenger_count"),
          luggage_count: numberOrNull("luggage_count"),
          vehicle_category: value("vehicle_category") || null,
          vehicle_name: value("vehicle_name") || null,
          status: value("status"),
        },
      });
      setEditingQuote(null);
      const refreshedData = await mutate();
      if (refreshedData) {
        const lastPage = Math.max(1, Math.ceil(refreshedData.total / QUOTES_PER_PAGE));
        if (page > lastPage) setPage(lastPage);
      }
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not update this quote."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (quote: Quote) => {
    if (!window.confirm(`Delete the quote from ${quote.full_name}? This cannot be undone.`)) {
      return;
    }

    setDeletingId(quote.id);
    setActionError("");
    try {
      await api(`/api/admin/quotes/${quote.id}`, { method: "DELETE" });
      const refreshedData = await mutate();
      if (refreshedData) {
        const lastPage = Math.max(1, Math.ceil(refreshedData.total / QUOTES_PER_PAGE));
        if (page > lastPage) setPage(lastPage);
      }
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not delete this quote."
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
          <h1 className="text-2xl font-bold text-slate-900">Get a Quote</h1>
          <p className="mt-1 text-sm text-slate-500">
            View quote requests submitted from the Urban Cruise website.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:min-w-0">
          <div className="relative w-full sm:max-w-sm lg:w-64 lg:shrink">
            <MdOutlineSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search name, phone, or email"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <select
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
              setPage(1);
            }}
            aria-label="Filter quotes by city"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 sm:max-w-xs lg:w-40 lg:shrink-0"
          >
            <option value="">All cities</option>
            <option value={UNASSIGNED_CITY_FILTER}>City not provided</option>
            {(data?.cities ?? []).map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
          <select
            value={vehicleCategory}
            onChange={(event) => {
              setVehicleCategory(event.target.value);
              setPage(1);
            }}
            aria-label="Filter quotes by vehicle category"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 sm:max-w-xs lg:w-40 lg:shrink-0"
          >
            <option value="">All categories</option>
            {(data?.vehicleCategories ?? []).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={vehicle}
            onChange={(event) => {
              setVehicle(event.target.value);
              setPage(1);
            }}
            aria-label="Filter quotes by vehicle"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 sm:max-w-xs lg:w-40 lg:shrink-0"
          >
            <option value="">All vehicles</option>
            {(data?.vehicles ?? []).map((vehicleName) => (
              <option key={vehicleName} value={vehicleName}>
                {vehicleName}
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
              aria-label="Filter quotes from date received"
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
              aria-label="Filter quotes to date received"
              className="min-w-0 bg-transparent text-slate-700 outline-none"
            />
          </label>
        </div>
        <div className="flex gap-2">
          {STATUSES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium capitalize ${
                status === value
                  ? "bg-teal-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Could not load quote requests: {error.message}
        </div>
      )}
      {actionError && (
        <div role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-500">
          {isLoading ? "Loading quote requests..." : `${data?.total ?? 0} quote requests`}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Website city / Trip</th>
                <th className="px-4 py-3 font-semibold">Vehicle</th>
                <th className="px-4 py-3 font-semibold">Passengers</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Received</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!isLoading && quotes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No quote requests found.
                  </td>
                </tr>
              )}
              {quotes.map((quote) => (
                <tr key={quote.id} className="align-top hover:bg-slate-50/70">
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-900">{quote.full_name}</div>
                    <div className="mt-1 text-slate-500">{quote.phone_number}</div>
                    {quote.email && <div className="text-slate-500">{quote.email}</div>}
                  </td>
                  <td className="px-4 py-4">
                    {quote.city && (
                      <div className="mb-1 text-xs font-medium text-teal-700">
                        Website city: {quote.city}
                      </div>
                    )}
                    {!quote.city && (
                      <div className="mb-1 text-xs font-medium text-amber-700">
                        Website city not provided
                      </div>
                    )}
                    <div className="text-slate-800">
                      {quote.pickup_address || "—"} → {quote.drop_address || "—"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {quote.pickup_date || "—"} to {quote.drop_date || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-slate-800">{quote.vehicle_name || "—"}</div>
                    {quote.vehicle_category && (
                      <div className="mt-1 text-xs text-slate-500">
                        {quote.vehicle_category}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {quote.passenger_count ?? "—"}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        quote.status === "submitted"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {quote.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                    {quote.created_at}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewQuote(quote)}
                        disabled={deletingId === quote.id}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40"
                        aria-label={`Preview quote from ${quote.full_name}`}
                        title="Preview"
                      >
                        <MdOutlineVisibility className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActionError("");
                          setEditingQuote(quote);
                        }}
                        disabled={deletingId === quote.id}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-teal-50 hover:text-teal-700 disabled:opacity-40"
                        aria-label={`Edit quote from ${quote.full_name}`}
                        title="Edit"
                      >
                        <MdOutlineEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(quote)}
                        disabled={deletingId === quote.id}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        aria-label={`Delete quote from ${quote.full_name}`}
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
              Showing {(page - 1) * QUOTES_PER_PAGE + 1}-
              {Math.min(page * QUOTES_PER_PAGE, data?.total ?? 0)} of {data?.total ?? 0} quotes
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

      {previewQuote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewQuote(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="quote-preview-title"
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
              <div>
                <h2 id="quote-preview-title" className="text-lg font-semibold text-slate-900">
                  Quote request
                </h2>
                <p className="mt-1 text-sm text-slate-500">Quote #{previewQuote.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewQuote(null)}
                aria-label="Close quote preview"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <MdOutlineClose className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <QuoteDetail label="Customer name" value={previewQuote.full_name} />
              <QuoteDetail label="Phone" value={previewQuote.phone_number} />
              <QuoteDetail label="Email" value={previewQuote.email} />
              <QuoteDetail label="Website city" value={previewQuote.city} />
              <QuoteDetail label="Status" value={previewQuote.status} />
              <QuoteDetail label="Pickup city / address" value={previewQuote.pickup_address} />
              <QuoteDetail label="Pickup date" value={previewQuote.pickup_date} />
              <QuoteDetail label="Drop-off city / address" value={previewQuote.drop_address} />
              <QuoteDetail label="Drop-off date" value={previewQuote.drop_date} />
              <QuoteDetail label="Passengers" value={previewQuote.passenger_count} />
              <QuoteDetail label="Luggage" value={previewQuote.luggage_count} />
              <QuoteDetail label="Vehicle" value={previewQuote.vehicle_name} />
              <QuoteDetail label="Vehicle category" value={previewQuote.vehicle_category} />
              <QuoteDetail label="Received" value={previewQuote.created_at} />
              <div className="sm:col-span-2">
                <QuoteDetail label="Travel itinerary" value={previewQuote.travel_itinerary} />
              </div>
              <div className="sm:col-span-2">
                <QuoteDetail label="Message" value={previewQuote.message} />
              </div>
            </div>
          </section>
        </div>
      )}

      {editingQuote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setEditingQuote(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="quote-edit-title"
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
              <div>
                <h2 id="quote-edit-title" className="text-lg font-semibold text-slate-900">
                  Edit quote request
                </h2>
                <p className="mt-1 text-sm text-slate-500">Quote #{editingQuote.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingQuote(null)}
                disabled={saving}
                aria-label="Close edit quote"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <MdOutlineClose className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="grid gap-4 p-6 sm:grid-cols-2">
                <QuoteInput label="Customer name" name="full_name" defaultValue={editingQuote.full_name} required />
                <QuoteInput label="Phone" name="phone_number" defaultValue={editingQuote.phone_number} required />
                <QuoteInput label="Email" name="email" type="email" defaultValue={editingQuote.email} />
                <QuoteInput label="Website city" name="city" defaultValue={editingQuote.city} />
                <QuoteInput label="Pickup city / address" name="pickup_address" defaultValue={editingQuote.pickup_address} />
                <QuoteInput label="Pickup date" name="pickup_date" type="date" defaultValue={editingQuote.pickup_date} />
                <QuoteInput label="Drop-off city / address" name="drop_address" defaultValue={editingQuote.drop_address} />
                <QuoteInput label="Drop-off date" name="drop_date" type="date" defaultValue={editingQuote.drop_date} />
                <QuoteInput label="Passengers" name="passenger_count" type="number" defaultValue={editingQuote.passenger_count} />
                <QuoteInput label="Luggage" name="luggage_count" type="number" defaultValue={editingQuote.luggage_count} />
                <QuoteInput label="Vehicle" name="vehicle_name" defaultValue={editingQuote.vehicle_name} />
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vehicle category</span>
                  <select
                    name="vehicle_category"
                    defaultValue={editingQuote.vehicle_category || ""}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="">Not provided</option>
                    {["Economy", "Premium", "Royal", "Royal VIP"].map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                  <select
                    name="status"
                    defaultValue={editingQuote.status}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="draft">Draft</option>
                  </select>
                </label>
                <QuoteInput label="Travel itinerary" name="travel_itinerary" defaultValue={editingQuote.travel_itinerary} className="sm:col-span-2" multiline />
                <QuoteInput label="Message" name="message" defaultValue={editingQuote.message} className="sm:col-span-2" multiline />
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setEditingQuote(null)}
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

function QuoteDetail({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-900">
        {value ?? "—"}
      </p>
    </div>
  );
}

function QuoteInput({
  label,
  name,
  value,
  defaultValue,
  type = "text",
  className = "",
  required = false,
  multiline = false,
}: {
  label: string;
  name: string;
  value?: string | number | null;
  defaultValue?: string | number | null;
  type?: string;
  className?: string;
  required?: boolean;
  multiline?: boolean;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {multiline ? (
        <textarea
          name={name}
          defaultValue={defaultValue ?? value ?? ""}
          rows={3}
          required={required}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={defaultValue ?? value ?? ""}
          required={required}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
      )}
    </label>
  );
}
