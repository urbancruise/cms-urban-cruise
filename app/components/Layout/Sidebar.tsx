"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MdOutlineExplore,
  MdOutlineBarChart,
  MdOutlineLogout,
  MdOutlineClose,
  MdOutlinePerson,
  MdOutlineGroup,
  MdOutlineSecurity,
  MdOutlineLocationCity,
  MdOutlineHistory,
} from "react-icons/md";
import { useAuth } from "@/app/context/AuthContext";

const menuItems = [
  {
    icon: MdOutlineExplore,
    label: "Dashboard",
    href: "/admin",
    perm: "dashboard.view",
  },
  {
    icon: MdOutlineBarChart,
    label: "Analytics",
    href: "/admin/analytics",
    perm: "analytics.view",
  },
  {
    icon: MdOutlineHistory,
    label: "Activity",
    href: "/admin/activity",
    perm: "activity.view",
  },
  {
    icon: MdOutlineGroup,
    label: "Users",
    href: "/admin/users",
    perm: "users.view",
  },
  {
    icon: MdOutlineSecurity,
    label: "Roles",
    href: "/admin/roles",
    perm: "roles.view",
  },
  {
    icon: MdOutlineLocationCity,
    label: "Cities",
    href: "/admin/cities",
    perm: "cities.view",
  },
  {
    icon: MdOutlinePerson,
    label: "Profile",
    href: "/admin/profile",
    perm: "profile.view",
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasPermission } = useAuth();

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "manager":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const displayName = user?.full_name || user?.username || "User";
  const displayEmail = user?.email || "user@urbancruise.com";
  const displayRole = user?.role || "User";
  const displayInitials = getInitials(displayName);

  const visibleItems = menuItems.filter((item) => hasPermission(item.perm));

  return (
    <aside className="h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-xl font-bold text-white">UC</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Urban Cruise
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              CMS Panel
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <MdOutlineClose className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleItems.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            No menu access. Contact admin.
          </p>
        ) : (
          visibleItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname?.startsWith(item.href + "/"));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                  }
                `}
              >
                <item.icon
                  className={`w-5 h-5 ${
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                  }`}
                />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-8 bg-blue-600 rounded-full" />
                )}
              </Link>
            );
          })
        )}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {displayInitials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {displayName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {displayEmail}
            </p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full inline-block mt-0.5 ${getRoleBadgeColor(
                displayRole
              )}`}
            >
              {displayRole}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            title="Logout"
          >
            <MdOutlineLogout className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
          </button>
        </div>
      </div>
    </aside>
  );
}