import Link from 'next/link';
import { ArrowRight, BookOpen, Clock, Eye } from 'lucide-react';
import type { Article } from '@/types';
import { markdownExcerpt } from '@/lib/utils/content';
import { formatDate, cn } from '@/lib/utils';

export function ArticleCard({
  article,
  showViews = false,
  excerptLength = 140,
  imageHeightClass = 'h-48',
}: {
  article: Article;
  showViews?: boolean;
  excerptLength?: number;
  imageHeightClass?: string;
}) {
  return (
    <article className="bento-card overflow-hidden flex flex-col justify-between bg-white border border-line hover:border-cerulean transition-all shadow-xs group">
      <div>
        <Link href={`/artikel/${article.slug}`} className={cn('block relative bg-slate-100 overflow-hidden', imageHeightClass)}>
          {article.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.thumbnail_url}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cerulean/10 via-surface to-cyan/10 text-cerulean">
              <BookOpen className="h-10 w-10 opacity-45" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 text-cerulean-dark shadow-xs border border-line">
              {article.category}
            </span>
          </div>
        </Link>

        <div className="p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-[11px] text-ink-muted">
            <span>{formatDate(article.published_at)}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {article.reading_minutes || 1} mnt{showViews ? ' baca' : ''}
            </span>
            {showViews && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" /> {article.view_count || 0}
                </span>
              </>
            )}
          </div>

          <Link href={`/artikel/${article.slug}`}>
            <h3 className="font-bold text-base text-ink leading-snug hover:text-cerulean-dark transition-colors line-clamp-2">
              {article.title}
            </h3>
          </Link>

          <p className="text-xs text-ink-muted line-clamp-3 leading-relaxed">
            {markdownExcerpt(article.content, excerptLength)}
          </p>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-line/70 bg-surface/30 flex items-center justify-between text-xs">
        <span className="text-ink-muted text-[11px] truncate max-w-[140px]">
          Oleh <strong>{article.author_name}</strong>
        </span>
        <Link
          href={`/artikel/${article.slug}`}
          className="font-bold text-cerulean-dark hover:text-cerulean inline-flex items-center gap-1 transition-colors"
        >
          Baca <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

