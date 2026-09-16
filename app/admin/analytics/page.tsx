"use client";

import { useScopedFetch } from "@/lib/use-scoped-fetch";
import { AnalyticsSkeleton } from "@/app/components/UI/PageSkeletons";
import {
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
      <p className="text-sm text-slate-400 text-center py-16">{emptyText}</p>
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
          <span className="text-[10px] text-slate-400 mt-2">{m.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading, error, mutate } = useScopedFetch<AnalyticsData>(
    "/api/admin/analytics/stats"
  );

  // ✅ Skeleton on initial load
  if (isLoading && !data) {
    return <AnalyticsSkeleton />;
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error?.message || "No data available"}
        </div>
      </div>
    );
  }

  const totalUsers = data.kpis.totalUsers || 1;

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
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 mt-1">
            Track users, roles and cities activity
          </p>
        </div>
        <button
          onClick={() => mutate()}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          title="Refresh"
        >
          <MdOutlineRefresh className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">{metric.label}</p>
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
            <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
            <p className="text-xs text-slate-400 mt-1">{metric.period}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <MdOutlinePeople className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              User Signups
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">Last 12 months</p>
          <BarChart
            data={data.monthlyUsers}
            colorFrom="from-teal-400"
            colorTo="to-teal-600"
            emptyText="No user signups in the last 12 months"
          />
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <MdOutlineSecurity className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900">
              Roles Created
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">Last 12 months</p>
          <BarChart
            data={data.monthlyRoles}
            colorFrom="from-amber-400"
            colorTo="to-amber-600"
            emptyText="No roles created in the last 12 months"
          />
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <MdOutlineLocationCity className="w-5 h-5 text-sky-500" />
            <h2 className="text-lg font-semibold text-slate-900">
              Cities Added
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">Last 12 months</p>
          <BarChart
            data={data.monthlyCities}
            colorFrom="from-sky-400"
            colorTo="to-sky-600"
            emptyText="No cities added in the last 12 months"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <MdOutlineSecurity className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900">
              Users per Role
            </h2>
          </div>
          {data.roleDist.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              No roles data
            </p>
          ) : (
            <div className="space-y-4">
              {data.roleDist.map((role) => {
                const pct = Math.round((role.count / totalUsers) * 100);
                const color =
                  role.slug === "admin"
                    ? "from-red-400 to-red-500"
                    : role.slug === "manager"
                    ? "from-amber-400 to-amber-500"
                    : "from-teal-400 to-teal-500";
                return (
                  <div key={role.slug}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600 capitalize">
                        {role.name}
                      </span>
                      <span className="text-sm font-medium text-slate-900">
                        {role.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
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

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <MdOutlineLocationCity className="w-5 h-5 text-sky-500" />
            <h2 className="text-lg font-semibold text-slate-900">
              Users per City
            </h2>
          </div>
          {data.cityDist.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              No cities data
            </p>
          ) : (
            <div className="space-y-4">
              {data.cityDist.map((c) => {
                const pct = Math.round((c.count / totalUsers) * 100);
                return (
                  <div key={`${c.city}-${c.state}`}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">
                        {c.city}
                        {c.state && (
                          <span className="text-xs text-slate-400 ml-1">
                            ({c.state})
                          </span>
                        )}
                      </span>
                      <span className="text-sm font-medium text-slate-900">
                        {c.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-sky-400 to-sky-500 h-2 rounded-full transition-all"
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
    </div>
  );
}
