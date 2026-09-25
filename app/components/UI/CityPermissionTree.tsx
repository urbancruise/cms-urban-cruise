"use client";

import { useState, useMemo } from "react";
import {
  MdOutlineLocationOn,
  MdOutlineKeyboardArrowDown,
  MdOutlineKeyboardArrowRight,
} from "react-icons/md";
import {
  PermissionGroup,
  WEBSITE_PERMISSION_TREE,
  collectAllKeys,
} from "@/lib/permissionTree";

export interface CityAccess {
  city_id: number;
  permissions: string[];
}

interface City {
  id: number;
  name: string;
  state: string | null;
  code: string | null;
}

interface Props {
  cities: City[];
  value: CityAccess[];
  onChange: (next: CityAccess[]) => void;
  allowedPermissions?: string[] | null;
  loading?: boolean;
}

// ============================================================
// Filter tree: keep only branches that have at least one
// allowed permission. Ancestors of allowed nodes are kept.
// ============================================================
function filterTreeByAllowed(
  nodes: PermissionGroup[],
  allowed: Set<string>
): PermissionGroup[] {
  const result: PermissionGroup[] = [];

  for (const node of nodes) {
    if (node.children?.length) {
      const filteredChildren = filterTreeByAllowed(node.children, allowed);
      const selfAllowed = node.permKey ? allowed.has(node.permKey) : false;

      if (selfAllowed || filteredChildren.length > 0) {
        result.push({
          ...node,
          children: filteredChildren,
        });
      }
      continue;
    }

    if (node.permKey && allowed.has(node.permKey)) {
      result.push(node);
    }
  }

  return result;
}

export default function CityPermissionTree({
  cities,
  value,
  onChange,
  allowedPermissions,
  loading = false,
}: Props) {
  const [expandedCities, setExpandedCities] = useState<number[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);

  const visibleTree = useMemo<PermissionGroup[]>(() => {
    if (!allowedPermissions || allowedPermissions.length === 0) {
      return WEBSITE_PERMISSION_TREE;
    }
    const allowedSet = new Set(allowedPermissions);
    return filterTreeByAllowed(WEBSITE_PERMISSION_TREE, allowedSet);
  }, [allowedPermissions]);

  const ALL_VISIBLE_KEYS = useMemo(() => collectAllKeys(visibleTree), [visibleTree]);

  const getCityAccess = (cityId: number): string[] =>
    value.find((v) => v.city_id === cityId)?.permissions || [];

  const updateCityAccess = (cityId: number, perms: string[]) => {
    const without = value.filter((v) => v.city_id !== cityId);
    if (perms.length === 0) {
      onChange(without);
    } else {
      onChange([...without, { city_id: cityId, permissions: perms }]);
    }
  };

  const toggleCitySelection = (cityId: number) => {
    const current = getCityAccess(cityId);
    if (current.length > 0) {
      updateCityAccess(cityId, []);
    } else {
      updateCityAccess(cityId, [...ALL_VISIBLE_KEYS]);
    }
  };

  const toggleCityExpand = (cityId: number) => {
    setExpandedCities((prev) =>
      prev.includes(cityId) ? prev.filter((id) => id !== cityId) : [...prev, cityId]
    );
  };

  const toggleNodeExpand = (key: string) => {
    setExpandedNodes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const isNodeExpanded = (key: string) => expandedNodes.includes(key);

  const togglePerm = (cityId: number, permKey: string) => {
    const current = getCityAccess(cityId);
    const has = current.includes(permKey);
    const next = has ? current.filter((p) => p !== permKey) : [...current, permKey];
    updateCityAccess(cityId, next);
  };

  const toggleBranch = (cityId: number, node: PermissionGroup) => {
    const keys = collectAllKeys([node]);
    const current = getCityAccess(cityId);
    const allSelected = keys.every((k) => current.includes(k));

    if (allSelected) {
      updateCityAccess(
        cityId,
        current.filter((p) => !keys.includes(p))
      );
    } else {
      const set = new Set([...current, ...keys]);
      updateCityAccess(cityId, Array.from(set));
    }
  };

  const branchState = (
    cityId: number,
    node: PermissionGroup
  ): "all" | "some" | "none" => {
    const keys = collectAllKeys([node]);
    const current = getCityAccess(cityId);
    const selected = keys.filter((k) => current.includes(k)).length;
    if (selected === 0) return "none";
    if (selected === keys.length) return "all";
    return "some";
  };

  const renderPermNode = (
    cityId: number,
    node: PermissionGroup,
    depth = 0
  ): React.ReactNode => {
    const hasChildren = Boolean(node.children?.length);
    const state = branchState(cityId, node);
    const expanded = isNodeExpanded(node.key);
    const Icon = node.icon;
    const indent = depth * 18;

    return (
      <div key={node.key}>
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
            state !== "none" ? "bg-teal-50/70" : "hover:bg-slate-50"
          }`}
          style={{ paddingLeft: `${8 + indent}px` }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleNodeExpand(node.key)}
              className="p-0.5 rounded hover:bg-slate-200 flex-shrink-0"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? (
                <MdOutlineKeyboardArrowDown className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <MdOutlineKeyboardArrowRight className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
          ) : (
            <span className="w-4 flex-shrink-0" />
          )}

          {node.permKey ? (
            <input
              type="checkbox"
              checked={getCityAccess(cityId).includes(node.permKey)}
              onChange={() => togglePerm(cityId, node.permKey!)}
              className="w-3.5 h-3.5 text-teal-600 border-slate-300 rounded focus:ring-teal-500 flex-shrink-0"
            />
          ) : (
            <input
              type="checkbox"
              checked={state === "all"}
              ref={(el) => {
                if (el) el.indeterminate = state === "some";
              }}
              onChange={() => toggleBranch(cityId, node)}
              className="w-3.5 h-3.5 text-teal-600 border-slate-300 rounded focus:ring-teal-500 flex-shrink-0"
            />
          )}

          {Icon && (
            <Icon
              className={`w-3.5 h-3.5 flex-shrink-0 ${
                state !== "none" ? "text-teal-600" : "text-slate-400"
              }`}
            />
          )}

          <span
            className={`text-xs flex-1 truncate ${
              state !== "none" ? "font-medium text-slate-900" : "text-slate-600"
            }`}
          >
            {node.label}
          </span>
        </div>

        {hasChildren && expanded && (
          <div className="mt-0.5">
            {node.children!.map((child) => renderPermNode(cityId, child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="border border-slate-200 rounded-lg bg-white p-6 text-center">
        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 mt-2">Loading permissions...</p>
      </div>
    );
  }

  if (visibleTree.length === 0) {
    return (
      <div className="border border-slate-200 rounded-lg bg-slate-50 p-6 text-center">
        <MdOutlineLocationOn className="w-8 h-8 mx-auto text-slate-300" />
        <p className="text-sm text-slate-500 mt-2 font-medium">
          No website permissions available
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Select a role that has Urban Cruise Website access first.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
      <div className="p-2 max-h-[500px] overflow-y-auto">
        {cities.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-400">
            No cities available
          </div>
        ) : (
          cities.map((city) => {
            const perms = getCityAccess(city.id);
            const isExpanded = expandedCities.includes(city.id);
            const hasAny = perms.length > 0;
            const hasAll =
              ALL_VISIBLE_KEYS.length > 0 &&
              ALL_VISIBLE_KEYS.every((k) => perms.includes(k));

            return (
              <div key={city.id} className="border-b border-slate-100 last:border-b-0">
                <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleCityExpand(city.id)}
                    className="p-0.5 rounded hover:bg-slate-200 flex-shrink-0"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isExpanded ? (
                      <MdOutlineKeyboardArrowDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <MdOutlineKeyboardArrowRight className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  <input
                    type="checkbox"
                    checked={hasAll}
                    ref={(el) => {
                      if (el) el.indeterminate = hasAny && !hasAll;
                    }}
                    onChange={() => toggleCitySelection(city.id)}
                    className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 flex-shrink-0"
                  />

                  <MdOutlineLocationOn
                    className={`w-4 h-4 flex-shrink-0 ${
                      hasAny ? "text-teal-600" : "text-slate-400"
                    }`}
                  />

                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-900">
                      {city.name}
                    </span>
                    {city.state && (
                      <span className="text-xs text-slate-400 ml-1">({city.state})</span>
                    )}
                  </div>

                  {city.code && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {city.code}
                    </span>
                  )}

                  {hasAny && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        hasAll
                          ? "bg-teal-100 text-teal-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {perms.length}/{ALL_VISIBLE_KEYS.length}
                    </span>
                  )}
                </div>

                {isExpanded && (
                  <div className="bg-slate-50/50 px-2 py-2 border-t border-slate-100">
                    {visibleTree.map((node) => renderPermNode(city.id, node))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs text-slate-500">
          Click a city&apos;s arrow to grant access to specific pages. Parent checkbox
          selects all children.
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              onChange(
                cities.map((c) => ({
                  city_id: c.id,
                  permissions: [...ALL_VISIBLE_KEYS],
                }))
              )
            }
            className="text-xs text-teal-600 hover:text-teal-700 font-medium"
          >
            Select All for All Cities
          </button>
          <span className="text-xs text-slate-300">|</span>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-red-600 hover:text-red-700 font-medium"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}
