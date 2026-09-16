"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ChunkedOptions<T> {
  endpoint: string;
  params?: Record<string, string | number | undefined>;
  pageSize?: number;
  dataKey: string;
  totalKey?: string;
  enabled?: boolean;
}

// ============================================================
// Client-side cache per (endpoint + params)
// ============================================================
const cache = new Map<string, { items: any[]; total: number }>();

export function useChunkedSWR<T>({
  endpoint,
  params = {},
  pageSize = 20,
  dataKey,
  totalKey = "total",
  enabled = true,
}: ChunkedOptions<T>) {
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

  // ============================================================
  // First page (respects tab visibility)
  // ============================================================
  useEffect(() => {
    if (!enabled) return;

    if (typeof document !== "undefined" && document.hidden) return;

    const cacheKey = `${endpoint}::${paramsKey}::0`;
    const cached = cache.get(cacheKey);

    if (cached) {
      setItems(cached.items as T[]);
      setTotal(cached.total);
      setHasMore(
        cached.items.length === pageSize && cached.items.length < cached.total
      );
      setInitialLoading(false);
      return;
    }

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
          cache: "default",
          signal: abortRef.current!.signal,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        const chunk: T[] = data[dataKey] || [];
        const totalCount = Number(data[totalKey]) || chunk.length;

        setItems(chunk);
        setTotal(totalCount);
        setHasMore(chunk.length === pageSize && chunk.length < totalCount);
        cache.set(cacheKey, { items: chunk, total: totalCount });
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e.message);
      } finally {
        setInitialLoading(false);
        setLoading(false);
      }
    })();

    return () => abortRef.current?.abort();
  }, [buildUrl, enabled, dataKey, pageSize, totalKey, paramsKey, endpoint]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const nextPage = page + 1;

    try {
      const res = await fetch(buildUrl(nextPage), { cache: "default" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
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
    const cacheKey = `${endpoint}::${paramsKey}::0`;
    cache.delete(cacheKey);
    setPage(0);
    setHasMore(true);
    setInitialLoading(true);
    setError("");

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(buildUrl(0), { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const chunk: T[] = data[dataKey] || [];
        const totalCount = Number(data[totalKey]) || chunk.length;

        setItems(chunk);
        setTotal(totalCount);
        setHasMore(chunk.length === pageSize && chunk.length < totalCount);
        cache.set(cacheKey, { items: chunk, total: totalCount });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setInitialLoading(false);
        setLoading(false);
      }
    })();
  }, [buildUrl, dataKey, pageSize, totalKey, paramsKey, endpoint]);

  return {
    items,
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