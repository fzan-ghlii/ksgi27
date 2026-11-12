import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getArticleForEdit } from '@/lib/data/articles';
import { ArticleForm } from '@/components/dashboard/article-form';

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { id } = await params;
  const article = await getArticleForEdit(user, id);

  if (!article) {
    notFound();
  }

  return <ArticleForm user={user} initialArticle={article} />;
}

