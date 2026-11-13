'use client';

import * as React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Eye,
  Loader2,
  MapPin,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import type { PiketAttendance, PiketScheduleEntry, PiketSession, PiketSettings } from '@/types';
import { PIKET_SESSIONS, formatDistance, piketDayLabel } from '@/lib/utils/piket';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Textarea } from '@/components/ui/form-controls';
import { CameraCapture, type CapturedCameraPhoto } from '@/components/piket/camera-capture';
import { LocationDetector, type DetectedLocation } from '@/components/piket/location-detector';
import {
  TIME_STATUS_META,
  VERIFICATION_META,
  googleMapsUrl,
  type WibClock,
} from './piket-shared';

interface PiketAbsenTabProps {
  settings: PiketSettings;
  wib: WibClock;
  mySchedules: PiketScheduleEntry[];
  myAttendances: PiketAttendance[];
  onSubmitted: () => Promise<void>;
  onPreviewPhoto: (attendance: PiketAttendance) => void;
}

export function PiketAbsenTab({
  settings,
  wib,
  mySchedules,
  myAttendances,
  onSubmitted,
  onPreviewPhoto,
}: PiketAbsenTabProps) {
  const [selectedSession, setSelectedSession] = React.useState<PiketSession>(wib.suggestedSession);
  const [detectedLocation, setDetectedLocation] = React.useState<DetectedLocation | null>(null);
  const [capturedPhoto, setCapturedPhoto] = React.useState<CapturedCameraPhoto | null>(null);
  const [attendanceNotes, setAttendanceNotes] = React.useState('');
  const [submittingAttendance, setSubmittingAttendance] = React.useState(false);
  const [submitStepLabel, setSubmitStepLabel] = React.useState('');

  const todayMatchingAttendance = React.useMemo(
    () => myAttendances.find((a) => a.date === wib.dateStr && a.session === selectedSession) ?? null,
    [myAttendances, wib.dateStr, selectedSession]
  );

  const isScheduledForSelectedNow = React.useMemo(
    () =>
      wib.isWeekday &&
      mySchedules.some((s) => s.day === wib.dayCode && s.session === selectedSession),
    [wib.isWeekday, wib.dayCode, mySchedules, selectedSession]
  );

  const cameraLocationWatermark = React.useMemo(() => {
    if (!detectedLocation) return settings.location_name;
    return `${settings.location_name} (${detectedLocation.latitude.toFixed(5)}, ${detectedLocation.longitude.toFixed(5)} · ${formatDistance(detectedLocation.distanceMeters)})`;
  }, [detectedLocation, settings.location_name]);

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();

    if (todayMatchingAttendance) {
      toast.error(`Anda sudah mengirim absensi pada ${wib.dateStr} sesi ${PIKET_SESSIONS[selectedSession].shortLabel}.`);
      return;
    }
    if (!detectedLocation) {
      toast.error('Silakan deteksi lokasi GPS Anda terlebih dahulu.');
      return;
    }
    if (settings.enforce_radius && !detectedLocation.inArea) {
      toast.error(
        `Lokasi Anda berada ${formatDistance(detectedLocation.distanceMeters)} dari ${settings.location_name} (batas maksimal ${settings.radius_meters} m).`
      );
      return;
    }
    if (!capturedPhoto) {
      toast.error('Silakan ambil foto bukti kehadiran melalui kamera langsung terlebih dahulu.');
      return;
    }
    if (settings.enforce_schedule && !isScheduledForSelectedNow) {
      toast.error('Mode jadwal ketat aktif: Anda tidak terjadwal pada hari dan sesi ini.');
      return;
    }

    setSubmittingAttendance(true);
    try {
      setSubmitStepLabel('Mengunggah foto WebP...');
      const uploadRes = await apiFetch<{ url: string }>('/api/images', {
        method: 'POST',
        body: {
          name: capturedPhoto.fileName,
          base64: capturedPhoto.base64,
          size: capturedPhoto.sizeBytes,
          original_size: capturedPhoto.sizeBytes,
        },
      });

      setSubmitStepLabel('Menyimpan presensi & koordinat...');
      await apiFetch<{ attendance: PiketAttendance }>('/api/piket/attendances', {
        method: 'POST',
        body: {
          session: selectedSession,
          photo_url: uploadRes.url,
          latitude: detectedLocation.latitude,
          longitude: detectedLocation.longitude,
          accuracy_meters: detectedLocation.accuracy,
          notes: attendanceNotes.trim(),
        },
      });

      toast.success('Absensi piket berhasil dikirim dan tercatat!');
      setCapturedPhoto(null);
      setAttendanceNotes('');
      await onSubmitted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengirim absensi piket.');
    } finally {
      setSubmittingAttendance(false);
      setSubmitStepLabel('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <form
        onSubmit={handleSubmitAttendance}
        className="lg:col-span-7 rounded-3xl border border-line bg-white p-5 sm:p-6 shadow-sm space-y-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-ink flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-cerulean" />
              Konfirmasi Kehadiran Piket
            </h2>
            <p className="text-xs text-ink-muted mt-1">
              Deteksi lokasi GPS Anda dan ambil foto bukti kehadiran langsung menggunakan kamera.
            </p>
          </div>
          <Badge variant={isScheduledForSelectedNow ? 'success' : 'outline'}>
            {isScheduledForSelectedNow ? 'Sesuai Jadwal Anda' : 'Piket Pengganti / Luar Slot'}
          </Badge>
        </div>

        {/* Pilihan Sesi */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-ink">Pilih Sesi Piket Hari Ini</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['PAGI', 'SIANG'] as PiketSession[]).map((code) => {
              const meta = PIKET_SESSIONS[code];
              const active = selectedSession === code;
              const isSuggested = wib.suggestedSession === code;
              const hasSlotToday =
                wib.isWeekday && mySchedules.some((s) => s.day === wib.dayCode && s.session === code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedSession(code)}
                  className={cn(
                    'text-left rounded-2xl border p-3.5 transition-all cursor-pointer',
                    active
                      ? 'border-cerulean bg-cerulean-light/40 ring-2 ring-cerulean/20'
                      : 'border-line bg-surface/50 hover:bg-white hover:border-slate-300'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-sm text-ink">{meta.label}</span>
                    <div className="flex items-center gap-1">
                      {hasSlotToday && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Jadwalmu
                        </span>
                      )}
                      {isSuggested && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cerulean text-white">
                          Sekarang
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-ink-muted mt-1 font-medium">{meta.timeRange}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifikasi jika sudah absen hari ini di sesi terpilih */}
        {todayMatchingAttendance ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 space-y-1">
              <p className="font-bold text-sm">
                Absensi {PIKET_SESSIONS[selectedSession].label} Hari Ini Sudah Tercatat
              </p>
              <p>
                Anda sudah melakukan check-in pada pukul{' '}
                <span className="font-bold">{todayMatchingAttendance.checked_in_wib}</span>. Silakan cek
                status verifikasi pada daftar riwayat di samping.
              </p>
            </div>
          </div>
        ) : (
          <>
            {!wib.isWeekday && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Hari ini bukan hari piket reguler (Senin–Jumat). Jika terdapat piket khusus atau
                  pengganti akhir pekan, absensi tetap dicatat sebagai di luar hari kerja reguler.
                </p>
              </div>
            )}

            {settings.enforce_schedule && !isScheduledForSelectedNow && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 flex items-start gap-2.5 text-xs text-rose-800">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <p>
                  Mode ketat jadwal sedang diaktifkan oleh Divisi Galeri. Anda hanya dapat mengirim
                  absensi sesuai hari &amp; sesi piket yang terdaftar pada jadwal Anda.
                </p>
              </div>
            )}

            {/* Langkah 1: Deteksi Lokasi GPS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-ink">
                  1. Deteksi Lokasi GPS <span className="text-rose-600">*</span>
                </label>
                <span className="text-[11px] text-ink-muted">Radius target: {settings.radius_meters} m</span>
              </div>
              <LocationDetector
                settings={settings}
                location={detectedLocation}
                onDetected={setDetectedLocation}
                disabled={submittingAttendance}
              />
            </div>

            {/* Langkah 2: Kamera Langsung */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-ink">
                2. Foto Kehadiran via Kamera <span className="text-rose-600">*</span>
              </label>
              <CameraCapture
                captured={capturedPhoto}
                onCapture={setCapturedPhoto}
                locationLabel={cameraLocationWatermark}
                disabled={submittingAttendance}
              />
            </div>

            {/* Langkah 3: Catatan Opsional */}
            <Field
              label="3. Catatan Aktivitas Piket (Opsional)"
              htmlFor="piket-notes"
              hint="Contoh: Menjaga Galeri BEI, membantu registrasi SPM, rekap pengunjung."
            >
              <Textarea
                id="piket-notes"
                value={attendanceNotes}
                onChange={(e) => setAttendanceNotes(e.target.value)}
                placeholder="Tulis catatan piket atau keterangan izin pergantian sesi bila ada..."
                maxLength={400}
                disabled={submittingAttendance}
              />
            </Field>

            <Button
              type="submit"
              variant="cerulean"
              size="lg"
              className="w-full font-bold"
              disabled={
                submittingAttendance ||
                !detectedLocation ||
                !capturedPhoto ||
                (settings.enforce_radius && !detectedLocation.inArea) ||
                (settings.enforce_schedule && !isScheduledForSelectedNow)
              }
            >
              {submittingAttendance ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {submitStepLabel || 'Mengirim Absensi...'}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Kirim Konfirmasi Kehadiran
                </>
              )}
            </Button>
          </>
        )}
      </form>

      {/* Kolom Kanan: Riwayat Absensi Saya */}
      <div className="lg:col-span-5 rounded-3xl border border-line bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
          <div>
            <h3 className="text-base font-extrabold text-ink">Riwayat Absensi Saya</h3>
            <p className="text-xs text-ink-muted">Status verifikasi Galeri &amp; catatan pengawas</p>
          </div>
          <Badge variant="cerulean">{myAttendances.length} Log</Badge>
        </div>

        {myAttendances.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Belum Ada Riwayat Absen"
            description="Setelah Anda mengirim kehadiran via kamera dan GPS, log dan status verifikasinya muncul di sini."
            className="p-6 sm:p-8"
          />
        ) : (
          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
            {myAttendances.map((item) => {
              const ver = VERIFICATION_META[item.verification_status];
              const tMeta = TIME_STATUS_META[item.time_status];
              return (
                <div key={item.id} className="rounded-2xl border border-line bg-surface/50 p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-sm text-ink">
                        {piketDayLabel(item.day)}, {item.date}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {PIKET_SESSIONS[item.session].label} · Check-in {item.checked_in_wib}
                      </p>
                    </div>
                    <Badge variant={ver.variant} className="shrink-0 text-[11px]">
                      {ver.label}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={tMeta.variant} className="text-[10px]">
                      {tMeta.label}
                    </Badge>
                    <Badge
                      variant={item.location_status === 'IN_AREA' ? 'success' : 'gold'}
                      className="text-[10px]"
                    >
                      {item.location_status === 'IN_AREA'
                        ? `Dalam Area (${formatDistance(item.distance_meters)})`
                        : `Luar Area (${formatDistance(item.distance_meters)})`}
                    </Badge>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-ink bg-white rounded-xl border border-line p-2.5">
                      “{item.notes}”
                    </p>
                  )}

                  {item.verification_note && (
                    <p className="text-[11px] text-ink-muted bg-white/80 rounded-lg px-2.5 py-1.5 border border-line">
                      <span className="font-bold text-ink">Catatan Galeri:</span> {item.verification_note}
                    </p>
                  )}

                  {item.supervisor_note && (
                    <p className="text-[11px] text-[#66532d] bg-gold-light/60 rounded-lg px-2.5 py-1.5 border border-gold/30">
                      <span className="font-bold">Catatan Pengawas Presidium:</span> {item.supervisor_note}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => onPreviewPhoto(item)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-cerulean hover:underline cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Lihat Foto Bukti
                    </button>
                    <a
                      href={googleMapsUrl(item.latitude, item.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-cerulean"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Peta Lokasi
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

