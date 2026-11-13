'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EventAndSpm, EventReport, Period, UserProfile } from '@/types';
import { OFFICIAL_DIVISIONS } from '@/lib/constants/divisions';
import { canManageEvent, canMarkEventCompleted, canViewEventReport } from '@/lib/auth/permissions';
import { EventModal } from './event-modal';
import { EventReportModal } from './event-report-modal';
import { PageHeader, TabBar } from '@/components/dashboard/page-parts';
import { ConfirmDialog } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Calendar,
  Plus,
  Users,
  MapPin,
  ExternalLink,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  ClipboardList,
} from 'lucide-react';

interface EventClientProps {
  user: UserProfile;
  initialEvents: EventAndSpm[];
  periods: Period[];
  initialReports?: EventReport[];
}

export function EventClient({
  user,
  initialEvents,
  periods,
  initialReports = [],
}: EventClientProps) {
  const router = useRouter();
  const [events, setEvents] = React.useState<EventAndSpm[]>(initialEvents);
  const [reportsByEvent, setReportsByEvent] = React.useState<Record<string, EventReport>>(() =>
    Object.fromEntries(initialReports.map((r) => [r.event_id, r]))
  );
  const [categoryFilter, setCategoryFilter] = React.useState<'ALL' | 'SPM' | 'EVENT'>('ALL');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<EventAndSpm | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; title: string } | null>(null);
  const [completeTarget, setCompleteTarget] = React.useState<EventAndSpm | null>(null);
  const [reportEvent, setReportEvent] = React.useState<EventAndSpm | null>(null);

  // Filter wewenang: Presidium/Creator melihat semua; Kadiv melihat divisinya & SPM jika Edukasi
  const filteredEvents = events.filter((e) => {
    // Filter Kategori
    if (categoryFilter === 'SPM' && e.category !== 'SPM' && e.category_type !== 'SPM') return false;
    if (categoryFilter === 'EVENT' && (e.category === 'SPM' || e.category_type === 'SPM')) return false;

    // Filter Status
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;

    // Filter Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchDesc = e.description?.toLowerCase().includes(q);
      const matchDivision = OFFICIAL_DIVISIONS[e.division_code]?.name.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchDivision) return false;
    }

    return true;
  });

  const handleDelete = (id: string, title: string) => {
    setDeleteTarget({ id, title });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    try {
      setDeletingId(id);
      await apiFetch(`/api/events/${id}`, { method: 'DELETE' });
      toast.success('Kegiatan berhasil dihapus.');
      setEvents((prev) => prev.filter((e) => e.id !== id));
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const confirmMarkCompleted = async () => {
    if (!completeTarget) return;
    try {
      const res = await apiFetch<{ event: EventAndSpm }>(`/api/events/${completeTarget.id}`, {
        method: 'PATCH',
        body: { status: 'COMPLETED' },
      });
      setEvents((prev) => prev.map((e) => (e.id === res.event.id ? res.event : e)));
      toast.success('Kegiatan ditandai Selesai. Silakan lengkapi pelaporan kegiatan.');
      setCompleteTarget(null);
      setReportEvent(res.event);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menandai kegiatan selesai.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Agenda & Sekolah Pasar Modal"
        title="Manajemen Event & Sekolah Pasar Modal (SPM)"
        description="Kelola agenda kegiatan organisasi, pantau kuota secara real-time, dan hubungkan langsung dengan Google Spreadsheet."
        actions={
          canManageEvent(user) ? (
            <Button
              onClick={() => {
                setEditingEvent(null);
                setModalOpen(true);
              }}
              variant="gold"
              className="font-bold shadow-sm inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-ink" />
              Buat Kegiatan Baru
            </Button>
          ) : undefined
        }
      />

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <TabBar
          value={categoryFilter}
          onChange={setCategoryFilter}
          tabs={[
            { id: 'ALL', label: 'Semua Kegiatan', count: events.length },
            { id: 'SPM', label: 'Sekolah Pasar Modal (SPM)', count: events.filter((e) => e.category === 'SPM' || e.category_type === 'SPM').length },
            { id: 'EVENT', label: 'Program Kerja & Seminar', count: events.filter((e) => e.category !== 'SPM' && e.category_type !== 'SPM').length },
          ]}
        />

        {/* Search & Status Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari kegiatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-secondary/30 border border-border focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs bg-secondary/30 border border-border focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="OPEN">Dibuka (OPEN)</option>
            <option value="CLOSED">Ditutup (CLOSED)</option>
            <option value="DRAFT">Draf (DRAFT)</option>
            <option value="COMPLETED">Selesai (COMPLETED)</option>
          </select>
        </div>
      </div>

      {/* Daftar Kartu Kegiatan */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-3xl border border-border p-12 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-foreground">Belum Ada Kegiatan</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Tidak ada kegiatan atau SPM yang sesuai dengan filter yang dipilih. Silakan klik tombol &ldquo;Buat Kegiatan Baru&rdquo;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((event) => {
            const isSpm = event.category === 'SPM' || event.category_type === 'SPM';
            const count = event.registered_count || 0;
            const quota = event.quota || 1;
            const pct = Math.min(100, Math.round((count / quota) * 100));
            const isFull = count >= quota;
            const isOpen = event.status === 'OPEN' && !isFull;

            return (
              <div
                key={event.id}
                className="bg-white rounded-2xl border border-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Banner / Poster Header */}
                  <div className="h-40 bg-secondary/40 relative overflow-hidden flex items-center justify-center border-b border-border/60">
                    {event.banner_url || event.poster_url ? (
                      <img
                        src={event.banner_url || event.poster_url}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-muted-foreground/40 flex flex-col items-center">
                        <Calendar className="w-10 h-10 mb-1" />
                        <span className="text-[11px] font-medium">Tanpa Poster</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs ${
                          event.status === 'COMPLETED'
                            ? 'bg-cerulean text-white'
                            : isOpen
                            ? 'bg-emerald-500 text-white'
                            : event.status === 'CLOSED' || isFull
                            ? 'bg-rose-500 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {event.status === 'COMPLETED' ? 'SELESAI' : isFull ? 'KUOTA PENUH' : event.status}
                      </span>
                    </div>

                    {/* SPM Level / Divisi Badge */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                      {isSpm ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gold text-ink shadow-xs flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-ink" />
                          SPM {event.spm_level || 'Reguler'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary text-white shadow-xs">
                          {OFFICIAL_DIVISIONS[event.division_code]?.name || event.division_code}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="font-bold text-base text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {event.description}
                      </p>
                    </div>

                    {/* Metadata Lokasi & Waktu */}
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>
                          {event.event_date
                            ? new Date(event.event_date).toLocaleDateString('id-ID', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-accent-gold shrink-0" />
                        <span className="truncate">
                          [{event.location_type || 'ONLINE'}] {event.location_detail || event.location_or_link || '-'}
                        </span>
                      </div>
                    </div>

                    {/* Kuota Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-primary" />
                          Pendaftar
                        </span>
                        <span className="font-bold text-slate-800">
                          {count} / {quota} Kursi ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-cyan to-cerulean"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Google Ecosystem Status Indicator */}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/60">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        {event.spreadsheet_id ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            Tersambung ke Sheet
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <FileSpreadsheet className="w-3.5 h-3.5 opacity-40" />
                            Tanpa Sheet
                          </span>
                        )}
                      </div>

                      <span className="text-muted-foreground">
                        {event.registration_mode === 'EXTERNAL_GFORM' ? 'Google Form' : 'Form Internal'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Pelaporan Kegiatan (jika COMPLETED) */}
                {event.status === 'COMPLETED' && canViewEventReport(user, event.division_code) ? (
                  <div className="px-5 pb-3">
                    {(() => {
                      const rep = reportsByEvent[event.id];
                      const tone = !rep
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : rep.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : rep.status === 'REVISION_NEEDED'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-cerulean-light/60 text-cerulean-dark border-cerulean/30';
                      const label = !rep
                        ? 'Belum ada laporan kegiatan'
                        : rep.status === 'APPROVED'
                        ? 'Laporan Disetujui Presidium'
                        : rep.status === 'REVISION_NEEDED'
                        ? 'Laporan Perlu Revisi'
                        : 'Laporan Menunggu Verifikasi Presidium';
                      return (
                        <div className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold ${tone}`}>
                          {label}
                        </div>
                      );
                    })()}
                  </div>
                ) : null}

                {/* Footer Action Buttons */}
                <div className="p-4 bg-secondary/20 border-t border-border flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/dashboard/event-spm/${event.id}/peserta`}
                    className="flex-1 min-w-[100px] inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold bg-white hover:bg-secondary text-primary border border-border shadow-xs transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Peserta ({count})
                  </Link>

                  {event.status !== 'COMPLETED' && canMarkEventCompleted(user, event.division_code) ? (
                    <button
                      type="button"
                      onClick={() => setCompleteTarget(event)}
                      title="Tandai Kegiatan Selesai"
                      className="inline-flex items-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-bold bg-cerulean-light/70 hover:bg-cerulean hover:text-white text-cerulean-dark border border-cerulean/30 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Selesai
                    </button>
                  ) : null}

                  {event.status === 'COMPLETED' && canViewEventReport(user, event.division_code) ? (
                    <button
                      type="button"
                      onClick={() => setReportEvent(event)}
                      title="Pelaporan Kegiatan"
                      className="inline-flex items-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-bold bg-gold-light hover:bg-gold text-ink border border-gold/40 transition-colors cursor-pointer"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      {reportsByEvent[event.id] ? 'Laporan' : 'Buat Laporan'}
                    </button>
                  ) : null}

                  {canManageEvent(user, event.division_code) ? (
                    <button
                      onClick={() => {
                        setEditingEvent(event);
                        setModalOpen(true);
                      }}
                      title="Edit Kegiatan"
                      className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white border border-transparent hover:border-border transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  ) : null}

                  <Link
                    href={`/kegiatan/${event.slug}`}
                    target="_blank"
                    title="Buka Halaman Publik"
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white border border-transparent hover:border-border transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  {canManageEvent(user, event.division_code) ? (
                    <button
                      onClick={() => handleDelete(event.id, event.title)}
                      disabled={deletingId === event.id}
                      title="Hapus Kegiatan"
                      className="p-2 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog */}
      <EventModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        eventToEdit={editingEvent}
        user={user}
        periods={periods}
        onSuccess={() => {
          router.refresh();
        }}
      />

      <EventReportModal
        open={Boolean(reportEvent)}
        onOpenChange={(o) => !o && setReportEvent(null)}
        event={reportEvent}
        existingReport={reportEvent ? reportsByEvent[reportEvent.id] ?? null : null}
        user={user}
        onSaved={(saved) => {
          setReportsByEvent((prev) => ({ ...prev, [saved.event_id]: saved }));
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={Boolean(completeTarget)}
        onOpenChange={(o) => !o && setCompleteTarget(null)}
        title="Tandai Kegiatan Selesai?"
        description={
          <>
            Kegiatan <strong>&ldquo;{completeTarget?.title}&rdquo;</strong> akan ditandai selesai (COMPLETED). Setelah ini Kadiv/Wakadiv dapat mengisi pelaporan kegiatan ke Presidium.
          </>
        }
        confirmLabel="Ya, Tandai Selesai"
        variant="cerulean"
        onConfirm={confirmMarkCompleted}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Hapus Kegiatan?"
        description={
          <>
            Apakah Anda yakin ingin menghapus kegiatan <strong>&ldquo;{deleteTarget?.title}&rdquo;</strong>? Seluruh data pendaftar terkait juga akan dihapus permanen.
          </>
        }
        confirmLabel="Ya, hapus permanen"
        onConfirm={confirmDelete}
      />
    </div>
  );
}

