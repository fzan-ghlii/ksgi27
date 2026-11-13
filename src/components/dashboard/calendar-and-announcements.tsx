'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Bell,
  Plus,
  Trash2,
  ExternalLink,
  MapPin,
  Clock,
  AlertTriangle,
  Pin,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/form-controls';
import { ConfirmDialog, Modal } from '@/components/ui/modal';
import { Announcement, EventAndSpm, UserProfile } from '@/types';
import { canManageCalendarAndAnnouncements } from '@/lib/auth/permissions';
import { apiFetch } from '@/lib/api-client';
import { formatDate, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

function formatGCalDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
  } catch {
    return '';
  }
}

function buildGoogleCalendarUrl(event: {
  title: string;
  description?: string;
  event_date: string;
  location_detail?: string;
}): string {
  const start = formatGCalDate(event.event_date);
  const endDate = new Date(new Date(event.event_date).getTime() + 2 * 60 * 60 * 1000);
  const end = formatGCalDate(endDate.toISOString());

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: `${event.description || ''}\n\nDiselenggarakan oleh: GIBEI UNIMED`,
    location: event.location_detail || 'Galeri Investasi BEI UNIMED',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function CalendarAndAnnouncements({
  events,
  initialAnnouncements = [],
  user,
}: {
  events: EventAndSpm[];
  initialAnnouncements?: Announcement[];
  user: UserProfile;
}) {
  const canEdit = canManageCalendarAndAnnouncements(user);

  const [announcements, setAnnouncements] = React.useState<Announcement[]>(initialAnnouncements);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  // Form State
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [priority, setPriority] = React.useState<'NORMAL' | 'IMPORTANT' | 'URGENT'>('NORMAL');
  const [eventDate, setEventDate] = React.useState('');
  const [pinned, setPinned] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  // Filter & sort events by date
  const upcomingEvents = React.useMemo(() => {
    return [...events]
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  }, [events]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Judul dan isi pengumuman wajib diisi.');
      return;
    }

    try {
      setBusy(true);
      const data = await apiFetch<{ announcement: Announcement }>('/api/announcements', {
        method: 'POST',
        body: {
          title,
          content,
          priority,
          event_date: eventDate || undefined,
          pinned,
        },
      });

      setAnnouncements((prev) => [data.announcement, ...prev]);
      toast.success('Pengumuman berhasil dipublikasikan!');
      setModalOpen(false);
      setTitle('');
      setContent('');
      setPriority('NORMAL');
      setEventDate('');
      setPinned(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAnnouncement = (id: string) => {
    setDeleteId(id);
  };

  const confirmDeleteAnnouncement = async () => {
    if (!deleteId) return;
    const id = deleteId;
    try {
      await apiFetch(`/api/announcements/${id}`, { method: 'DELETE' });
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success('Pengumuman dihapus.');
    } catch {
      toast.error('Gagal menghapus pengumuman.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Kolom Kiri: Papan Pengumuman Pengurus (5 Kolom) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-cerulean-light text-cerulean flex items-center justify-center font-bold">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-ink">Pengumuman Internal</h3>
              <p className="text-[11px] text-ink-muted">Informasi resmi untuk pengurus</p>
            </div>
          </div>

          {canEdit && (
            <Button
              size="sm"
              variant="cerulean"
              onClick={() => setModalOpen(true)}
              className="gap-1.5 text-xs font-semibold h-8"
            >
              <Plus className="h-3.5 w-3.5" />
              Buat Pengumuman
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {announcements.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white border border-line text-center space-y-2">
              <Bell className="h-6 w-6 text-slate-300 mx-auto" />
              <p className="text-xs text-ink-muted">Belum ada pengumuman pengurus saat ini.</p>
              {canEdit && (
                <Button size="sm" variant="outline" onClick={() => setModalOpen(true)} className="text-xs">
                  Tambah Pengumuman Baru
                </Button>
              )}
            </div>
          ) : (
            announcements.map((ann) => (
              <div
                key={ann.id}
                className={`p-4 rounded-2xl bg-white border transition-all space-y-2.5 relative ${
                  ann.priority === 'URGENT'
                    ? 'border-rose-300 bg-rose-50/30'
                    : ann.priority === 'IMPORTANT'
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-line'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ann.pinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-cerulean-light text-cerulean-dark">
                          <Pin className="h-2.5 w-2.5 fill-current" /> PINNED
                        </span>
                      )}
                      {ann.priority === 'URGENT' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                          <AlertTriangle className="h-2.5 w-2.5" /> MENDESAK
                        </span>
                      )}
                      {ann.priority === 'IMPORTANT' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                          PENTING
                        </span>
                      )}
                      <span className="text-[11px] text-ink-muted">
                        {formatDate(ann.created_at)}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-ink">{ann.title}</h4>
                  </div>

                  {canEdit && (
                    <button
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                      title="Hapus pengumuman"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-ink-muted whitespace-pre-wrap leading-relaxed">
                  {ann.content}
                </p>

                <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-muted">
                  <span>Dari: <strong>{ann.author_name}</strong> ({ann.author_position})</span>
                  {ann.event_date && (
                    <span className="text-cerulean-dark font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDate(ann.event_date)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Kolom Kanan: Kalender Jadwal Event & Google Calendar Integration (7 Kolom) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gold-light text-gold-dark flex items-center justify-center font-bold">
              <CalendarIcon className="h-4 w-4 text-[#8a6d25]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-ink">Kalender Jadwal Kegiatan</h3>
              <p className="text-[11px] text-ink-muted">
                Jadwal proker & SPM terintegrasi Google Calendar
              </p>
            </div>
          </div>

          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-line bg-white hover:bg-surface text-ink transition-colors shadow-2xs"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
            </svg>
            Buka Google Calendar
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </a>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-line space-y-4 shadow-sm">
          {upcomingEvents.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <CalendarIcon className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-ink">Belum Ada Agenda Kegiatan</p>
              <p className="text-xs text-ink-muted">
                Jadwal kegiatan yang dibuat di menu Event & SPM akan otomatis tampil di sini.
              </p>
              {canEdit && (
                <Link href="/dashboard/event-spm">
                  <Button size="sm" variant="cerulean" className="mt-2 text-xs">
                    Buat Kegiatan Baru
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 6).map((ev) => {
                const isSpm = ev.category === 'SPM';
                const gCalLink = buildGoogleCalendarUrl(ev);

                return (
                  <div
                    key={ev.id}
                    className="p-3.5 sm:p-4 rounded-2xl border border-line hover:border-cerulean/50 hover:bg-surface/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSpm ? 'bg-gold-light text-[#6b5523]' : 'bg-cerulean-light text-cerulean-dark'
                          }`}
                        >
                          {isSpm ? `SPM ${ev.spm_level || 'Reguler'}` : 'Program Kerja'}
                        </span>
                        <span className="text-[10px] font-semibold text-ink-muted bg-surface px-2 py-0.5 rounded border border-line">
                          {ev.division_code}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {ev.status}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-ink truncate group-hover:text-cerulean transition-colors">
                        {ev.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-cerulean shrink-0" />
                          {formatDateTime(ev.event_date)}
                        </span>
                        <span className="flex items-center gap-1.5 truncate max-w-[220px]">
                          <MapPin className="h-3.5 w-3.5 text-cyan shrink-0" />
                          {ev.location_detail}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
                      <a
                        href={gCalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                        title="Simpan jadwal ini langsung ke Google Calendar Anda"
                      >
                        <CalendarIcon className="h-3.5 w-3.5" />
                        + Google Calendar
                      </a>

                      <Link href={`/kegiatan/${ev.slug}`}>
                        <Button size="sm" variant="ghost" className="h-8 px-2 text-xs">
                          Lihat
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}

              <div className="pt-2 text-center border-t border-line">
                <Link
                  href="/dashboard/event-spm"
                  className="text-xs font-bold text-cerulean-dark hover:underline"
                >
                  Lihat Semua Jadwal & Kelola Kegiatan di Event & SPM →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Buat Pengumuman (Khusus Sekre, Wasekre, Presidium, Creator) */}
      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Buat Pengumuman Pengurus"
        description="Pengumuman ini akan tampil di dashboard internal untuk seluruh anggota pengurus GIBEI UNIMED."
        size="md"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">Judul Pengumuman</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Rapat Koordinasi SPM Batch 1"
              required
              disabled={busy}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">Tingkat Prioritas</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'NORMAL' | 'IMPORTANT' | 'URGENT')}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-line"
                disabled={busy}
              >
                <option value="NORMAL">Normal (Informasi Rutin)</option>
                <option value="IMPORTANT">Penting (Wajib Diperhatikan)</option>
                <option value="URGENT">Mendesak (Segera Tindak Lanjut)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">Tenggat Waktu / Tanggal Agenda (Opsional)</label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                disabled={busy}
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">Isi Pengumuman</label>
            <Textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tuliskan arahan, instruksi, link dokumen, atau detail agenda..."
              required
              disabled={busy}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="h-4 w-4 accent-cerulean rounded"
              disabled={busy}
            />
            <span className="text-xs font-semibold text-ink">
              Sematkan di posisi teratas (Pin to top)
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} disabled={busy}>
              Batal
            </Button>
            <Button type="submit" variant="cerulean" disabled={busy} className="gap-2">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Publikasikan Pengumuman
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Hapus Pengumuman?"
        description="Pengumuman ini akan dihapus permanen dari papan informasi internal pengurus."
        confirmLabel="Ya, hapus"
        onConfirm={confirmDeleteAnnouncement}
      />
    </div>
  );
}

