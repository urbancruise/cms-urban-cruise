import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
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
} from "react-icons/md";
import { useAuth } from "@/app/context/AuthContext";

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

/* =========================================================
   WEBSITE HOME SECTIONS
========================================================= */

const homeSections: MenuItem[] = [
  { label: "Hero", href: "/admin/urbancruise/home/hero" },
  {
    label: "Get a Quick Call",
    href: "/admin/urbancruise/home/get-a-quick-call",
  },
  { label: "About", href: "/admin/urbancruise/home/about" },
  {
    label: "How It Works",
    href: "/admin/urbancruise/home/how-it-works",
  },
  {
    label: "We Offer Best Services",
    href: "/admin/urbancruise/home/we-offer-best-services",
  },
  {
    label: "Vehicle For Every Group Size",
    href: "/admin/urbancruise/home/vehicle-for-every-group-size",
  },
  {
    label: "Tempo Traveller For Every Occasion",
    href: "/admin/urbancruise/home/tempo-traveller-for-every-occasion",
  },
  {
    label: "Why Choose Urban Cruise",
    href: "/admin/urbancruise/home/why-choose-urban-cruise",
  },
  {
    label: "Testimonials",
    href: "/admin/urbancruise/home/testimonials",
  },
  { label: "FAQs", href: "/admin/urbancruise/home/faqs" },
  {
    label: "Service Locations",
    href: "/admin/urbancruise/home/service-locations",
  },
  {
    label: "Our Trusted Partners",
    href: "/admin/urbancruise/home/our-trusted-partners",
  },
  {
    label: "Download Our App",
    href: "/admin/urbancruise/home/download-our-app",
  },
];

/* =========================================================
   VEHICLE PAGE BUILDER

   Keeping these routes in one place prevents the old problem
   where every vehicle accidentally pointed to /ertiga/*.
========================================================= */

const vehicleSections = (
  basePath: string,
  options: {
    compare?: boolean;
    prices?: boolean;
    discover?: boolean;
  } = {}
): MenuItem[] => [
  { label: "Hero", href: `${basePath}/hero` },
  {
    label: "Get a Quick Call",
    href: `${basePath}/get-a-quick-call`,
  },
  { label: "About", href: `${basePath}/about` },
  {
    label: "How It Works",
    href: `${basePath}/how-it-works`,
  },
  {
    label: "We Offer Best Services",
    href: `${basePath}/we-offer-best-services`,
  },
  {
    label: "Vehicle For Every Group Size",
    href: `${basePath}/vehicle-for-every-group-size`,
  },
  ...(options.compare
    ? [
        {
          label: "Compare With Vehicles",
          href: `${basePath}/compare-with-vehicles`,
        },
      ]
    : []),
  ...(options.prices
    ? [
        {
          label: "Prices & Charges",
          href: `${basePath}/prices-charges`,
        },
      ]
    : []),
  {
    label: "Looking for other Vehicle",
    href: `${basePath}/looking-for-other-vehicle`,
  },
  {
    label: "Tempo Traveller For Every Occasion",
    href: `${basePath}/tempo-traveller-for-every-occasion`,
  },
  {
    label: "Why Choose Urban Cruise",
    href: `${basePath}/why-choose-urban-cruise`,
  },
  { label: "Testimonials", href: `${basePath}/testimonials` },
  ...(options.discover
    ? [
        {
          label: "Discover Your Next Adventure",
          href: `${basePath}/discover-your-next-adventure`,
        },
      ]
    : []),
  { label: "FAQs", href: `${basePath}/faqs` },
  {
    label: "Service Locations",
    href: `${basePath}/service-locations`,
  },
  {
    label: "Our Trusted Partners",
    href: `${basePath}/our-trusted-partners`,
  },
  {
    label: "Download Our App",
    href: `${basePath}/download-our-app`,
  },
];

const createVehicle = (
  label: string,
  basePath: string,
  options: {
    compare?: boolean;
    prices?: boolean;
    discover?: boolean;
  } = {}
): MenuItem => ({
  label,
  href: basePath,
  children: vehicleSections(basePath, options),
});

/* =========================================================
   MENU
========================================================= */

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

  /* -------------------------------------------------------
     URBAN CRUISE WEBSITE
  ------------------------------------------------------- */

  {
    icon: MdOutlinePublic,
    label: "Urban Cruise Website",
    href: "/admin/urbancruise",
    perm: "urbancruisewebsite.view",
    children: [
      {
        icon: MdOutlineHome,
        label: "Home",
        href: "/admin/urbancruise/home",
        children: homeSections,
      },

      /* ---------------------------------------------------
         OUR VEHICLES
      --------------------------------------------------- */

      {
        icon: MdOutlineDirectionsCar,
        label: "Our Vehicles",
        href: "/admin/urbancruise/vehicles",
        children: [
          {
            label: "Car & SUVs",
            href: "/admin/urbancruise/vehicles/car-suvs",
            children: [
              createVehicle(
                "Ertiga",
                "/admin/urbancruise/vehicles/car-suvs/ertiga",
                { compare: true, discover: true }
              ),
              createVehicle(
                "Innova Crysta",
                "/admin/urbancruise/vehicles/car-suvs/innova-crysta",
                { compare: true, discover: true }
              ),
              createVehicle(
                "Hycross",
                "/admin/urbancruise/vehicles/car-suvs/hycross",
                { compare: true, discover: true }
              ),
            ],
          },

          {
            label: "Luxury Cars, SUVs, Vans",
            href: "/admin/urbancruise/vehicles/luxury-cars-suvs-vans",
            children: [
              createVehicle(
                "Luxury Cars & SUVs",
                "/admin/urbancruise/vehicles/luxury-cars-suvs-vans/luxury-cars-suvs",
                { compare: true, discover: true }
              ),
              createVehicle(
                "Mercedes Sprinter",
                "/admin/urbancruise/vehicles/luxury-cars-suvs-vans/mercedes-sprinter",
                { compare: true, discover: true }
              ),
              createVehicle(
                "Luxury Vans",
                "/admin/urbancruise/vehicles/luxury-cars-suvs-vans/luxury-vans",
                { prices: true, discover: true }
              ),
            ],
          },

          {
            label: "Tempo Traveller",
            href: "/admin/urbancruise/vehicles/tempo-traveller",
            children: [
              createVehicle(
                "Tempo Traveller",
                "/admin/urbancruise/vehicles/tempo-traveller",
                { compare: true, prices: true, discover: true }
              ),
              createVehicle(
                "Maharaja Tempo Traveller",
                "/admin/urbancruise/vehicles/tempo-traveller/maharaja",
                { compare: true, prices: true, discover: true }
              ),
            ],
          },

          {
            label: "Urbania",
            href: "/admin/urbancruise/vehicles/urbania",
            children: [
              createVehicle(
                "Urbania",
                "/admin/urbancruise/vehicles/urbania",
                { compare: true, prices: true, discover: true }
              ),
            ],
          },

          {
            label: "Mini Bus",
            href: "/admin/urbancruise/vehicles/mini-bus",
            children: [
              createVehicle(
                "Mini Bus",
                "/admin/urbancruise/vehicles/mini-bus",
                { compare: true, prices: true, discover: true }
              ),
            ],
          },

          {
            label: "Luxury Buses",
            href: "/admin/urbancruise/vehicles/luxury-buses",
            children: [
              createVehicle(
                "Luxury Bus",
                "/admin/urbancruise/vehicles/luxury-buses",
                { compare: true, prices: true, discover: true }
              ),
              createVehicle(
                "Volvo Bus",
                "/admin/urbancruise/vehicles/luxury-buses/volvo-bus",
                { compare: true, prices: true, discover: true }
              ),
              createVehicle(
                "Bharat Benz Bus",
                "/admin/urbancruise/vehicles/luxury-buses/bharat-benz-bus",
                { compare: true, prices: true, discover: true }
              ),
              createVehicle(
                "Bus With Washroom",
                "/admin/urbancruise/vehicles/luxury-buses/bus-with-washroom",
                { compare: true, prices: true, discover: true }
              ),
              createVehicle(
                "Sleeper | Semi Sleeper Bus",
                "/admin/urbancruise/vehicles/luxury-buses/sleeper-semi-sleeper-bus",
                { compare: true, prices: true, discover: true }
              ),
            ],
          },
        ],
      },
    ],
  },

  {
    icon: MdOutlinePerson,
    label: "Profile",
    href: "/admin/profile",
    perm: "profile.view",
  },
];

/* =========================================================
   HELPERS
========================================================= */

const isPathActive = (pathname: string | null, href: string): boolean => {
  if (!pathname) return false;

  // /admin is an exact route. Without this exception it would
  // incorrectly become active on every /admin/* page.
  if (href === "/admin") return pathname === "/admin";

  return pathname === href || pathname.startsWith(`${href}/`);
};

const hasActiveDescendant = (
  item: MenuItem,
  pathname: string | null
): boolean => {
  if (!item.children?.length) return false;

  return item.children.some(
    (child) =>
      isPathActive(pathname, child.href) ||
      hasActiveDescendant(child, pathname)
  );
};

/* =========================================================
   SIDEBAR
========================================================= */

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

  const openDropdown = (href: string) => {
    setOpenDropdowns((prev) =>
      prev.includes(href) ? prev : [...prev, href]
    );
  };

  const closeDropdown = (href: string) => {
    setOpenDropdowns((prev) => prev.filter((item) => item !== href));
  };

  /* -------------------------------------------------------
     Automatically open every parent of the active route.
  ------------------------------------------------------- */

  useEffect(() => {
    const activeParents: string[] = [];

    const walk = (nodes: MenuItem[]) => {
      nodes.forEach((node) => {
        if (!node.children?.length) return;

        if (
          isPathActive(pathname, node.href) ||
          hasActiveDescendant(node, pathname)
        ) {
          activeParents.push(node.href);
        }

        walk(node.children);
      });
    };

    walk(menuItems);

    if (activeParents.length) {
      setOpenDropdowns((prev) =>
        Array.from(new Set([...prev, ...activeParents]))
      );
    }
  }, [pathname]);

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
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

      case "manager":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";

      default:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
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

  const visibleItems = useMemo(
    () => menuItems.filter((item) => !item.perm || hasPermission(item.perm)),
    [hasPermission]
  );

  /* -------------------------------------------------------
     Recursive node renderer
  ------------------------------------------------------- */

  const renderNode = (
    node: MenuItem,
    depth = 0
  ): ReactNode => {
    const hasChildren = Boolean(node.children?.length);
    const isActive = isPathActive(pathname, node.href);
    const isDescendantActive = hasActiveDescendant(node, pathname);
    const isOpen = openDropdowns.includes(node.href);

    if (hasChildren) {
      return (
        <div
          key={node.href}
          className="relative"
          onMouseEnter={() => openDropdown(node.href)}
          onMouseLeave={() => closeDropdown(node.href)}
        >
          <button
            type="button"
            aria-expanded={isOpen}
            aria-current={
              isActive || isDescendantActive ? "page" : undefined
            }
            onClick={() => toggleDropdown(node.href)}
            className={`
              w-full flex items-center gap-2 rounded-lg
              transition-all duration-200 group
              ${depth === 0 ? "px-4 py-3" : "px-3 py-2"}
              ${
                isActive || isDescendantActive
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              }
            `}
          >
            {node.icon && (
              <node.icon
                className={`
                  ${depth === 0 ? "w-5 h-5" : "w-4 h-4"}
                  ${
                    isActive || isDescendantActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                  }
                `}
              />
            )}

            {!node.icon && depth > 0 && (
              <span
                className={`
                  w-1.5 h-1.5 rounded-full flex-shrink-0
                  ${
                    isActive || isDescendantActive
                      ? "bg-blue-600 dark:bg-blue-400"
                      : "bg-current opacity-40"
                  }
                `}
              />
            )}

            <span
              className={`
                font-medium truncate text-left
                ${
                  depth === 0
                    ? "text-sm"
                    : depth === 1
                      ? "text-sm"
                      : "text-xs"
                }
              `}
            >
              {node.label}
            </span>

            <MdOutlineKeyboardArrowDown
              className={`
                ${depth === 0 ? "w-4 h-4" : "w-3.5 h-3.5"}
                ml-auto flex-shrink-0 transition-transform duration-200
                ${isOpen ? "rotate-180" : ""}
                ${
                  isActive || isDescendantActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-400"
                }
              `}
            />
          </button>

          <div
            className={`
              grid transition-[grid-template-rows,opacity] duration-300 ease-in-out
              ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}
            `}
          >
            <div className="overflow-hidden">
              <div
                className={`
                  ml-3 pl-3 border-l-2 border-gray-200 dark:border-gray-700
                  ${depth === 0 ? "space-y-1 mt-1" : "space-y-0.5"}
                `}
              >
                {node.children?.map((child) =>
                  renderNode(child, depth + 1)
                )}
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
          ${depth === 0 ? "px-4 py-3" : "px-3 py-1.5"}
          ${
            isActive
              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          }
        `}
      >
        {node.icon ? (
          <node.icon
            className={`
              ${depth === 0 ? "w-5 h-5" : "w-4 h-4"}
              ${
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
              }
            `}
          />
        ) : (
          depth > 0 && (
            <span
              className={`
                w-1.5 h-1.5 rounded-full flex-shrink-0
                ${
                  isActive
                    ? "bg-blue-600 dark:bg-blue-400"
                    : "bg-current opacity-40"
                }
              `}
            />
          )
        )}

        <span
          className={`
            font-medium truncate
            ${
              depth === 0
                ? "text-sm"
                : depth === 1
                  ? "text-sm"
                  : "text-xs"
            }
          `}
        >
          {node.label}
        </span>

        {isActive && depth === 0 && (
          <div className="ml-auto w-1.5 h-8 bg-blue-600 rounded-full" />
        )}
      </Link>
    );
  };

  return (
    <aside className="h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
            <span className="text-xl font-bold text-white">UC</span>
          </div>

          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              Urban Cruise
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              CMS Panel
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <MdOutlineClose className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 p-4 space-y-1 overflow-y-auto"
        aria-label="Admin navigation"
      >
        {visibleItems.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            No menu access. Contact admin.
          </p>
        ) : (
          visibleItems.map((item) => renderNode(item))
        )}
      </nav>

      {/* User / Logout */}
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
            type="button"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
          >
            <MdOutlineLogout className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
          </button>
        </div>
      </div>
    </aside>
  );
}

