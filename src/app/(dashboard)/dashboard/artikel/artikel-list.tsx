'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Pencil,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react';
import type { Article, UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArticleStatusBadge } from '@/components/ui/status-badges';
import { EmptyState } from '@/components/ui/empty-state';
import { ImagePreview } from '@/components/shared/image-inputs';
import {
  canDeleteArticle,
  canEditArticle,
  canReviewArticle,
  canSubmitArticle,
  canUnpublishArticle,
} from '@/lib/auth/permissions';
import { formatDate } from '@/lib/utils';

interface ArticleRowActionsProps {
  article: Article;
  user: UserProfile;
  compact?: boolean;
  onReview: (article: Article, decision: 'publish' | 'reject') => void;
  onSubmitDraft: (article: Article) => void;
  onUnpublish: (article: Article) => void;
  onDelete: (article: Article) => void;
}

function ArticleRowActions({
  article,
  user,
  compact = false,
  onReview,
  onSubmitDraft,
  onUnpublish,
  onDelete,
}: ArticleRowActionsProps) {
  const canEdit = canEditArticle(user, article);
  const canDelete = canDeleteArticle(user, article);
  const canSubmit = canSubmitArticle(user, article);
  const canReview = canReviewArticle(user, article);
  const canUnpub = canUnpublishArticle(user) && article.status === 'PUBLISHED';

  const iconCls = compact ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const iconBtnSize = compact ? 'h-8 w-8' : '';

  return (
    <div className={compact ? 'flex items-center gap-1' : 'flex items-center justify-end gap-1'}>
      {canReview && (
        <div className={compact ? 'contents' : 'flex items-center gap-1 mr-1'}>
          <Button
            size="sm"
            variant="cerulean"
            className={compact ? 'h-8 px-2 text-xs font-bold gap-1' : 'h-8 px-2.5 text-xs gap-1 font-bold'}
            onClick={() => onReview(article, 'publish')}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Terbitkan
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={
              compact
                ? 'h-8 px-2 text-xs text-rose-600 hover:bg-rose-50'
                : 'h-8 px-2 text-xs gap-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700'
            }
            onClick={() => onReview(article, 'reject')}
          >
            {!compact && <XCircle className="h-3.5 w-3.5" />} Tolak
          </Button>
        </div>
      )}

      {canSubmit && (
        <Button
          size="sm"
          variant="outline"
          className={
            compact
              ? 'h-8 px-2 text-xs gap-1 text-cerulean-dark border-cerulean/30'
              : 'h-8 px-2 text-xs gap-1 hover:border-cerulean text-cerulean-dark'
          }
          onClick={() => onSubmitDraft(article)}
          title={compact ? undefined : 'Kirim artikel untuk direview Kadiv/Presidium'}
        >
          <Send className="h-3.5 w-3.5" /> Ajukan Review
        </Button>
      )}

      {article.status === 'PUBLISHED' && (
        <Link href={`/artikel/${article.slug}`} target="_blank">
          <Button size="icon" variant="ghost" className={iconBtnSize} title={compact ? 'Lihat di Web' : 'Lihat di Web Publik'}>
            <ExternalLink className={`${iconCls} text-ink-muted`} />
          </Button>
        </Link>
      )}

      {canEdit && (
        <Link href={`/dashboard/artikel/${article.id}/edit`}>
          <Button size="icon" variant="ghost" className={iconBtnSize} title={compact ? 'Edit' : 'Edit Artikel'}>
            <Pencil className={`${iconCls} text-ink-muted ${compact ? '' : 'hover:text-ink'}`} />
          </Button>
        </Link>
      )}

      {canUnpub && (
        <Button
          size="icon"
          variant="ghost"
          className={compact ? 'h-8 w-8 text-amber-600' : ''}
          title={compact ? 'Tarik Publikasi' : 'Tarik Publikasi (Kembalikan ke Draf)'}
          onClick={() => onUnpublish(article)}
        >
          <XCircle className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4 text-amber-600'} />
        </Button>
      )}

      {canDelete && (
        <Button
          size="icon"
          variant="ghost"
          title={compact ? 'Hapus' : 'Hapus Artikel'}
          className={`${iconBtnSize} text-rose-600 hover:bg-rose-50 ${compact ? '' : 'hover:text-rose-700'}`}
          onClick={() => onDelete(article)}
        >
          <Trash2 className={iconCls} />
        </Button>
      )}
    </div>
  );
}

interface ArtikelListProps {
  articles: Article[];
  user: UserProfile;
  isQueueTab: boolean;
  onCreateNew: () => void;
  onReview: (article: Article, decision: 'publish' | 'reject') => void;
  onSubmitDraft: (article: Article) => void;
  onUnpublish: (article: Article) => void;
  onDelete: (article: Article) => void;
}

export function ArtikelList({
  articles,
  user,
  isQueueTab,
  onCreateNew,
  onReview,
  onSubmitDraft,
  onUnpublish,
  onDelete,
}: ArtikelListProps) {
  if (articles.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title={isQueueTab ? 'Tidak Ada Antrean Review' : 'Belum Ada Artikel'}
        description={
          isQueueTab
            ? 'Semua artikel dari divisi Anda telah selesai ditinjau.'
            : 'Belum ada artikel pada kategori ini. Mulai tulis artikel pertama Anda.'
        }
        actionLabel="Tulis Artikel Sekarang"
        onAction={onCreateNew}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-white shadow-sm overflow-hidden">
      {/* Mobile View */}
      <div className="md:hidden divide-y divide-line">
        {articles.map((art) => (
          <div key={art.id} className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <ImagePreview src={art.thumbnail_url ?? ''} className="h-14 w-14 rounded-xl shrink-0" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <ArticleStatusBadge status={art.status} />
                  <Badge variant="cerulean" className="text-[10px] py-0 px-1.5">
                    {art.division_code}
                  </Badge>
                  {art.is_featured && (
                    <Badge variant="gold" className="text-[10px] py-0 px-1.5 font-bold">
                      Unggulan
                    </Badge>
                  )}
                </div>
                <h4 className="font-bold text-sm text-ink leading-snug line-clamp-2">{art.title}</h4>
                <p className="text-[11px] text-ink-muted">
                  Oleh {art.author_name} • {formatDate(art.published_at || art.updated_at || art.created_at)}
                </p>
              </div>
            </div>

            {art.review_note && art.status === 'REJECTED' && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 italic">
                Revisi: {art.review_note}
              </div>
            )}

            <div className="pt-2 border-t border-line/60 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] text-ink-muted">
                <strong>{art.view_count || 0}</strong> views • ~{art.reading_minutes || 1} mnt
              </span>
              <ArticleRowActions
                article={art}
                user={user}
                compact
                onReview={onReview}
                onSubmitDraft={onSubmitDraft}
                onUnpublish={onUnpublish}
                onDelete={onDelete}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface/70 text-[11px] uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-4 py-3 text-left font-bold">Artikel</th>
              <th className="px-4 py-3 text-left font-bold">Kategori &amp; Divisi</th>
              <th className="px-4 py-3 text-left font-bold">Status</th>
              <th className="px-4 py-3 text-left font-bold">Statistik</th>
              <th className="px-4 py-3 text-right font-bold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {articles.map((art) => (
              <tr key={art.id} className="align-middle hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 max-w-sm">
                  <div className="flex items-start gap-3">
                    <ImagePreview src={art.thumbnail_url ?? ''} className="h-12 w-12 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-ink leading-snug line-clamp-2">{art.title}</div>
                      <div className="text-xs text-ink-muted mt-1 flex items-center gap-2 flex-wrap">
                        <span>
                          Oleh <strong>{art.author_name}</strong>
                        </span>
                        <span>•</span>
                        <span>{formatDate(art.published_at || art.updated_at || art.created_at)}</span>
                        {art.is_featured && (
                          <Badge variant="gold" className="text-[10px] py-0 px-1.5 font-bold">
                            Unggulan
                          </Badge>
                        )}
                      </div>
                      {art.review_note && art.status === 'REJECTED' && (
                        <p className="text-[11px] text-rose-600 mt-1 line-clamp-1 italic">
                          Revisi: {art.review_note}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-ink block">{art.category}</span>
                    <Badge variant="cerulean" className="text-[10px]">
                      {art.division_code}
                    </Badge>
                  </div>
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <ArticleStatusBadge status={art.status} />
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-xs text-ink-muted">
                  <div>
                    <strong className="text-ink font-bold">{art.view_count || 0}</strong> pembaca
                  </div>
                  <div className="text-[11px]">~{art.reading_minutes || 1} menit baca</div>
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <ArticleRowActions
                    article={art}
                    user={user}
                    onReview={onReview}
                    onSubmitDraft={onSubmitDraft}
                    onUnpublish={onUnpublish}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

