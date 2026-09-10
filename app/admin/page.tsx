/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MdOutlinePeople,
  MdOutlineSecurity,
  MdOutlineLocationCity,
  MdOutlineTrendingUp,
  MdOutlineTrendingDown,
  MdOutlineArrowForward,
  MdOutlineRefresh,
  MdOutlineCheckCircle,
} from "react-icons/md";
import Link from "next/link";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  activeRoles: number;
  totalCities: number;
  activeCities: number;
  userGrowth: number;
}

interface Activity {
  type: string;
  id: number;
  title: string;
  description: string;
  time_ago: string;
}

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
  },
  orange: {
    bg: "bg-orange-100 dark:bg-orange-900/20",
    text: "text-orange-600 dark:text-orange-400",
  },
  green: {
    bg: "bg-green-100 dark:bg-green-900/20",
    text: "text-green-600 dark:text-green-400",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/20",
    text: "text-purple-600 dark:text-purple-400",
  },
};

const ACTIVITY_BADGE: Record<string, { label: string; cls: string }> = {
  user: {
    label: "New User",
    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  role: {
    label: "New Role",
    cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  city: {
    label: "New City",
    cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
};

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    try {
      setError("");
      const res = await fetch("/api/admin/dashboard/stats", {
        cache: "no-store",
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load stats");

      setStats(data.stats);
      setActivity(data.recentActivity || []);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cards = stats
    ? [
        {
          icon: MdOutlinePeople,
          label: "Total Users",
          value: stats.totalUsers.toString(),
          change: `${stats.activeUsers} active`,
          trend: stats.userGrowth >= 0 ? "up" : "down",
          color: "blue",
        },
        {
          icon: MdOutlineSecurity,
          label: "Total Roles",
          value: stats.totalRoles.toString(),
          change: `${stats.activeRoles} active`,
          trend: "up",
          color: "orange",
        },
        {
          icon: MdOutlineLocationCity,
          label: "Total Cities",
          value: stats.totalCities.toString(),
          change: `${stats.activeCities} active`,
          trend: "up",
          color: "green",
        },
        {
          icon: MdOutlineTrendingUp,
          label: "User Growth",
          value: `${stats.userGrowth >= 0 ? "+" : ""}${stats.userGrowth}%`,
          change: "vs last month",
          trend: stats.userGrowth >= 0 ? "up" : "down",
          color: "purple",
        },
      ]
    : [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening.
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          title="Refresh"
        >
          <MdOutlineRefresh className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((stat) => {
          const Icon = stat.icon;
          const colors = COLOR_MAP[stat.color];
          return (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.change}
                  {stat.trend === "up" ? (
                    <MdOutlineTrendingUp className="w-4 h-4" />
                  ) : (
                    <MdOutlineTrendingDown className="w-4 h-4" />
                  )}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h2>
            <Link
              href="/admin/users"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View All Users
              <MdOutlineArrowForward className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {activity.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                No recent activity.
              </p>
            ) : (
              activity.map((item) => {
                const badge = ACTIVITY_BADGE[item.type] || ACTIVITY_BADGE.user;
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.description}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.time_ago}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              href="/admin/users"
              className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-blue-600 dark:text-blue-400"
            >
              <MdOutlinePeople className="w-5 h-5" />
              <span className="font-medium">Manage Users</span>
            </Link>
            <Link
              href="/admin/roles"
              className="w-full flex items-center gap-3 px-4 py-3 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors text-orange-600 dark:text-orange-400"
            >
              <MdOutlineCheckCircle className="w-5 h-5" />
              <span className="font-medium">Manage Roles</span>
            </Link>
            <Link
              href="/admin/cities"
              className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors text-green-600 dark:text-green-400"
            >
              <MdOutlineLocationCity className="w-5 h-5" />
              <span className="font-medium">Manage Cities</span>
            </Link>
            <Link
              href="/admin/profile"
              className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors text-purple-600 dark:text-purple-400"
            >
              <span className="text-xl">👤</span>
              <span className="font-medium">View Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

