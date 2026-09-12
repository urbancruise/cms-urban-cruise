import VehicleSectionPage from '@/app/admin/urbancruise/_components/VehicleSectionPage';

interface PageProps {
  params: Promise<{ section: string }>;
}

export default async function VolvoBusSectionPage({ params }: PageProps) {
  const { section } = await params;
  return <VehicleSectionPage vehicleName="Volvo Bus" section={section} />;
}