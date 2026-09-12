'use client';

import Link from 'next/link';
import { MdOutlineArrowForward } from 'react-icons/md';

const vehicles = [
  { name: 'Luxury Bus', href: '/admin/urbancruise/vehicles/luxury-buses' },
  { name: 'Volvo Bus', href: '/admin/urbancruise/vehicles/luxury-buses/volvo-bus' },
  { name: 'Bharat Benz Bus', href: '/admin/urbancruise/vehicles/luxury-buses/bharat-benz-bus' },
  { name: 'Bus With Washroom', href: '/admin/urbancruise/vehicles/luxury-buses/bus-with-washroom' },
  { name: 'Sleeper | Semi Sleeper Bus', href: '/admin/urbancruise/vehicles/luxury-buses/sleeper-semi-sleeper-bus' },
];

export default function LuxuryBusesPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <Link href="/admin/urbancruise/vehicles" className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block">
          ← Back to Vehicles
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Luxury Buses
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((v) => (
          <Link
            key={v.href}
            href={v.href}
            className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">{v.name}</h3>
              <MdOutlineArrowForward className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}