'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  CalendarDays,
  ClipboardCheck,
  Clock,
  Download,
  ExternalLink,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type {
  PiketAttendance,
  PiketEligibleMember,
  PiketScheduleEntry,
  PiketSettings,
  UserProfile,
} from '@/types';
import {
  canManagePiket,
  canSubmitPiketAttendance,
  canSupervisePiket,
  canViewAllPiketReports,
} from '@/lib/auth/permissions';
import {
  PIKET_SESSIONS,
  formatDistance,
  getWibNow,
  piketDayLabel,
} from '@/lib/utils/piket';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { PageHeader, TabBar } from '@/components/dashboard/page-parts';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { googleMapsUrl } from './piket-shared';
import { PiketAbsenTab } from './piket-absen-tab';
import { PiketJadwalTab } from './piket-jadwal-tab';
import { PiketManageTab } from './piket-manage-tab';
import { PiketLaporanTab } from './piket-laporan-tab';

type PiketTab = 'absen' | 'jadwal' | 'atur' | 'laporan';

interface PiketClientProps {
  user: UserProfile;
  periodId: string;
  initialSettings: PiketSettings;
  initialSchedules: PiketScheduleEntry[];
  initialAttendances: PiketAttendance[];
  eligibleMembers: PiketEligibleMember[];
}

export function PiketClient({
  user,
  periodId,
  initialSettings,
  initialSchedules,
  initialAttendances,
  eligibleMembers,
}: PiketClientProps) {
  const router = useRouter();

  const canManage = canManagePiket(user);
  const canSupervise = canSupervisePiket(user);
  const canViewReports = canViewAllPiketReports(user);
  const canCheckIn = canSubmitPiketAttendance(user);

  const [settings, setSettings] = React.useState<PiketSettings>(initialSettings);
  const [schedules, setSchedules] = React.useState<PiketScheduleEntry[]>(initialSchedules);
  const [attendances, setAttendances] = React.useState<PiketAttendance[]>(initialAttendances);
  const [members, setMembers] = React.useState<PiketEligibleMember[]>(eligibleMembers);
  const [refreshing, setRefreshing] = React.useState(false);
  const [previewPhotoAttendance, setPreviewPhotoAttendance] = React.useState<PiketAttendance | null>(null);

  const [wib, setWib] = React.useState(() => getWibNow());
  React.useEffect(() => {
    const id = window.setInterval(() => setWib(getWibNow()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const tabs = React.useMemo(() => {
    const list: Array<{ id: PiketTab; label: string; count?: number }> = [];
    if (canCheckIn) {
      list.push({ id: 'absen', label: 'Absen Piket' });
    }
    list.push({ id: 'jadwal', label: 'Jadwal Piket', count: schedules.length });
    if (canManage) {
      list.push({ id: 'atur', label: 'Atur Jadwal & Lokasi' });
    }
    if (canViewReports) {
      const pendingCount = attendances.filter((a) => a.verification_status === 'PENDING').length;
      list.push({
        id: 'laporan',
        label: 'Laporan & Pengawasan',
        count: pendingCount > 0 ? pendingCount : attendances.length,
      });
    }
    return list;
  }, [canCheckIn, canManage, canViewReports, schedules.length, attendances]);

  const [activeTab, setActiveTab] = React.useState<PiketTab>(() =>
    user.role === 'creator' && canManage ? 'atur' : canCheckIn ? 'absen' : 'jadwal'
  );

  const refreshData = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await apiFetch<{
        settings: PiketSettings;
        schedules: PiketScheduleEntry[];
        attendances: PiketAttendance[];
        eligibleMembers: PiketEligibleMember[];
      }>('/api/piket');
      setSettings(data.settings);
      setSchedules(data.schedules);
      setAttendances(data.attendances);
      setMembers(data.eligibleMembers);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat ulang data piket.');
    } finally {
      setRefreshing(false);
    }
  }, [router]);

  const myMemberRecord = React.useMemo(
    () => members.find((m) => m.user_id === user.uid),
    [members, user.uid]
  );

  const isMySchedule = React.useCallback(
    (s: PiketScheduleEntry) =>
      s.user_id === user.uid ||
      (!!myMemberRecord?.board_member_id && s.board_member_id === myMemberRecord.board_member_id),
    [user.uid, myMemberRecord]
  );

  const mySchedules = React.useMemo(
    () => schedules.filter(isMySchedule),
    [schedules, isMySchedule]
  );

  const myAttendances = React.useMemo(
    () => attendances.filter((a) => a.user_id === user.uid),
    [attendances, user.uid]
  );

  const mandatoryMembers = React.useMemo(
    () => members.filter((m) => m.is_mandatory_piket),
    [members]
  );

  const scheduleIdsByMember = React.useMemo(() => {
    const byUser = new Map<string, Set<string>>();
    const byBoard = new Map<string, Set<string>>();
    for (const s of schedules) {
      if (s.user_id) {
        const set = byUser.get(s.user_id) ?? new Set<string>();
        set.add(s.id);
        byUser.set(s.user_id, set);
      }
      if (s.board_member_id) {
        const set = byBoard.get(s.board_member_id) ?? new Set<string>();
        set.add(s.id);
        byBoard.set(s.board_member_id, set);
      }
    }
    return { byUser, byBoard };
  }, [schedules]);

  const getMemberScheduleCount = React.useCallback(
    (m: PiketEligibleMember) => {
      const ids = new Set<string>();
      if (m.user_id) {
        scheduleIdsByMember.byUser.get(m.user_id)?.forEach((id) => ids.add(id));
      }
      if (m.board_member_id) {
        scheduleIdsByMember.byBoard.get(m.board_member_id)?.forEach((id) => ids.add(id));
      }
      return ids.size;
    },
    [scheduleIdsByMember]
  );

  const unscheduledMandatory = React.useMemo(
    () => mandatoryMembers.filter((m) => getMemberScheduleCount(m) === 0),
    [mandatoryMembers, getMemberScheduleCount]
  );
  const scheduledMandatoryCount = mandatoryMembers.length - unscheduledMandatory.length;

  const pendingVerifyCount = attendances.filter((a) => a.verification_status === 'PENDING').length;
  const approvedCount = attendances.filter((a) => a.verification_status === 'APPROVED').length;
  const myApprovedCount = myAttendances.filter((a) => a.verification_status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Operasional Galeri BEI"
        title="Jadwal & Absensi Piket Galeri"
        description="Piket harian Senin–Jumat terbagi dalam Sesi Pagi (08.00–12.00 WIB) dan Sesi Siang (14.00–17.00 WIB). Seluruh pengurus termasuk Kadiv & Wakadiv Galeri wajib piket, dengan Presidium sebagai pengawas."
        tone={canSupervise && !canManage ? 'gold' : 'cerulean'}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canManage && activeTab !== 'atur' && (
              <Button
                type="button"
                variant="cerulean"
                size="sm"
                onClick={() => setActiveTab('atur')}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Atur Jadwal Piket
              </Button>
            )}
            {canViewReports && (
              <a
                href="/api/piket/export"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-xs font-semibold text-ink hover:bg-surface hover:border-cerulean transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-cerulean" />
                Export CSV
              </a>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={refreshing}
            >
              <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
              Segarkan
            </Button>
          </div>
        }
      />

      {/* Ringkasan Statistik Cepat */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-ink-muted">
            <span>Waktu Galeri (WIB)</span>
            <Clock className="h-4 w-4 text-cerulean shrink-0" />
          </div>
          <p className="mt-1.5 text-base sm:text-lg font-extrabold text-ink" suppressHydrationWarning>
            {piketDayLabel(wib.dayCode)}, {wib.timeStr}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-muted">
            {wib.isWeekday
              ? `Aktif: ${PIKET_SESSIONS[wib.suggestedSession].label}`
              : 'Akhir Pekan (Galeri Libur)'}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-ink-muted">
            <span>
              {user.role === 'creator'
                ? 'Pengelola Piket'
                : canCheckIn
                  ? 'Jadwal Piket Saya'
                  : 'Peran Pengawasan'}
            </span>
            {canCheckIn && user.role !== 'creator' ? (
              <CalendarDays className="h-4 w-4 text-cerulean shrink-0" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-gold shrink-0" />
            )}
          </div>
          {user.role === 'creator' ? (
            <>
              <p className="mt-1.5 text-base sm:text-lg font-extrabold text-ink">Akses Penuh</p>
              <button
                type="button"
                onClick={() => setActiveTab('atur')}
                className="mt-0.5 text-[11px] font-semibold text-cerulean hover:underline cursor-pointer text-left"
              >
                Kelola jadwal, lokasi &amp; laporan →
              </button>
            </>
          ) : canCheckIn ? (
            <>
              <p className="mt-1.5 text-base sm:text-lg font-extrabold text-ink truncate">
                {mySchedules.length > 0
                  ? mySchedules
                      .map((s) => `${piketDayLabel(s.day)} (${PIKET_SESSIONS[s.session].shortLabel})`)
                      .join(', ')
                  : 'Belum Terjadwal'}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-muted">
                {mySchedules.length > 0 ? (
                  `${mySchedules.length} slot piket per minggu`
                ) : canManage ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('atur')}
                    className="font-semibold text-cerulean hover:underline cursor-pointer"
                  >
                    Tambahkan di tab Atur Jadwal →
                  </button>
                ) : (
                  'Hubungi Kadiv/Wakadiv Galeri'
                )}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1.5 text-base sm:text-lg font-extrabold text-ink">Pengawas Piket</p>
              <p className="mt-0.5 text-[11px] text-ink-muted">Presidium memantau jadwal &amp; laporan</p>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-ink-muted">
            <span>Kepatuhan Jadwal Wajib</span>
            <Users className="h-4 w-4 text-cerulean shrink-0" />
          </div>
          <p className="mt-1.5 text-base sm:text-lg font-extrabold text-ink">
            {scheduledMandatoryCount} / {mandatoryMembers.length}{' '}
            <span className="text-xs font-semibold text-ink-muted">Pengurus</span>
          </p>
          <p className="mt-0.5 text-[11px] text-ink-muted">
            {unscheduledMandatory.length === 0
              ? 'Seluruh pengurus wajib telah dijadwalkan'
              : `${unscheduledMandatory.length} pengurus belum dapat slot`}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-ink-muted">
            <span>{canViewReports ? 'Rekap Laporan Absen' : 'Kehadiran Saya'}</span>
            <ClipboardCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          </div>
          {canViewReports ? (
            <>
              <p className="mt-1.5 text-base sm:text-lg font-extrabold text-ink">{attendances.length} Log</p>
              <p className="mt-0.5 text-[11px] text-ink-muted">
                {pendingVerifyCount} pending · {approvedCount} disetujui
              </p>
            </>
          ) : (
            <>
              <p className="mt-1.5 text-base sm:text-lg font-extrabold text-ink">
                {myAttendances.length} Absensi
              </p>
              <p className="mt-0.5 text-[11px] text-ink-muted">{myApprovedCount} disetujui Galeri</p>
            </>
          )}
        </div>
      </div>

      {/* Tab Navigasi */}
      <TabBar tabs={tabs} value={activeTab} onChange={setActiveTab} />

      {activeTab === 'absen' && canCheckIn && (
        <PiketAbsenTab
          settings={settings}
          wib={wib}
          mySchedules={mySchedules}
          myAttendances={myAttendances}
          onSubmitted={refreshData}
          onPreviewPhoto={setPreviewPhotoAttendance}
        />
      )}

      {activeTab === 'jadwal' && (
        <PiketJadwalTab
          periodId={periodId}
          schedules={schedules}
          wib={wib}
          isMySchedule={isMySchedule}
          mandatoryMembers={mandatoryMembers}
          unscheduledMandatory={unscheduledMandatory}
          scheduledMandatoryCount={scheduledMandatoryCount}
        />
      )}

      {activeTab === 'atur' && canManage && (
        <PiketManageTab
          periodId={periodId}
          settings={settings}
          schedules={schedules}
          mandatoryMembers={mandatoryMembers}
          unscheduledMandatory={unscheduledMandatory}
          getMemberScheduleCount={getMemberScheduleCount}
          onChanged={refreshData}
        />
      )}

      {activeTab === 'laporan' && canViewReports && (
        <PiketLaporanTab
          attendances={attendances}
          canManage={canManage}
          canSupervise={canSupervise}
          onChanged={refreshData}
          onPreviewPhoto={setPreviewPhotoAttendance}
        />
      )}

      {/* Modal Lightbox Foto Bukti Kehadiran */}
      <Modal
        open={!!previewPhotoAttendance}
        onOpenChange={(open) => !open && setPreviewPhotoAttendance(null)}
        title={
          previewPhotoAttendance
            ? `Bukti Foto Piket — ${previewPhotoAttendance.user_name}`
            : 'Bukti Foto Piket'
        }
        description={
          previewPhotoAttendance
            ? `${piketDayLabel(previewPhotoAttendance.day)}, ${previewPhotoAttendance.date} · ${previewPhotoAttendance.checked_in_wib}`
            : undefined
        }
        size="lg"
      >
        {previewPhotoAttendance && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-line bg-slate-900">
              <img
                src={previewPhotoAttendance.photo_url}
                alt={`Foto absen ${previewPhotoAttendance.user_name}`}
                className="w-full max-h-[65dvh] object-contain mx-auto"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
              <span>
                Jarak dari titik Galeri:{' '}
                <strong className="text-ink">
                  {formatDistance(previewPhotoAttendance.distance_meters)}
                </strong>{' '}
                (Akurasi GPS ±{previewPhotoAttendance.accuracy_meters}m)
              </span>
              <a
                href={googleMapsUrl(
                  previewPhotoAttendance.latitude,
                  previewPhotoAttendance.longitude
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-cerulean hover:underline"
              >
                <MapPin className="h-3.5 w-3.5" />
                Lihat Lokasi di Google Maps
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
