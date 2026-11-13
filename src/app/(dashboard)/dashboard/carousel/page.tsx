import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageHeroCarousel } from '@/lib/auth/permissions';
import { getHeroCarouselConfig } from '@/lib/data/carousel';
import { CarouselClient } from './carousel-client';

export default async function DashboardCarouselPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!canManageHeroCarousel(user)) {
    redirect('/dashboard');
  }

  const initialConfig = await getHeroCarouselConfig();

  return <CarouselClient initialConfig={initialConfig} />;
}

