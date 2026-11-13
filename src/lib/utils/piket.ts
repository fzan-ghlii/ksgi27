import type { DivisionCode, PiketDay, PiketSession, PiketTimeStatus, Role } from '@/types';

export const PIKET_DAY_CODES = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'] as const;
export const PIKET_SESSION_CODES = ['PAGI', 'SIANG'] as const;

export const PIKET_DAYS: Array<{ code: PiketDay; label: string; short: string }> = [
  { code: 'SENIN', label: 'Senin', short: 'Sen' },
  { code: 'SELASA', label: 'Selasa', short: 'Sel' },
  { code: 'RABU', label: 'Rabu', short: 'Rab' },
  { code: 'KAMIS', label: 'Kamis', short: 'Kam' },
  { code: 'JUMAT', label: 'Jumat', short: 'Jum' },
];

export const PIKET_SESSIONS: Record<
  PiketSession,
  { code: PiketSession; label: string; shortLabel: string; timeRange: string; startHour: number; endHour: number }
> = {
  PAGI: {
    code: 'PAGI',
    label: 'Sesi Pagi',
    shortLabel: 'Pagi',
    timeRange: '08.00 - 12.00 WIB',
    startHour: 8,
    endHour: 12,
  },
  SIANG: {
    code: 'SIANG',
    label: 'Sesi Siang',
    shortLabel: 'Siang',
    timeRange: '14.00 - 17.00 WIB',
    startHour: 14,
    endHour: 17,
  },
};

export const DEFAULT_GALERI_COORDS = {
  location_name: 'Galeri Investasi BEI UNIMED (Fakultas Ekonomi)',
  latitude: 3.6068,
  longitude: 98.7165,
  radius_meters: 200,
};

const WEEKDAY_MAP: Record<string, PiketDay | 'SABTU' | 'MINGGU'> = {
  Mon: 'SENIN',
  Tue: 'SELASA',
  Wed: 'RABU',
  Thu: 'KAMIS',
  Fri: 'JUMAT',
  Sat: 'SABTU',
  Sun: 'MINGGU',
};

export interface WibDateTimeInfo {
  dateStr: string; // YYYY-MM-DD
  dayCode: PiketDay | 'SABTU' | 'MINGGU';
  isWeekday: boolean;
  hour: number;
  minute: number;
  timeStr: string; // e.g. "08:15 WIB"
  suggestedSession: PiketSession;
}

/**
 * Mengambil informasi tanggal, hari, dan waktu saat ini dalam zona waktu WIB (Asia/Jakarta).
 */
export function getWibNow(now: Date = new Date()): WibDateTimeInfo {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  }).formatToParts(now);

  const getPart = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '';

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const weekday = getPart('weekday');
  const rawHour = Number(getPart('hour'));
  const hour = rawHour === 24 ? 0 : rawHour;
  const minute = Number(getPart('minute'));

  const dayCode = WEEKDAY_MAP[weekday] ?? 'SENIN';
  const isWeekday = (PIKET_DAY_CODES as readonly string[]).includes(dayCode);
  const pad = (n: number) => String(n).padStart(2, '0');

  return {
    dateStr: `${year}-${month}-${day}`,
    dayCode,
    isWeekday,
    hour,
    minute,
    timeStr: `${pad(hour)}:${pad(minute)} WIB`,
    suggestedSession: hour < 13 ? 'PAGI' : 'SIANG',
  };
}

/**
 * Menghitung jarak dua koordinat geografis menggunakan rumus Haversine (dalam meter).
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius bumi dalam meter
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return '-';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Mengevaluasi ketepatan waktu absensi berdasarkan sesi piket:
 * - Pagi: 08.00 - 12.00 WIB (toleransi lebih awal 07.30, tepat waktu s.d 08.30)
 * - Siang: 14.00 - 17.00 WIB (toleransi lebih awal 13.30, tepat waktu s.d 14.30)
 */
export function evaluateTimeStatus(
  session: PiketSession,
  hour: number,
  minute: number
): PiketTimeStatus {
  const totalMinutes = hour * 60 + minute;

  if (session === 'PAGI') {
    const earlyWindowStart = 7 * 60 + 30; // 07:30
    const onTimeEnd = 8 * 60 + 30; // 08:30
    const sessionEnd = 12 * 60; // 12:00

    if (totalMinutes < earlyWindowStart) return 'LEBIH_AWAL';
    if (totalMinutes <= onTimeEnd) return 'TEPAT_WAKTU';
    if (totalMinutes <= sessionEnd) return 'TERLAMBAT';
    return 'DI_LUAR_SESI';
  }

  // SIANG
  const afternoonEarliest = 12 * 60 + 1; // 12:01
  const earlyWindowStart = 13 * 60 + 30; // 13:30
  const onTimeEnd = 14 * 60 + 30; // 14:30
  const sessionEnd = 17 * 60; // 17:00

  if (totalMinutes < afternoonEarliest || totalMinutes > sessionEnd) return 'DI_LUAR_SESI';
  if (totalMinutes < earlyWindowStart) return 'LEBIH_AWAL';
  if (totalMinutes <= onTimeEnd) return 'TEPAT_WAKTU';
  return 'TERLAMBAT';
}

/**
 * Semua pengurus GIBEI (termasuk Kadiv & Wakadiv Galeri) wajib piket,
 * sementara Presidium bertugas sebagai pengawas.
 */
export function isMandatoryPiketMember(input: {
  role?: Role | null;
  division_code?: DivisionCode | string | null;
}): boolean {
  if (input.role === 'master_presidium' || input.role === 'creator') return false;
  if (input.division_code === 'PRESIDIUM') return false;
  return true;
}

export function piketDayLabel(day: string): string {
  const found = PIKET_DAYS.find((d) => d.code === day);
  if (found) return found.label;
  if (day === 'SABTU') return 'Sabtu';
  if (day === 'MINGGU') return 'Minggu';
  return day;
}

