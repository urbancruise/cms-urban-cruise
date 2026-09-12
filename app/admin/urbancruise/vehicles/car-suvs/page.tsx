'use client';

import Link from 'next/link';
import { MdOutlineDirectionsCar } from 'react-icons/md';
import ContentCard from '@/app/admin/urbancruise/_components/ContentCard';

const vehicles = [
  {
    name: 'Ertiga',
    href: '/admin/urbancruise/vehicles/car-suvs/ertiga',
    desc: '7-seater MPV',
    color: 'blue' as const,
  },
  {
    name: 'Innova Crysta',
    href: '/admin/urbancruise/vehicles/car-suvs/innova-crysta',
    desc: 'Premium SUV',
    color: 'purple' as const,
  },
  {
    name: 'Hycross',
    href: '/admin/urbancruise/vehicles/car-suvs/hycross',
    desc: 'Luxury SUV',
    color: 'green' as const,
  },
];

export default function CarSuvsPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <Link
          href="/admin/urbancruise/vehicles"
          className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
        >
          ← Back to Vehicles
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Car & SUVs
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage car and SUV vehicle pages
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((v) => (
          <ContentCard
            key={v.href}
            title={v.name}
            description={v.desc}
            href={v.href}
            icon={MdOutlineDirectionsCar}
            color={v.color}
          />
        ))}
      </div>
    </div>
  );
}