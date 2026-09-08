"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  MdOutlineExplore, 
  MdOutlineCalendarToday, 
  MdOutlinePeople, 
  MdOutlineSettings,
  MdOutlineAnchor,
  MdOutlineDescription,
  MdOutlineBarChart,
  MdOutlineLogout,
  MdOutlineClose
} from "react-icons/md";

const menuItems = [
  { icon: MdOutlineExplore, label: "Dashboard", href: "/admin" },
  { icon: MdOutlineAnchor, label: "Cruises", href: "/admin/cruises" },
  { icon: MdOutlineCalendarToday, label: "Bookings", href: "/admin/bookings" },
  { icon: MdOutlinePeople, label: "Customers", href: "/admin/customers" },
  { icon: MdOutlineDescription, label: "Reviews", href: "/admin/reviews" },
  { icon: MdOutlineBarChart, label: "Analytics", href: "/admin/analytics" },
  { icon: MdOutlineSettings, label: "Settings", href: "/admin/settings" },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
            <MdOutlineAnchor className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Urban Cruise</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">CMS Panel</p>
          </div>
        </div>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <MdOutlineClose className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
                ${isActive 
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" 
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                }
              `}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"}`} />
              <span className="font-medium text-sm">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-8 bg-blue-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors group">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white font-semibold text-sm">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">John Doe</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Administrator</p>
          </div>
          <MdOutlineLogout className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
        </div>
      </div>
    </aside>
  );
}

