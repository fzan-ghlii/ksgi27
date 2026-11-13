import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageAchievements } from '@/lib/auth/permissions';
import { listAchievements } from '@/lib/data/achievements';
import { PrestasiClient } from './prestasi-client';

export default async function DashboardPrestasiPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!canManageAchievements(user)) {
    redirect('/dashboard');
  }

  const initialAchievements = await listAchievements();

  return <PrestasiClient initialAchievements={initialAchievements} />;
}

