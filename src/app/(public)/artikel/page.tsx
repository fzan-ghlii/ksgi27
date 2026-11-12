import { getPublishedArticles } from '@/lib/data/public';
import { Newspaper } from 'lucide-react';
import { ArtikelPublicClient } from './artikel-public-client';

export default async function ArtikelPage() {
  const articles = await getPublishedArticles();

  return (
    <div className="py-12 sm:py-16 bg-background min-h-[70vh]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl space-y-10">
        {/* Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cerulean-light text-cerulean-dark text-xs font-bold uppercase tracking-wider mb-3 border border-cerulean/20">
            <Newspaper className="h-3.5 w-3.5 text-cerulean" />
            Warta & Riset Pasar Modal
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-ink tracking-tight">
            Artikel Edukasi & Analisis Investasi
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-muted">
            Kumpulan tulisan, riset fundamental, dan panduan investasi karya tim analis pengurus GIBEI UNIMED.
          </p>
        </div>

        {/* Client Articles Explorer */}
        <ArtikelPublicClient initialArticles={articles} />
      </div>
    </div>
  );
}
