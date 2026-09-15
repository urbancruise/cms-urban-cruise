"use client";

import { useEffect, useRef } from "react";

interface Props {
  onIntersect: () => void;
  disabled?: boolean;
  rootMargin?: string;
}

export default function InfiniteScrollSentinel({
  onIntersect,
  disabled = false,
  rootMargin = "200px",
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onIntersect();
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onIntersect, disabled, rootMargin]);

  return <div ref={ref} className="h-1 w-full" aria-hidden />;
}

