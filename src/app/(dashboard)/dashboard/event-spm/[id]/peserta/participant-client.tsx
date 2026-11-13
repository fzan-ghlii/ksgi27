'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EventAndSpm, Registration, UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Mail,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface ParticipantClientProps {
  user: UserProfile;
  event: EventAndSpm;
  initialParticipants: Registration[];
}

export function ParticipantClient({
  user,
  event,
  initialParticipants,
}: ParticipantClientProps) {
  const router = useRouter();
  const [participants, setParticipants] = React.useState<Registration[]>(initialParticipants);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [syncing, setSyncing] = React.useState(false);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const filtered = participants.filter((p) => {
    if (statusFilter !== 'ALL') {
      const pStatus = (p.attendance_status || 'Registered').toLowerCase();
      if (pStatus !== statusFilter.toLowerCase()) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const name = (p.participant_name || p.full_name || '').toLowerCase();
      const nim = (p.participant_nim || p.nim || '').toLowerCase();
      const email = (p.participant_email || p.email || '').toLowerCase();
      const inst = (p.institution_faculty || p.institution || '').toLowerCase();
      if (!name.includes(q) && !nim.includes(q) && !email.includes(q) && !inst.includes(q)) {
        return false;
      }
    }

    return true;
  });

  const handleSyncSheet = async () => {
    try {
      setSyncing(true);
      const res = await fetch(`/api/events/${event.id}/sync`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal sinkronisasi ke Google Sheet.');

      toast.success(data.message || 'Sinkronisasi selesai.');
      // Tandai yang ada sebagai tersinkron
      setParticipants((prev) => prev.map((p) => ({ ...p, synced_to_sheet: true })));
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sinkronisasi.';
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateAttendance = async (
    regId: string,
    newStatus: 'Registered' | 'Attended' | 'Absent'
  ) => {
    try {
      setUpdatingId(regId);
      const res = await fetch(`/api/events/${event.id}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: regId,
          attendance_status: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui status kehadiran.');

      setParticipants((prev) =>
        prev.map((p) => (p.id === regId ? { ...p, attendance_status: newStatus } : p))
      );
      toast.success(`Kehadiran diperbarui: ${newStatus}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const attendedCount = participants.filter(
    (p) => (p.attendance_status || '').toLowerCase() === 'attended'
  ).length;

  return (
    <div className="space-y-6">
      {/* Tombol Kembali & Header */}
      <div>
        <Link
          href="/dashboard/event-spm"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Event & SPM
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{event.title}</h1>
              {event.category === 'SPM' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gold text-ink shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-ink" />
                  SPM {event.spm_level}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {event.location_type} &bull; {event.location_detail || event.location_or_link} &bull; Kuota: {participants.length}/{event.quota} Terisi
            </p>
          </div>

          {/* Tombol Aksi: Sync Sheet & Export CSV */}
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={handleSyncSheet}
              disabled={syncing || !event.spreadsheet_id}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 text-xs font-semibold"
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin text-emerald-600" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1.5 text-emerald-600" />
              )}
              Sinkronkan Ulang ke Sheet
            </Button>

            <a
              href={`/api/events/${event.id}/export`}
              download
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gold hover:bg-gold-hover text-ink shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-ink" />
              Unduh CSV
            </a>
          </div>
        </div>
      </div>

      {/* Ringkasan Statistik Peserta */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
          <p className="text-xs text-muted-foreground font-medium">Total Pendaftar</p>
          <p className="text-2xl font-black text-foreground mt-1">{participants.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
          <p className="text-xs text-muted-foreground font-medium">Hadir (Attended)</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{attendedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
          <p className="text-xs text-muted-foreground font-medium">Punya Rekening RDN</p>
          <p className="text-2xl font-black text-primary mt-1">
            {participants.filter((p) => p.has_rdn).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
          <p className="text-xs text-muted-foreground font-medium">Tersinkron Sheet</p>
          <p className="text-2xl font-black text-slate-700 mt-1">
            {participants.filter((p) => p.synced_to_sheet).length} / {participants.length}
          </p>
        </div>
      </div>

      {/* Filter & Pencarian */}
      <div className="bg-white p-3 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama, NIM, email, instansi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-secondary/30 border border-border focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-muted-foreground">Status Kehadiran:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs bg-secondary/30 border border-border focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="ALL">Semua Peserta</option>
            <option value="Registered">Terdaftar (Registered)</option>
            <option value="Attended">Hadir (Attended)</option>
            <option value="Absent">Tidak Hadir (Absent)</option>
          </select>
        </div>
      </div>

      {/* Tabel Peserta (Desktop) & Kartu Peserta (Mobile) */}
      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        {/* Mobile View: Kartu Peserta Praktis */}
        <div className="md:hidden divide-y divide-border/60">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs">
              Tidak ada data peserta yang cocok.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const currentStatus = item.attendance_status || 'Registered';
              const isUpdating = updatingId === item.id;
              const waNumber = (item.participant_phone || item.whatsapp || '').replace(/[^0-9]/g, '');
              const waLink = waNumber ? `https://wa.me/${waNumber.startsWith('0') ? '62' + waNumber.slice(1) : waNumber}` : '#';

              return (
                <div key={item.id} className="p-4 space-y-3 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-foreground">
                        {idx + 1}. {item.participant_name || item.full_name}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">
                        NIM: {item.participant_nim || item.nim} • {item.institution_faculty || item.institution || '-'}
                      </div>
                    </div>
                    {item.has_rdn && (
                      <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        RDN ✓
                      </span>
                    )}
                  </div>

                  {/* Kontak */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate max-w-[180px]">{item.participant_email || item.email}</span>
                    </span>
                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      {item.participant_phone || item.whatsapp}
                    </a>
                  </div>

                  {/* Absensi Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-[11px] font-semibold text-muted-foreground">Status:</span>
                    <div className="inline-flex items-center gap-1 p-0.5 bg-secondary/60 rounded-xl border border-border">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateAttendance(item.id, 'Registered')}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                          currentStatus === 'Registered'
                            ? 'bg-white text-slate-800 shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Terdaftar
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateAttendance(item.id, 'Attended')}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                          currentStatus === 'Attended'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        Hadir ✓
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateAttendance(item.id, 'Absent')}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                          currentStatus === 'Absent'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-rose-700 hover:bg-rose-50'
                        }`}
                      >
                        Absen
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama & NIM</th>
                <th className="py-3 px-4">Kontak (Email / WA)</th>
                <th className="py-3 px-4">Fakultas / Instansi</th>
                <th className="py-3 px-4 text-center">Status RDN</th>
                <th className="py-3 px-4 text-center">Kehadiran (Absensi)</th>
                <th className="py-3 px-4 text-center">Google Sheet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Tidak ada data peserta yang cocok.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const currentStatus = item.attendance_status || 'Registered';
                  const isUpdating = updatingId === item.id;
                  const waNumber = (item.participant_phone || item.whatsapp || '').replace(/[^0-9]/g, '');
                  const waLink = waNumber ? `https://wa.me/${waNumber.startsWith('0') ? '62' + waNumber.slice(1) : waNumber}` : '#';

                  return (
                    <tr key={item.id} className="hover:bg-secondary/15 transition-colors">
                      <td className="py-3 px-4 text-center text-muted-foreground font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-foreground">
                          {item.participant_name || item.full_name}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground">
                          {item.participant_nim || item.nim}
                        </div>
                      </td>
                      <td className="py-3 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="w-3 h-3 text-primary shrink-0" />
                          <span className="truncate max-w-[150px]">{item.participant_email || item.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:underline font-medium"
                          >
                            {item.participant_phone || item.whatsapp}
                          </a>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {item.institution_faculty || item.institution || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.has_rdn ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Punya RDN
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Belum Ada
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1 p-0.5 bg-secondary/60 rounded-xl border border-border/80">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateAttendance(item.id, 'Registered')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                              currentStatus === 'Registered'
                                ? 'bg-primary text-white shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Registered
                          </button>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateAttendance(item.id, 'Attended')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                              currentStatus === 'Attended'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-muted-foreground hover:text-emerald-700'
                            }`}
                          >
                            Attended
                          </button>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateAttendance(item.id, 'Absent')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                              currentStatus === 'Absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-muted-foreground hover:text-rose-700'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.synced_to_sheet ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Synced
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

