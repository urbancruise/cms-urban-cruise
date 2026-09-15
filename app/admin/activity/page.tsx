"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  MdOutlineAdd,
  MdOutlineEdit,
  MdOutlineDelete,
  MdOutlineRefresh,
  MdOutlineSearch,
  MdOutlineHistory,
  MdOutlineExpandMore,
  MdOutlineExpandLess,
} from "react-icons/md";
import { useChunkedFetch } from "@/app/hooks/useChunkedFetch";
import InfiniteScrollSentinel from "@/app/components/UI/InfiniteScrollSentinel";
import {
  ChunkSkeleton,
  ChunkSpinner,
  EndOfList,
} from "@/app/components/UI/ChunkLoader";

interface Activity {
  id: number;
  user_id: number | null;
  user_name: string | null;
  action: "create" | "update" | "delete";
  entity_type: string;
  entity_id: number | null;
  entity_name: string | null;
  changes: any;
  ip_address: string | null;
  created_at: string;
}

const ACTION_STYLE: Record<
  string,
  { bg: string; icon: any; label: string }
> = {
  create: {
    bg: "bg-teal-50 text-teal-700 border border-teal-200",
    icon: MdOutlineAdd,
    label: "Created",
  },
  update: {
    bg: "bg-sky-50 text-sky-700 border border-sky-200",
    icon: MdOutlineEdit,
    label: "Updated",
  },
  delete: {
    bg: "bg-red-50 text-red-700 border border-red-200",
    icon: MdOutlineDelete,
    label: "Deleted",
  },
};

const ENTITY_LABEL: Record<string, string> = {
  user: "User",
  role: "Role",
  city: "City",
  profile: "Profile",
};

const PAGE_SIZE = 20;

export default function ActivityPage() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("All");
  const [action, setAction] = useState("All");

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const params = useMemo(
    () => ({
      search: search || undefined,
      entity_type: entityType !== "All" ? entityType : undefined,
      action: action !== "All" ? action : undefined,
    }),
    [search, entityType, action]
  );

  const {
    items: activities,
    total,
    loading,
    initialLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  } = useChunkedFetch<Activity>({
    endpoint: "/api/admin/activity",
    params,
    pageSize: PAGE_SIZE,
    dataKey: "activities",
    totalKey: "total",
  });

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) loadMore();
  }, [hasMore, loading, loadMore]);

  const formatVal = (v: any): string => {
    if (v === null || v === undefined) return "—";
    if (Array.isArray(v)) return `[${v.join(", ")}]`;
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };

  const renderChanges = (changes: any) => {
    if (!changes || typeof changes !== "object") return null;

    if (changes.before && changes.after) {
      const keys = new Set([
        ...Object.keys(changes.before),
        ...Object.keys(changes.after),
      ]);
      const rows: { key: string; b: any; a: any }[] = [];
      keys.forEach((k) => {
        const b = changes.before[k];
        const a = changes.after[k];
        if (JSON.stringify(b) !== JSON.stringify(a)) {
          rows.push({ key: k, b, a });
        }
      });
      if (rows.length === 0)
        return <p className="text-xs text-slate-400">No field changes detected</p>;

      return (
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div key={r.key} className="text-xs flex flex-wrap gap-1">
              <span className="font-medium text-slate-500">{r.key}:</span>
              <span className="text-red-600 line-through">{formatVal(r.b)}</span>
              <span className="text-slate-400">→</span>
              <span className="text-teal-700">{formatVal(r.a)}</span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {Object.entries(changes)
          .filter(([k]) => k !== "deleted")
          .map(([key, val]) => (
            <div key={key} className="text-xs">
              <span className="font-medium text-slate-500">{key}:</span>{" "}
              <span className="text-slate-700">{formatVal(val)}</span>
            </div>
          ))}
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <MdOutlineHistory className="w-8 h-8 text-teal-600" />
            Activity History
          </h1>
          <p className="text-slate-500 mt-1">
            Full audit trail ({total} entries)
          </p>
        </div>
        <button
          onClick={refresh}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          title="Refresh"
        >
          <MdOutlineRefresh className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by entity name or user..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="All">All Types</option>
          <option value="user">Users</option>
          <option value="role">Roles</option>
          <option value="city">Cities</option>
        </select>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="All">All Actions</option>
          <option value="create">Created</option>
          <option value="update">Updated</option>
          <option value="delete">Deleted</option>
        </select>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {initialLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <ChunkSkeleton rows={6} />
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <MdOutlineHistory className="w-12 h-12 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500">No activity found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {activities.map((a) => {
                const style = ACTION_STYLE[a.action] || ACTION_STYLE.update;
                const Icon = style.icon;
                const isExpanded = expanded === a.id;
                const hasChanges =
                  a.changes &&
                  typeof a.changes === "object" &&
                  Object.keys(a.changes).length > 0;

                return (
                  <div
                    key={a.id}
                    className="p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${style.bg}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-900">
                            {a.user_name || `User #${a.user_id}`}
                          </span>
                          <span className="text-slate-500">
                            {style.label.toLowerCase()}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-medium">
                            {ENTITY_LABEL[a.entity_type] || a.entity_type}
                          </span>
                          {a.entity_name && (
                            <span className="font-mono text-sm text-teal-700">
                              {a.entity_name}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                          <span>{new Date(a.created_at).toLocaleString()}</span>
                          {a.ip_address && <span>IP: {a.ip_address}</span>}
                        </div>

                        {hasChanges && (
                          <button
                            onClick={() => setExpanded(isExpanded ? null : a.id)}
                            className="mt-2 text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1 font-medium"
                          >
                            {isExpanded ? (
                              <>
                                <MdOutlineExpandLess className="w-3.5 h-3.5" />
                                Hide details
                              </>
                            ) : (
                              <>
                                <MdOutlineExpandMore className="w-3.5 h-3.5" />
                                Show changes
                              </>
                            )}
                          </button>
                        )}

                        {isExpanded && hasChanges && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            {renderChanges(a.changes)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {hasMore ? (
            <>
              <InfiniteScrollSentinel onIntersect={handleLoadMore} disabled={loading} />
              {loading && <ChunkSpinner />}
              {!loading && (
                <div className="flex justify-center py-6">
                  <button
                    onClick={handleLoadMore}
                    className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                  >
                    Load more ({activities.length} / {total})
                  </button>
                </div>
              )}
            </>
          ) : (
            activities.length > PAGE_SIZE && <EndOfList />
          )}
        </>
      )}
    </div>
  );
}