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

// ============================================================
// WEBSITE HOME SECTIONS
// ============================================================

const homeSections: MenuItem[] = [
  {
    label: "Hero",
    href: "/admin/urbancruise/home/hero",
    perm: "urbancruise.home.hero.view",
  },
  {
    label: "Get a Quick Call",
    href: "/admin/urbancruise/home/get-a-quick-call",
    perm: "urbancruise.home.quickcall.view",
  },
  {
    label: "About",
    href: "/admin/urbancruise/home/about",
    perm: "urbancruise.home.about.view",
  },
  {
    label: "How It Works",
    href: "/admin/urbancruise/home/how-it-works",
    perm: "urbancruise.home.howitworks.view",
  },
  {
    label: "We Offer Best Services",
    href: "/admin/urbancruise/home/we-offer-best-services",
    perm: "urbancruise.home.services.view",
  },
  {
    label: "Vehicle For Every Group Size",
    href: "/admin/urbancruise/home/vehicle-for-every-group-size",
    perm: "urbancruise.home.groupsize.view",
  },
  {
    label: "Tempo Traveller For Every Occasion",
    href: "/admin/urbancruise/home/tempo-traveller-for-every-occasion",
    perm: "urbancruise.home.tempotraveller.view",
  },
  {
    label: "Why Choose Urban Cruise",
    href: "/admin/urbancruise/home/why-choose-urban-cruise",
    perm: "urbancruise.home.whychoose.view",
  },
  {
    label: "Testimonials",
    href: "/admin/urbancruise/home/testimonials",
    perm: "urbancruise.home.testimonials.view",
  },
  {
    label: "FAQs",
    href: "/admin/urbancruise/home/faqs",
    perm: "urbancruise.home.faqs.view",
  },
  {
    label: "Service Locations",
    href: "/admin/urbancruise/home/service-locations",
    perm: "urbancruise.home.locations.view",
  },
  {
    label: "Our Trusted Partners",
    href: "/admin/urbancruise/home/our-trusted-partners",
    perm: "urbancruise.home.partners.view",
  },
  {
    label: "Download Our App",
    href: "/admin/urbancruise/home/download-our-app",
    perm: "urbancruise.home.downloadapp.view",
  },
];

// ============================================================
// VEHICLE PAGE BUILDER
// ============================================================

const vehicleSections = (
  basePath: string,
  options: {
    compare?: boolean;
    prices?: boolean;
    discover?: boolean;
  } = {},
): MenuItem[] => [
  {
    label: "Hero",
    href: `${basePath}/hero`,
  },
  {
    label: "Get a Quick Call",
    href: `${basePath}/get-a-quick-call`,
  },
  {
    label: "About",
    href: `${basePath}/about`,
  },
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
  {
    label: "Testimonials",
    href: `${basePath}/testimonials`,
  },

  ...(options.discover
    ? [
        {
          label: "Discover Your Next Adventure",
          href: `${basePath}/discover-your-next-adventure`,
        },
      ]
    : []),

  {
    label: "FAQs",
    href: `${basePath}/faqs`,
  },
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
  perm: string,
  options: {
    compare?: boolean;
    prices?: boolean;
    discover?: boolean;
  } = {},
): MenuItem => ({
  label,
  href: basePath,
  perm,
  children: vehicleSections(basePath, options),
});

// ============================================================
// MENU
// ============================================================

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
      // ========================================================
      // CMS Website Home
      // ========================================================

      {
        icon: MdOutlineHome,
        label: "Website Home",
        href: "/admin/website/home",
        perm: "urbancruisewebsite.view",
      },

      // ========================================================
      // CMS Website Vehicles
      // ========================================================

      {
        icon: MdOutlineDirectionsCar,
        label: "Website Vehicles",
        href: "/admin/website/vehicles",
        perm: "urbancruisewebsite.view",
      },

      // ========================================================
      // Existing Home Editor
      // ========================================================

      {
        icon: MdOutlineHome,
        label: "Home",
        href: "/admin/urbancruise/home",
        perm: "urbancruise.home.view",
        children: homeSections,
      },

      // ========================================================
      // Existing Vehicle Editor
      // ========================================================

      {
        icon: MdOutlineDirectionsCar,
        label: "Our Vehicles",
        href: "/admin/urbancruise/vehicles",
        perm: "urbancruise.vehicles.view",

        children: [
          // ======================================================
          // CAR & SUVS
          // ======================================================

          {
            label: "Car & SUVs",
            href: "/admin/urbancruise/vehicles/car-suvs",
            perm: "urbancruise.vehicles.carsuvs.view",

            children: [
              createVehicle(
                "Ertiga",
                "/admin/urbancruise/vehicles/car-suvs/ertiga",
                "urbancruise.vehicles.ertiga.view",
                {
                  compare: true,
                  discover: true,
                },
              ),

              createVehicle(
                "Innova Crysta",
                "/admin/urbancruise/vehicles/car-suvs/innova-crysta",
                "urbancruise.vehicles.innova.view",
                {
                  compare: true,
                  discover: true,
                },
              ),

              createVehicle(
                "Hycross",
                "/admin/urbancruise/vehicles/car-suvs/hycross",
                "urbancruise.vehicles.hycross.view",
                {
                  compare: true,
                  discover: true,
                },
              ),
            ],
          },

          // ======================================================
          // LUXURY CARS / SUVS / VANS
          // ======================================================

          {
            label: "Luxury Cars, SUVs, Vans",
            href: "/admin/urbancruise/vehicles/luxury-cars-suvs-vans",
            perm: "urbancruise.vehicles.luxury.view",

            children: [
              createVehicle(
                "Luxury Cars & SUVs",
                "/admin/urbancruise/vehicles/luxury-cars-suvs-vans/luxury-cars-suvs",
                "urbancruise.vehicles.luxurycars.view",
                {
                  compare: true,
                  discover: true,
                },
              ),

              createVehicle(
                "Mercedes Sprinter",
                "/admin/urbancruise/vehicles/luxury-cars-suvs-vans/mercedes-sprinter",
                "urbancruise.vehicles.sprinter.view",
                {
                  compare: true,
                  discover: true,
                },
              ),

              createVehicle(
                "Luxury Vans",
                "/admin/urbancruise/vehicles/luxury-cars-suvs-vans/luxury-vans",
                "urbancruise.vehicles.luxuryvans.view",
                {
                  prices: true,
                  discover: true,
                },
              ),
            ],
          },

          // ======================================================
          // TEMPO TRAVELLER
          // ======================================================

          {
            label: "Tempo Traveller",
            href: "/admin/urbancruise/vehicles/tempo-traveller",
            perm: "urbancruise.vehicles.tempo.view",

            children: [
              createVehicle(
                "Tempo Traveller",
                "/admin/urbancruise/vehicles/tempo-traveller",
                "urbancruise.vehicles.tempotraveller.view",
                {
                  compare: true,
                  prices: true,
                  discover: true,
                },
              ),

              createVehicle(
                "Maharaja Tempo Traveller",
                "/admin/urbancruise/vehicles/tempo-traveller/maharaja",
                "urbancruise.vehicles.maharaja.view",
                {
                  compare: true,
                  prices: true,
                  discover: true,
                },
              ),
            ],
          },

          // ======================================================
          // URBANIA
          // ======================================================

          {
            label: "Urbania",
            href: "/admin/urbancruise/vehicles/urbania",
            perm: "urbancruise.vehicles.urbania.view",

            children: [
              createVehicle(
                "Urbania",
                "/admin/urbancruise/vehicles/urbania",
                "urbancruise.vehicles.urbania.main.view",
                {
                  compare: true,
                  prices: true,
                  discover: true,
                },
              ),
            ],
          },

          // ======================================================
          // MINI BUS
          // ======================================================

          {
            label: "Mini Bus",
            href: "/admin/urbancruise/vehicles/mini-bus",
            perm: "urbancruise.vehicles.minibus.view",

            children: [
              createVehicle(
                "Mini Bus",
                "/admin/urbancruise/vehicles/mini-bus",
                "urbancruise.vehicles.minibus.main.view",
                {
                  compare: true,
                  prices: true,
                  discover: true,
                },
              ),
            ],
          },

          // ======================================================
          // LUXURY BUSES
          // ======================================================

          {
            label: "Luxury Buses",
            href: "/admin/urbancruise/vehicles/luxury-buses",
            perm: "urbancruise.vehicles.luxurybuses.view",

            children: [
              createVehicle(
                "Luxury Bus",
                "/admin/urbancruise/vehicles/luxury-buses",
                "urbancruise.vehicles.luxurybus.view",
                {
                  compare: true,
                  prices: true,
                  discover: true,
                },
              ),

              createVehicle(
                "Volvo Bus",
                "/admin/urbancruise/vehicles/luxury-buses/volvo-bus",
                "urbancruise.vehicles.volvo.view",
                {
                  compare: true,
                  prices: true,
                  discover: true,
                },
              ),

              createVehicle(
                "Bharat Benz Bus",
                "/admin/urbancruise/vehicles/luxury-buses/bharat-benz-bus",
                "urbancruise.vehicles.bharatbenz.view",
                {
                  compare: true,
                  prices: true,
                  discover: true,
                },
              ),

              createVehicle(
                "Bus With Washroom",
                "/admin/urbancruise/vehicles/luxury-buses/bus-with-washroom",
                "urbancruise.vehicles.washroom.view",
                {
                  compare: true,
                  prices: true,
                  discover: true,
                },
              ),

              createVehicle(
                "Sleeper | Semi Sleeper Bus",
                "/admin/urbancruise/vehicles/luxury-buses/sleeper-semi-sleeper-bus",
                "urbancruise.vehicles.sleeper.view",
                {
                  compare: true,
                  prices: true,
                  discover: true,
                },
              ),
            ],
          },
        ],
      },
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

// ============================================================
// HELPERS
// ============================================================

const isPathActive = (
  pathname: string | null,
  href: string,
): boolean => {
  if (!pathname) return false;

  if (href === "/admin") {
    return pathname === "/admin";
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
};

const hasActiveDescendant = (
  item: MenuItem,
  pathname: string | null,
): boolean => {
  if (!item.children?.length) {
    return false;
  }

  return item.children.some(
    (child) =>
      isPathActive(pathname, child.href) ||
      hasActiveDescendant(child, pathname),
  );
};

// ============================================================
// RECURSIVE PERMISSION FILTER
// ============================================================

const filterMenuTree = (
  items: MenuItem[],
  hasPermission: (perm: string) => boolean,
): MenuItem[] => {
  return items
    .map((item) => {
      // Item permission check
      if (
        item.perm &&
        !hasPermission(item.perm)
      ) {
        return null;
      }

      // Recursively filter children
      if (item.children?.length) {
        const filteredChildren = filterMenuTree(
          item.children,
          hasPermission,
        );

        // Parent has its own permission
        if (item.perm) {
          return {
            ...item,
            children: filteredChildren,
          };
        }

        // No permission and no visible children
        if (filteredChildren.length === 0) {
          return null;
        }

        return {
          ...item,
          children: filteredChildren,
        };
      }

      // Normal menu item
      return item;
    })
    .filter(
      (item): item is MenuItem =>
        item !== null,
    );
};

// ============================================================
// SIDEBAR
// ============================================================

export default function Sidebar({
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const {
    user,
    logout,
    hasPermission,
  } = useAuth();

  // ==========================================================
  // Dropdown State
  // ==========================================================

  const [openDropdowns, setOpenDropdowns] =
    useState<string[]>([]);

  // ==========================================================
  // CLICK ONLY DROPDOWN
  // ==========================================================

  const toggleDropdown = (href: string) => {
    setOpenDropdowns((prev) =>
      prev.includes(href)
        ? prev.filter(
            (item) => item !== href,
          )
        : [...prev, href],
    );
  };

  // ==========================================================
  // FILTER MENU BY PERMISSION
  // ==========================================================

  const visibleItems = useMemo(
    () =>
      filterMenuTree(
        menuItems,
        hasPermission,
      ),
    [hasPermission],
  );

  // ==========================================================
  // USER HELPERS
  // ==========================================================

  const getInitials = (
    name: string,
  ): string => {
    const cleanName = name.trim();

    if (!cleanName) {
      return "?";
    }

    const parts =
      cleanName.split(/\s+/);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return cleanName
      .substring(0, 2)
      .toUpperCase();
  };

  const getRoleBadgeColor = (
    role: string,
  ): string => {
    switch (
      role?.toLowerCase()
    ) {
      case "admin":
        return "bg-red-50 text-red-700 border border-red-200";

      case "manager":
        return "bg-amber-50 text-amber-700 border border-amber-200";

      default:
        return "bg-teal-50 text-teal-700 border border-teal-200";
    }
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout =
    async () => {
      try {
        await logout();

        router.push("/login");
      } catch (error) {
        console.error(
          "Logout failed:",
          error,
        );
      }
    };

  // ==========================================================
  // USER DATA
  // ==========================================================

  const displayName =
    user?.full_name ||
    user?.username ||
    "User";

  const displayEmail =
    user?.email ||
    "user@urbancruise.com";

  const displayRole =
    user?.role ||
    "User";

  const displayInitials =
    getInitials(
      displayName,
    );

  // ==========================================================
  // RECURSIVE MENU RENDERER
  // ==========================================================

  const renderNode = (
    node: MenuItem,
    depth = 0,
  ): ReactNode => {
    const hasChildren =
      Boolean(
        node.children?.length,
      );

    const isActive =
      isPathActive(
        pathname,
        node.href,
      );

    const isDescendantActive =
      hasActiveDescendant(
        node,
        pathname,
      );

    const isOpen =
      openDropdowns.includes(
        node.href,
      );

    // ========================================================
    // STYLES
    // ========================================================

    const activeStyle =
      "bg-teal-50 text-teal-700";

    const inactiveStyle =
      "text-slate-600 hover:bg-slate-50 hover:text-slate-900";

    const activeIcon =
      "text-teal-600";

    const inactiveIcon =
      "text-slate-400 group-hover:text-slate-600";

    const NodeIcon =
      node.icon;

    // ========================================================
    // MENU WITH CHILDREN
    // ========================================================

    if (hasChildren) {
      return (
        <div
          key={node.href}
          className="relative"
        >
          {/* ==================================================
              CLICKABLE PARENT
              NO HOVER EVENTS
              ================================================== */}

          <button
            type="button"
            aria-expanded={isOpen}
            aria-current={
              isActive ||
              isDescendantActive
                ? "page"
                : undefined
            }
            onClick={() =>
              toggleDropdown(
                node.href,
              )
            }
            className={`
              w-full flex items-center gap-2 rounded-lg
              transition-all duration-200 group
              ${
                depth === 0
                  ? "px-3 py-2.5"
                  : "px-3 py-2"
              }
              ${
                isActive ||
                isDescendantActive
                  ? activeStyle
                  : inactiveStyle
              }
            `}
          >
            {/* Icon */}
            {NodeIcon && (
              <NodeIcon
                className={`
                  ${
                    depth === 0
                      ? "w-5 h-5"
                      : "w-4 h-4"
                  }
                  ${
                    isActive ||
                    isDescendantActive
                      ? activeIcon
                      : inactiveIcon
                  }
                `}
              />
            )}

            {/* Bullet */}
            {!NodeIcon &&
              depth > 0 && (
                <span
                  className={`
                    w-1.5 h-1.5
                    rounded-full
                    flex-shrink-0
                    ${
                      isActive ||
                      isDescendantActive
                        ? "bg-teal-600"
                        : "bg-slate-300"
                    }
                  `}
                />
              )}

            {/* Label */}
            <span
              className={`
                font-medium
                truncate
                text-left
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

            {/* Arrow */}
            <MdOutlineKeyboardArrowDown
              className={`
                ${
                  depth === 0
                    ? "w-4 h-4"
                    : "w-3.5 h-3.5"
                }
                ml-auto
                flex-shrink-0
                transition-transform
                duration-200
                ${
                  isOpen
                    ? "rotate-180"
                    : ""
                }
                ${
                  isActive ||
                  isDescendantActive
                    ? "text-teal-600"
                    : "text-slate-400"
                }
              `}
            />
          </button>

          {/* ==================================================
              CHILDREN DROPDOWN
              ================================================== */}

          <div
            className={`
              grid
              transition-[grid-template-rows,opacity]
              duration-300
              ease-in-out
              ${
                isOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }
            `}
          >
            <div className="overflow-hidden">
              <div
                className={`
                  ml-3
                  pl-3
                  border-l-2
                  border-slate-100
                  ${
                    depth === 0
                      ? "space-y-1 mt-1"
                      : "space-y-0.5"
                  }
                `}
              >
                {node.children?.map(
                  (child) =>
                    renderNode(
                      child,
                      depth + 1,
                    ),
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ========================================================
    // NORMAL LINK
    // ========================================================

    return (
      <Link
        key={node.href}
        href={node.href}
        onClick={onClose}
        aria-current={
          isActive
            ? "page"
            : undefined
        }
        className={`
          flex items-center gap-2
          rounded-lg
          transition-all
          duration-200
          group
          ${
            depth === 0
              ? "px-3 py-2.5"
              : "px-3 py-1.5"
          }
          ${
            isActive
              ? activeStyle
              : inactiveStyle
          }
        `}
      >
        {/* Icon */}
        {NodeIcon ? (
          <NodeIcon
            className={`
              ${
                depth === 0
                  ? "w-5 h-5"
                  : "w-4 h-4"
              }
              ${
                isActive
                  ? activeIcon
                  : inactiveIcon
              }
            `}
          />
        ) : (
          depth > 0 && (
            <span
              className={`
                w-1.5 h-1.5
                rounded-full
                flex-shrink-0
                ${
                  isActive
                    ? "bg-teal-600"
                    : "bg-slate-300"
                }
              `}
            />
          )
        )}

        {/* Label */}
        <span
          className={`
            font-medium
            truncate
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

        {/* Active Indicator */}
        {isActive &&
          depth === 0 && (
            <div
              className="
                ml-auto
                w-1.5
                h-6
                bg-teal-600
                rounded-full
              "
            />
          )}
      </Link>
    );
  };

  // ==========================================================
  // SIDEBAR UI
  // ==========================================================

  return (
    <aside
      className="
        h-screen
        w-64
        bg-white
        border-r
        border-slate-200
        flex
        flex-col
      "
    >
      {/* ======================================================
          HEADER / LOGO
          ====================================================== */}

      <div
        className="
          p-5
          border-b
          border-slate-200
          flex
          items-center
          justify-between
          flex-shrink-0
        "
      >
        <div
          className="
            flex
            items-center
            gap-3
            min-w-0
          "
        >
          {/* Logo */}
          <div
            className="
              w-10
              h-10
              rounded-lg
              flex
              items-center
              justify-center
              shadow-sm
              flex-shrink-0
              overflow-hidden
              bg-white
              border
              border-slate-200
            "
          >
            <Image
              src="/images/UCLogo.png"
              alt="Urban Cruise Logo"
              width={40}
              height={40}
              className="
                w-full
                h-full
                object-contain
              "
              priority
            />
          </div>

          {/* Brand */}
          <div className="min-w-0">
            <h1
              className="
                text-base
                font-bold
                text-slate-900
                truncate
              "
            >
              Urban Cruise
            </h1>

            <p
              className="
                text-xs
                text-slate-500
              "
            >
              CMS Panel
            </p>
          </div>
        </div>

        {/* Mobile Close */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="
              lg:hidden
              p-1
              hover:bg-slate-100
              rounded-lg
              transition-colors
            "
          >
            <MdOutlineClose
              className="
                w-5
                h-5
                text-slate-500
              "
            />
          </button>
        )}
      </div>

      {/* ======================================================
          NAVIGATION
          ====================================================== */}

      <nav
        className="
          flex-1
          p-3
          space-y-0.5
          overflow-y-auto
        "
        aria-label="Admin navigation"
      >
        {visibleItems.length === 0 ? (
          <p
            className="
              text-xs
              text-slate-400
              text-center
              py-4
            "
          >
            No menu access.
            Contact admin.
          </p>
        ) : (
          visibleItems.map(
            (item) =>
              renderNode(item),
          )
        )}
      </nav>

      {/* ======================================================
          USER / LOGOUT
          ====================================================== */}

      <div
        className="
          p-3
          border-t
          border-slate-200
          flex-shrink-0
        "
      >
        <div
          className="
            flex
            items-center
            gap-3
            px-3
            py-2.5
            rounded-lg
            hover:bg-slate-50
            transition-colors
            group
          "
        >
          {/* Avatar */}
          {user?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar_url}
              alt={displayName}
              className="
                w-9
                h-9
                rounded-full
                object-cover
                shadow-sm
                flex-shrink-0
              "
              onError={(e) => {
                (
                  e.target as HTMLImageElement
                ).style.display =
                  "none";
              }}
            />
          ) : (
            <div
              className="
                w-9
                h-9
                bg-gradient-to-br
                from-teal-500
                to-teal-600
                rounded-full
                flex
                items-center
                justify-center
                shadow-sm
                flex-shrink-0
              "
            >
              <span
                className="
                  text-white
                  font-semibold
                  text-xs
                "
              >
                {displayInitials}
              </span>
            </div>
          )}

          {/* User Details */}
          <div
            className="
              flex-1
              min-w-0
            "
          >
            <p
              className="
                text-sm
                font-medium
                text-slate-900
                truncate
              "
            >
              {displayName}
            </p>

            <p
              className="
                text-xs
                text-slate-500
                truncate
              "
            >
              {displayEmail}
            </p>

            <span
              className={`
                text-[10px]
                px-1.5
                py-0.5
                rounded-full
                inline-block
                mt-0.5
                font-medium
                ${getRoleBadgeColor(
                  displayRole,
                )}
              `}
            >
              {displayRole}
            </span>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
            className="
              p-1.5
              hover:bg-red-50
              rounded-lg
              transition-colors
              flex-shrink-0
            "
          >
            <MdOutlineLogout
              className="
                w-4
                h-4
                text-slate-400
                group-hover:text-red-600
                transition-colors
              "
            />
          </button>
        </div>
      </div>
    </aside>
  );
}
