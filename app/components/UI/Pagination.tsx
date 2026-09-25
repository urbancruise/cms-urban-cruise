"use client";

import { MdOutlineChevronLeft, MdOutlineChevronRight } from "react-icons/md";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 20,
}: Props) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  if (start > 1) pages.push(1, "...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages) pages.push("...", totalPages);

  const btnBase =
    "min-w-[36px] h-9 px-3 text-sm rounded-lg border transition-colors flex items-center justify-center";

  return (
    <div className="flex items-center justify-between gap-4 py-4 flex-wrap">
      {totalItems !== undefined && (
        <p className="text-sm text-slate-500">
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} of{" "}
          {totalItems}
        </p>
      )}
      <div className="flex items-center gap-1.5 ml-auto">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={`${btnBase} border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600`}
        >
          <MdOutlineChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="px-2 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`${btnBase} ${
                p === page
                  ? "bg-teal-600 text-white border-teal-600"
                  : "border-slate-200 hover:bg-slate-50 text-slate-600"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={`${btnBase} border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600`}
        >
          <MdOutlineChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
