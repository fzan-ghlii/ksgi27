import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { ArticleForm } from '@/components/dashboard/article-form';

export default async function NewArticlePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return <ArticleForm user={user} />;
}

