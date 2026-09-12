import VehicleSectionPage from '@/app/admin/urbancruise/_components/VehicleSectionPage';

interface PageProps {
  params: Promise<{ section: string }>;
}

export default async function ErtigaSectionPage({ params }: PageProps) {
  const { section } = await params;
  return <VehicleSectionPage vehicleName="Ertiga" section={section} />;
}