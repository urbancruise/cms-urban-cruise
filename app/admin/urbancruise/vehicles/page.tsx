'use client';

import Link from 'next/link';
import {
  MdOutlineArrowForward,
  MdOutlineDirectionsCar,
  MdOutlineAirportShuttle,
  MdOutlineLocalTaxi,
  MdOutlineDirectionsBus,
  MdOutlineDriveEta,
  MdOutlineRvHookup,
} from 'react-icons/md';
import ContentCard from '../_components/ContentCard';

const vehicleCategories = [
  {
    title: 'Car & SUVs',
    href: '/admin/urbancruise/vehicles/car-suvs',
    icon: MdOutlineDriveEta,
    color: 'blue' as const,
    vehicles: [
      { name: 'Ertiga', href: '/admin/urbancruise/vehicles/car-suvs/ertiga' },
      { name: 'Innova Crysta', href: '/admin/urbancruise/vehicles/car-suvs/innova-crysta' },
      { name: 'Hycross', href: '/admin/urbancruise/vehicles/car-suvs/hycross' },
    ],
  },
  {
    title: 'Luxury Cars, SUVs, Vans',
    href: '/admin/urbancruise/vehicles/luxury-cars-suvs-vans',
    icon: MdOutlineLocalTaxi,
    color: 'purple' as const,
    vehicles: [
      { name: 'Luxury Cars & SUVs', href: '/admin/urbancruise/vehicles/luxury-cars-suvs-vans/luxury-cars-suvs' },
      { name: 'Mercedes Sprinter', href: '/admin/urbancruise/vehicles/luxury-cars-suvs-vans/mercedes-sprinter' },
      { name: 'Luxury Vans', href: '/admin/urbancruise/vehicles/luxury-cars-suvs-vans/luxury-vans' },
    ],
  },
  {
    title: 'Tempo Traveller',
    href: '/admin/urbancruise/vehicles/tempo-traveller',
    icon: MdOutlineAirportShuttle,
    color: 'orange' as const,
    vehicles: [
      { name: 'Tempo Traveller', href: '/admin/urbancruise/vehicles/tempo-traveller' },
      { name: 'Maharaja Tempo Traveller', href: '/admin/urbancruise/vehicles/tempo-traveller/maharaja' },
    ],
  },
  {
    title: 'Urbania',
    href: '/admin/urbancruise/vehicles/urbania',
    icon: MdOutlineRvHookup,
    color: 'green' as const,
    vehicles: [
      { name: 'Urbania', href: '/admin/urbancruise/vehicles/urbania' },
    ],
  },
  {
    title: 'Mini Bus',
    href: '/admin/urbancruise/vehicles/mini-bus',
    icon: MdOutlineDirectionsBus,
    color: 'pink' as const,
    vehicles: [
      { name: 'Mini Bus', href: '/admin/urbancruise/vehicles/mini-bus' },
    ],
  },
  {
    title: 'Luxury Buses',
    href: '/admin/urbancruise/vehicles/luxury-buses',
    icon: MdOutlineDirectionsBus,
    color: 'teal' as const,
    vehicles: [
      { name: 'Luxury Bus', href: '/admin/urbancruise/vehicles/luxury-buses' },
      { name: 'Volvo Bus', href: '/admin/urbancruise/vehicles/luxury-buses/volvo-bus' },
      { name: 'Bharat Benz Bus', href: '/admin/urbancruise/vehicles/luxury-buses/bharat-benz-bus' },
      { name: 'Bus With Washroom', href: '/admin/urbancruise/vehicles/luxury-buses/bus-with-washroom' },
      { name: 'Sleeper | Semi Sleeper Bus', href: '/admin/urbancruise/vehicles/luxury-buses/sleeper-semi-sleeper-bus' },
    ],
  },
];

export default function VehiclesPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
            <MdOutlineDirectionsCar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Our Vehicles
          </h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          Manage all vehicle categories ({vehicleCategories.length} categories)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {vehicleCategories.map((category) => (
          <div
            key={category.href}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
          >
            <ContentCard
              title={category.title}
              href={category.href}
              icon={category.icon}
              color={category.color}
              count={category.vehicles.length}
              countLabel="vehicles"
              className="rounded-b-none border-0 border-b"
            />

            <div className="p-4 space-y-1">
              {category.vehicles.map((vehicle) => (
                <Link
                  key={vehicle.href}
                  href={vehicle.href}
                  className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <span>{vehicle.name}</span>
                  <MdOutlineArrowForward className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}