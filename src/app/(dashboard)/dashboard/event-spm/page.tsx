import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { listEvents } from '@/lib/data/events';
import { listPeriods } from '@/lib/data/periods';
import { EventClient } from './event-client';

export default async function DashboardEventSpmPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [events, periods] = await Promise.all([
    listEvents(),
    listPeriods(),
  ]);

  return (
    <EventClient
      user={user}
      initialEvents={events}
      periods={periods}
    />
  );
}
