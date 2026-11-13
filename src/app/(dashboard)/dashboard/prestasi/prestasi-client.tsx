'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trophy, Edit2, Trash2, Search, Award, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Achievement } from '@/types';
import { PageHeader } from '@/components/dashboard/page-parts';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/modal';
import { apiFetch } from '@/lib/api-client';
import { AchievementModal } from './achievement-modal';

export function PrestasiClient({ initialAchievements }: { initialAchievements: Achievement[] }) {
  const router = useRouter();
  const [items, setItems] = React.useState<Achievement[]>(initialAchievements);
  const [search, setSearch] = React.useState('');
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Achievement | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Achievement | null>(null);

  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.organizer.toLowerCase().includes(q) ||
      item.level.toLowerCase().includes(q) ||
      String(item.year).includes(q)
    );
  });

  const handleSaved = (saved: Achievement, isEdit: boolean) => {
    setItems((prev) => {
      const next = isEdit ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev];
      return [...next].sort((a, b) => b.year - a.year || b.created_at.localeCompare(a.created_at));
    });
    router.refresh();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/achievements/${deleteTarget.id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success('Prestasi berhasil dihapus.');
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus prestasi.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Khusus Presidium"
        tone="gold"
        title="Prestasi GIBEI UNIMED"
        description="Kelola daftar penghargaan dan prestasi GIBEI UNIMED yang tampil pada halaman Tentang Organisasi."
        actions={
          <Button
            variant="gold"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="gap-2 font-bold shadow-sm"
          >
            <Plus className="h-4 w-4 text-ink" />
            Tambah Prestasi
          </Button>
        }
      />

      {/* Search bar */}
      <div className="bg-white p-4 rounded-2xl border border-line shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-ink-muted" />
          <input
            type="text"
            placeholder="Cari judul, penyelenggara, atau tahun..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-surface border border-line focus:ring-2 focus:ring-cerulean focus:outline-none"
          />
        </div>
        <span className="text-xs font-semibold text-ink-muted">
          Total: <strong className="text-ink">{filtered.length}</strong> prestasi
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title={items.length === 0 ? 'Belum Ada Prestasi Tercatat' : 'Tidak Ada Hasil Cocok'}
          description={
            items.length === 0
              ? 'Tambahkan prestasi atau penghargaan GIBEI UNIMED agar ditampilkan di halaman Tentang Organisasi.'
              : 'Coba ubah kata kunci pencarian Anda.'
          }
          actionLabel={items.length === 0 ? 'Tambah Prestasi Pertama' : undefined}
          onAction={
            items.length === 0
              ? () => {
                  setEditing(null);
                  setModalOpen(true);
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-line bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div>
                {item.image_url ? (
                  <div className="h-40 bg-surface border-b border-line overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gold text-ink shadow-xs">
                      {item.year}
                    </span>
                  </div>
                ) : null}

                <div className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cerulean-light text-cerulean-dark border border-cerulean/20">
                      <Award className="h-3 w-3" />
                      {item.level}
                    </span>
                    {!item.image_url && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gold-light text-[#66532d] border border-gold/30">
                        {item.year}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-extrabold text-ink leading-snug">{item.title}</h3>

                  {item.category && (
                    <p className="text-[11px] font-semibold text-cerulean-dark">{item.category}</p>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-1">{item.organizer}</span>
                  </div>

                  {item.description && (
                    <p className="text-xs text-ink-muted leading-relaxed line-clamp-3 pt-1">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="px-5 py-3 bg-surface/60 border-t border-line flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(item);
                    setModalOpen(true);
                  }}
                  className="gap-1.5 text-xs"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteTarget(item)}
                  className="gap-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AchievementModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Hapus Prestasi?"
        description={
          <>
            Apakah Anda yakin ingin menghapus prestasi <strong>&ldquo;{deleteTarget?.title}&rdquo;</strong>? Data akan langsung hilang dari halaman Tentang publik.
          </>
        }
        confirmLabel="Ya, hapus"
        onConfirm={confirmDelete}
      />
    </div>
  );
}

