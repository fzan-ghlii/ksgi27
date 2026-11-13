import { z } from 'zod';
import { DIVISION_CODES } from '@/lib/constants/divisions';
import { IMAGE_REF_ERROR, isValidImageRef } from '@/lib/utils/image-ref';
import { SLUG_PATTERN } from '@/lib/utils/content';

// ------------------------------------------------------------------ Bagian bersama

export const imageRefSchema = z.string().trim().refine(isValidImageRef, IMAGE_REF_ERROR);

/** Gambar opsional: boleh kosong, kalau diisi harus valid. */
export const optionalImageRef = z.union([z.literal(''), imageRefSchema]).optional();

const httpUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => /^https?:\/\//i.test(v), 'Tautan harus diawali http:// atau https://');

const optionalHttpUrl = z.union([z.literal(''), httpUrl]).optional();

const divisionCode = z.enum(DIVISION_CODES, { message: 'Divisi tidak valid.' });

// ------------------------------------------------------------------ Periode

const PERIOD_YEAR_RANGE = /^(\d{4})\/(\d{4})$/;

export const PeriodSchema = z.object({
  cabinet_name: z.string().trim().max(80).optional().default(''),
  year_range: z
    .string()
    .trim()
    .regex(PERIOD_YEAR_RANGE, 'Format tahun: 2027/2028')
    .refine((v) => {
      const m = PERIOD_YEAR_RANGE.exec(v);
      return !!m && Number(m[2]) === Number(m[1]) + 1;
    }, 'Tahun akhir harus tepat satu tahun setelah tahun awal.'),
  vision: z.string().trim().max(600).optional().default(''),
  missions: z
    .array(z.string().trim().max(300))
    .max(10, 'Maksimal 10 misi.')
    .optional()
    .default([]),
  is_current: z.boolean().optional(),
});
export type PeriodInput = z.infer<typeof PeriodSchema>;

/** Rentang tahun menentukan ID periode, jadi tidak bisa diubah setelah dibuat. */
export const PeriodUpdateSchema = PeriodSchema.omit({ year_range: true });
export type PeriodUpdateInput = z.infer<typeof PeriodUpdateSchema>;

// ------------------------------------------------------------------ Pengurus

const socialLinks = z
  .object({ linkedin: optionalHttpUrl, instagram: optionalHttpUrl })
  .optional();

export const BoardAddSchema = z.object({
  period_id: z.string().trim().min(1, 'Periode wajib dipilih.'),
  division_code: divisionCode,
  full_name: z.string().trim().min(3, 'Nama minimal 3 karakter.').max(100),
  position_title: z.string().trim().min(2, 'Jabatan minimal 2 karakter.').max(80),
  order_index: z.number().int().min(0).max(999).optional(),
  photo_url: optionalImageRef,
  bio: z.string().trim().max(400).optional(),
  social_links: socialLinks,
});
export type BoardAddInput = z.infer<typeof BoardAddSchema>;

export const BoardUpdateSchema = z.object({
  full_name: z.string().trim().min(3, 'Nama minimal 3 karakter.').max(100).optional(),
  position_title: z.string().trim().min(2, 'Jabatan minimal 2 karakter.').max(80).optional(),
  order_index: z.number().int().min(0).max(999).optional(),
  photo_url: optionalImageRef,
  bio: z.string().trim().max(400).optional(),
  social_links: socialLinks,
  is_active: z.boolean().optional(),
});
export type BoardUpdateInput = z.infer<typeof BoardUpdateSchema>;

export const BoardMoveSchema = z.object({ direction: z.enum(['up', 'down']) });

export const DivisionHeadSchema = z.object({
  user_id: z.string().trim().min(1).nullable(),
});

// ------------------------------------------------------------------ Artikel

export const ARTICLE_CATEGORIES = [
  'Edukasi Dasar',
  'Analisis Emiten',
  'Berita GIBEI',
  'Opini Ekonomi',
] as const;
export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export const ARTICLE_MIN_CONTENT = 30;

export const ArticleInputSchema = z.object({
  title: z.string().trim().min(5, 'Judul minimal 5 karakter.').max(150, 'Judul maksimal 150 karakter.'),
  slug: z
    .union([
      z.literal(''),
      z
        .string()
        .trim()
        .max(100)
        .regex(SLUG_PATTERN, 'Slug hanya huruf kecil, angka, dan tanda hubung.'),
    ])
    .optional(),
  category: z.enum(ARTICLE_CATEGORIES, { message: 'Pilih kategori artikel.' }),
  tags: z
    .array(z.string().trim().min(1).max(30))
    .max(8, 'Maksimal 8 tagar.')
    .default([]),
  thumbnail_url: optionalImageRef,
  content: z.string().max(60000, 'Isi artikel terlalu panjang.').default(''),
  is_featured: z.boolean().optional(),
  action: z.enum(['draft', 'submit', 'publish']).default('draft'),
});
export type ArticleInput = z.infer<typeof ArticleInputSchema>;

export const ArticleReviewSchema = z
  .object({
    decision: z.enum(['publish', 'reject']),
    note: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.decision === 'publish' || (v.note && v.note.length >= 5), {
    message: 'Catatan revisi wajib diisi (minimal 5 karakter) saat menolak artikel.',
    path: ['note'],
  });
export type ArticleReviewInput = z.infer<typeof ArticleReviewSchema>;

// ------------------------------------------------------------------ Galeri

export const GalleryInputSchema = z.object({
  title: z.string().trim().min(4, 'Judul minimal 4 karakter.').max(120),
  caption: z.string().trim().max(600, 'Deskripsi maksimal 600 karakter.').default(''),
  image_urls: z
    .array(imageRefSchema)
    .min(1, 'Tambahkan minimal 1 foto.')
    .max(30, 'Maksimal 30 foto per album.'),
  period_id: z.string().trim().min(1, 'Periode wajib dipilih.'),
  division_code: divisionCode,
  activity_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal kegiatan wajib diisi.'),
});
export type GalleryInput = z.infer<typeof GalleryInputSchema>;

