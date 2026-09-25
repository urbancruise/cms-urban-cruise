"use client";

import { useCallback, useEffect, useState } from "react";

export function usePagination(total: number, pageSize = 20) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages]);

  const next = useCallback(
    () => setPage((p) => Math.min(p + 1, totalPages)),
    [totalPages]
  );
  const prev = useCallback(() => setPage((p) => Math.max(p - 1, 1)), []);
  const goTo = useCallback(
    (p: number) => setPage(Math.min(Math.max(1, p), totalPages)),
    [totalPages]
  );
  const reset = useCallback(() => setPage(1), []);

  return {
    page,
    totalPages,
    next,
    prev,
    goTo,
    reset,
    offset: (page - 1) * pageSize,
  };
}
