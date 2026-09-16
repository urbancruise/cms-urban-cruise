"use client";

import { useScopedFetch } from "@/lib/use-scoped-fetch";
import { DashboardSkeleton } from "@/app/components/UI/PageSkeletons";
import {
  MdOutlinePeople,
  MdOutlineSecurity,
  MdOutlineLocationCity,
  MdOutlineHistory,
} from "react-icons/md";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  activeRoles: number;
  totalCities: number;
  activeCities: number;
  userGrowth: number;
}

interface RecentActivity {
  type: string;
  id: number;
  title: string;
  description: string;
  created_at: string;
  time_ago: string;
}

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useScopedFetch<{
    stats: Stats;
    recentActivity: RecentActivity[];
  }>("/api/admin/dashboard/stats");

  // ✅ Show skeleton on initial load
  if (isLoading && !data) {
    return <DashboardSkeleton />;
  }

  const stats = data?.stats;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your CMS</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          sub={`${stats?.activeUsers ?? 0} active`}
          icon={MdOutlinePeople}
          color="teal"
        />
        <StatCard
          label="Total Roles"
          value={stats?.totalRoles ?? 0}
          sub={`${stats?.activeRoles ?? 0} active`}
          icon={MdOutlineSecurity}
          color="amber"
        />
        <StatCard
          label="Total Cities"
          value={stats?.totalCities ?? 0}
          sub={`${stats?.activeCities ?? 0} active`}
          icon={MdOutlineLocationCity}
          color="sky"
        />
        <StatCard
          label="Growth"
          value={`${stats?.userGrowth ?? 0}%`}
          sub="vs last month"
          icon={MdOutlineHistory}
          color="green"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Recent Activity
        </h2>
        {!data?.recentActivity?.length ? (
          <p className="text-sm text-slate-400 py-6 text-center">
            No recent activity
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.recentActivity.map((a) => (
              <li key={`${a.type}-${a.id}`} className="py-3">
                <p className="text-sm text-slate-900 font-medium">
                  {a.description}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{a.time_ago}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: any;
  color: "teal" | "amber" | "sky" | "green";
}) {
  const colors = {
    teal: "bg-teal-50 text-teal-600",
    amber: "bg-amber-50 text-amber-600",
    sky: "bg-sky-50 text-sky-600",
    green: "bg-green-50 text-green-600",
  }[color];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}
