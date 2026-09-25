"use client";

import { MdOutlineHome, MdOutlineDirectionsCar } from "react-icons/md";
import ContentCard from "./_components/ContentCard";

export default function UrbanCruisePage() {
  const sections = [
    {
      title: "Website Home",
      description: "Manage all homepage sections",
      href: "/admin/urbancruise/home",
      icon: MdOutlineHome,
      color: "blue" as const,
      count: 13,
    },
    {
      title: "Website Vehicles",
      description: "Manage vehicle pages and details",
      href: "/admin/urbancruise/vehicles",
      icon: MdOutlineDirectionsCar,
      color: "purple" as const,
      count: 6,
      countLabel: "categories",
    },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Urban Cruise Website</h1>
        <p className="text-slate-500 mt-1">
          Manage your website content, pages, and sections
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <ContentCard
            key={section.href}
            title={section.title}
            description={section.description}
            href={section.href}
            icon={section.icon}
            color={section.color}
            count={section.count}
            countLabel={section.countLabel}
          />
        ))}
      </div>
    </div>
  );
}
