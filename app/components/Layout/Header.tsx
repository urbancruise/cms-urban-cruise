"use client";

import { useState } from "react";
import { 
  MdOutlineSearch,
  MdOutlineNotifications,
  MdOutlineSettings,
  MdOutlineHelp,
  MdOutlineMenu,
  MdOutlineClose,
  MdOutlineDarkMode,
  MdOutlineLightMode,
  MdOutlinePerson,
  MdOutlineLogout,
  MdOutlineDashboard,
  MdOutlineAccountCircle
} from "react-icons/md";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

interface HeaderProps {
  toggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export default function Header({ toggleSidebar, isSidebarOpen }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const getPageTitle = () => {
    const path = pathname?.split('/').pop() || 'dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const notifications = [
    { id: 1, title: "New user registered", time: "5 minutes ago", type: "user" },
    { id: 2, title: "New booking received", time: "1 hour ago", type: "booking" },
    { id: 3, title: "Payment confirmed for #1234", time: "3 hours ago", type: "payment" },
  ];

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const displayName = user?.full_name || user?.username || 'User';
  const displayEmail = user?.email || 'user@urbancruise.com';
  const displayRole = user?.role || 'User';
  const displayInitials = getInitials(displayName);

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="px-6 h-16 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? (
              <MdOutlineClose className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <MdOutlineMenu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {getPageTitle()}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Welcome back, {displayName}! 👋
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <MdOutlineSearch className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          <div className="hidden lg:flex items-center relative">
            <MdOutlineSearch className="absolute left-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-64 pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <span className="absolute right-3 text-xs text-gray-400">⌘K</span>
          </div>

          {/* Dark Mode */}
          <button
            onClick={toggleDarkMode}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isDarkMode ? (
              <MdOutlineLightMode className="w-5 h-5 text-yellow-500" />
            ) : (
              <MdOutlineDarkMode className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          {/* Help */}
          <button className="hidden sm:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <MdOutlineHelp className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative"
            >
              <MdOutlineNotifications className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        notification.type === 'booking' ? 'bg-blue-500' :
                        notification.type === 'payment' ? 'bg-green-500' :
                        'bg-yellow-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                  <Link href="/admin/notifications" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {displayInitials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{displayRole}</p>
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {displayInitials}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{displayName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{displayEmail}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 capitalize">{displayRole}</p>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <Link
                    href="/admin/profile"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <MdOutlineAccountCircle className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">My Profile</span>
                  </Link>
                  <Link
                    href="/admin/dashboard"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <MdOutlineDashboard className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Dashboard</span>
                  </Link>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full"
                  >
                    <MdOutlineLogout className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600 dark:text-red-400">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      {isSearchOpen && (
        <div className="lg:hidden p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="relative">
            <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}