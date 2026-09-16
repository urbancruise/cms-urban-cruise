"use client";

import type { CSSProperties } from "react";

// ============================================================
// Base Skeleton — rectangular shimmer block
// ============================================================
interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
  style?: CSSProperties;
}

const ROUND = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

export function Skeleton({
  className = "",
  width,
  height,
  rounded = "md",
  style,
}: SkeletonProps) {
  return (
    <div
      className={`uc-skeleton ${ROUND[rounded]} ${className}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

// ============================================================
// Text line — for paragraphs, titles
// ============================================================
export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          rounded="sm"
          width={i === lines - 1 ? "60%" : "100%"}
        />
      ))}
    </div>
  );
}

// ============================================================
// Avatar — circle with shimmer
// ============================================================
export function SkeletonAvatar({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Skeleton
      width={size}
      height={size}
      rounded="full"
      className={className}
    />
  );
}

// ============================================================
// Card — generic rectangular card skeleton
// ============================================================
export function SkeletonCard({
  rows = 3,
  className = "",
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-5 ${className}`}
    >
      <Skeleton height={40} width={40} rounded="lg" className="mb-3" />
      <Skeleton height={14} width="40%" className="mb-2" />
      <Skeleton height={24} width="60%" className="mb-3" />
      <SkeletonText lines={rows - 2} />
    </div>
  );
}