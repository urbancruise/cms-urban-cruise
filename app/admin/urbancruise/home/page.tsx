'use client';

import {
  MdOutlineHome,
  MdOutlinePhone,
  MdOutlineInfo,
  MdOutlineSettings,
  MdOutlineStar,
  MdOutlineDirectionsCar,
  MdOutlineHelp,
  MdOutlineLocationOn,
  MdOutlineHandshake,
  MdOutlinePhoneAndroid,
} from 'react-icons/md';
import ContentCard from '../_components/ContentCard';

const homeSections = [
  {
    label: 'Hero',
    href: '/admin/urbancruise/home/hero',
    desc: 'Main banner and hero content',
    icon: MdOutlineHome,
    color: 'blue' as const,
  },
  {
    label: 'Get a Quick Call',
    href: '/admin/urbancruise/home/get-a-quick-call',
    desc: 'Quick contact form',
    icon: MdOutlinePhone,
    color: 'green' as const,
  },
  {
    label: 'About',
    href: '/admin/urbancruise/home/about',
    desc: 'About company content',
    icon: MdOutlineInfo,
    color: 'purple' as const,
  },
  {
    label: 'How It Works',
    href: '/admin/urbancruise/home/how-it-works',
    desc: 'Process steps',
    icon: MdOutlineSettings,
    color: 'orange' as const,
  },
  {
    label: 'We Offer Best Services',
    href: '/admin/urbancruise/home/we-offer-best-services',
    desc: 'Services list',
    icon: MdOutlineStar,
    color: 'pink' as const,
  },
  {
    label: 'Vehicle For Every Group Size',
    href: '/admin/urbancruise/home/vehicle-for-every-group-size',
    desc: 'Vehicle group options',
    icon: MdOutlineDirectionsCar,
    color: 'indigo' as const,
  },
  {
    label: 'Tempo Traveller For Every Occasion',
    href: '/admin/urbancruise/home/tempo-traveller-for-every-occasion',
    desc: 'Tempo traveller content',
    icon: MdOutlineDirectionsCar,
    color: 'teal' as const,
  },
  {
    label: 'Why Choose Urban Cruise',
    href: '/admin/urbancruise/home/why-choose-urban-cruise',
    desc: 'USP content',
    icon: MdOutlineStar,
    color: 'red' as const,
  },
  {
    label: 'Testimonials',
    href: '/admin/urbancruise/home/testimonials',
    desc: 'Customer reviews',
    icon: MdOutlineStar,
    color: 'orange' as const,
  },
  {
    label: 'FAQs',
    href: '/admin/urbancruise/home/faqs',
    desc: 'Frequently asked questions',
    icon: MdOutlineHelp,
    color: 'blue' as const,
  },
  {
    label: 'Service Locations',
    href: '/admin/urbancruise/home/service-locations',
    desc: 'Locations served',
    icon: MdOutlineLocationOn,
    color: 'green' as const,
  },
  {
    label: 'Our Trusted Partners',
    href: '/admin/urbancruise/home/our-trusted-partners',
    desc: 'Partner logos and details',
    icon: MdOutlineHandshake,
    color: 'purple' as const,
  },
  {
    label: 'Download Our App',
    href: '/admin/urbancruise/home/download-our-app',
    desc: 'App download section',
    icon: MdOutlinePhoneAndroid,
    color: 'teal' as const,
  },
];

export default function HomePage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <MdOutlineHome className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Home Page Sections
          </h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          Manage all sections of the homepage ({homeSections.length} sections)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {homeSections.map((section) => (
          <ContentCard
            key={section.href}
            title={section.label}
            description={section.desc}
            href={section.href}
            icon={section.icon}
            color={section.color}
          />
        ))}
      </div>
    </div>
  );
}