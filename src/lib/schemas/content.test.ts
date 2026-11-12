import { describe, it, expect } from 'vitest';
import {
  PeriodSchema,
  ArticleInputSchema,
  ArticleReviewSchema,
  GalleryInputSchema,
  BoardAddSchema,
} from './content';

const validPeriod = {
  cabinet_name: 'Kabinet Harmoni',
  year_range: '2027/2028',
  vision: 'Visi yang cukup panjang untuk lolos validasi.',
  missions: ['Misi pertama yang jelas'],
};

describe('PeriodSchema', () => {
  it('menerima data valid', () => {
    expect(PeriodSchema.safeParse(validPeriod).success).toBe(true);
  });
  it('menerima nama kabinet dan misi kosong (opsional)', () => {
    expect(PeriodSchema.safeParse({ year_range: '2027/2028' }).success).toBe(true);
    expect(PeriodSchema.safeParse({ ...validPeriod, cabinet_name: '', missions: [] }).success).toBe(true);
  });
  it('menolak rentang tahun yang tidak berurutan', () => {
    expect(PeriodSchema.safeParse({ ...validPeriod, year_range: '2027/2029' }).success).toBe(false);
    expect(PeriodSchema.safeParse({ ...validPeriod, year_range: '2027-2028' }).success).toBe(false);
  });
});

describe('ArticleInputSchema', () => {
  const base = { title: 'Belajar Saham untuk Pemula', category: 'Edukasi Dasar' as const };
  it('memberi default draft, tags, dan content', () => {
    const r = ArticleInputSchema.parse(base);
    expect(r.action).toBe('draft');
    expect(r.tags).toEqual([]);
    expect(r.content).toBe('');
  });
  it('menolak kategori di luar daftar dan slug tidak valid', () => {
    expect(ArticleInputSchema.safeParse({ ...base, category: 'Gosip' }).success).toBe(false);
    expect(ArticleInputSchema.safeParse({ ...base, slug: 'Slug Salah!' }).success).toBe(false);
    expect(ArticleInputSchema.safeParse({ ...base, slug: 'slug-benar-1' }).success).toBe(true);
  });
  it('menolak URL sampul berbahaya', () => {
    expect(ArticleInputSchema.safeParse({ ...base, thumbnail_url: 'javascript:alert(1)' }).success).toBe(false);
    expect(ArticleInputSchema.safeParse({ ...base, thumbnail_url: '/gambar/artikel/a.jpg' }).success).toBe(true);
    expect(ArticleInputSchema.safeParse({ ...base, thumbnail_url: '/api/images/img_12345' }).success).toBe(true);
  });
});

describe('ArticleReviewSchema', () => {
  it('tolak wajib disertai catatan', () => {
    expect(ArticleReviewSchema.safeParse({ decision: 'reject' }).success).toBe(false);
    expect(ArticleReviewSchema.safeParse({ decision: 'reject', note: 'Perbaiki sumber data' }).success).toBe(true);
    expect(ArticleReviewSchema.safeParse({ decision: 'publish' }).success).toBe(true);
  });
});

describe('GalleryInputSchema & BoardAddSchema', () => {
  it('galeri butuh minimal 1 foto valid dan tanggal', () => {
    const base = {
      title: 'SPM Batch I',
      period_id: '2026-2027',
      division_code: 'EDUKASI' as const,
      activity_date: '2026-10-05',
    };
    expect(GalleryInputSchema.safeParse({ ...base, image_urls: [] }).success).toBe(false);
    expect(GalleryInputSchema.safeParse({ ...base, image_urls: ['bukan-url'] }).success).toBe(false);
    expect(GalleryInputSchema.safeParse({ ...base, image_urls: ['https://x.id/a.jpg'] }).success).toBe(true);
  });
  it('pengurus menolak tautan sosmed non-http', () => {
    const base = { period_id: '2026-2027', division_code: 'MEDIA' as const, full_name: 'Budi Santoso', position_title: 'Staf' };
    expect(BoardAddSchema.safeParse({ ...base, social_links: { instagram: 'javascript:1' } }).success).toBe(false);
    expect(BoardAddSchema.safeParse({ ...base, social_links: { instagram: 'https://instagram.com/budi' } }).success).toBe(true);
  });
});

