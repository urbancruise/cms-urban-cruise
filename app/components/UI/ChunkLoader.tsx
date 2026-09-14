"use client";

export function ChunkSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-4 p-4 rounded-lg border border-slate-200"
        >
          <div className="uc-skeleton w-10 h-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="uc-skeleton h-4 w-1/3 rounded" />
            <div className="uc-skeleton h-3 w-1/2 rounded" />
            <div className="uc-skeleton h-3 w-1/4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChunkSpinner() {
  return (
    <div className="flex justify-center py-6">
      <div className="w-8 h-8 border-[3px] border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function EndOfList() {
  return (
    <div className="text-center py-6 text-sm text-slate-400">
      ✦ You&apos;ve reached the end ✦
    </div>
  );
}