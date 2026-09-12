'use client';

import Link from 'next/link';
import {
  MdOutlineHome,
  MdOutlinePhone,
  MdOutlineInfo,
  MdOutlineSettings,
  MdOutlineStar,
  MdOutlineDirectionsCar,
  MdOutlineCompareArrows,
  MdOutlineSearch,
  MdOutlineExplore,
  MdOutlineHelp,
  MdOutlineLocationOn,
  MdOutlineHandshake,
  MdOutlinePhoneAndroid,
  MdOutlineArrowBack,
} from 'react-icons/md';
import ContentCard, {
  CardColor,
} from '@/app/admin/urbancruise/_components/ContentCard';

const vehicleSections: Array<{
  label: string;
  slug: string;
  icon: any;
  color: CardColor;
}> = [
  { label: 'Hero', slug: 'hero', icon: MdOutlineHome, color: 'blue' },
  { label: 'Get a Quick Call', slug: 'get-a-quick-call', icon: MdOutlinePhone, color: 'green' },
  { label: 'About', slug: 'about', icon: MdOutlineInfo, color: 'purple' },
  { label: 'How It Works', slug: 'how-it-works', icon: MdOutlineSettings, color: 'orange' },
  { label: 'We Offer Best Services', slug: 'we-offer-best-services', icon: MdOutlineStar, color: 'pink' },
  { label: 'Vehicle For Every Group Size', slug: 'vehicle-for-every-group-size', icon: MdOutlineDirectionsCar, color: 'indigo' },
  { label: 'Compare With Vehicles', slug: 'compare-with-vehicles', icon: MdOutlineCompareArrows, color: 'teal' },
  { label: 'Looking for Other Vehicle', slug: 'looking-for-other-vehicle', icon: MdOutlineSearch, color: 'red' },
  { label: 'Tempo Traveller For Every Occasion', slug: 'tempo-traveller-for-every-occasion', icon: MdOutlineDirectionsCar, color: 'blue' },
  { label: 'Why Choose Urban Cruise', slug: 'why-choose-urban-cruise', icon: MdOutlineStar, color: 'orange' },
  { label: 'Testimonials', slug: 'testimonials', icon: MdOutlineStar, color: 'green' },
  { label: 'Discover Your Next Adventure', slug: 'discover-your-next-adventure', icon: MdOutlineExplore, color: 'purple' },
  { label: 'FAQs', slug: 'faqs', icon: MdOutlineHelp, color: 'pink' },
  { label: 'Service Locations', slug: 'service-locations', icon: MdOutlineLocationOn, color: 'teal' },
  { label: 'Our Trusted Partners', slug: 'our-trusted-partners', icon: MdOutlineHandshake, color: 'indigo' },
  { label: 'Download Our App', slug: 'download-our-app', icon: MdOutlinePhoneAndroid, color: 'red' },
];

export default function ErtigaPage() {
  const basePath = '/admin/urbancruise/vehicles/car-suvs/ertiga';

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <Link
          href="/admin/urbancruise/vehicles/car-suvs"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-3"
        >
          <MdOutlineArrowBack className="w-4 h-4" />
          Back to Car & SUVs
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Ertiga
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage Ertiga vehicle page sections ({vehicleSections.length} sections)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicleSections.map((section) => (
          <ContentCard
            key={section.slug}
            title={section.label}
            href={`${basePath}/${section.slug}`}
            icon={section.icon}
            color={section.color}
            compact
          />
        ))}
      </div>
    </div>
  );
}