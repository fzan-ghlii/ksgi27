import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Eye, 
  Tag, 
} from 'lucide-react';
import { 
  getPublishedArticleBySlug, 
  getRelatedArticles 
} from '@/lib/data/public';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/shared/markdown';
import { formatDate } from '@/lib/utils';
import { ViewTracker } from './view-tracker';

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedArticles(article, 3);

  return (
    <div className="py-10 sm:py-16 bg-background min-h-[80vh]">
      {/* Invisible View Counter Tracker */}
      <ViewTracker slug={article.slug} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link href="/artikel">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-ink-muted hover:text-ink">
              <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Semua Artikel
            </Button>
          </Link>
        </div>

        {/* Article Header Card */}
        <header className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cerulean-light text-cerulean-dark border border-cerulean/20">
              {article.category}
            </span>
            <Badge variant="cyan" className="text-xs">
              Divisi {article.division_code}
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink tracking-tight leading-[1.2]">
            {article.title}
          </h1>

          {/* Meta Info Bar */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-ink-muted pt-2 border-y border-line py-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-cerulean-light text-cerulean flex items-center justify-center font-bold text-xs">
                {article.author_name.charAt(0)}
              </div>
              <div>
                <strong className="text-ink block font-bold">{article.author_name}</strong>
                <span className="text-[11px] text-ink-muted">{article.author_position || 'Pengurus GIBEI'}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>{formatDate(article.published_at)}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>~{article.reading_minutes || 1} menit baca</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-slate-400" />
              <span>{article.view_count || 0} pembaca</span>
            </div>
          </div>
        </header>

        {/* Thumbnail Hero if Available */}
        {article.thumbnail_url && (
          <div className="rounded-3xl overflow-hidden border border-line shadow-sm max-h-[460px] bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.thumbnail_url}
              alt={article.title}
              className="w-full h-full object-cover max-h-[460px]"
            />
          </div>
        )}

        {/* Article Body Content (Elevated White Canvas) */}
        <article className="bento-card p-6 sm:p-10 lg:p-12 bg-white border border-line shadow-sm">
          <MarkdownRenderer content={article.content} />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-line flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-ink-muted flex items-center gap-1 mr-1">
                <Tag className="h-3.5 w-3.5" /> Tagar:
              </span>
              {article.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface text-ink-muted border border-line"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </article>

        {/* Author Bio Card */}
        <div className="bento-card p-6 bg-white border border-line flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-cerulean-light text-cerulean-dark flex items-center justify-center font-bold text-xl shrink-0">
            {article.author_name.charAt(0)}
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cerulean-dark">
              Penulis Riset
            </span>
            <h3 className="font-bold text-base text-ink">{article.author_name}</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Pengurus resmi Galeri Investasi BEI UNIMED pada Divisi {article.division_code}. Berdedikasi dalam edukasi pasar modal dan diseminasi riset investasi mahasiswa.
            </p>
          </div>
        </div>

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <section className="pt-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-black text-ink">
                Artikel Terkait Lainnya
              </h2>
              <Link href="/artikel" className="text-xs font-bold text-cerulean-dark hover:underline">
                Lihat Semua Artikel →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/artikel/${rel.slug}`}
                  className="bento-card p-4 bg-white border border-line hover:border-cerulean transition-all space-y-2 block group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cerulean-dark">
                    {rel.category}
                  </span>
                  <h3 className="font-bold text-sm text-ink line-clamp-2 group-hover:text-cerulean-dark transition-colors">
                    {rel.title}
                  </h3>
                  <div className="text-[11px] text-ink-muted pt-2 flex items-center justify-between">
                    <span>{formatDate(rel.published_at)}</span>
                    <span className="font-semibold text-cerulean-dark">Baca →</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

