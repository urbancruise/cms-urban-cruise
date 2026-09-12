'use client';

import SectionPage from './SectionPage';

const SECTION_TITLES: Record<string, string> = {
  'hero': 'Hero Section',
  'get-a-quick-call': 'Get a Quick Call',
  'about': 'About Section',
  'how-it-works': 'How It Works',
  'we-offer-best-services': 'We Offer Best Services',
  'vehicle-for-every-group-size': 'Vehicle For Every Group Size',
  'compare-with-vehicles': 'Compare With Vehicles',
  'prices-charges': 'Prices & Charges',
  'looking-for-other-vehicle': 'Looking for Other Vehicle',
  'tempo-traveller-for-every-occasion': 'Tempo Traveller For Every Occasion',
  'why-choose-urban-cruise': 'Why Choose Urban Cruise',
  'testimonials': 'Testimonials',
  'discover-your-next-adventure': 'Discover Your Next Adventure',
  'faqs': 'FAQs',
  'service-locations': 'Service Locations',
  'our-trusted-partners': 'Our Trusted Partners',
  'download-our-app': 'Download Our App',
};

interface VehicleSectionPageProps {
  vehicleName: string;
  section: string;
}

export default function VehicleSectionPage({
  vehicleName,
  section,
}: VehicleSectionPageProps) {
  const title = SECTION_TITLES[section] || section
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <SectionPage
      title={`${vehicleName} — ${title}`}
      description={`Manage "${title}" content for ${vehicleName}`}
    />
  );
}