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

const SECTION_DESCRIPTIONS: Record<string, string> = {
  'hero': 'The main banner visitors see first',
  'get-a-quick-call': 'Quick contact / lead capture form',
  'about': 'Company or vehicle description',
  'how-it-works': 'Step-by-step process explanation',
  'we-offer-best-services': 'Services provided',
  'vehicle-for-every-group-size': 'Vehicle options by group size',
  'compare-with-vehicles': 'Comparison table with other vehicles',
  'prices-charges': 'Pricing and charges breakdown',
  'looking-for-other-vehicle': 'Suggest alternative vehicles',
  'tempo-traveller-for-every-occasion': 'Use cases for tempo traveller',
  'why-choose-urban-cruise': 'Unique selling points',
  'testimonials': 'Customer reviews and ratings',
  'discover-your-next-adventure': 'Call-to-action / explore section',
  'faqs': 'Frequently asked questions',
  'service-locations': 'Locations where service is available',
  'our-trusted-partners': 'Partner logos and details',
  'download-our-app': 'Mobile app download links',
};

interface VehicleSectionPageProps {
  /** Name of the vehicle (e.g. "Ertiga") */
  vehicleName: string;
  /** Section slug (e.g. "hero") */
  section: string;
}

export default function VehicleSectionPage({
  vehicleName,
  section,
}: VehicleSectionPageProps) {
  const title =
    SECTION_TITLES[section] ||
    section
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  const description =
    SECTION_DESCRIPTIONS[section] ||
    `Manage "${title}" content for ${vehicleName}`;

  return (
    <SectionPage
      title={`${vehicleName} — ${title}`}
      description={description}
    />
  );
}