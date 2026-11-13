'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { Article, ArticleStatus, UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Modal, ConfirmDialog } from '@/components/ui/modal';
import { Field, Textarea } from '@/components/ui/form-controls';
import { PageHeader, TabBar } from '@/components/dashboard/page-parts';
import { canReviewArticle } from '@/lib/auth/permissions';
import { apiFetch } from '@/lib/api-client';
import { ArtikelList } from './artikel-list';

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

      <ArtikelList
        articles={filteredArticles}
        user={user}
        isQueueTab={filterTab === 'QUEUE'}
        onCreateNew={() => router.push('/dashboard/artikel/baru')}
        onReview={(article, decision) =>
          setReviewModal({ open: true, article, decision, note: '', busy: false })
        }
        onSubmitDraft={handleSubmitDraft}
        onUnpublish={(article) => setUnpublishConfirm({ open: true, article })}
        onDelete={(article) => setDeleteConfirm({ open: true, article })}
      />

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
            Artikel <strong>&ldquo;{unpublishConfirm.article?.title}&rdquo;</strong> akan ditarik dari portal publik
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
            Apakah Anda yakin ingin menghapus artikel <strong>&ldquo;{deleteConfirm.article?.title}&rdquo;</strong>?
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

