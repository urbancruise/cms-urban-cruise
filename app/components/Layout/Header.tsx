"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import {
  MdOutlineNotifications,
  MdOutlineMenu,
  MdOutlineClose,
  MdOutlineLogout,
  MdOutlineDashboard,
  MdOutlineAccountCircle,
  MdOutlineDoneAll,
  MdOutlineDeleteSweep,
  MdOutlineNotificationsActive,
} from "react-icons/md";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { fetcher } from "@/lib/swr-config";
import { NotificationSkeleton } from "@/app/components/UI/PageSkeletons";

interface HeaderProps {
  toggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  entity_type: string;
  entity_id: number | null;
  actor_name: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export default function Header({ toggleSidebar, isSidebarOpen }: HeaderProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const { data, error, mutate } = useSWR<{
    notifications: NotificationItem[];
    unread: number;
  }>(user ? "/api/notifications?limit=15" : null, fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unread || 0;
  const isLoading = !data && !error;

  const getPageTitle = () => {
    const path = pathname?.split("/").pop() || "dashboard";
    if (path === "admin") return "Dashboard";
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const displayName = user?.full_name || user?.username || "User";
  const displayEmail = user?.email || "user@urbancruise.com";
  const displayRole = user?.role || "User";
  const displayInitials = getInitials(displayName);
  const avatarUrl = user?.avatar_url || null;  // ✅

  const markAllRead = useCallback(async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    mutate();
  }, [mutate]);

  const markOneRead = useCallback(
    async (id: number) => {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      mutate();
    },
    [mutate]
  );

  const deleteOne = useCallback(
    async (id: number) => {
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
      mutate();
    },
    [mutate]
  );

  const clearAll = useCallback(async () => {
    if (!confirm("Clear all notifications?")) return;
    await fetch("/api/notifications?all=true", { method: "DELETE" });
    mutate();
  }, [mutate]);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <header className="flex-shrink-0 bg-white border-b border-slate-200 z-30">
      <div className="px-6 h-16 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? (
              <MdOutlineClose className="w-5 h-5 text-slate-600" />
            ) : (
              <MdOutlineMenu className="w-5 h-5 text-slate-600" />
            )}
          </button>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {getPageTitle()}
            </h2>
            <p className="text-xs text-slate-500 hidden sm:block">
              Welcome back, {displayName}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative"
            >
              <MdOutlineNotifications className="w-5 h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsNotificationsOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full font-medium">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                          title="Mark all read"
                        >
                          <MdOutlineDoneAll className="w-3.5 h-3.5" /> All read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAll}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                          title="Clear all"
                        >
                          <MdOutlineDeleteSweep className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {isLoading ? (
                      <NotificationSkeleton rows={5} />
                    ) : notifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <MdOutlineNotificationsActive className="w-10 h-10 mx-auto text-slate-300" />
                        <p className="text-sm text-slate-500 mt-2">
                          No notifications yet
                        </p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`group relative flex items-start gap-3 p-4 border-b border-slate-100 last:border-0 transition-colors ${
                            !n.is_read ? "bg-teal-50/50" : "hover:bg-slate-50"
                          }`}
                        >
                          <button
                            onClick={() => {
                              if (!n.is_read) markOneRead(n.id);
                              if (n.link) {
                                setIsNotificationsOpen(false);
                                router.push(n.link);
                              }
                            }}
                            className="flex items-start gap-3 flex-1 min-w-0 text-left"
                          >
                            <div
                              className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                !n.is_read ? "bg-teal-500" : "bg-slate-300"
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900">
                                {n.title}
                              </p>
                              <p className="text-xs text-slate-600 mt-0.5">
                                {n.message}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-1">
                                {timeAgo(n.created_at)}
                              </p>
                            </div>
                          </button>
                          <button
                            onClick={() => deleteOne(n.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-all flex-shrink-0"
                            title="Delete"
                          >
                            <MdOutlineClose className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-3 border-t border-slate-200 text-center bg-slate-50">
                    <Link
                      href="/admin/activity"
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                    >
                      View all activity history →
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {/* ✅ Avatar in header button */}
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm"
                  onError={(e) => {
                    // Fallback if image fails to load
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                  {displayInitials}
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-900">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {displayRole}
                </p>
              </div>
            </button>

            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      {/* ✅ Avatar in dropdown */}
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                          {displayInitials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {displayEmail}
                        </p>
                        <p className="text-xs text-teal-600 capitalize font-medium">
                          {displayRole}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <Link
                      href="/admin/profile"
                      className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <MdOutlineAccountCircle className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-700">
                        My Profile
                      </span>
                    </Link>
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <MdOutlineDashboard className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-700">
                        Dashboard
                      </span>
                    </Link>
                  </div>
                  <div className="border-t border-slate-200 py-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-colors w-full"
                    >
                      <MdOutlineLogout className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600">Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
