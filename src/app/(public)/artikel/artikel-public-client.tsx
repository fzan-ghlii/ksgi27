'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  BookOpen, 
  Clock, 
  Eye, 
  Newspaper, 
  Search, 
  Sparkles, 
  Tag 
} from 'lucide-react';
import type { Article } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { ImagePreview } from '@/components/shared/image-inputs';
import { ARTICLE_CATEGORIES } from '@/lib/schemas/content';
import { markdownExcerpt } from '@/lib/utils/content';
import { formatDate, cn } from '@/lib/utils';

interface ArtikelPublicClientProps {
  initialArticles: Article[];
}

export function ArtikelPublicClient({ initialArticles }: ArtikelPublicClientProps) {
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('ALL');

  const filteredArticles = React.useMemo(() => {
    return initialArticles.filter((art) => {
      const matchCat = selectedCategory === 'ALL' || art.category === selectedCategory;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        art.title.toLowerCase().includes(q) ||
        art.author_name.toLowerCase().includes(q) ||
        art.content.toLowerCase().includes(q) ||
        art.tags?.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [initialArticles, selectedCategory, search]);

  // Find the featured article (either is_featured=true or the newest one)
  const featuredArticle = React.useMemo(() => {
    if (search || selectedCategory !== 'ALL') return null;
    return initialArticles.find((a) => a.is_featured) || initialArticles[0] || null;
  }, [initialArticles, search, selectedCategory]);

  const regularArticles = React.useMemo(() => {
    if (!featuredArticle) return filteredArticles;
    return filteredArticles.filter((a) => a.id !== featuredArticle.id);
  }, [filteredArticles, featuredArticle]);

  const categories = ['ALL', ...ARTICLE_CATEGORIES];

  return (
    <div className="space-y-10">
      {/* Search and Category Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-line shadow-xs">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari riset saham, analisis emiten, atau topik..."
            className="pl-10 h-10 text-xs sm:text-sm bg-surface/50 border-line"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                  active
                    ? 'bg-cerulean text-white shadow-xs'
                    : 'text-ink-muted hover:text-cerulean-dark hover:bg-surface'
                )}
              >
                {cat === 'ALL' ? 'Semua Kategori' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured Big Card (Only when no search/cat filter active) */}
      {featuredArticle && (
        <div className="bento-card overflow-hidden bg-white border border-line hover:border-cerulean transition-all shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-7 h-64 sm:h-80 lg:h-full relative overflow-hidden bg-slate-100 min-h-[260px]">
              {featuredArticle.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featuredArticle.thumbnail_url}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cerulean-light via-surface to-cyan-light text-cerulean">
                  <Newspaper className="h-16 w-16 opacity-40" />
                </div>
              )}
              <div className="absolute top-4 left-4">
                <Badge variant="gold" className="font-extrabold shadow-sm gap-1">
                  <Sparkles className="h-3 w-3" /> ARTIKEL UNGGULAN
                </Badge>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <span className="font-bold text-cerulean-dark uppercase tracking-wider">
                    {featuredArticle.category}
                  </span>
                  <span>•</span>
                  <span>{formatDate(featuredArticle.published_at)}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {featuredArticle.reading_minutes || 1} mnt baca
                  </span>
                </div>

                <Link href={`/artikel/${featuredArticle.slug}`}>
                  <h2 className="text-xl sm:text-2xl font-black text-ink hover:text-cerulean-dark transition-colors leading-tight">
                    {featuredArticle.title}
                  </h2>
                </Link>

                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed line-clamp-4">
                  {markdownExcerpt(featuredArticle.content, 200)}
                </p>
              </div>

              <div className="pt-4 border-t border-line flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-ink-muted block text-[11px]">Penulis:</span>
                  <strong className="text-ink font-bold">{featuredArticle.author_name}</strong>
                  <span className="text-ink-muted text-[11px]"> ({featuredArticle.division_code})</span>
                </div>

                <Link href={`/artikel/${featuredArticle.slug}`}>
                  <Button variant="cerulean" size="sm" className="gap-1.5 font-bold">
                    Baca Selengkapnya <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regular Articles Grid */}
      {regularArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularArticles.map((art) => (
            <article
              key={art.id}
              className="bento-card overflow-hidden flex flex-col justify-between bg-white border border-line hover:border-cerulean transition-all shadow-xs group"
            >
              <div>
                {/* Thumbnail */}
                <Link href={`/artikel/${art.slug}`} className="block relative h-48 bg-slate-100 overflow-hidden">
                  {art.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={art.thumbnail_url}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cerulean/10 via-surface to-cyan/10 text-cerulean">
                      <BookOpen className="h-10 w-10 opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 text-cerulean-dark shadow-xs border border-line">
                      {art.category}
                    </span>
                  </div>
                </Link>

                {/* Content */}
                <div className="p-5 space-y-2.5">
                  <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                    <span>{formatDate(art.published_at)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {art.reading_minutes || 1} mnt baca
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {art.view_count || 0}
                    </span>
                  </div>

                  <Link href={`/artikel/${art.slug}`}>
                    <h3 className="text-base font-bold text-ink leading-snug hover:text-cerulean-dark transition-colors line-clamp-2">
                      {art.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-ink-muted line-clamp-3 leading-relaxed">
                    {markdownExcerpt(art.content, 140)}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-line/70 bg-surface/30 flex items-center justify-between text-xs">
                <span className="text-ink-muted truncate max-w-[140px]">
                  Oleh <strong>{art.author_name}</strong>
                </span>
                <Link
                  href={`/artikel/${art.slug}`}
                  className="font-bold text-cerulean-dark hover:text-cerulean inline-flex items-center gap-1 transition-colors"
                >
                  Baca <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        !featuredArticle && (
          <EmptyState
            icon={Newspaper}
            title="Tidak Ada Artikel Ditemukan"
            description="Tidak ada artikel yang cocok dengan kata kunci atau kategori yang Anda pilih."
          />
        )
      )}
    </div>
  );
}

