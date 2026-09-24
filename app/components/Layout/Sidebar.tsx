"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

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
  MdOutlinePublic,
  MdOutlineKeyboardArrowDown,
  MdOutlineHome,
  MdOutlineDirectionsCar,
  MdOutlineSearch,
} from "react-icons/md";

import { useAuth } from "@/app/context/AuthContext";
import Image from "next/image";

type IconComponent = ComponentType<{ className?: string }>;

interface MenuItem {
  label: string;
  href: string;
  icon?: IconComponent;
  perm?: string;
  children?: MenuItem[];
}

interface SidebarProps {
  onClose?: () => void;
}

const menuItems: MenuItem[] = [
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

  // ============================================================
  // URBAN CRUISE WEBSITE
  // ============================================================
  {
    icon: MdOutlinePublic,
    label: "Urban Cruise Website",
    href: "/admin/urbancruise",
    perm: "urbancruisewebsite.view",
    children: [
      {
        icon: MdOutlineHome,
        label: "Website Home",
        href: "/admin/website/home",
        perm: "urbancruise.home.view",
      },
      {
        icon: MdOutlineDirectionsCar,
        label: "Website Vehicles",
        href: "/admin/website/vehicles",
        perm: "urbancruise.vehicles.view",
      },
    ],
  },

  // ============================================================
  // SEO
  // ============================================================
  {
  icon: MdOutlineSearch,
  label: "SEO",
  href: "/admin/seo",
  perm: "seo.view",
  children: [
    { label: "SEO Dashboard", href: "/admin/seo", perm: "seo.dashboard.view" },
    { label: "Page SEO Management", href: "/admin/seo/pages", perm: "seo.pages.view" },
    { label: "Keyword Management", href: "/admin/seo/keywords", perm: "seo.keywords.view" },
    { label: "SEO Content Editor", href: "/admin/seo/content", perm: "seo.content.view" },
    { label: "Image SEO", href: "/admin/seo/images", perm: "seo.images.view" },
    { label: "Technical SEO", href: "/admin/seo/technical", perm: "seo.technical.view" },
    { label: "Sitemap Management", href: "/admin/seo/sitemap", perm: "seo.sitemap.view" },
    { label: "Robots.txt", href: "/admin/seo/robots", perm: "seo.robots.view" },
    { label: "Schema / Structured Data", href: "/admin/seo/schema", perm: "seo.schema.view" },
    { label: "URL Management", href: "/admin/seo/urls", perm: "seo.urls.view" },
    { label: "Internal Linking", href: "/admin/seo/internal-links", perm: "seo.internal_links.view" },
    { label: "Search Console", href: "/admin/seo/gsc", perm: "seo.gsc.view" },
    { label: "Google Analytics", href: "/admin/seo/analytics", perm: "seo.ga.view" },
    { label: "Core Web Vitals", href: "/admin/seo/cwv", perm: "seo.cwv.view" },
    { label: "SEO Audit", href: "/admin/seo/audit", perm: "seo.audit.view" },
    { label: "Issues Center", href: "/admin/seo/issues", perm: "seo.issues.view" },
    { label: "Social / Open Graph", href: "/admin/seo/social", perm: "seo.social.view" },
    { label: "Location SEO", href: "/admin/seo/location", perm: "seo.location.view" },
    { label: "SEO Settings", href: "/admin/seo/settings", perm: "seo.settings.view" },
  ],
},

  // ============================================================
  // PROFILE
  // ============================================================
  {
    icon: MdOutlinePerson,
    label: "Profile",
    href: "/admin/profile",
    perm: "profile.view",
  },
];

const isPathActive = (pathname: string | null, href: string): boolean => {
  if (!pathname) return false;
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
};

const hasActiveDescendant = (item: MenuItem, pathname: string | null): boolean => {
  if (!item.children?.length) return false;
  return item.children.some(
    (child) =>
      isPathActive(pathname, child.href) ||
      hasActiveDescendant(child, pathname)
  );
};

const filterMenuTree = (
  items: MenuItem[],
  hasPermission: (perm: string) => boolean
): MenuItem[] => {
  return items
    .map((item) => {
      if (item.perm && !hasPermission(item.perm)) return null;
      if (item.children?.length) {
        const filteredChildren = filterMenuTree(item.children, hasPermission);
        if (item.perm) return { ...item, children: filteredChildren };
        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren };
      }
      return item;
    })
    .filter((item): item is MenuItem => item !== null);
};

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasPermission } = useAuth();

  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);

  const toggleDropdown = (href: string) => {
    setOpenDropdowns((prev) =>
      prev.includes(href)
        ? prev.filter((item) => item !== href)
        : [...prev, href]
    );
  };

  const visibleItems = useMemo(
    () => filterMenuTree(menuItems, hasPermission),
    [hasPermission]
  );

  const getInitials = (name: string): string => {
    const cleanName = name.trim();
    if (!cleanName) return "?";
    const parts = cleanName.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return cleanName.substring(0, 2).toUpperCase();
  };

  const getRoleBadgeColor = (role: string): string => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-red-50 text-red-700 border border-red-200";
      case "manager":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      default:
        return "bg-teal-50 text-teal-700 border border-teal-200";
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const displayName = user?.full_name || user?.username || "User";
  const displayEmail = user?.email || "user@urbancruise.com";
  const displayRole = user?.role || "User";
  const displayInitials = getInitials(displayName);

  const renderNode = (node: MenuItem, depth = 0): ReactNode => {
    const hasChildren = Boolean(node.children?.length);
    const isActive = isPathActive(pathname, node.href);
    const isDescendantActive = hasActiveDescendant(node, pathname);
    const isOpen = openDropdowns.includes(node.href);

    const activeStyle = "bg-teal-50 text-teal-700";
    const inactiveStyle = "text-slate-600 hover:bg-slate-50 hover:text-slate-900";
    const activeIcon = "text-teal-600";
    const inactiveIcon = "text-slate-400 group-hover:text-slate-600";
    const NodeIcon = node.icon;

    if (hasChildren) {
      return (
        <div key={node.href} className="relative">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-current={isActive || isDescendantActive ? "page" : undefined}
            onClick={() => toggleDropdown(node.href)}
            className={`
              w-full flex items-center gap-2 rounded-lg
              transition-all duration-200 group
              ${depth === 0 ? "px-3 py-2.5" : "px-3 py-2"}
              ${isActive || isDescendantActive ? activeStyle : inactiveStyle}
            `}
          >
            {NodeIcon && (
              <NodeIcon
                className={`
                  ${depth === 0 ? "w-5 h-5" : "w-4 h-4"}
                  ${isActive || isDescendantActive ? activeIcon : inactiveIcon}
                `}
              />
            )}

            {!NodeIcon && depth > 0 && (
              <span
                className={`
                  w-1.5 h-1.5 rounded-full flex-shrink-0
                  ${isActive || isDescendantActive ? "bg-teal-600" : "bg-slate-300"}
                `}
              />
            )}

            <span
              className={`
                font-medium truncate text-left
                ${depth === 0 ? "text-sm" : depth === 1 ? "text-sm" : "text-xs"}
              `}
            >
              {node.label}
            </span>

            <MdOutlineKeyboardArrowDown
              className={`
                ${depth === 0 ? "w-4 h-4" : "w-3.5 h-3.5"}
                ml-auto flex-shrink-0 transition-transform duration-200
                ${isOpen ? "rotate-180" : ""}
                ${isActive || isDescendantActive ? "text-teal-600" : "text-slate-400"}
              `}
            />
          </button>

          <div
            className={`
              grid transition-[grid-template-rows,opacity]
              duration-300 ease-in-out
              ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}
            `}
          >
            <div className="overflow-hidden">
              <div
                className={`
                  ml-3 pl-3 border-l-2 border-slate-100
                  ${depth === 0 ? "space-y-1 mt-1" : "space-y-0.5"}
                `}
              >
                {node.children?.map((child) => renderNode(child, depth + 1))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Link
        key={node.href}
        href={node.href}
        onClick={onClose}
        aria-current={isActive ? "page" : undefined}
        className={`
          flex items-center gap-2 rounded-lg
          transition-all duration-200 group
          ${depth === 0 ? "px-3 py-2.5" : "px-3 py-1.5"}
          ${isActive ? activeStyle : inactiveStyle}
        `}
      >
        {NodeIcon ? (
          <NodeIcon
            className={`
              ${depth === 0 ? "w-5 h-5" : "w-4 h-4"}
              ${isActive ? activeIcon : inactiveIcon}
            `}
          />
        ) : (
          depth > 0 && (
            <span
              className={`
                w-1.5 h-1.5 rounded-full flex-shrink-0
                ${isActive ? "bg-teal-600" : "bg-slate-300"}
              `}
            />
          )
        )}

        <span
          className={`
            font-medium truncate
            ${depth === 0 ? "text-sm" : depth === 1 ? "text-sm" : "text-xs"}
          `}
        >
          {node.label}
        </span>

        {isActive && depth === 0 && (
          <div className="ml-auto w-1.5 h-6 bg-teal-600 rounded-full" />
        )}
      </Link>
    );
  };

  return (
    <aside className="h-screen w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 overflow-hidden bg-white border border-slate-200">
            <Image
              src="/images/UCLogo.png"
              alt="Urban Cruise Logo"
              width={40}
              height={40}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-900 truncate">
              Urban Cruise
            </h1>
            <p className="text-xs text-slate-500">CMS Panel</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="lg:hidden p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <MdOutlineClose className="w-5 h-5 text-slate-500" />
          </button>
        )}
      </div>

      <nav
        className="flex-1 p-3 space-y-0.5 overflow-y-auto"
        aria-label="Admin navigation"
      >
        {visibleItems.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            No menu access. Contact admin.
          </p>
        ) : (
          visibleItems.map((item) => renderNode(item))
        )}
      </nav>

      <div className="p-3 border-t border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group">
          {user?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar_url}
              alt={displayName}
              className="w-9 h-9 rounded-full object-cover shadow-sm flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-white font-semibold text-xs">
                {displayInitials}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {displayName}
            </p>
            <p className="text-xs text-slate-500 truncate">{displayEmail}</p>
            <span
              className={`
                text-[10px] px-1.5 py-0.5 rounded-full inline-block mt-0.5 font-medium
                ${getRoleBadgeColor(displayRole)}
              `}
            >
              {displayRole}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
          >
            <MdOutlineLogout className="w-4 h-4 text-slate-400 group-hover:text-red-600 transition-colors" />
          </button>
        </div>
      </div>
    </aside>
  );
}

