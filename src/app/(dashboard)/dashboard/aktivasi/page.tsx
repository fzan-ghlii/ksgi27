import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { canIssueInvite } from '@/lib/auth/roles';
import { listActivationInvites } from '@/lib/data/invites';
import { AktivasiClient } from './aktivasi-client';

export default async function DashboardAktivasiPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Check if role is allowed to access activation links (Creator, Presidium, Kadiv HRD)
  const isAllowed = 
    user.role === 'creator' || 
    user.role === 'master_presidium' || 
    (user.role === 'admin_kadiv' && user.division_code === 'HRD');

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

  const initialInvites = await listActivationInvites(user);

  return <AktivasiClient initialInvites={initialInvites} user={user} />;
}

