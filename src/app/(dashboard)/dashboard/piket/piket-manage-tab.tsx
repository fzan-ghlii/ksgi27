'use client';

import * as React from 'react';
import {
  CalendarDays,
  ExternalLink,
  Loader2,
  LocateFixed,
  MapPin,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  PiketDay,
  PiketEligibleMember,
  PiketScheduleEntry,
  PiketSession,
  PiketSettings,
} from '@/types';
import {
  DEFAULT_GALERI_COORDS,
  PIKET_DAYS,
  PIKET_SESSIONS,
  piketDayLabel,
} from '@/lib/utils/piket';
import { divisionName } from '@/lib/constants/divisions';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Select } from '@/components/ui/form-controls';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/modal';
import { googleMapsUrl } from './piket-shared';

interface PiketManageTabProps {
  periodId: string;
  settings: PiketSettings;
  schedules: PiketScheduleEntry[];
  mandatoryMembers: PiketEligibleMember[];
  unscheduledMandatory: PiketEligibleMember[];
  getMemberScheduleCount: (member: PiketEligibleMember) => number;
  onChanged: () => Promise<void>;
}

function toLocationForm(settings: PiketSettings) {
  return {
    location_name: settings.location_name,
    latitude: String(settings.latitude),
    longitude: String(settings.longitude),
    radius_meters: String(settings.radius_meters),
    enforce_radius: settings.enforce_radius,
    enforce_schedule: settings.enforce_schedule,
  };
}

export function PiketManageTab({
  periodId,
  settings,
  schedules,
  mandatoryMembers,
  unscheduledMandatory,
  getMemberScheduleCount,
  onChanged,
}: PiketManageTabProps) {
  const [assignDay, setAssignDay] = React.useState<PiketDay>('SENIN');
  const [assignSession, setAssignSession] = React.useState<PiketSession>('PAGI');
  const [assignMemberKey, setAssignMemberKey] = React.useState<string>('');
  const selectedMemberKey = assignMemberKey || unscheduledMandatory[0]?.key || mandatoryMembers[0]?.key || '';
  const [assignBusy, setAssignBusy] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<PiketScheduleEntry | null>(null);

  const [locForm, setLocForm] = React.useState(() => toLocationForm(settings));
  const [prevSettings, setPrevSettings] = React.useState(settings);
  if (settings !== prevSettings) {
    setPrevSettings(settings);
    setLocForm(toLocationForm(settings));
  }
  const [calibratingGps, setCalibratingGps] = React.useState(false);
  const [savingSettings, setSavingSettings] = React.useState(false);

  const handleAssignSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberKey) return;
    setAssignBusy(true);
    try {
      await apiFetch('/api/piket/schedules', {
        method: 'POST',
        body: {
          period_id: periodId,
          day: assignDay,
          session: assignSession,
          member_key: selectedMemberKey,
        },
      });
      toast.success('Jadwal piket berhasil ditambahkan.');
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambahkan jadwal piket.');
    } finally {
      setAssignBusy(false);
    }
  };

  const handleRemoveSchedule = async (entry: PiketScheduleEntry) => {
    await apiFetch(`/api/piket/schedules/${entry.id}`, { method: 'DELETE' });
    toast.success(
      `${entry.member_name} dihapus dari slot ${piketDayLabel(entry.day)} (${PIKET_SESSIONS[entry.session].shortLabel}).`
    );
    await onChanged();
  };

  const handleCalibrateCurrentGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('Perangkat atau browser tidak mendukung GPS.');
      return;
    }
    setCalibratingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        toast.success(
          `Koordinat GPS Anda berhasil diambil (±${Math.round(pos.coords.accuracy)} m). Jangan lupa klik Simpan!`
        );
        setCalibratingGps(false);
      },
      (err) => {
        setCalibratingGps(false);
        toast.error(err.message || 'Gagal membaca lokasi GPS saat ini.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = Number(locForm.latitude);
    const lng = Number(locForm.longitude);
    const radius = Math.round(Number(locForm.radius_meters));

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast.error('Koordinat latitude dan longitude harus berupa angka yang valid.');
      return;
    }
    if (!Number.isFinite(radius) || radius < 20 || radius > 5000) {
      toast.error('Radius harus di antara 20 hingga 5000 meter.');
      return;
    }

    setSavingSettings(true);
    try {
      await apiFetch('/api/piket/settings', {
        method: 'PATCH',
        body: {
          location_name: locForm.location_name.trim(),
          latitude: lat,
          longitude: lng,
          radius_meters: radius,
          enforce_radius: locForm.enforce_radius,
          enforce_schedule: locForm.enforce_schedule,
        },
      });
      toast.success('Pengaturan titik lokasi dan aturan piket Galeri tersimpan.');
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan lokasi.');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Atur Penugasan Jadwal Piket */}
        <div className="xl:col-span-7 space-y-5">
          <form
            onSubmit={handleAssignSchedule}
            className="rounded-3xl border border-line bg-white p-5 sm:p-6 shadow-sm space-y-4"
          >
            <div className="border-b border-line pb-3">
              <h2 className="text-base sm:text-lg font-extrabold text-ink">
                Tambah Pengurus ke Jadwal Piket
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Semua pengurus divisi (termasuk Kadiv &amp; Wakadiv Galeri) wajib memiliki jadwal piket.
              </p>
            </div>

            {unscheduledMandatory.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 space-y-2">
                <p className="text-xs font-bold text-amber-900">
                  {unscheduledMandatory.length} Pengurus Belum Memiliki Jadwal (klik untuk pilih cepat):
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {unscheduledMandatory.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setAssignMemberKey(m.key)}
                      className={cn(
                        'text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors cursor-pointer',
                        assignMemberKey === m.key || selectedMemberKey === m.key
                          ? 'bg-cerulean text-white border-cerulean'
                          : 'bg-white text-ink border-amber-300 hover:border-cerulean'
                      )}
                    >
                      {m.full_name} ({m.division_code})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Field label="Hari Piket" htmlFor="assign-day" required>
                <Select
                  id="assign-day"
                  value={assignDay}
                  onChange={(e) => setAssignDay(e.target.value as PiketDay)}
                >
                  {PIKET_DAYS.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Sesi Piket" htmlFor="assign-session" required>
                <Select
                  id="assign-session"
                  value={assignSession}
                  onChange={(e) => setAssignSession(e.target.value as PiketSession)}
                >
                  <option value="PAGI">Sesi Pagi (08.00 - 12.00 WIB)</option>
                  <option value="SIANG">Sesi Siang (14.00 - 17.00 WIB)</option>
                </Select>
              </Field>
            </div>

            <Field label="Pilih Pengurus Wajib Piket" htmlFor="assign-member" required>
              <Select
                id="assign-member"
                value={selectedMemberKey}
                onChange={(e) => setAssignMemberKey(e.target.value)}
              >
                {mandatoryMembers.length === 0 ? (
                  <option value="">Belum ada data pengurus terdaftar</option>
                ) : (
                  mandatoryMembers.map((m) => {
                    const count = getMemberScheduleCount(m);
                    return (
                      <option key={m.key} value={m.key}>
                        {m.full_name} — {divisionName(m.division_code)} ({m.position_title})
                        {count > 0 ? ` [${count} slot]` : ' [Belum ada jadwal]'}
                      </option>
                    );
                  })
                )}
              </Select>
            </Field>

            <Button
              type="submit"
              variant="cerulean"
              disabled={assignBusy || !assignMemberKey}
              className="w-full sm:w-auto"
            >
              {assignBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Tambahkan ke Slot {piketDayLabel(assignDay)} ({PIKET_SESSIONS[assignSession].shortLabel})
            </Button>
          </form>

          {/* Daftar Slot Terdaftar dengan Tombol Hapus */}
          <div className="rounded-3xl border border-line bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
              <div>
                <h3 className="text-base font-extrabold text-ink">Daftar Penugasan Slot Piket</h3>
                <p className="text-xs text-ink-muted">Kelola dan hapus penugasan per hari &amp; sesi.</p>
              </div>
              <Badge variant="cerulean">{schedules.length} Slot</Badge>
            </div>

            {schedules.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Belum Ada Slot Jadwal"
                description="Tambahkan pengurus ke slot Senin–Jumat melalui formulir di atas."
                className="p-6"
              />
            ) : (
              <div className="space-y-4">
                {PIKET_DAYS.map((dayObj) => {
                  const dayEntries = schedules.filter((s) => s.day === dayObj.code);
                  if (dayEntries.length === 0) return null;
                  return (
                    <div key={dayObj.code} className="space-y-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-ink-muted">
                        {dayObj.label}
                      </h4>
                      <div className="space-y-2">
                        {dayEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="rounded-2xl border border-line bg-surface/50 px-3.5 py-2.5 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-bold text-sm text-ink truncate">{entry.member_name}</span>
                                <Badge
                                  variant={entry.session === 'PAGI' ? 'cerulean' : 'cyan'}
                                  className="text-[10px]"
                                >
                                  {PIKET_SESSIONS[entry.session].shortLabel}
                                </Badge>
                              </div>
                              <p className="text-xs text-ink-muted truncate">
                                {divisionName(entry.division_code)} · {entry.position_title}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 shrink-0"
                              onClick={() => setDeleteTarget(entry)}
                              aria-label={`Hapus ${entry.member_name} dari jadwal`}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="hidden sm:inline">Hapus</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Pengaturan Lokasi GPS Galeri & Aturan Absensi */}
        <form
          onSubmit={handleSaveSettings}
          className="xl:col-span-5 rounded-3xl border border-line bg-white p-5 sm:p-6 shadow-sm space-y-4"
        >
          <div className="border-b border-line pb-3">
            <h2 className="text-base sm:text-lg font-extrabold text-ink flex items-center gap-2">
              <MapPin className="h-5 w-5 text-cerulean" />
              Pengaturan Lokasi Galeri &amp; Geofence
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Kalibrasi titik GPS Galeri Investasi BEI UNIMED untuk validasi jarak absensi anggota.
            </p>
          </div>

          <Field label="Nama Titik Lokasi" htmlFor="loc-name" required>
            <Input
              id="loc-name"
              value={locForm.location_name}
              onChange={(e) => setLocForm((p) => ({ ...p, location_name: e.target.value }))}
              placeholder={DEFAULT_GALERI_COORDS.location_name}
              required
            />
          </Field>

          <div className="rounded-2xl border border-cerulean/20 bg-cerulean-light/30 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-ink">Kalibrasi Koordinat Galeri</span>
              <Button
                type="button"
                variant="cerulean"
                size="sm"
                onClick={handleCalibrateCurrentGps}
                disabled={calibratingGps}
              >
                {calibratingGps ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <LocateFixed className="h-3.5 w-3.5" />
                )}
                Gunakan GPS Saya Saat Ini
              </Button>
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Klik tombol di atas saat Anda berada langsung di ruang Galeri Investasi UNIMED agar
              koordinat latitude &amp; longitude terkalibrasi presisi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Latitude" htmlFor="loc-lat" required>
              <Input
                id="loc-lat"
                type="number"
                step="any"
                value={locForm.latitude}
                onChange={(e) => setLocForm((p) => ({ ...p, latitude: e.target.value }))}
                required
              />
            </Field>
            <Field label="Longitude" htmlFor="loc-lng" required>
              <Input
                id="loc-lng"
                type="number"
                step="any"
                value={locForm.longitude}
                onChange={(e) => setLocForm((p) => ({ ...p, longitude: e.target.value }))}
                required
              />
            </Field>
          </div>

          <Field
            label="Radius Area Absensi (meter)"
            htmlFor="loc-radius"
            hint="Disarankan 100–250 meter untuk memperhitungkan akurasi GPS di dalam ruangan kampus."
            required
          >
            <div className="space-y-2">
              <Input
                id="loc-radius"
                type="number"
                min={20}
                max={5000}
                value={locForm.radius_meters}
                onChange={(e) => setLocForm((p) => ({ ...p, radius_meters: e.target.value }))}
                required
              />
              <div className="flex flex-wrap gap-1.5">
                {[50, 100, 200, 350, 500].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setLocForm((p) => ({ ...p, radius_meters: String(r) }))}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer',
                      Number(locForm.radius_meters) === r
                        ? 'bg-cerulean text-white border-cerulean'
                        : 'bg-surface text-ink-muted border-line hover:text-ink'
                    )}
                  >
                    {r} m
                  </button>
                ))}
              </div>
            </div>
          </Field>

          <div className="space-y-2.5 pt-1">
            <label className="flex items-start gap-3 rounded-2xl border border-line bg-surface/50 p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={locForm.enforce_radius}
                onChange={(e) => setLocForm((p) => ({ ...p, enforce_radius: e.target.checked }))}
                className="mt-0.5 h-4 w-4 rounded border-line text-cerulean focus:ring-cerulean"
              />
              <span className="text-xs space-y-0.5">
                <span className="font-bold text-ink block">Kunci absensi wajib di dalam radius Galeri</span>
                <span className="text-ink-muted block">
                  Jika nonaktif, anggota di luar radius tetap bisa melapor dengan penanda &ldquo;Di Luar
                  Area&rdquo; untuk diverifikasi Galeri.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-line bg-surface/50 p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={locForm.enforce_schedule}
                onChange={(e) => setLocForm((p) => ({ ...p, enforce_schedule: e.target.checked }))}
                className="mt-0.5 h-4 w-4 rounded border-line text-cerulean focus:ring-cerulean"
              />
              <span className="text-xs space-y-0.5">
                <span className="font-bold text-ink block">Kunci absensi hanya sesuai jadwal hari &amp; sesi</span>
                <span className="text-ink-muted block">
                  Jika nonaktif, pengurus dapat menggantikan jadwal rekan dengan penanda
                  &ldquo;Pengganti / Luar Jadwal&rdquo;.
                </span>
              </span>
            </label>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
            <a
              href={googleMapsUrl(
                Number(locForm.latitude) || settings.latitude,
                Number(locForm.longitude) || settings.longitude
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-cerulean hover:underline"
            >
              Cek Titik di Maps
              <ExternalLink className="h-3 w-3" />
            </a>
            <Button type="submit" variant="cerulean" disabled={savingSettings}>
              {savingSettings && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan Pengaturan Lokasi
            </Button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Jadwal Piket"
        description={
          deleteTarget ? (
            <>
              Hapus <span className="font-bold text-ink">{deleteTarget.member_name}</span> dari slot{' '}
              <span className="font-bold text-ink">
                {piketDayLabel(deleteTarget.day)} ({PIKET_SESSIONS[deleteTarget.session].label})
              </span>
              ?
            </>
          ) : null
        }
        confirmLabel="Ya, Hapus Slot"
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await handleRemoveSchedule(deleteTarget);
            setDeleteTarget(null);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Gagal menghapus slot jadwal.');
          }
        }}
      />
    </>
  );
}

