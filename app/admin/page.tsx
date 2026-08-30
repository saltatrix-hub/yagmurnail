import ScheduleScreen from '@/components/ScheduleScreen';
import { getAdminStatus } from '@/lib/admin';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const status = await getAdminStatus();
  if (status === 'anonymous') redirect('/signin-with-chatgpt?return_to=/admin');
  if (status === 'forbidden') redirect('/');
  return <ScheduleScreen admin />;
}
