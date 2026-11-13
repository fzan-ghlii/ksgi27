'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Camera, 
  CheckCircle2, 
  Eye, 
  ImageIcon, 
  Pencil, 
  Plus, 
  RefreshCw, 
  Trash2, 
  X, 
  XCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import type { Gallery, GalleryStatus, Period, UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GalleryStatusBadge } from '@/components/ui/status-badges';
import { ConfirmDialog } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader, TabBar } from '@/components/dashboard/page-parts';
import { 
  canApproveGallery, 
  canDeleteGallery, 
  canEditGallery 
} from '@/lib/auth/permissions';
import { apiFetch } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { GalleryModal } from './gallery-modal';

interface GaleriClientProps {
  user: UserProfile;
  initialGalleries: Gallery[];
  periods: Period[];
}

export function GaleriClient({
  user,
  initialGalleries,
  periods,
}: GaleriClientProps) {
  const router = useRouter();
  const [galleries, setGalleries] = React.useState<Gallery[]>(initialGalleries);
  const [filterTab, setFilterTab] = React.useState<'ALL' | GalleryStatus>('ALL');
  const [refreshing, setRefreshing] = React.useState(false);

  // Modal create/edit
  const [modalState, setModalState] = React.useState<{
    open: boolean;
    gallery: Gallery | null;
  }>({
    open: false,
    gallery: null,
  });

  // Confirm delete
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    open: boolean;
    gallery: Gallery | null;
  }>({
    open: false,
    gallery: null,
  });

  // Lightbox preview for admin
  const [previewGallery, setPreviewGallery] = React.useState<Gallery | null>(null);

  const fetchGalleries = async () => {
    try {
      setRefreshing(true);
      const res = await apiFetch<{ galleries: Gallery[] }>('/api/galleries');
      setGalleries(res.galleries || []);
    } catch {
      toast.error('Gagal memperbarui daftar galeri.');
    } finally {
      setRefreshing(false);
    }
  };

  const filteredGalleries = React.useMemo(() => {
    if (filterTab === 'ALL') return galleries;
    return galleries.filter((g) => g.status === filterTab);
  }, [galleries, filterTab]);

  const handleApprove = async (g: Gallery) => {
    try {
      await apiFetch(`/api/galleries/${g.id}/approve`, { method: 'POST' });
      toast.success(`Album "${g.title}" disetujui dan diterbitkan ke portal publik!`);
      await fetchGalleries();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyetujui album.');
    }
  };

  const handleUnpublish = async (g: Gallery) => {
    try {
      await apiFetch(`/api/galleries/${g.id}/unpublish`, { method: 'POST' });
      toast.success(`Album "${g.title}" ditarik kembali ke status Menunggu Persetujuan.`);
      await fetchGalleries();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menarik album.');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.gallery) return;
    try {
      await apiFetch(`/api/galleries/${deleteConfirm.gallery.id}`, { method: 'DELETE' });
      toast.success('Album dokumentasi berhasil dihapus.');
      setDeleteConfirm({ open: false, gallery: null });
      await fetchGalleries();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus album.');
    }
  };

  const pendingCount = galleries.filter((g) => g.status === 'PENDING').length;
  const publishedCount = galleries.filter((g) => g.status === 'PUBLISHED').length;

  const tabs = [
    { id: 'ALL' as const, label: 'Semua Album', count: galleries.length },
    { id: 'PUBLISHED' as const, label: 'Diterbitkan', count: publishedCount },
    { id: 'PENDING' as const, label: 'Menunggu Persetujuan', count: pendingCount },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Dokumentasi Visual"
        title="Galeri & Foto Kegiatan"
        description="Kelola dokumentasi visual pelaksanaan Sekolah Pasar Modal, seminar nasional, audiensi bursa, dan agenda keorganisasian."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchGalleries}
              disabled={refreshing}
              className="text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Perbarui
            </Button>
            <Button
              variant="gold"
              size="sm"
              className="gap-1.5 font-bold shadow-xs"
              onClick={() => setModalState({ open: true, gallery: null })}
            >
              <Plus className="h-4 w-4" /> Tambah Album Foto
            </Button>
          </div>
        }
      />

      <TabBar tabs={tabs} value={filterTab} onChange={setFilterTab} />

      {filteredGalleries.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="Belum Ada Album Foto"
          description="Belum ada dokumentasi foto kegiatan yang terdaftar pada kategori ini. Tekan tombol 'Tambah Album Foto' untuk menambahkan dokumentasi baru."
          actionLabel="Tambah Album Foto"
          onAction={() => setModalState({ open: true, gallery: null })}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGalleries.map((gal) => {
            const canEdit = canEditGallery(user, gal);
            const canDelete = canDeleteGallery(user, gal);
            const canApprove = canApproveGallery(user, gal.division_code);
            const coverPhoto = gal.image_urls[0] || '';

            return (
              <div
                key={gal.id}
                className="bento-card overflow-hidden flex flex-col justify-between bg-white border border-line shadow-xs group"
              >
                <div>
                  {/* Photo Cover with Count overlay */}
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    {coverPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverPhoto}
                        alt={gal.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}

                    <div className="absolute top-2.5 right-2.5">
                      <GalleryStatusBadge status={gal.status} />
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-ink/75 backdrop-blur-xs text-white text-[11px] font-semibold">
                      <Camera className="h-3 w-3" />
                      <span>{gal.image_urls.length} foto</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewGallery(gal)}
                      className="absolute inset-0 bg-ink/20 sm:bg-transparent sm:hover:bg-ink/30 flex items-center justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-bold text-xs gap-1.5"
                      title={`Buka album ${gal.title}`}
                    >
                      <span className="px-3 py-1.5 rounded-full bg-ink/75 sm:bg-transparent backdrop-blur-xs flex items-center gap-1.5 shadow-sm">
                        <Eye className="h-3.5 w-3.5" />
                        <span>Lihat {gal.image_urls.length} Foto</span>
                      </span>
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="cerulean" className="text-[10px]">
                        {gal.division_code}
                      </Badge>
                      <span className="text-[11px] text-ink-muted">
                        {formatDate(gal.activity_date)}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-ink line-clamp-1 leading-snug">
                      {gal.title}
                    </h3>

                    {gal.caption && (
                      <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">
                        {gal.caption}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-3.5 border-t border-line bg-surface/40 flex items-center justify-between text-xs">
                  <span className="text-ink-muted truncate max-w-[120px]">
                    Oleh <strong>{gal.uploader_name || 'Pengurus'}</strong>
                  </span>

                  <div className="flex items-center gap-1">
                    {/* Moderate Action */}
                    {canApprove && gal.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="cerulean"
                        className="h-7 px-2 text-xs gap-1 font-bold"
                        onClick={() => handleApprove(gal)}
                        title="Setujui dan Terbitkan ke Web Publik"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Terbitkan
                      </Button>
                    )}

                    {canApprove && gal.status === 'PUBLISHED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs gap-1 text-amber-700 hover:bg-amber-50"
                        onClick={() => handleUnpublish(gal)}
                        title="Tarik kembali ke status Pending"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Tarik
                      </Button>
                    )}

                    {/* Edit */}
                    {canEdit && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-ink-muted hover:text-ink"
                        onClick={() => setModalState({ open: true, gallery: gal })}
                        title="Edit Album"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    {/* Delete */}
                    {canDelete && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => setDeleteConfirm({ open: true, gallery: gal })}
                        title="Hapus Album"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox / Preview Album Modal */}
      {previewGallery && (
        <div className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="relative w-[calc(100%-1rem)] max-w-4xl bg-white rounded-3xl p-5 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
              <div>
                <Badge variant="cerulean" className="text-xs mb-1">
                  {previewGallery.division_code}
                </Badge>
                <h2 className="text-xl font-bold text-ink">{previewGallery.title}</h2>
                <p className="text-xs text-ink-muted mt-1">
                  Pelaksanaan: {formatDate(previewGallery.activity_date)} • {previewGallery.image_urls.length} foto dokumentasi
                </p>
                {previewGallery.caption && (
                  <p className="text-xs text-ink mt-2 leading-relaxed max-w-2xl">
                    {previewGallery.caption}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setPreviewGallery(null)}
                className="p-2 rounded-xl bg-surface hover:bg-slate-200 text-ink-muted hover:text-ink transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {previewGallery.image_urls.map((url, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden border border-line bg-slate-100 group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`${previewGallery.title} - ${idx + 1}`}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute bottom-1 right-1 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px]">
                    Foto #{idx + 1}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewGallery(null)}>
                Tutup Pratinjau
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Modal (Create/Edit) */}
      <GalleryModal
        open={modalState.open}
        onOpenChange={(o) => setModalState((s) => ({ ...s, open: o }))}
        user={user}
        periods={periods}
        initialGallery={modalState.gallery}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(o) => !o && setDeleteConfirm({ open: false, gallery: null })}
        title="Hapus Album Dokumentasi?"
        description={
          <>
            Apakah Anda yakin ingin menghapus album <strong>&ldquo;{deleteConfirm.gallery?.title}&rdquo;</strong> beserta seluruh foto di dalamnya? Tindakan ini tidak dapat dibatalkan.
          </>
        }
        confirmLabel="Hapus Album"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

