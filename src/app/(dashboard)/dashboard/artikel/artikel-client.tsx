'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle2, 
  ExternalLink, 
  Eye, 
  FileText, 
  Loader2, 
  Pencil, 
  Plus, 
  RefreshCw, 
  Send, 
  Sparkles, 
  Trash2, 
  XCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import type { Article, ArticleStatus, UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArticleStatusBadge } from '@/components/ui/status-badges';
import { Modal, ConfirmDialog } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Textarea } from '@/components/ui/form-controls';
import { PageHeader, TabBar } from '@/components/dashboard/page-parts';
import { ImagePreview } from '@/components/shared/image-inputs';
import { 
  canDeleteArticle, 
  canEditArticle, 
  canReviewArticle, 
  canSubmitArticle, 
  canUnpublishArticle 
} from '@/lib/auth/permissions';
import { apiFetch } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

interface ArtikelClientProps {
  user: UserProfile;
  initialArticles: Article[];
}

export function ArtikelClient({ user, initialArticles }: ArtikelClientProps) {
  const router = useRouter();
  const [articles, setArticles] = React.useState<Article[]>(initialArticles);
  const [filterTab, setFilterTab] = React.useState<'ALL' | ArticleStatus | 'QUEUE'>('ALL');
  const [refreshing, setRefreshing] = React.useState(false);

  // Review Modal State
  const [reviewModal, setReviewModal] = React.useState<{
    open: boolean;
    article: Article | null;
    decision: 'publish' | 'reject';
    note: string;
    busy: boolean;
  }>({
    open: false,
    article: null,
    decision: 'publish',
    note: '',
    busy: false,
  });

  // Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    open: boolean;
    article: Article | null;
  }>({
    open: false,
    article: null,
  });

  // Unpublish Confirm State
  const [unpublishConfirm, setUnpublishConfirm] = React.useState<{
    open: boolean;
    article: Article | null;
  }>({
    open: false,
    article: null,
  });

  const fetchArticles = async () => {
    try {
      setRefreshing(true);
      const res = await apiFetch<{ articles: Article[] }>('/api/articles');
      setArticles(res.articles || []);
    } catch {
      toast.error('Gagal memperbarui daftar artikel.');
    } finally {
      setRefreshing(false);
    }
  };

  // Check how many need review for this actor
  const queueArticles = React.useMemo(() => {
    return articles.filter((a) => canReviewArticle(user, a));
  }, [articles, user]);

  const filteredArticles = React.useMemo(() => {
    if (filterTab === 'ALL') return articles;
    if (filterTab === 'QUEUE') return queueArticles;
    return articles.filter((a) => a.status === filterTab);
  }, [articles, filterTab, queueArticles]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModal.article) return;

    if (reviewModal.decision === 'reject' && reviewModal.note.trim().length < 5) {
      toast.error('Catatan revisi wajib diisi minimal 5 karakter untuk menjelaskan alasan penolakan.');
      return;
    }

    try {
      setReviewModal((s) => ({ ...s, busy: true }));
      await apiFetch(`/api/articles/${reviewModal.article.id}/review`, {
        method: 'POST',
        body: {
          decision: reviewModal.decision,
          note: reviewModal.note.trim() || undefined,
        },
      });

      toast.success(
        reviewModal.decision === 'publish'
          ? 'Artikel berhasil disetujui dan diterbitkan!'
          : 'Artikel berhasil ditolak dan dikembalikan ke penulis dengan catatan revisi.'
      );
      setReviewModal((s) => ({ ...s, open: false }));
      await fetchArticles();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memproses review.');
    } finally {
      setReviewModal((s) => ({ ...s, busy: false }));
    }
  };

  const handleUnpublish = async () => {
    if (!unpublishConfirm.article) return;
    try {
      await apiFetch(`/api/articles/${unpublishConfirm.article.id}/unpublish`, {
        method: 'POST',
      });
      toast.success('Artikel ditarik dari publikasi dan dikembalikan ke status Draf.');
      setUnpublishConfirm({ open: false, article: null });
      await fetchArticles();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menarik artikel.');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.article) return;
    try {
      await apiFetch(`/api/articles/${deleteConfirm.article.id}`, {
        method: 'DELETE',
      });
      toast.success('Artikel berhasil dihapus.');
      setDeleteConfirm({ open: false, article: null });
      await fetchArticles();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus artikel.');
    }
  };

  const handleSubmitDraft = async (art: Article) => {
    try {
      await apiFetch(`/api/articles/${art.id}/submit`, {
        method: 'POST',
      });
      toast.success('Artikel berhasil dikirim untuk review!');
      await fetchArticles();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengirim artikel.');
    }
  };

  const tabs = [
    { id: 'ALL' as const, label: 'Semua Artikel', count: articles.length },
    ...(queueArticles.length > 0
      ? [{ id: 'QUEUE' as const, label: 'Antrean Kurasi', count: queueArticles.length }]
      : []),
    { id: 'PUBLISHED' as const, label: 'Diterbitkan', count: articles.filter((a) => a.status === 'PUBLISHED').length },
    { id: 'PENDING_REVIEW' as const, label: 'Menunggu Review', count: articles.filter((a) => a.status === 'PENDING_REVIEW').length },
    { id: 'DRAFT' as const, label: 'Draf', count: articles.filter((a) => a.status === 'DRAFT').length },
    { id: 'REJECTED' as const, label: 'Perlu Revisi', count: articles.filter((a) => a.status === 'REJECTED').length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        badge="CMS & Literasi"
        title="Artikel & Riset Pasar Modal"
        description="Kelola publikasi riset emiten, edukasi investasi, dan warta kegiatan GIBEI UNIMED dengan alur kurasi berjenjang."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchArticles}
              disabled={refreshing}
              className="text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Perbarui
            </Button>
            <Link href="/dashboard/artikel/baru">
              <Button variant="gold" size="sm" className="gap-1.5 font-bold shadow-xs">
                <Plus className="h-4 w-4" /> Tulis Artikel Baru
              </Button>
            </Link>
          </div>
        }
      />

      <TabBar tabs={tabs} value={filterTab} onChange={setFilterTab} />

      {filteredArticles.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={
            filterTab === 'QUEUE'
              ? 'Tidak Ada Antrean Review'
              : 'Belum Ada Artikel'
          }
          description={
            filterTab === 'QUEUE'
              ? 'Semua artikel dari divisi Anda telah selesai ditinjau.'
              : 'Belum ada artikel pada kategori ini. Mulai tulis artikel pertama Anda.'
          }
          actionLabel="Tulis Artikel Sekarang"
          onAction={() => router.push('/dashboard/artikel/baru')}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-surface/70 text-[11px] uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Artikel</th>
                <th className="px-4 py-3 text-left font-bold">Kategori & Divisi</th>
                <th className="px-4 py-3 text-left font-bold">Status</th>
                <th className="px-4 py-3 text-left font-bold">Statistik</th>
                <th className="px-4 py-3 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredArticles.map((art) => {
                const canEdit = canEditArticle(user, art);
                const canDelete = canDeleteArticle(user, art);
                const canSubmit = canSubmitArticle(user, art);
                const canReview = canReviewArticle(user, art);
                const canUnpub = canUnpublishArticle(user) && art.status === 'PUBLISHED';

                return (
                  <tr key={art.id} className="align-middle hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 max-w-sm">
                      <div className="flex items-start gap-3">
                        <ImagePreview src={art.thumbnail_url ?? ''} className="h-12 w-12 rounded-lg" />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-ink leading-snug line-clamp-2">
                            {art.title}
                          </div>
                          <div className="text-xs text-ink-muted mt-1 flex items-center gap-2 flex-wrap">
                            <span>Oleh <strong>{art.author_name}</strong></span>
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
                      <div className="flex items-center justify-end gap-1">
                        {/* Review Action for Kadiv/Presidium */}
                        {canReview && (
                          <div className="flex items-center gap-1 mr-1">
                            <Button
                              size="sm"
                              variant="cerulean"
                              className="h-8 px-2.5 text-xs gap-1 font-bold"
                              onClick={() =>
                                setReviewModal({
                                  open: true,
                                  article: art,
                                  decision: 'publish',
                                  note: '',
                                  busy: false,
                                })
                              }
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Terbitkan
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs gap-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() =>
                                setReviewModal({
                                  open: true,
                                  article: art,
                                  decision: 'reject',
                                  note: '',
                                  busy: false,
                                })
                              }
                            >
                              <XCircle className="h-3.5 w-3.5" /> Tolak
                            </Button>
                          </div>
                        )}

                        {/* Submit draft for author */}
                        {canSubmit && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-xs gap-1 hover:border-cerulean text-cerulean-dark"
                            onClick={() => handleSubmitDraft(art)}
                            title="Kirim artikel untuk direview Kadiv/Presidium"
                          >
                            <Send className="h-3.5 w-3.5" /> Ajukan Review
                          </Button>
                        )}

                        {/* Preview published public article */}
                        {art.status === 'PUBLISHED' && (
                          <Link href={`/artikel/${art.slug}`} target="_blank">
                            <Button size="icon" variant="ghost" title="Lihat di Web Publik">
                              <ExternalLink className="h-4 w-4 text-ink-muted" />
                            </Button>
                          </Link>
                        )}

                        {/* Edit Button */}
                        {canEdit && (
                          <Link href={`/dashboard/artikel/${art.id}/edit`}>
                            <Button size="icon" variant="ghost" title="Edit Artikel">
                              <Pencil className="h-4 w-4 text-ink-muted hover:text-ink" />
                            </Button>
                          </Link>
                        )}

                        {/* Unpublish */}
                        {canUnpub && (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Tarik Publikasi (Kembalikan ke Draf)"
                            onClick={() => setUnpublishConfirm({ open: true, article: art })}
                          >
                            <XCircle className="h-4 w-4 text-amber-600" />
                          </Button>
                        )}

                        {/* Delete */}
                        {canDelete && (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Hapus Artikel"
                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => setDeleteConfirm({ open: true, article: art })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      <Modal
        open={reviewModal.open}
        onOpenChange={(o) =>
          !reviewModal.busy && setReviewModal((s) => ({ ...s, open: o }))
        }
        title={
          reviewModal.decision === 'publish'
            ? 'Setujui & Terbitkan Artikel'
            : 'Tolak & Minta Revisi Artikel'
        }
        description={
          reviewModal.decision === 'publish'
            ? `Artikel "${reviewModal.article?.title}" karya ${reviewModal.article?.author_name} akan langsung tayang di portal publik GIBEI UNIMED.`
            : `Berikan catatan detail perbaikan untuk ${reviewModal.article?.author_name} agar dapat memperbaiki artikelnya.`
        }
        size="md"
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <Field
            label={
              reviewModal.decision === 'publish'
                ? 'Catatan Persetujuan (Opsional)'
                : 'Catatan Revisi Wajib'
            }
            htmlFor="review-note"
            required={reviewModal.decision === 'reject'}
            hint={
              reviewModal.decision === 'reject'
                ? 'Minimal 5 karakter. Jelaskan bagian mana yang perlu diperbaiki (fakta, format, sumber data).'
                : undefined
            }
          >
            <Textarea
              id="review-note"
              value={reviewModal.note}
              onChange={(e) =>
                setReviewModal((s) => ({ ...s, note: e.target.value }))
              }
              placeholder={
                reviewModal.decision === 'publish'
                  ? 'Komentar apresiasi atau catatan pengarsipan...'
                  : 'Contoh: Mohon perbarui sumber data IHSG dan tambahkan referensi prospektus emiten.'
              }
              disabled={reviewModal.busy}
            />
          </Field>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReviewModal((s) => ({ ...s, open: false }))}
              disabled={reviewModal.busy}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant={reviewModal.decision === 'publish' ? 'cerulean' : 'destructive'}
              disabled={reviewModal.busy}
            >
              {reviewModal.busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {reviewModal.decision === 'publish'
                ? 'Setujui & Publikasikan'
                : 'Kirim Catatan Revisi'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Unpublish Confirm Dialog */}
      <ConfirmDialog
        open={unpublishConfirm.open}
        onOpenChange={(o) => !o && setUnpublishConfirm({ open: false, article: null })}
        title="Tarik Publikasi Artikel?"
        description={
          <>
            Artikel <strong>"{unpublishConfirm.article?.title}"</strong> akan ditarik dari portal publik
            dan dikembalikan ke status <strong>Draf</strong>. Artikel tidak lagi dapat diakses oleh pengunjung umum.
          </>
        }
        confirmLabel="Tarik dari Publik"
        variant="destructive"
        onConfirm={handleUnpublish}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(o) => !o && setDeleteConfirm({ open: false, article: null })}
        title="Hapus Artikel?"
        description={
          <>
            Apakah Anda yakin ingin menghapus artikel <strong>"{deleteConfirm.article?.title}"</strong>?
            Tindakan ini tidak dapat dibatalkan.
          </>
        }
        confirmLabel="Hapus Permanen"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

