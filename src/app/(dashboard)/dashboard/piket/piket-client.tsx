'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ClipboardCheck,
  CalendarDays,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Download,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  RefreshCw,
  LocateFixed,
  MessageSquareText,
  Image as ImageIcon,
  Users,
  Send,
  Loader2,
  Eye,
  Info,
} from 'lucide-react';
import type {
  DivisionCode,
  PiketAttendance,
  PiketDay,
  PiketEligibleMember,
  PiketScheduleEntry,
  PiketSession,
  PiketSettings,
  PiketTimeStatus,
  PiketVerificationStatus,
  UserProfile,
} from '@/types';
import {
  canManagePiket,
  canSubmitPiketAttendance,
  canSupervisePiket,
  canViewAllPiketReports,
} from '@/lib/auth/permissions';
import {
  DEFAULT_GALERI_COORDS,
  PIKET_DAYS,
  PIKET_SESSIONS,
  formatDistance,
  getWibNow,
  piketDayLabel,
} from '@/lib/utils/piket';
import { PUBLIC_DIVISIONS, divisionName } from '@/lib/constants/divisions';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { PageHeader, TabBar } from '@/components/dashboard/page-parts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ConfirmDialog } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Select, Textarea } from '@/components/ui/form-controls';
import { CameraCapture, type CapturedCameraPhoto } from '@/components/piket/camera-capture';
import { LocationDetector, type DetectedLocation } from '@/components/piket/location-detector';

type PiketTab = 'absen' | 'jadwal' | 'atur' | 'laporan';

interface PiketClientProps {
  user: UserProfile;
  periodId: string;
  initialSettings: PiketSettings;
  initialSchedules: PiketScheduleEntry[];
  initialAttendances: PiketAttendance[];
  eligibleMembers: PiketEligibleMember[];
}

const VERIFICATION_META: Record<
  PiketVerificationStatus,
  { label: string; variant: 'gold' | 'success' | 'destructive' }
> = {
  PENDING: { label: 'Menunggu Verifikasi', variant: 'gold' },
  APPROVED: { label: 'Disetujui Galeri', variant: 'success' },
  REJECTED: { label: 'Ditolak Galeri', variant: 'destructive' },
};

const TIME_STATUS_META: Record<
  PiketTimeStatus,
  { label: string; variant: 'success' | 'cerulean' | 'gold' | 'outline' }
> = {
  TEPAT_WAKTU: { label: 'Tepat Waktu', variant: 'success' },
  LEBIH_AWAL: { label: 'Lebih Awal', variant: 'cerulean' },
  TERLAMBAT: { label: 'Terlambat', variant: 'gold' },
  DI_LUAR_SESI: { label: 'Di Luar Sesi', variant: 'outline' },
};

function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
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

  const [wib, setWib] = React.useState(() => getWibNow());
  React.useEffect(() => {
    setWib(getWibNow());
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

  // Identifikasi profil & jadwal piket milik user yang sedang login
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

  // Kepatuhan penjadwalan pengurus wajib (semua pengurus non-Presidium termasuk Kadiv/Wakadiv Galeri)
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

  // ---------------- STATE: TAB 1 (ABSEN PIKET) ----------------
  const [selectedSession, setSelectedSession] = React.useState<PiketSession>(wib.suggestedSession);
  const [detectedLocation, setDetectedLocation] = React.useState<DetectedLocation | null>(null);
  const [capturedPhoto, setCapturedPhoto] = React.useState<CapturedCameraPhoto | null>(null);
  const [attendanceNotes, setAttendanceNotes] = React.useState('');
  const [submittingAttendance, setSubmittingAttendance] = React.useState(false);
  const [submitStepLabel, setSubmitStepLabel] = React.useState('');

  const todayMatchingAttendance = React.useMemo(
    () =>
      myAttendances.find((a) => a.date === wib.dateStr && a.session === selectedSession) ?? null,
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
    if (!canCheckIn) return;

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
      await refreshData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengirim absensi piket.');
    } finally {
      setSubmittingAttendance(false);
      setSubmitStepLabel('');
    }
  };

  // ---------------- STATE: TAB 2 (JADWAL PIKET READ-ONLY) ----------------
  const [scheduleSearch, setScheduleSearch] = React.useState('');
  const [scheduleDivisionFilter, setScheduleDivisionFilter] = React.useState<'ALL' | DivisionCode>('ALL');
  const [showComplianceDrawer, setShowComplianceDrawer] = React.useState(false);

  const filteredSchedules = React.useMemo(() => {
    const q = scheduleSearch.trim().toLowerCase();
    return schedules.filter((s) => {
      if (scheduleDivisionFilter !== 'ALL' && s.division_code !== scheduleDivisionFilter) {
        return false;
      }
      if (!q) return true;
      return (
        s.member_name.toLowerCase().includes(q) ||
        s.position_title.toLowerCase().includes(q) ||
        divisionName(s.division_code).toLowerCase().includes(q)
      );
    });
  }, [schedules, scheduleSearch, scheduleDivisionFilter]);

  // ---------------- STATE: TAB 3 (ATUR JADWAL & LOKASI - GALERI) ----------------
  const [assignDay, setAssignDay] = React.useState<PiketDay>('SENIN');
  const [assignSession, setAssignSession] = React.useState<PiketSession>('PAGI');
  const [assignMemberKey, setAssignMemberKey] = React.useState<string>(
    () => unscheduledMandatory[0]?.key ?? mandatoryMembers[0]?.key ?? ''
  );
  const [assignBusy, setAssignBusy] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<PiketScheduleEntry | null>(null);

  React.useEffect(() => {
    if (!assignMemberKey && (unscheduledMandatory[0] || mandatoryMembers[0])) {
      setAssignMemberKey((unscheduledMandatory[0] ?? mandatoryMembers[0]).key);
    }
  }, [assignMemberKey, unscheduledMandatory, mandatoryMembers]);

  const [locForm, setLocForm] = React.useState({
    location_name: settings.location_name,
    latitude: String(settings.latitude),
    longitude: String(settings.longitude),
    radius_meters: String(settings.radius_meters),
    enforce_radius: settings.enforce_radius,
    enforce_schedule: settings.enforce_schedule,
  });
  const [calibratingGps, setCalibratingGps] = React.useState(false);
  const [savingSettings, setSavingSettings] = React.useState(false);

  React.useEffect(() => {
    setLocForm({
      location_name: settings.location_name,
      latitude: String(settings.latitude),
      longitude: String(settings.longitude),
      radius_meters: String(settings.radius_meters),
      enforce_radius: settings.enforce_radius,
      enforce_schedule: settings.enforce_schedule,
    });
  }, [settings]);

  const handleAssignSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !assignMemberKey) return;
    setAssignBusy(true);
    try {
      await apiFetch('/api/piket/schedules', {
        method: 'POST',
        body: {
          period_id: periodId,
          day: assignDay,
          session: assignSession,
          member_key: assignMemberKey,
        },
      });
      toast.success('Jadwal piket berhasil ditambahkan.');
      await refreshData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambahkan jadwal piket.');
    } finally {
      setAssignBusy(false);
    }
  };

  const handleRemoveSchedule = async (entry: PiketScheduleEntry) => {
    try {
      await apiFetch(`/api/piket/schedules/${entry.id}`, { method: 'DELETE' });
      toast.success(
        `${entry.member_name} dihapus dari slot ${piketDayLabel(entry.day)} (${PIKET_SESSIONS[entry.session].shortLabel}).`
      );
      await refreshData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus slot jadwal.');
      throw err;
    }
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
        toast.success(`Koordinat GPS Anda berhasil diambil (±${Math.round(pos.coords.accuracy)} m). Jangan lupa klik Simpan!`);
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
    if (!canManage) return;
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
      await refreshData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan lokasi.');
    } finally {
      setSavingSettings(false);
    }
  };

  // ---------------- STATE: TAB 4 (LAPORAN & PENGAWASAN) ----------------
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

  const [previewPhotoAttendance, setPreviewPhotoAttendance] = React.useState<PiketAttendance | null>(null);

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
      await refreshData();
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
      await refreshData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan catatan pengawas.');
    } finally {
      setSupervisorBusy(false);
    }
  };

  // Hitung ringkasan status untuk kartu header
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
              <p className="mt-0.5 text-[11px] text-ink-muted">
                Presidium memantau jadwal & laporan
              </p>
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
              <p className="mt-1.5 text-base sm:text-lg font-extrabold text-ink">
                {attendances.length} Log
              </p>
              <p className="mt-0.5 text-[11px] text-ink-muted">
                {pendingVerifyCount} pending · {approvedCount} disetujui
              </p>
            </>
          ) : (
            <>
              <p className="mt-1.5 text-base sm:text-lg font-extrabold text-ink">
                {myAttendances.length} Absensi
              </p>
              <p className="mt-0.5 text-[11px] text-ink-muted">
                {myApprovedCount} disetujui Galeri
              </p>
            </>
          )}
        </div>
      </div>

      {/* Tab Navigasi */}
      <TabBar tabs={tabs} value={activeTab} onChange={setActiveTab} />

      {/* ========================================================= */}
      {/* TAB 1: ABSEN PIKET (ANGGOTA & PENGURUS WAJIB PIKET)       */}
      {/* ========================================================= */}
      {activeTab === 'absen' && canCheckIn && (
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
                    wib.isWeekday &&
                    mySchedules.some((s) => s.day === wib.dayCode && s.session === code);
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
                    <span className="font-bold">{todayMatchingAttendance.checked_in_wib}</span>.
                    Silakan cek status verifikasi pada daftar riwayat di samping.
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
                      Mode ketat jadwal sedang diaktifkan oleh Divisi Galeri. Anda hanya dapat
                      mengirim absensi sesuai hari & sesi piket yang terdaftar pada jadwal Anda.
                    </p>
                  </div>
                )}

                {/* Langkah 1: Deteksi Lokasi GPS */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-ink">
                      1. Deteksi Lokasi GPS <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-[11px] text-ink-muted">
                      Radius target: {settings.radius_meters} m
                    </span>
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
                <p className="text-xs text-ink-muted">Status verifikasi Galeri & catatan pengawas</p>
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
                    <div
                      key={item.id}
                      className="rounded-2xl border border-line bg-surface/50 p-3.5 space-y-2.5"
                    >
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
                          <span className="font-bold text-ink">Catatan Galeri:</span>{' '}
                          {item.verification_note}
                        </p>
                      )}

                      {item.supervisor_note && (
                        <p className="text-[11px] text-[#66532d] bg-gold-light/60 rounded-lg px-2.5 py-1.5 border border-gold/30">
                          <span className="font-bold">Catatan Pengawas Presidium:</span>{' '}
                          {item.supervisor_note}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => setPreviewPhotoAttendance(item)}
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
      )}

      {/* ========================================================= */}
      {/* TAB 2: JADWAL PIKET (READ-ONLY UNTUK SEMUA PENGURUS)       */}
      {/* ========================================================= */}
      {activeTab === 'jadwal' && (
        <div className="space-y-5">
          {/* Banner Info Aturan Piket & Tata Kelola */}
          <div className="rounded-2xl border border-cerulean/20 bg-cerulean-light/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-cerulean shrink-0 mt-0.5" />
              <div className="text-xs text-ink space-y-0.5">
                <p className="font-bold text-sm">
                  Jadwal Piket Galeri Investasi BEI UNIMED (Periode {periodId})
                </p>
                <p className="text-ink-muted leading-relaxed">
                  Jadwal bersifat lihat-saja bagi anggota. Perubahan jadwal dikelola oleh Kadiv &amp;
                  Wakadiv Galeri, diawasi oleh Presidium. Sesi Pagi: 08.00–12.00 WIB · Sesi Siang:
                  14.00–17.00 WIB.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setShowComplianceDrawer((v) => !v)}
            >
              <Users className="h-3.5 w-3.5" />
              {showComplianceDrawer ? 'Tutup Status Kepatuhan' : `Cek Pengurus Belum Terjadwal (${unscheduledMandatory.length})`}
            </Button>
          </div>

          {showComplianceDrawer && (
            <div className="rounded-2xl border border-line bg-white p-4 sm:p-5 space-y-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-ink">
                    Kepatuhan Penjadwalan Piket Pengurus Wajib
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Seluruh pengurus lintas divisi termasuk Kadiv &amp; Wakadiv Galeri wajib memiliki jadwal
                    piket. Presidium bertindak sebagai pengawas.
                  </p>
                </div>
                <Badge variant={unscheduledMandatory.length === 0 ? 'success' : 'gold'}>
                  {scheduledMandatoryCount} / {mandatoryMembers.length} Terjadwal
                </Badge>
              </div>

              {unscheduledMandatory.length === 0 ? (
                <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  Semua pengurus wajib piket sudah tercantum dalam jadwal mingguan Galeri.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto">
                  {unscheduledMandatory.map((m) => (
                    <div
                      key={m.key}
                      className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-ink truncate">{m.full_name}</p>
                        <p className="text-[11px] text-ink-muted truncate">
                          {divisionName(m.division_code)} · {m.position_title}
                        </p>
                      </div>
                      <Badge variant="gold" className="text-[10px] shrink-0">
                        Belum Ada
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Filter Pencarian Jadwal */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={scheduleSearch}
                onChange={(e) => setScheduleSearch(e.target.value)}
                placeholder="Cari nama pengurus, jabatan, atau divisi..."
                className="pl-9"
              />
            </div>
            <Select
              value={scheduleDivisionFilter}
              onChange={(e) => setScheduleDivisionFilter(e.target.value as 'ALL' | DivisionCode)}
              className="sm:w-56"
              aria-label="Filter divisi jadwal"
            >
              <option value="ALL">Semua Divisi</option>
              {PUBLIC_DIVISIONS.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Matriks Jadwal Responsif: 1 kolom di mobile -> 2 tablet -> 5 desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3.5">
            {PIKET_DAYS.map((dayObj) => {
              const isToday = wib.isWeekday && wib.dayCode === dayObj.code;
              return (
                <div
                  key={dayObj.code}
                  className={cn(
                    'rounded-2xl border bg-white overflow-hidden flex flex-col shadow-sm',
                    isToday ? 'border-cerulean ring-2 ring-cerulean/15' : 'border-line'
                  )}
                >
                  <div
                    className={cn(
                      'px-4 py-3 border-b flex items-center justify-between',
                      isToday ? 'bg-cerulean text-white border-cerulean' : 'bg-surface border-line'
                    )}
                  >
                    <span className="font-extrabold text-sm">{dayObj.label}</span>
                    {isToday && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-cerulean">
                        Hari Ini
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-line flex-1">
                    {(['PAGI', 'SIANG'] as PiketSession[]).map((sesCode) => {
                      const sesMeta = PIKET_SESSIONS[sesCode];
                      const slotItems = filteredSchedules.filter(
                        (s) => s.day === dayObj.code && s.session === sesCode
                      );
                      return (
                        <div key={sesCode} className="p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-xs font-extrabold text-ink">{sesMeta.label}</p>
                              <p className="text-[11px] text-ink-muted">{sesMeta.timeRange}</p>
                            </div>
                            <Badge variant={sesCode === 'PAGI' ? 'cerulean' : 'cyan'} className="text-[10px]">
                              {slotItems.length} Orang
                            </Badge>
                          </div>

                          {slotItems.length === 0 ? (
                            <p className="text-[11px] italic text-ink-muted py-1.5">
                              Belum ada petugas terjadwal.
                            </p>
                          ) : (
                            <ul className="space-y-1.5">
                              {slotItems.map((entry) => {
                                const mine = isMySchedule(entry);
                                return (
                                  <li
                                    key={entry.id}
                                    className={cn(
                                      'rounded-xl border px-2.5 py-2 text-xs',
                                      mine
                                        ? 'border-cerulean bg-cerulean-light/40'
                                        : 'border-line bg-surface/60'
                                    )}
                                  >
                                    <div className="flex items-center justify-between gap-1.5">
                                      <span className="font-bold text-ink truncate">
                                        {entry.member_name}
                                      </span>
                                      {mine && (
                                        <span className="text-[10px] font-extrabold text-cerulean shrink-0">
                                          Saya
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-ink-muted truncate">
                                      {divisionName(entry.division_code)} · {entry.position_title}
                                    </p>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ATUR JADWAL & LOKASI (KHUSUS KADIV/WAKADIV GALERI) */}
      {/* ========================================================= */}
      {activeTab === 'atur' && canManage && (
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
                          assignMemberKey === m.key
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
                  value={assignMemberKey}
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
                {assignBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Tambahkan ke Slot {piketDayLabel(assignDay)} ({PIKET_SESSIONS[assignSession].shortLabel})
              </Button>
            </form>

            {/* Daftar Slot Terdaftar dengan Tombol Hapus */}
            <div className="rounded-3xl border border-line bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-ink">Daftar Penugasan Slot Piket</h3>
                  <p className="text-xs text-ink-muted">
                    Kelola dan hapus penugasan per hari &amp; sesi.
                  </p>
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
                                  <span className="font-bold text-sm text-ink truncate">
                                    {entry.member_name}
                                  </span>
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
                  <span className="font-bold text-ink block">
                    Kunci absensi wajib di dalam radius Galeri
                  </span>
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
                  <span className="font-bold text-ink block">
                    Kunci absensi hanya sesuai jadwal hari &amp; sesi
                  </span>
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
      )}

      {/* ========================================================= */}
      {/* TAB 4: LAPORAN & PENGAWASAN (GALERI + PRESIDIUM PENGAWAS) */}
      {/* ========================================================= */}
      {activeTab === 'laporan' && canViewReports && (
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
                onChange={(e) =>
                  setReportStatusFilter(e.target.value as 'ALL' | PiketVerificationStatus)
                }
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
                      onClick={() => setPreviewPhotoAttendance(item)}
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
                          {piketDayLabel(item.day)}, {item.date} · {PIKET_SESSIONS[item.session].shortLabel} ({item.checked_in_wib})
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

                      {/* Tombol Aksi Verifikasi (Galeri) & Catatan Pengawas (Presidium) */}
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
      )}

      {/* ========================================================= */}
      {/* MODAL KONFIRMASI HAPUS JADWAL PIKET                       */}
      {/* ========================================================= */}
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
          if (deleteTarget) {
            await handleRemoveSchedule(deleteTarget);
            setDeleteTarget(null);
          }
        }}
      />

      {/* ========================================================= */}
      {/* MODAL VERIFIKASI GALERI                                   */}
      {/* ========================================================= */}
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

      {/* ========================================================= */}
      {/* MODAL CATATAN PENGAWAS PRESIDIUM                          */}
      {/* ========================================================= */}
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
          <Field
            label="Catatan Evaluasi / Arahan Presidium"
            htmlFor="supervisor-note"
            required
          >
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

      {/* ========================================================= */}
      {/* MODAL LIGHTBOX FOTO BUKTI KEHADIRAN                       */}
      {/* ========================================================= */}
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
