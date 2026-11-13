import { describe, it, expect } from 'vitest';
import {
  calculateDistanceMeters,
  evaluateTimeStatus,
  formatDistance,
  getWibNow,
  isMandatoryPiketMember,
} from './piket';

describe('piket utilities', () => {
  it('menghitung jarak Haversine secara akurat', () => {
    // Titik identik -> 0 meter
    expect(calculateDistanceMeters(3.6068, 98.7165, 3.6068, 98.7165)).toBe(0);

    // Pergeseran ~111 meter (0.001 derajat lintang)
    const dist = calculateDistanceMeters(3.6068, 98.7165, 3.6078, 98.7165);
    expect(dist).toBeGreaterThan(100);
    expect(dist).toBeLessThan(120);
  });

  it('memformat jarak meter dan kilometer dengan benar', () => {
    expect(formatDistance(45)).toBe('45 m');
    expect(formatDistance(1500)).toBe('1.50 km');
    expect(formatDistance(-1)).toBe('-');
  });

  it('mengevaluasi status waktu sesi pagi (08.00 - 12.00 WIB)', () => {
    expect(evaluateTimeStatus('PAGI', 7, 15)).toBe('LEBIH_AWAL');
    expect(evaluateTimeStatus('PAGI', 7, 45)).toBe('TEPAT_WAKTU');
    expect(evaluateTimeStatus('PAGI', 8, 10)).toBe('TEPAT_WAKTU');
    expect(evaluateTimeStatus('PAGI', 9, 15)).toBe('TERLAMBAT');
    expect(evaluateTimeStatus('PAGI', 12, 0)).toBe('TERLAMBAT');
    expect(evaluateTimeStatus('PAGI', 12, 30)).toBe('DI_LUAR_SESI');
  });

  it('mengevaluasi status waktu sesi siang (14.00 - 17.00 WIB)', () => {
    expect(evaluateTimeStatus('SIANG', 10, 0)).toBe('DI_LUAR_SESI');
    expect(evaluateTimeStatus('SIANG', 13, 0)).toBe('LEBIH_AWAL');
    expect(evaluateTimeStatus('SIANG', 13, 50)).toBe('TEPAT_WAKTU');
    expect(evaluateTimeStatus('SIANG', 14, 25)).toBe('TEPAT_WAKTU');
    expect(evaluateTimeStatus('SIANG', 15, 0)).toBe('TERLAMBAT');
    expect(evaluateTimeStatus('SIANG', 17, 0)).toBe('TERLAMBAT');
    expect(evaluateTimeStatus('SIANG', 17, 5)).toBe('DI_LUAR_SESI');
  });

  it('mengonversi waktu UTC ke WIB (Asia/Jakarta)', () => {
    // 2026-11-16T01:30:00Z = Senin, 16 Nov 2026 pukul 08:30 WIB
    const wibMorning = getWibNow(new Date('2026-11-16T01:30:00Z'));
    expect(wibMorning.dateStr).toBe('2026-11-16');
    expect(wibMorning.dayCode).toBe('SENIN');
    expect(wibMorning.isWeekday).toBe(true);
    expect(wibMorning.hour).toBe(8);
    expect(wibMorning.minute).toBe(30);
    expect(wibMorning.suggestedSession).toBe('PAGI');

    // 2026-11-16T07:30:00Z = Senin, 16 Nov 2026 pukul 14:30 WIB
    const wibAfternoon = getWibNow(new Date('2026-11-16T07:30:00Z'));
    expect(wibAfternoon.hour).toBe(14);
    expect(wibAfternoon.suggestedSession).toBe('SIANG');
  });

  it('menentukan pengurus wajib piket vs pengawas Presidium', () => {
    expect(isMandatoryPiketMember({ role: 'member', division_code: 'EDUKASI' })).toBe(true);
    expect(isMandatoryPiketMember({ role: 'admin_kadiv', division_code: 'GALERI' })).toBe(true);
    expect(isMandatoryPiketMember({ role: 'member', division_code: 'GALERI' })).toBe(true);
    expect(isMandatoryPiketMember({ role: 'admin_kadiv', division_code: 'MEDIA' })).toBe(true);

    // Presidium bertugas sebagai pengawas
    expect(isMandatoryPiketMember({ role: 'master_presidium', division_code: 'PRESIDIUM' })).toBe(false);
    expect(isMandatoryPiketMember({ role: 'member', division_code: 'PRESIDIUM' })).toBe(false);
    expect(isMandatoryPiketMember({ role: 'creator', division_code: null })).toBe(false);
  });
});

