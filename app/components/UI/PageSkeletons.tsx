"use client";

import { Skeleton, SkeletonAvatar, SkeletonText } from "./Skeleton";

// ============================================================
// Dashboard Skeleton — KPI cards + recent activity
// ============================================================
export function DashboardSkeleton() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Skeleton height={32} width={200} className="mb-2" />
        <Skeleton height={16} width={280} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
            <Skeleton height={40} width={40} rounded="lg" className="mb-3" />
            <Skeleton height={12} width="50%" className="mb-2" />
            <Skeleton height={28} width="40%" className="mb-2" />
            <Skeleton height={10} width="60%" />
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <Skeleton height={20} width={140} className="mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 py-2">
              <SkeletonAvatar size={32} />
              <div className="flex-1">
                <Skeleton height={14} width="60%" className="mb-1.5" />
                <Skeleton height={10} width="30%" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Analytics Skeleton — KPI cards + charts + distributions
// ============================================================
export function AnalyticsSkeleton() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <Skeleton height={32} width={180} className="mb-2" />
        <Skeleton height={16} width={300} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex justify-between mb-2">
              <Skeleton height={12} width="40%" />
              <Skeleton height={14} width={50} />
            </div>
            <Skeleton height={28} width="50%" className="mb-2" />
            <Skeleton height={10} width="30%" />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton height={20} width={20} rounded="md" />
              <Skeleton height={18} width={120} />
            </div>
            <Skeleton height={12} width={100} className="mb-4" />
            {/* Bar chart placeholder */}
            <div className="flex items-end h-48 gap-1.5">
              {[40, 65, 30, 80, 55, 70, 45, 90, 60, 75, 50, 85].map((h, j) => (
                <div key={j} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex items-end h-full">
                    <Skeleton height={`${h}%`} className="w-full" rounded="md" />
                  </div>
                  <Skeleton height={8} width={20} className="mt-2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6">
            <Skeleton height={20} width={140} className="mb-4" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((j) => (
                <div key={j}>
                  <div className="flex justify-between mb-1">
                    <Skeleton height={12} width="30%" />
                    <Skeleton height={12} width="20%" />
                  </div>
                  <Skeleton height={8} className="w-full" rounded="full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Table Skeleton — for Users, Roles lists
// ============================================================
export function TableSkeleton({
  rows = 8,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex gap-6">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height={10} width={i === 0 ? 80 : 60} rounded="sm" />
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-6">
            {Array.from({ length: columns }).map((_, j) => {
              if (j === 0) {
                return (
                  <div key={j} className="flex items-center gap-3 flex-1">
                    <SkeletonAvatar size={40} />
                    <div className="space-y-1">
                      <Skeleton height={14} width={120} />
                      <Skeleton height={10} width={80} />
                    </div>
                  </div>
                );
              }
              return <Skeleton key={j} height={12} width={j === columns - 1 ? 60 : 90} />;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Card Grid Skeleton — for Cities, Roles (card layout)
// ============================================================
export function CardGridSkeleton({
  count = 6,
  className = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={`grid ${className} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <Skeleton height={40} width={40} rounded="lg" />
            <Skeleton height={20} width={60} rounded="full" />
          </div>
          <Skeleton height={16} width="60%" className="mb-2" />
          <Skeleton height={12} width="40%" className="mb-3" />
          <Skeleton height={10} width="80%" className="mb-1" />
          <Skeleton height={10} width="70%" />
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
            <Skeleton height={20} width={20} rounded="md" />
            <Skeleton height={20} width={20} rounded="md" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Profile Skeleton
// ============================================================
export function ProfileSkeleton() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Skeleton height={32} width={180} className="mb-2" />
        <Skeleton height={16} width={300} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <Skeleton height={128} className="w-full" rounded="sm" />
        <div className="pt-16 pb-8 px-8">
          <div className="flex items-start justify-between">
            <div>
              <Skeleton height={28} width={200} className="mb-2" />
              <Skeleton height={16} width={180} className="mb-2" />
              <Skeleton height={20} width={80} rounded="full" />
            </div>
            <Skeleton height={40} width={120} rounded="lg" />
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <Skeleton height={12} width="40%" className="mb-2" />
                <Skeleton height={18} width="70%" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 shadow-sm border border-slate-200"
          >
            <Skeleton height={12} width="50%" className="mb-2" />
            <Skeleton height={20} width="70%" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Activity Skeleton — with chunk support
// ============================================================
export function ActivitySkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4">
            <div className="flex items-start gap-4">
              <Skeleton height={40} width={40} rounded="lg" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton height={14} width={100} />
                  <Skeleton height={12} width={80} />
                  <Skeleton height={18} width={60} rounded="full" />
                </div>
                <Skeleton height={10} width={200} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Notification Dropdown Skeleton
// ============================================================
export function NotificationSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4">
          <Skeleton height={8} width={8} rounded="full" className="mt-2" />
          <div className="flex-1">
            <Skeleton height={14} width="60%" className="mb-1.5" />
            <Skeleton height={10} width="80%" className="mb-1.5" />
            <Skeleton height={8} width="30%" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Modal Form Skeleton
// ============================================================
export function ModalFormSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <Skeleton height={12} width="30%" className="mb-2" />
            <Skeleton height={40} className="w-full" rounded="lg" />
          </div>
        ))}
      </div>
      <div>
        <Skeleton height={12} width="20%" className="mb-2" />
        <Skeleton height={100} className="w-full" rounded="lg" />
      </div>
      <div>
        <Skeleton height={12} width="30%" className="mb-2" />
        <Skeleton height={180} className="w-full" rounded="lg" />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <Skeleton height={40} width={100} rounded="lg" />
        <Skeleton height={40} width={120} rounded="lg" />
      </div>
    </div>
  );
}
