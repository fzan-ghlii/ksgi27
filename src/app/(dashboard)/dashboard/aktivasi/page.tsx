import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getAllowedInviteRoles } from '@/lib/auth/roles';
import { seedInitialPeriodAndDivisions } from '@/lib/auth/bootstrap';
import { listActivationInvites } from '@/lib/data/invites';
import { listPeriods } from '@/lib/data/periods';
import { AktivasiClient } from './aktivasi-client';

export default async function DashboardAktivasiPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const isAllowed = getAllowedInviteRoles(user.role, user.division_code).length > 0;

  if (!isAllowed) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-line text-center space-y-3">
        <h2 className="text-xl font-bold text-ink">Akses Dibatasi</h2>
        <p className="text-sm text-ink-muted max-w-md mx-auto">
          Fitur pembuatan dan pengelolaan Link Aktivasi hanya dapat diakses oleh Presidium dan Kepala Divisi HRD.
        </p>
      </div>
    );
  }

  await seedInitialPeriodAndDivisions();
  const [initialInvites, periods] = await Promise.all([
    listActivationInvites(user),
    listPeriods(),
  ]);

  return <AktivasiClient initialInvites={initialInvites} periods={periods} user={user} />;
}

