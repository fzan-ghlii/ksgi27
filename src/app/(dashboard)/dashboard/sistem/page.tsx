import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getSystemMetrics, listAllUsers, queryAuditLogs } from '@/lib/data/system';
import { SystemClient } from './system-client';

export default async function CreatorSystemPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'creator') {
    redirect('/dashboard');
  }

  const [metrics, initialLogs, allUsers] = await Promise.all([
    getSystemMetrics(user),
    queryAuditLogs({ limit: 50 }),
    listAllUsers(user),
  ]);

  return (
    <SystemClient
      user={user}
      initialMetrics={metrics}
      initialLogs={initialLogs}
      initialUsers={allUsers}
    />
  );
}
