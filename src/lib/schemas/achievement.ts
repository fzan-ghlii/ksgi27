import { z } from 'zod';
import { optionalImageRef } from '@/lib/schemas/content';

export const ACHIEVEMENT_LEVELS = [
  'Internasional',
  'Nasional',
  'Regional',
  'Universitas',
  'Fakultas',
] as const;

export type AchievementLevel = (typeof ACHIEVEMENT_LEVELS)[number];

export const AchievementInputSchema = z.object({
  title: z.string().trim().min(4, 'Judul prestasi minimal 4 karakter.').max(160),
  level: z.enum(ACHIEVEMENT_LEVELS, { message: 'Tingkat prestasi tidak valid.' }),
  year: z.coerce
    .number()
    .int('Tahun harus berupa angka bulat.')
    .min(2010, 'Tahun minimal 2010.')
    .max(2100, 'Tahun tidak valid.'),
  organizer: z.string().trim().min(2, 'Penyelenggara minimal 2 karakter.').max(140),
  category: z.string().trim().max(80).optional().default(''),
  description: z.string().trim().max(600).optional().default(''),
  image_url: optionalImageRef,
});

export type AchievementInput = z.infer<typeof AchievementInputSchema>;

