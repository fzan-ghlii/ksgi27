import { getPublishedArticles } from '@/lib/data/public';
import { PublicPageHeader } from '@/components/public/page-header';
import { Newspaper } from 'lucide-react';
import { ArtikelPublicClient } from './artikel-public-client';

export default async function ArtikelPage() {
  const articles = await getPublishedArticles();

  return (
    <div className="py-12 sm:py-16 bg-background min-h-[70vh]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl space-y-10">
        <PublicPageHeader
          badge="Warta & Riset Pasar Modal"
          icon={<Newspaper className="h-3.5 w-3.5 text-cerulean" />}
          title="Artikel Edukasi & Analisis Investasi"
          description="Kumpulan tulisan, riset fundamental, dan panduan investasi karya tim analis pengurus GIBEI UNIMED."
        />

        {/* Client Articles Explorer */}
        <ArtikelPublicClient initialArticles={articles} />
      </div>
    </div>
  );
}
