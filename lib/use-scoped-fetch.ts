"use client";

import useSWR, { type SWRConfiguration } from "swr";
import { useEffect, useState } from "react";

// ============================================================
// Tab visibility hook
// ============================================================
export function usePageVisible() {
  const [visible, setVisible] = useState(
    typeof document !== "undefined" ? !document.hidden : true
  );

  useEffect(() => {
    const handler = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  return visible;
}

// ============================================================
// Scoped SWR — only fetches when tab visible + mounted
// ============================================================
export function useScopedFetch<T = any>(
  key: string | null,
  options?: SWRConfiguration<T>
) {
  const visible = usePageVisible();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldFetch = key && mounted && visible;

  return useSWR<T>(shouldFetch ? key : null, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    ...options,
  });
}