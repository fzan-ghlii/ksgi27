import { describe, it, expect } from 'vitest';
import {
  PiketAttendanceInputSchema,
  PiketScheduleAssignSchema,
  PiketSettingsInputSchema,
  PiketVerifyInputSchema,
} from './piket';

describe('piket schemas', () => {
  it('menerima penjadwalan Senin–Jumat sesi Pagi/Siang', () => {
    const ok = PiketScheduleAssignSchema.safeParse({
      period_id: '2026-2027',
      day: 'SENIN',
      session: 'PAGI',
      member_key: 'uid_123',
    });
    expect(ok.success).toBe(true);
  });

  it('menolak hari di luar Senin–Jumat untuk jadwal piket', () => {
    const bad = PiketScheduleAssignSchema.safeParse({
      period_id: '2026-2027',
      day: 'SABTU',
      session: 'PAGI',
      member_key: 'uid_123',
    });
    expect(bad.success).toBe(false);
  });

  it('memvalidasi absensi kamera WebP & GPS', () => {
    const ok = PiketAttendanceInputSchema.safeParse({
      session: 'SIANG',
      photo_url: '/api/images/img_123_abc',
      latitude: 3.6068,
      longitude: 98.7165,
      accuracy_meters: 15,
      notes: 'Piket sesi siang menjaga ruang galeri.',
    });
    expect(ok.success).toBe(true);

    const noPhoto = PiketAttendanceInputSchema.safeParse({
      session: 'PAGI',
      photo_url: '',
      latitude: 3.6068,
      longitude: 98.7165,
    });
    expect(noPhoto.success).toBe(false);

    const badLat = PiketAttendanceInputSchema.safeParse({
      session: 'PAGI',
      photo_url: '/api/images/img_123',
      latitude: 120,
      longitude: 98.7,
    });
    expect(badLat.success).toBe(false);
  });

  it('memvalidasi pengaturan radius lokasi galeri', () => {
    const ok = PiketSettingsInputSchema.safeParse({
      location_name: 'Galeri Investasi BEI UNIMED',
      latitude: 3.6068,
      longitude: 98.7165,
      radius_meters: 200,
      enforce_radius: false,
      enforce_schedule: false,
    });
    expect(ok.success).toBe(true);

    const tooSmall = PiketSettingsInputSchema.safeParse({
      location_name: 'Galeri',
      latitude: 3.6068,
      longitude: 98.7165,
      radius_meters: 5,
      enforce_radius: true,
      enforce_schedule: true,
    });
    expect(tooSmall.success).toBe(false);
  });

  it('memvalidasi keputusan verifikasi absensi', () => {
    expect(
      PiketVerifyInputSchema.safeParse({ verification_status: 'APPROVED', verification_note: 'Sah' }).success
    ).toBe(true);
    expect(
      PiketVerifyInputSchema.safeParse({ verification_status: 'INVALID' }).success
    ).toBe(false);
  });
});

