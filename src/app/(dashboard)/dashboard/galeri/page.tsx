import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { listGalleriesForActor } from '@/lib/data/galleries';
import { listPeriods } from '@/lib/data/periods';
import { seedInitialPeriodAndDivisions } from '@/lib/auth/bootstrap';
import { GaleriClient } from './galeri-client';

export default async function DashboardGaleriPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  await seedInitialPeriodAndDivisions();
  const [galleries, periods] = await Promise.all([
    listGalleriesForActor(user),
    listPeriods(),
  ]);

  return (
    <GaleriClient
      user={user}
      initialGalleries={galleries}
      periods={periods}
    />
  );
}
