"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import {
  MdOutlineClose,
  MdOutlineContactSupport,
  MdOutlineSearch,
  MdOutlineVisibility,
} from "react-icons/md";
import { fetcher } from "@/lib/swr-config";

interface Quote {
  id: number;
  full_name: string;
  phone_number: string;
  email: string | null;
  message: string | null;
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

export default function GetAQuotePage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [city, setCity] = useState("");
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);
  const query = new URLSearchParams({ limit: "100" });
  if (search.trim()) query.set("search", search.trim());
  if (status !== "all") query.set("status", status);
  if (city) query.set("city", city);

  const { data, error, isLoading } = useSWR<QuotesResponse>(
    `/api/admin/quotes?${query.toString()}`,
    fetcher
  );
  const quotes = data?.quotes ?? [];

  useEffect(() => {
    if (!previewQuote) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewQuote(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewQuote]);

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

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-500">
          {isLoading ? "Loading quote requests..." : `${data?.total ?? 0} quote requests`}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Trip</th>
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
                    <button
                      type="button"
                      onClick={() => setPreviewQuote(quote)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                      aria-label={`Preview quote from ${quote.full_name}`}
                    >
                      <MdOutlineVisibility className="h-4 w-4" />
                      Preview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                  Quote request preview
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
              <PreviewField label="Customer name" value={previewQuote.full_name} />
              <PreviewField label="Phone" value={previewQuote.phone_number} />
              <PreviewField label="Email" value={previewQuote.email} />
              <PreviewField label="Status" value={previewQuote.status} />
              <PreviewField label="Pickup city / address" value={previewQuote.pickup_address} />
              <PreviewField label="Pickup date" value={previewQuote.pickup_date} />
              <PreviewField label="Drop-off city / address" value={previewQuote.drop_address} />
              <PreviewField label="Drop-off date" value={previewQuote.drop_date} />
              <PreviewField label="Passengers" value={previewQuote.passenger_count} />
              <PreviewField label="Luggage" value={previewQuote.luggage_count} />
              <PreviewField label="Vehicle" value={previewQuote.vehicle_name} />
              <PreviewField label="Vehicle category" value={previewQuote.vehicle_category} />
              <PreviewField label="Received" value={previewQuote.created_at} />
              <div className="sm:col-span-2">
                <PreviewField label="Travel itinerary" value={previewQuote.travel_itinerary} />
              </div>
              <div className="sm:col-span-2">
                <PreviewField label="Message" value={previewQuote.message} />
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function PreviewField({
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
