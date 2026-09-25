"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ChunkedFetchOptions<T> {
  endpoint: string;
  params?: Record<string, string | number | undefined>;
  pageSize?: number;
  dataKey: string;
  totalKey?: string;
  enabled?: boolean;
}

export function useChunkedFetch<T>({
  endpoint,
  params = {},
  pageSize = 20,
  dataKey,
  totalKey = "total",
  enabled = true,
}: ChunkedFetchOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);

  const paramsKey = JSON.stringify(params);
  const abortRef = useRef<AbortController | null>(null);

  const buildUrl = useCallback(
    (pageIndex: number) => {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "" && v !== null) {
          search.set(k, String(v));
        }
      });
      search.set("limit", String(pageSize));
      search.set("offset", String(pageIndex * pageSize));
      return `${endpoint}?${search.toString()}`;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [endpoint, pageSize, paramsKey]
  );

  useEffect(() => {
    if (!enabled) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setItems([]);
    setPage(0);
    setHasMore(true);
    setInitialLoading(true);
    setError("");

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(buildUrl(0), {
          cache: "no-store",
          signal: abortRef.current!.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");

        const chunk: T[] = data[dataKey] || [];
        const totalCount = Number(data[totalKey]) || chunk.length;

        setItems(chunk);
        setTotal(totalCount);
        setHasMore(chunk.length === pageSize && chunk.length < totalCount);
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e.message);
      } finally {
        setInitialLoading(false);
        setLoading(false);
      }
    })();

    return () => abortRef.current?.abort();
  }, [buildUrl, enabled, dataKey, pageSize, totalKey]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const nextPage = page + 1;
    try {
      const res = await fetch(buildUrl(nextPage), { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");

      const chunk: T[] = data[dataKey] || [];
      setItems((prev) => [...prev, ...chunk]);
      setPage(nextPage);
      setHasMore(chunk.length === pageSize);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, buildUrl, dataKey, pageSize]);

  const refresh = useCallback(() => {
    setPage(0);
    setHasMore(true);
    setInitialLoading(true);
    setError("");

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(buildUrl(0), { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");

        const chunk: T[] = data[dataKey] || [];
        const totalCount = Number(data[totalKey]) || chunk.length;
        setItems(chunk);
        setTotal(totalCount);
        setHasMore(chunk.length === pageSize && chunk.length < totalCount);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setInitialLoading(false);
        setLoading(false);
      }
    })();
  }, [buildUrl, dataKey, pageSize, totalKey]);

  return {
    items,
    setItems,
    total,
    page,
    loading,
    initialLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
