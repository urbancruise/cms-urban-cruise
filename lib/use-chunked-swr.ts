"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHUNKED_CACHE_MAX_ENTRIES } from "./constants";

interface ChunkedOptions<T> {
  endpoint: string;
  params?: Record<string, string | number | undefined>;
  pageSize?: number;
  dataKey: string;
  totalKey?: string;
  enabled?: boolean;
}

interface CacheEntry {
  items: any[];
  total: number;
  ts: number;
}

const cache = new Map<string, CacheEntry>();

function cacheGet(key: string): CacheEntry | undefined {
  const hit = cache.get(key);
  if (hit) hit.ts = Date.now();
  return hit;
}

function cacheSet(key: string, items: any[], total: number) {
  cache.set(key, { items, total, ts: Date.now() });

  if (cache.size > CHUNKED_CACHE_MAX_ENTRIES) {
    // LRU eviction
    let oldestKey: string | null = null;
    let oldestTs = Infinity;
    for (const [k, v] of cache.entries()) {
      if (v.ts < oldestTs) {
        oldestTs = v.ts;
        oldestKey = k;
      }
    }
    if (oldestKey) cache.delete(oldestKey);
  }
}

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

  const cacheKey = `${endpoint}::${paramsKey}::${pageSize}::0`;

  // ============================================================
  // First page (respects tab visibility + cache)
  // ============================================================
  useEffect(() => {
    if (!enabled) return;
    if (typeof document !== "undefined" && document.hidden) return;

    const cached = cacheGet(cacheKey);
    if (cached) {
      setItems(cached.items as T[]);
      setTotal(cached.total);
      setHasMore(cached.items.length === pageSize && cached.items.length < cached.total);
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
        cacheSet(cacheKey, chunk, totalCount);
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e.message);
      } finally {
        setInitialLoading(false);
        setLoading(false);
      }
    })();

    return () => abortRef.current?.abort();
  }, [buildUrl, enabled, dataKey, pageSize, totalKey, paramsKey, endpoint, cacheKey]);

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
        cacheSet(cacheKey, chunk, totalCount);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setInitialLoading(false);
        setLoading(false);
      }
    })();
  }, [buildUrl, dataKey, pageSize, totalKey, cacheKey]);

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
