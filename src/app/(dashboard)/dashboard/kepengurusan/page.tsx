import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { hasMinRole } from '@/lib/auth/roles';
import { listPeriods, listDivisionsByPeriod } from '@/lib/data/periods';
import { listBoardMembers } from '@/lib/data/board';
import { seedInitialPeriodAndDivisions } from '@/lib/auth/bootstrap';
import { KepengurusanClient } from './kepengurusan-client';

export default async function DashboardKepengurusanPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!hasMinRole(user.role, 'admin_kadiv')) redirect('/dashboard');

  await seedInitialPeriodAndDivisions();
  const periods = await listPeriods();

  const { periode } = await searchParams;
  const selected =
    periods.find((p) => p.id === periode) ?? periods.find((p) => p.is_current) ?? periods[0];

  const [divisions, members] = selected
    ? await Promise.all([listDivisionsByPeriod(selected.id), listBoardMembers(selected.id)])
    : [[], []];

  return (
    <KepengurusanClient
      user={user}
      periods={periods}
      selectedPeriodId={selected?.id ?? ''}
      divisions={divisions}
      members={members}
    />
  );
}
