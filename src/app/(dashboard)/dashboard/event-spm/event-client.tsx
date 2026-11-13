'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EventAndSpm, Period, UserProfile } from '@/types';
import { OFFICIAL_DIVISIONS } from '@/lib/constants/divisions';
import { isPresidiumUp } from '@/lib/auth/permissions';
import { EventModal } from './event-modal';
import { Button } from '@/components/ui/button';
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
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react';

interface EventClientProps {
  user: UserProfile;
  initialEvents: EventAndSpm[];
  periods: Period[];
}

export function EventClient({ user, initialEvents, periods }: EventClientProps) {
  const router = useRouter();
  const [events, setEvents] = React.useState<EventAndSpm[]>(initialEvents);
  const [categoryFilter, setCategoryFilter] = React.useState<'ALL' | 'SPM' | 'EVENT'>('ALL');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<EventAndSpm | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const isPresidium = isPresidiumUp(user);
  const userDivision = user.division_code;

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

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kegiatan "${title}"? Seluruh data pendaftar terkait juga akan dihapus permanen.`)) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus kegiatan.');

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

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Calendar className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Manajemen Event & Sekolah Pasar Modal (SPM)
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola agenda kegiatan organisasi, pantau kuota secara real-time, dan hubungkan langsung dengan Google Spreadsheet.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingEvent(null);
            setModalOpen(true);
          }}
          className="bg-gold hover:bg-gold-hover text-ink font-bold shadow-sm inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-ink" />
          Buat Kegiatan Baru
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Tab Kategori */}
        <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-xl border border-border/60 w-full md:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              categoryFilter === 'ALL'
                ? 'bg-white text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Semua Kegiatan
          </button>
          <button
            onClick={() => setCategoryFilter('SPM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              categoryFilter === 'SPM'
                ? 'bg-white text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Sekolah Pasar Modal (SPM)
          </button>
          <button
            onClick={() => setCategoryFilter('EVENT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              categoryFilter === 'EVENT'
                ? 'bg-white text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Program Kerja & Seminar
          </button>
        </div>

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
            Tidak ada kegiatan atau SPM yang sesuai dengan filter yang dipilih. Silakan klik tombol "Buat Kegiatan Baru".
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
                          isOpen
                            ? 'bg-emerald-500 text-white'
                            : event.status === 'CLOSED' || isFull
                            ? 'bg-rose-500 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {isFull ? 'KUOTA PENUH' : event.status}
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

                {/* Footer Action Buttons */}
                <div className="p-4 bg-secondary/20 border-t border-border flex items-center justify-between gap-2">
                  <Link
                    href={`/dashboard/event-spm/${event.id}/peserta`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold bg-white hover:bg-secondary text-primary border border-border shadow-xs transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Peserta ({count})
                  </Link>

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

                  <Link
                    href={`/kegiatan/${event.slug}`}
                    target="_blank"
                    title="Buka Halaman Publik"
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white border border-transparent hover:border-border transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => handleDelete(event.id, event.title)}
                    disabled={deletingId === event.id}
                    title="Hapus Kegiatan"
                    className="p-2 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
          // Re-fetch atau refresh
          router.refresh();
        }}
      />
    </div>
  );
}

