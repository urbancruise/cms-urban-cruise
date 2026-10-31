"use client";

import { useState } from "react";
import useSWR from "swr";
import { MdOutlineContactSupport, MdOutlineSearch } from "react-icons/md";
import { fetcher } from "@/lib/swr-config";

interface Quote {
  id: number;
  full_name: string;
  phone_number: string;
  email: string | null;
  pickup_address: string | null;
  pickup_date: string | null;
  drop_address: string | null;
  drop_date: string | null;
  passenger_count: number | null;
  vehicle_category: string | null;
  vehicle_name: string | null;
  status: "draft" | "submitted";
  created_at: string;
}

interface QuotesResponse {
  quotes: Quote[];
  total: number;
}

const STATUSES = ["all", "submitted", "draft"] as const;

export default function GetAQuotePage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const query = new URLSearchParams({ limit: "100" });
  if (search.trim()) query.set("search", search.trim());
  if (status !== "all") query.set("status", status);

  const { data, error, isLoading } = useSWR<QuotesResponse>(
    `/api/admin/quotes?${query.toString()}`,
    fetcher
  );
  const quotes = data?.quotes ?? [];

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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!isLoading && quotes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
