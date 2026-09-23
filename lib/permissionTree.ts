import type { ComponentType } from "react";
import {
  MdOutlineDashboard,
  MdOutlineBarChart,
  MdOutlineGroup,
  MdOutlineLocationCity,
  MdOutlinePerson,
  MdOutlineAdminPanelSettings,
  MdOutlineHistory,
  MdOutlinePublic,
  MdOutlineHome,
  MdOutlineDirectionsCar,
} from "react-icons/md";

export interface PermissionGroup {
  key: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  children?: PermissionGroup[];
  permKey?: string;
}

// ============================================================
// Website-only permissions (Users → city-wise access)
// ============================================================
export const WEBSITE_PERMISSION_TREE: PermissionGroup[] = [
  {
    key: "urbancruisewebsite.view",
    label: "Urban Cruise Website",
    icon: MdOutlinePublic,
    permKey: "urbancruisewebsite.view",
    children: [
      {
        key: "urbancruise.home.view",
        label: "Website Home",
        icon: MdOutlineHome,
        permKey: "urbancruise.home.view",
        children: [
          {
            key: "urbancruise.home.hero.view",
            label: "Hero",
            permKey: "urbancruise.home.hero.view",
          },
          {
            key: "urbancruise.home.quickcall.view",
            label: "Get a Quick Call",
            permKey: "urbancruise.home.quickcall.view",
          },
          {
            key: "urbancruise.home.about.view",
            label: "About",
            permKey: "urbancruise.home.about.view",
          },
          {
            key: "urbancruise.home.howitworks.view",
            label: "How It Works",
            permKey: "urbancruise.home.howitworks.view",
          },
          {
            key: "urbancruise.home.services.view",
            label: "We Offer Best Services",
            permKey: "urbancruise.home.services.view",
          },
          {
            key: "urbancruise.home.groupsize.view",
            label: "Vehicle For Every Group Size",
            permKey: "urbancruise.home.groupsize.view",
          },
          {
            key: "urbancruise.home.tempotraveller.view",
            label: "Tempo Traveller For Every Occasion",
            permKey: "urbancruise.home.tempotraveller.view",
          },
          {
            key: "urbancruise.home.whychoose.view",
            label: "Why Choose Urban Cruise",
            permKey: "urbancruise.home.whychoose.view",
          },
          {
            key: "urbancruise.home.testimonials.view",
            label: "Testimonials",
            permKey: "urbancruise.home.testimonials.view",
          },
          {
            key: "urbancruise.home.faqs.view",
            label: "FAQs",
            permKey: "urbancruise.home.faqs.view",
          },
          {
            key: "urbancruise.home.locations.view",
            label: "Service Locations",
            permKey: "urbancruise.home.locations.view",
          },
          {
            key: "urbancruise.home.partners.view",
            label: "Our Trusted Partners",
            permKey: "urbancruise.home.partners.view",
          },
          {
            key: "urbancruise.home.downloadapp.view",
            label: "Download Our App",
            permKey: "urbancruise.home.downloadapp.view",
          },
        ],
      },
      {
        key: "urbancruise.vehicles.view",
        label: "Website Vehicles",
        icon: MdOutlineDirectionsCar,
        permKey: "urbancruise.vehicles.view",
        children: [
          {
            key: "urbancruise.vehicles.carsuvs.view",
            label: "Car & SUVs",
            permKey: "urbancruise.vehicles.carsuvs.view",
            children: [
              {
                key: "urbancruise.vehicles.ertiga.view",
                label: "Ertiga",
                permKey: "urbancruise.vehicles.ertiga.view",
              },
              {
                key: "urbancruise.vehicles.innova.view",
                label: "Innova Crysta",
                permKey: "urbancruise.vehicles.innova.view",
              },
              {
                key: "urbancruise.vehicles.hycross.view",
                label: "Hycross",
                permKey: "urbancruise.vehicles.hycross.view",
              },
            ],
          },
          {
            key: "urbancruise.vehicles.luxury.view",
            label: "Luxury Cars, SUVs, Vans",
            permKey: "urbancruise.vehicles.luxury.view",
            children: [
              {
                key: "urbancruise.vehicles.luxurycars.view",
                label: "Luxury Cars & SUVs",
                permKey: "urbancruise.vehicles.luxurycars.view",
              },
              {
                key: "urbancruise.vehicles.sprinter.view",
                label: "Mercedes Sprinter",
                permKey: "urbancruise.vehicles.sprinter.view",
              },
              {
                key: "urbancruise.vehicles.luxuryvans.view",
                label: "Luxury Vans",
                permKey: "urbancruise.vehicles.luxuryvans.view",
              },
            ],
          },
          {
            key: "urbancruise.vehicles.tempo.view",
            label: "Tempo Traveller",
            permKey: "urbancruise.vehicles.tempo.view",
            children: [
              {
                key: "urbancruise.vehicles.tempotraveller.view",
                label: "Tempo Traveller",
                permKey: "urbancruise.vehicles.tempotraveller.view",
              },
              {
                key: "urbancruise.vehicles.maharaja.view",
                label: "Maharaja Tempo Traveller",
                permKey: "urbancruise.vehicles.maharaja.view",
              },
            ],
          },
          {
            key: "urbancruise.vehicles.urbania.view",
            label: "Urbania",
            permKey: "urbancruise.vehicles.urbania.view",
            children: [
              {
                key: "urbancruise.vehicles.urbania.main.view",
                label: "Urbania",
                permKey: "urbancruise.vehicles.urbania.main.view",
              },
            ],
          },
          {
            key: "urbancruise.vehicles.minibus.view",
            label: "Mini Bus",
            permKey: "urbancruise.vehicles.minibus.view",
            children: [
              {
                key: "urbancruise.vehicles.minibus.main.view",
                label: "Mini Bus",
                permKey: "urbancruise.vehicles.minibus.main.view",
              },
            ],
          },
          {
            key: "urbancruise.vehicles.luxurybuses.view",
            label: "Luxury Buses",
            permKey: "urbancruise.vehicles.luxurybuses.view",
            children: [
              {
                key: "urbancruise.vehicles.luxurybus.view",
                label: "Luxury Bus",
                permKey: "urbancruise.vehicles.luxurybus.view",
              },
              {
                key: "urbancruise.vehicles.volvo.view",
                label: "Volvo Bus",
                permKey: "urbancruise.vehicles.volvo.view",
              },
              {
                key: "urbancruise.vehicles.bharatbenz.view",
                label: "Bharat Benz Bus",
                permKey: "urbancruise.vehicles.bharatbenz.view",
              },
              {
                key: "urbancruise.vehicles.washroom.view",
                label: "Bus With Washroom",
                permKey: "urbancruise.vehicles.washroom.view",
              },
              {
                key: "urbancruise.vehicles.sleeper.view",
                label: "Sleeper | Semi Sleeper Bus",
                permKey: "urbancruise.vehicles.sleeper.view",
              },
            ],
          },
        ],
      },
    ],
  },
];

// ============================================================
// Full permissions tree (Roles page)
// ============================================================
export const FULL_PERMISSION_TREE: PermissionGroup[] = [
  {
    key: "dashboard.view",
    label: "Dashboard",
    icon: MdOutlineDashboard,
    permKey: "dashboard.view",
  },
  {
    key: "analytics.view",
    label: "Analytics",
    icon: MdOutlineBarChart,
    permKey: "analytics.view",
  },
  {
    key: "activity.view",
    label: "Activity",
    icon: MdOutlineHistory,
    permKey: "activity.view",
  },
  {
    key: "users.view",
    label: "Users",
    icon: MdOutlineGroup,
    permKey: "users.view",
  },
  {
    key: "roles.view",
    label: "Roles",
    icon: MdOutlineAdminPanelSettings,
    permKey: "roles.view",
  },
  {
    key: "cities.view",
    label: "Cities",
    icon: MdOutlineLocationCity,
    permKey: "cities.view",
  },
  ...WEBSITE_PERMISSION_TREE,
  {
    key: "profile.view",
    label: "Profile",
    icon: MdOutlinePerson,
    permKey: "profile.view",
  },
];

// ============================================================
// Helpers
// ============================================================
export function collectAllKeys(nodes: PermissionGroup[]): string[] {
  const out: string[] = [];
  const walk = (list: PermissionGroup[]) => {
    list.forEach((n) => {
      if (n.permKey) out.push(n.permKey);
      if (n.children) walk(n.children);
    });
  };
  walk(nodes);
  return out;
}

export const ALL_FULL_KEYS = collectAllKeys(FULL_PERMISSION_TREE);
export const ALL_WEBSITE_KEYS = collectAllKeys(WEBSITE_PERMISSION_TREE);
