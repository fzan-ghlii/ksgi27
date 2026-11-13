import { describe, it, expect } from 'vitest';
import { AchievementInputSchema } from './achievement';

const base = {
  title: 'Galeri Investasi Teraktif Kategori Edukasi BEI',
  level: 'Nasional' as const,
  year: 2026,
  organizer: 'PT Bursa Efek Indonesia',
  category: 'Kinerja Galeri Investasi',
  description: 'Penghargaan atas capaian literasi dan penyelenggaraan SPM sepanjang tahun.',
};

describe('AchievementInputSchema', () => {
  it('menerima prestasi valid dengan gambar opsional', () => {
    expect(AchievementInputSchema.safeParse(base).success).toBe(true);
    expect(
      AchievementInputSchema.safeParse({
        ...base,
        image_url: '/api/images/img_12345',
      }).success
    ).toBe(true);
  });

  it('menolak judul terlalu pendek, tingkat tidak valid, atau tahun di luar rentang', () => {
    expect(AchievementInputSchema.safeParse({ ...base, title: 'Top' }).success).toBe(false);
    expect(AchievementInputSchema.safeParse({ ...base, level: 'Kecamatan' }).success).toBe(false);
    expect(AchievementInputSchema.safeParse({ ...base, year: 1995 }).success).toBe(false);
  });

  it('menolak image_url berbahaya', () => {
    expect(
      AchievementInputSchema.safeParse({
        ...base,
        image_url: 'javascript:alert(1)',
      }).success
    ).toBe(false);
  });
});

