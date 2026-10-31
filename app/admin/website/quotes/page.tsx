"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  MdOutlineClose,
  MdOutlineContactSupport,
  MdOutlineDelete,
  MdOutlineEdit,
  MdOutlineSearch,
  MdOutlineSave,
} from "react-icons/md";
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
}

const STATUSES = ["all", "submitted", "draft"] as const;
const UNASSIGNED_CITY_FILTER = "__unassigned__";

export default function GetAQuotePage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [city, setCity] = useState("");
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const query = new URLSearchParams({ limit: "100" });
  if (search.trim()) query.set("search", search.trim());
  if (status !== "all") query.set("status", status);
  if (city) query.set("city", city);

  const { data, error, isLoading, mutate } = useSWR<QuotesResponse>(
    `/api/admin/quotes?${query.toString()}`,
    fetcher
  );
  const quotes = data?.quotes ?? [];

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
      await mutate();
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
      await mutate();
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
        <div className="flex w-full flex-col gap-3 sm:max-w-2xl sm:flex-row">
          <div className="relative w-full sm:max-w-sm">
            <MdOutlineSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, phone, or email"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <select
            value={city}
            onChange={(event) => setCity(event.target.value)}
            aria-label="Filter quotes by city"
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
        </div>
        <div className="flex gap-2">
          {STATUSES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
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
      </div>

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
