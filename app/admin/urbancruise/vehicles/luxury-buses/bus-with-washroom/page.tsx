'use client';

import Link from 'next/link';
import {
  MdOutlineArrowForward, MdOutlineHome, MdOutlinePhone, MdOutlineInfo,
  MdOutlineSettings, MdOutlineStar, MdOutlineDirectionsCar,
  MdOutlineCompareArrows, MdOutlineAttachMoney, MdOutlineSearch,
  MdOutlineExplore, MdOutlineHelp, MdOutlineLocationOn,
  MdOutlineHandshake, MdOutlinePhoneAndroid,
} from 'react-icons/md';

const vehicleSections = [
  { label: 'Hero', slug: 'hero', icon: MdOutlineHome },
  { label: 'Get a Quick Call', slug: 'get-a-quick-call', icon: MdOutlinePhone },
  { label: 'About', slug: 'about', icon: MdOutlineInfo },
  { label: 'How It Works', slug: 'how-it-works', icon: MdOutlineSettings },
  { label: 'We Offer Best Services', slug: 'we-offer-best-services', icon: MdOutlineStar },
  { label: 'Vehicle For Every Group Size', slug: 'vehicle-for-every-group-size', icon: MdOutlineDirectionsCar },
  { label: 'Compare With Vehicles', slug: 'compare-with-vehicles', icon: MdOutlineCompareArrows },
  { label: 'Prices & Charges', slug: 'prices-charges', icon: MdOutlineAttachMoney },
  { label: 'Looking for Other Vehicle', slug: 'looking-for-other-vehicle', icon: MdOutlineSearch },
  { label: 'Tempo Traveller For Every Occasion', slug: 'tempo-traveller-for-every-occasion', icon: MdOutlineDirectionsCar },
  { label: 'Why Choose Urban Cruise', slug: 'why-choose-urban-cruise', icon: MdOutlineStar },
  { label: 'Testimonials', slug: 'testimonials', icon: MdOutlineStar },
  { label: 'Discover Your Next Adventure', slug: 'discover-your-next-adventure', icon: MdOutlineExplore },
  { label: 'FAQs', slug: 'faqs', icon: MdOutlineHelp },
  { label: 'Service Locations', slug: 'service-locations', icon: MdOutlineLocationOn },
  { label: 'Our Trusted Partners', slug: 'our-trusted-partners', icon: MdOutlineHandshake },
  { label: 'Download Our App', slug: 'download-our-app', icon: MdOutlinePhoneAndroid },
];

export default function BusWithWashroomPage() {
  const basePath = '/admin/urbancruise/vehicles/luxury-buses/bus-with-washroom';
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <Link href="/admin/urbancruise/vehicles/luxury-buses" className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block">
          ← Back to Luxury Buses
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Bus With Washroom</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicleSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.slug} href={`${basePath}/${section.slug}`}
              className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-900 dark:text-white text-sm">{section.label}</span>
                <MdOutlineArrowForward className="w-4 h-4 text-gray-400 group-hover:text-blue-600 ml-auto" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}