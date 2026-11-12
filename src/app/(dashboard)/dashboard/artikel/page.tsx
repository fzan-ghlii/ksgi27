import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { listArticlesForActor } from '@/lib/data/articles';
import { ArtikelClient } from './artikel-client';

export default async function DashboardArtikelPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const articles = await listArticlesForActor(user);

  return <ArtikelClient user={user} initialArticles={articles} />;
}
