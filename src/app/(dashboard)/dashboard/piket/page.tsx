import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { seedInitialPeriodAndDivisions } from '@/lib/auth/bootstrap';
import {
  getPiketSettings,
  listEligiblePiketMembers,
  listPiketAttendances,
  listPiketSchedules,
} from '@/lib/data/piket';
import { PiketClient } from './piket-client';

export default async function DashboardPiketPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const periodId = await seedInitialPeriodAndDivisions();

  const [settings, schedules, attendances, eligibleMembers] = await Promise.all([
    getPiketSettings(),
    listPiketSchedules(periodId),
    listPiketAttendances(user, periodId),
    listEligiblePiketMembers(periodId),
  ]);

  return (
    <PiketClient
      user={user}
      periodId={periodId}
      initialSettings={settings}
      initialSchedules={schedules}
      initialAttendances={attendances}
      eligibleMembers={eligibleMembers}
    />
  );
}

