import { z } from 'zod';
import { imageRefSchema } from '@/lib/schemas/content';
import { isLandscapeAspect } from '@/lib/utils/image-converter';

const HERO_BLUR_LEVELS = ['soft', 'medium', 'strong'] as const;

export const HeroCarouselSlideSchema = z
  .object({
    id: z.string().trim().min(1, 'ID slide wajib diisi.').max(80),
    image_url: imageRefSchema,
    alt_text: z.string().trim().max(160).optional().default(''),
    caption: z.string().trim().max(120).optional().default(''),
    width: z.number().int().min(320, 'Lebar gambar minimal 320 px.').max(10000),
    height: z.number().int().min(180, 'Tinggi gambar minimal 180 px.').max(10000),
    is_active: z.boolean(),
    created_at: z.string().trim().min(1),
  })
  .refine((slide) => isLandscapeAspect(slide.width, slide.height), {
    message:
      'Foto carousel hanya diperbolehkan dengan orientasi landscape atau rasio 16:9 (lebar lebih besar dari tinggi).',
    path: ['width'],
  });

export const HeroCarouselUpdateSchema = z.object({
  slides: z
    .array(HeroCarouselSlideSchema)
    .max(12, 'Maksimal 12 foto pada carousel beranda.'),
  autoplay_seconds: z
    .number()
    .int('Interval harus bilangan bulat.')
    .min(3, 'Interval pergantian slide minimal 3 detik.')
    .max(15, 'Interval pergantian slide maksimal 15 detik.'),
  blur_level: z.enum(HERO_BLUR_LEVELS, {
    message: 'Tingkat blur harus soft, medium, atau strong.',
  }),
  overlay_opacity: z
    .number()
    .int('Opasitas overlay harus bilangan bulat.')
    .min(45, 'Opasitas lapisan overlay minimal 45%.')
    .max(92, 'Opasitas lapisan overlay maksimal 92%.'),
});

export type HeroCarouselUpdateInput = z.infer<typeof HeroCarouselUpdateSchema>;

