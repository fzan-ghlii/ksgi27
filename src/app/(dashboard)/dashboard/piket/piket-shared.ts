import type { PiketTimeStatus, PiketVerificationStatus } from '@/types';
import { getWibNow } from '@/lib/utils/piket';

export type WibClock = ReturnType<typeof getWibNow>;

export const VERIFICATION_META: Record<
  PiketVerificationStatus,
  { label: string; variant: 'gold' | 'success' | 'destructive' }
> = {
  PENDING: { label: 'Menunggu Verifikasi', variant: 'gold' },
  APPROVED: { label: 'Disetujui Galeri', variant: 'success' },
  REJECTED: { label: 'Ditolak Galeri', variant: 'destructive' },
};

export const TIME_STATUS_META: Record<
  PiketTimeStatus,
  { label: string; variant: 'success' | 'cerulean' | 'gold' | 'outline' }
> = {
  TEPAT_WAKTU: { label: 'Tepat Waktu', variant: 'success' },
  LEBIH_AWAL: { label: 'Lebih Awal', variant: 'cerulean' },
  TERLAMBAT: { label: 'Terlambat', variant: 'gold' },
  DI_LUAR_SESI: { label: 'Di Luar Sesi', variant: 'outline' },
};

export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

