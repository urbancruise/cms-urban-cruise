"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MdOutlineTrendingUp,
  MdOutlinePeople,
  MdOutlineSecurity,
  MdOutlineLocationCity,
  MdOutlineArrowUpward,
  MdOutlineArrowDownward,
  MdOutlineRefresh,
} from "react-icons/md";

interface MonthlyPoint {
  month: string;
  label: string;
  count: number;
}

interface RoleDist {
  slug: string;
  name: string;
  count: number;
}

interface CityDist {
  city: string;
  state: string | null;
  code: string | null;
  count: number;
}

interface AnalyticsData {
  kpis: {
    totalUsers: number;
    activeUsers: number;
    totalRoles: number;
    activeRoles: number;
    totalCities: number;
    activeCities: number;
    growthRate: number;
  };
  monthlyUsers: MonthlyPoint[];
  monthlyRoles: MonthlyPoint[];
  monthlyCities: MonthlyPoint[];
  roleDist: RoleDist[];
  cityDist: CityDist[];
}

function BarChart({
  data,
  colorFrom,
  colorTo,
  emptyText,
}: {
  data: MonthlyPoint[];
  colorFrom: string;
  colorTo: string;
  emptyText: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <p className="text-sm text-gray-500 text-center py-16">{emptyText}</p>
    );
  }

  return (
    <div className="flex items-end h-48 gap-1.5">
      {data.map((m) => (
        <div key={m.month} className="flex-1 flex flex-col items-center">
          <div className="w-full flex items-end h-full">
            <div
              className={`w-full bg-gradient-to-t ${colorFrom} ${colorTo} rounded-md transition-all hover:opacity-80`}
              style={{ height: `${Math.max(4, (m.count / max) * 100)}%` }}
              title={`${m.label}: ${m.count}`}
            />
          </div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">
            {m.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setError("");
      const res = await fetch("/api/admin/analytics/stats", {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load analytics");
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg">
          {error || "No data available"}
        </div>
      </div>
    );
  }

  const totalUsers = data.kpis.totalUsers || 1;
  const totalCities = data.kpis.totalCities || 1;

  const metrics = [
    {
      label: "Total Users",
      value: data.kpis.totalUsers.toString(),
      change: `${data.kpis.growthRate >= 0 ? "+" : ""}${data.kpis.growthRate}%`,
      trend: data.kpis.growthRate >= 0 ? "up" : "down",
      period: "vs last month",
    },
    {
      label: "Total Roles",
      value: data.kpis.totalRoles.toString(),
      change: `${data.kpis.activeRoles} active`,
      trend: "up",
      period: "current",
    },
    {
      label: "Total Cities",
      value: data.kpis.totalCities.toString(),
      change: `${data.kpis.activeCities} active`,
      trend: "up",
      period: "current",
    },
    {
      label: "Growth Rate",
      value: `${data.kpis.growthRate}%`,
      change: `${data.kpis.growthRate >= 0 ? "+" : ""}${data.kpis.growthRate}%`,
      trend: data.kpis.growthRate >= 0 ? "up" : "down",
      period: "vs last month",
    },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track users, roles and cities activity
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          title="Refresh"
        >
          <MdOutlineRefresh className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {metric.label}
              </p>
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  metric.trend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                {metric.change}
                {metric.trend === "up" ? (
                  <MdOutlineArrowUpward className="w-4 h-4" />
                ) : (
                  <MdOutlineArrowDownward className="w-4 h-4" />
                )}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {metric.value}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {metric.period}
            </p>
          </div>
        ))}
      </div>

      {/* Three monthly charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <MdOutlinePeople className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              User Signups
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Last 12 months
          </p>
          <BarChart
            data={data.monthlyUsers}
            colorFrom="from-blue-400"
            colorTo="to-blue-600"
            emptyText="No user signups in the last 12 months"
          />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <MdOutlineSecurity className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Roles Created
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Last 12 months
          </p>
          <BarChart
            data={data.monthlyRoles}
            colorFrom="from-orange-400"
            colorTo="to-orange-600"
            emptyText="No roles created in the last 12 months"
          />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <MdOutlineLocationCity className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Cities Added
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Last 12 months
          </p>
          <BarChart
            data={data.monthlyCities}
            colorFrom="from-green-400"
            colorTo="to-green-600"
            emptyText="No cities added in the last 12 months"
          />
        </div>
      </div>

      {/* Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users per role */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <MdOutlineSecurity className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Users per Role
            </h2>
          </div>
          {data.roleDist.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              No roles data
            </p>
          ) : (
            <div className="space-y-4">
              {data.roleDist.map((role) => {
                const pct = Math.round((role.count / totalUsers) * 100);
                const color =
                  role.slug === "admin"
                    ? "from-red-500 to-red-600"
                    : role.slug === "manager"
                    ? "from-yellow-500 to-yellow-600"
                    : "from-blue-500 to-blue-600";
                return (
                  <div key={role.slug}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                        {role.name}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {role.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`bg-gradient-to-r ${color} h-2 rounded-full transition-all`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Users per city */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <MdOutlineLocationCity className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Users per City
            </h2>
          </div>
          {data.cityDist.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              No cities data
            </p>
          ) : (
            <div className="space-y-4">
              {data.cityDist.map((c) => {
                const pct = Math.round((c.count / totalUsers) * 100);
                return (
                  <div key={`${c.city}-${c.state}`}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {c.city}
                        {c.state && (
                          <span className="text-xs text-gray-400 ml-1">
                            ({c.state})
                          </span>
                        )}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {c.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <MdOutlinePeople className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Users
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data.kpis.totalUsers}
            </p>
            <p
              className={`text-xs ${
                data.kpis.growthRate >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {data.kpis.growthRate >= 0 ? "↑" : "↓"}{" "}
              {Math.abs(data.kpis.growthRate)}% this month
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
            <MdOutlineSecurity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Roles
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data.kpis.totalRoles}
            </p>
            <p className="text-xs text-green-600">
              {data.kpis.activeRoles} active
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <MdOutlineLocationCity className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Cities
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data.kpis.totalCities}
            </p>
            <p className="text-xs text-green-600">
              {data.kpis.activeCities} active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

