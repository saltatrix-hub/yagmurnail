import ScheduleScreen from '@/components/ScheduleScreen';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function HairdresserPage({ params }: PageProps) {
  const { id } = await params;
  return <ScheduleScreen hairdresserId={id} />;
}
