import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { listEvents } from '@/lib/data/events';
import { listPeriods } from '@/lib/data/periods';
import { listEventReportsForActor } from '@/lib/data/event-reports';
import { EventClient } from './event-client';

export default async function DashboardEventSpmPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [events, periods, reports] = await Promise.all([
    listEvents(),
    listPeriods(),
    listEventReportsForActor(user),
  ]);

  return (
    <EventClient
      user={user}
      initialEvents={events}
      periods={periods}
      initialReports={reports}
    />
  );
}
