"use client";

import { useEffect, useState, useCallback } from "react";
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
    bg: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: MdOutlineAdd,
    label: "Created",
  },
  update: {
    bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: MdOutlineEdit,
    label: "Updated",
  },
  delete: {
    bg: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
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

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("All");
  const [action, setAction] = useState("All");
  const [page, setPage] = useState(0);
  const limit = 20;

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String(page * limit));
      if (search) params.set("search", search);
      if (entityType !== "All") params.set("entity_type", entityType);
      if (action !== "All") params.set("action", action);

      const res = await fetch(`/api/admin/activity?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load activity");
      setActivities(data.activities || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, entityType, action]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const totalPages = Math.ceil(total / limit);

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

      if (rows.length === 0) {
        return (
          <p className="text-xs text-gray-400">No field changes detected</p>
        );
      }

      return (
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div key={r.key} className="text-xs flex flex-wrap gap-1">
              <span className="font-medium text-gray-500 dark:text-gray-400">
                {r.key}:
              </span>
              <span className="text-red-600 dark:text-red-400 line-through">
                {formatVal(r.b)}
              </span>
              <span className="text-gray-400">→</span>
              <span className="text-green-600 dark:text-green-400">
                {formatVal(r.a)}
              </span>
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
              <span className="font-medium text-gray-500 dark:text-gray-400">
                {key}:
              </span>{" "}
              <span className="text-gray-700 dark:text-gray-300">
                {formatVal(val)}
              </span>
            </div>
          ))}
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <MdOutlineHistory className="w-8 h-8 text-blue-500" />
            Activity History
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Every create, update and delete — full audit trail ({total}{" "}
            entries)
          </p>
        </div>
        <button
          onClick={fetchActivities}
          className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          title="Refresh"
        >
          <MdOutlineRefresh className="w-5 h-5" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by entity name or user..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(0);
          }}
          className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Types</option>
          <option value="user">Users</option>
          <option value="role">Roles</option>
          <option value="city">Cities</option>
        </select>
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(0);
          }}
          className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Actions</option>
          <option value="create">Created</option>
          <option value="update">Updated</option>
          <option value="delete">Deleted</option>
        </select>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* List */}
      {loading && activities.length === 0 ? (
        <div className="flex justify-center h-64 items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 py-16 text-center">
          <MdOutlineHistory className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            No activity found
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
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
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${style.bg}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {a.user_name || `User #${a.user_id}`}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {style.label.toLowerCase()}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          {ENTITY_LABEL[a.entity_type] || a.entity_type}
                        </span>
                        {a.entity_name && (
                          <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
                            {a.entity_name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
                        <span>{new Date(a.created_at).toLocaleString()}</span>
                        {a.ip_address && <span>IP: {a.ip_address}</span>}
                      </div>

                      {hasChanges && (
                        <button
                          onClick={() => setExpanded(isExpanded ? null : a.id)}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
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
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                          {renderChanges(a.changes)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {page + 1} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}