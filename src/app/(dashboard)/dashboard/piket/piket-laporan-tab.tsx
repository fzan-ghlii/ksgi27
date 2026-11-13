'use client';

import * as React from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MessageSquareText,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { PiketAttendance, PiketSession, PiketVerificationStatus } from '@/types';
import { PIKET_SESSIONS, formatDistance, piketDayLabel } from '@/lib/utils/piket';
import { divisionName } from '@/lib/constants/divisions';
import { apiFetch } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Select, Textarea } from '@/components/ui/form-controls';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import {
  TIME_STATUS_META,
  VERIFICATION_META,
  googleMapsUrl,
} from './piket-shared';

interface PiketLaporanTabProps {
  attendances: PiketAttendance[];
  canManage: boolean;
  canSupervise: boolean;
  onChanged: () => Promise<void>;
  onPreviewPhoto: (attendance: PiketAttendance) => void;
}

export function PiketLaporanTab({
  attendances,
  canManage,
  canSupervise,
  onChanged,
  onPreviewPhoto,
}: PiketLaporanTabProps) {
  const [reportSearch, setReportSearch] = React.useState('');
  const [reportSessionFilter, setReportSessionFilter] = React.useState<'ALL' | PiketSession>('ALL');
  const [reportStatusFilter, setReportStatusFilter] = React.useState<'ALL' | PiketVerificationStatus>('ALL');
  const [reportLocationFilter, setReportLocationFilter] = React.useState<'ALL' | 'IN_AREA' | 'OUT_OF_AREA'>('ALL');
  const [reportDateFilter, setReportDateFilter] = React.useState('');

  const [verifyModalTarget, setVerifyModalTarget] = React.useState<{
    attendance: PiketAttendance;
    nextStatus: PiketVerificationStatus;
  } | null>(null);
  const [verifyNote, setVerifyNote] = React.useState('');
  const [verifyBusy, setVerifyBusy] = React.useState(false);

  const [supervisorModalTarget, setSupervisorModalTarget] = React.useState<PiketAttendance | null>(null);
  const [supervisorNote, setSupervisorNote] = React.useState('');
  const [supervisorBusy, setSupervisorBusy] = React.useState(false);

  const filteredReports = React.useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    return attendances.filter((a) => {
      if (reportSessionFilter !== 'ALL' && a.session !== reportSessionFilter) return false;
      if (reportStatusFilter !== 'ALL' && a.verification_status !== reportStatusFilter) return false;
      if (reportLocationFilter !== 'ALL' && a.location_status !== reportLocationFilter) return false;
      if (reportDateFilter && a.date !== reportDateFilter) return false;
      if (!q) return true;
      return (
        a.user_name.toLowerCase().includes(q) ||
        a.position_title.toLowerCase().includes(q) ||
        divisionName(a.division_code).toLowerCase().includes(q)
      );
    });
  }, [
    attendances,
    reportSearch,
    reportSessionFilter,
    reportStatusFilter,
    reportLocationFilter,
    reportDateFilter,
  ]);

  const openVerifyModal = (attendance: PiketAttendance, nextStatus: PiketVerificationStatus) => {
    setVerifyModalTarget({ attendance, nextStatus });
    setVerifyNote(attendance.verification_note ?? '');
  };

  const handleConfirmVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyModalTarget || !canManage) return;
    setVerifyBusy(true);
    try {
      await apiFetch(`/api/piket/attendances/${verifyModalTarget.attendance.id}`, {
        method: 'PATCH',
        body: {
          mode: 'verify',
          verification_status: verifyModalTarget.nextStatus,
          verification_note: verifyNote.trim(),
        },
      });
      toast.success(
        verifyModalTarget.nextStatus === 'APPROVED'
          ? 'Kehadiran piket disetujui.'
          : verifyModalTarget.nextStatus === 'REJECTED'
          ? 'Kehadiran piket ditolak.'
          : 'Status verifikasi diperbarui.'
      );
      setVerifyModalTarget(null);
      setVerifyNote('');
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memperbarui status verifikasi.');
    } finally {
      setVerifyBusy(false);
    }
  };

  const openSupervisorModal = (attendance: PiketAttendance) => {
    setSupervisorModalTarget(attendance);
    setSupervisorNote(attendance.supervisor_note ?? '');
  };

  const handleSaveSupervisorNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supervisorModalTarget || !canSupervise) return;
    if (supervisorNote.trim().length < 2) {
      toast.error('Catatan pengawas minimal 2 karakter.');
      return;
    }
    setSupervisorBusy(true);
    try {
      await apiFetch(`/api/piket/attendances/${supervisorModalTarget.id}`, {
        method: 'PATCH',
        body: {
          mode: 'supervisor',
          supervisor_note: supervisorNote.trim(),
        },
      });
      toast.success('Catatan pengawasan Presidium berhasil disimpan.');
      setSupervisorModalTarget(null);
      setSupervisorNote('');
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan catatan pengawas.');
    } finally {
      setSupervisorBusy(false);
    }
  };

  return (
    <>
      <div className="space-y-5">
        {/* Info Peran Verifikasi vs Pengawasan */}
        <div className="rounded-2xl border border-line bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-gold shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-sm text-ink">
                {canManage
                  ? 'Panel Verifikasi & Rekap Hasil Absensi Piket (Divisi Galeri)'
                  : 'Panel Pengawasan Pelaksanaan & Hasil Piket (Presidium)'}
              </p>
              <p className="text-ink-muted">
                {canManage
                  ? 'Tinjau foto kamera langsung, titik koordinat GPS, ketepatan waktu, lalu setujui atau tolak laporan kehadiran.'
                  : 'Sebagai pengawas, Presidium dapat memantau seluruh bukti foto, GPS, status verifikasi Galeri, serta menambahkan catatan pengawasan.'}
              </p>
            </div>
          </div>
          <a
            href="/api/piket/export"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-cerulean px-4 text-xs font-bold text-white hover:bg-cerulean-dark transition-colors shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            Unduh Rekap CSV
          </a>
        </div>

        {/* Toolbar Filter Laporan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-white p-4 rounded-2xl border border-line shadow-sm">
          <div className="relative lg:col-span-2">
            <Search className="h-4 w-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={reportSearch}
              onChange={(e) => setReportSearch(e.target.value)}
              placeholder="Cari nama pengurus atau divisi..."
              className="pl-9"
            />
          </div>
          <Input
            type="date"
            value={reportDateFilter}
            onChange={(e) => setReportDateFilter(e.target.value)}
            aria-label="Filter tanggal laporan"
          />
          <Select
            value={reportSessionFilter}
            onChange={(e) => setReportSessionFilter(e.target.value as 'ALL' | PiketSession)}
            aria-label="Filter sesi"
          >
            <option value="ALL">Semua Sesi</option>
            <option value="PAGI">Sesi Pagi (08.00-12.00)</option>
            <option value="SIANG">Sesi Siang (14.00-17.00)</option>
          </Select>
          <div className="flex gap-2">
            <Select
              value={reportStatusFilter}
              onChange={(e) => setReportStatusFilter(e.target.value as 'ALL' | PiketVerificationStatus)}
              aria-label="Filter status verifikasi"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Disetujui</option>
              <option value="REJECTED">Ditolak</option>
            </Select>
            <Select
              value={reportLocationFilter}
              onChange={(e) =>
                setReportLocationFilter(e.target.value as 'ALL' | 'IN_AREA' | 'OUT_OF_AREA')
              }
              aria-label="Filter area lokasi"
            >
              <option value="ALL">Semua Area</option>
              <option value="IN_AREA">Dalam Area</option>
              <option value="OUT_OF_AREA">Luar Area</option>
            </Select>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Belum Ada Data Laporan Piket"
            description="Belum ada absensi yang sesuai dengan filter, atau pengurus belum mengirimkan konfirmasi piket."
          />
        ) : (
          <div className="space-y-3.5">
            {filteredReports.map((item) => {
              const ver = VERIFICATION_META[item.verification_status];
              const tMeta = TIME_STATUS_META[item.time_status];
              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-line bg-white p-4 sm:p-5 shadow-sm flex flex-col md:flex-row gap-4"
                >
                  {/* Thumbnail Foto Kamera Langsung */}
                  <button
                    type="button"
                    onClick={() => onPreviewPhoto(item)}
                    className="group relative w-full md:w-44 h-48 md:h-36 rounded-2xl overflow-hidden border border-line bg-slate-100 shrink-0 cursor-pointer"
                  >
                    <img
                      src={item.photo_url}
                      alt={`Bukti piket ${item.user_name}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-ink/75 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-white">
                      <ImageIcon className="h-3 w-3" />
                      Perbesar
                    </span>
                  </button>

                  {/* Detail Laporan */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-extrabold text-ink">{item.user_name}</h3>
                        <p className="text-xs text-ink-muted">
                          {divisionName(item.division_code)} · {item.position_title}
                        </p>
                      </div>
                      <Badge variant={ver.variant}>{ver.label}</Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="text-[11px]">
                        {piketDayLabel(item.day)}, {item.date} · {PIKET_SESSIONS[item.session].shortLabel} (
                        {item.checked_in_wib})
                      </Badge>
                      <Badge variant={tMeta.variant} className="text-[11px]">
                        {tMeta.label}
                      </Badge>
                      <Badge
                        variant={item.location_status === 'IN_AREA' ? 'success' : 'gold'}
                        className="text-[11px]"
                      >
                        {item.location_status === 'IN_AREA'
                          ? `Dalam Area · ${formatDistance(item.distance_meters)}`
                          : `Luar Area · ${formatDistance(item.distance_meters)}`}
                      </Badge>
                      <Badge variant={item.is_scheduled_match ? 'cerulean' : 'outline'} className="text-[11px]">
                        {item.is_scheduled_match ? 'Sesuai Jadwal' : 'Pengganti / Luar Slot'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                      <span className="font-mono">
                        GPS: {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)} (±{item.accuracy_meters}m)
                      </span>
                      <a
                        href={googleMapsUrl(item.latitude, item.longitude)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-cerulean hover:underline"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        Buka di Google Maps
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    {item.notes && (
                      <p className="text-xs text-ink bg-surface rounded-xl border border-line px-3 py-2">
                        <span className="font-bold">Catatan Piket:</span> {item.notes}
                      </p>
                    )}

                    {item.verification_note && (
                      <p className="text-xs text-ink-muted bg-surface/60 rounded-xl border border-line px-3 py-2">
                        <span className="font-bold text-ink">
                          Verifikasi ({item.verified_by_name || 'Galeri'}):
                        </span>{' '}
                        {item.verification_note}
                      </p>
                    )}

                    {item.supervisor_note && (
                      <p className="text-xs text-[#66532d] bg-gold-light/60 rounded-xl border border-gold/30 px-3 py-2">
                        <span className="font-bold">
                          Catatan Pengawas ({item.supervisor_name || 'Presidium'}):
                        </span>{' '}
                        {item.supervisor_note}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {canManage && (
                        <>
                          <Button
                            type="button"
                            variant={item.verification_status === 'APPROVED' ? 'outline' : 'cerulean'}
                            size="sm"
                            onClick={() => openVerifyModal(item, 'APPROVED')}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Setujui
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => openVerifyModal(item, 'REJECTED')}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Tolak
                          </Button>
                        </>
                      )}

                      {canSupervise && (
                        <Button
                          type="button"
                          variant="gold"
                          size="sm"
                          onClick={() => openSupervisorModal(item)}
                        >
                          <MessageSquareText className="h-3.5 w-3.5" />
                          {item.supervisor_note ? 'Edit Catatan Pengawas' : 'Catatan Pengawas'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Verifikasi Galeri */}
      <Modal
        open={!!verifyModalTarget}
        onOpenChange={(open) => !open && setVerifyModalTarget(null)}
        title={
          verifyModalTarget?.nextStatus === 'APPROVED'
            ? 'Setujui Laporan Absensi Piket'
            : 'Tolak Laporan Absensi Piket'
        }
        description={
          verifyModalTarget
            ? `${verifyModalTarget.attendance.user_name} · ${piketDayLabel(verifyModalTarget.attendance.day)}, ${verifyModalTarget.attendance.date}`
            : undefined
        }
        size="sm"
      >
        <form onSubmit={handleConfirmVerify} className="space-y-4">
          <Field
            label="Catatan Verifikasi Divisi Galeri (Opsional)"
            htmlFor="verify-note"
            hint="Catatan akan terlihat oleh pengurus yang bersangkutan dan Presidium pengawas."
          >
            <Textarea
              id="verify-note"
              value={verifyNote}
              onChange={(e) => setVerifyNote(e.target.value)}
              placeholder={
                verifyModalTarget?.nextStatus === 'REJECTED'
                  ? 'Contoh: Foto tidak diambil di ruang Galeri atau di luar jam piket.'
                  : 'Contoh: Kehadiran sesuai jadwal dan lokasi terkonfirmasi.'
              }
              maxLength={400}
            />
          </Field>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setVerifyModalTarget(null)}
              disabled={verifyBusy}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant={verifyModalTarget?.nextStatus === 'REJECTED' ? 'destructive' : 'cerulean'}
              size="sm"
              disabled={verifyBusy}
            >
              {verifyBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {verifyModalTarget?.nextStatus === 'REJECTED' ? 'Tolak Kehadiran' : 'Simpan Persetujuan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Catatan Pengawas Presidium */}
      <Modal
        open={!!supervisorModalTarget}
        onOpenChange={(open) => !open && setSupervisorModalTarget(null)}
        title="Catatan Pengawasan Presidium"
        description={
          supervisorModalTarget
            ? `Pengawasan untuk piket ${supervisorModalTarget.user_name} (${supervisorModalTarget.date})`
            : undefined
        }
        size="sm"
      >
        <form onSubmit={handleSaveSupervisorNote} className="space-y-4">
          <Field label="Catatan Evaluasi / Arahan Presidium" htmlFor="supervisor-note" required>
            <Textarea
              id="supervisor-note"
              value={supervisorNote}
              onChange={(e) => setSupervisorNote(e.target.value)}
              placeholder="Contoh: Koordinasikan dengan Kadiv Galeri terkait keterlambatan sesi siang."
              minLength={2}
              maxLength={500}
              required
            />
          </Field>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSupervisorModalTarget(null)}
              disabled={supervisorBusy}
            >
              Batal
            </Button>
            <Button type="submit" variant="gold" size="sm" disabled={supervisorBusy}>
              {supervisorBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Simpan Catatan Pengawas
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

