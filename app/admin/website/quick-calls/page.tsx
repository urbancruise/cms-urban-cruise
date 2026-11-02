"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { MdOutlineContactSupport, MdOutlineSearch } from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
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

export default function QuickCallsPage() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const lastSeenRequestId = useRef<number | null>(null);
  const query = new URLSearchParams({ limit: "100" });
  if (search.trim()) query.set("search", search.trim());
  if (city) query.set("city", city);

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
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:max-w-sm">
            <MdOutlineSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or phone"
              aria-label="Search quick call requests by name or phone"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <select
            value={city}
            onChange={(event) => setCity(event.target.value)}
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

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Phone number</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!isLoading && requests.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
