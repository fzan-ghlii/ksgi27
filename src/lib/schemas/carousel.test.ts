import { describe, it, expect } from 'vitest';
import { HeroCarouselSlideSchema, HeroCarouselUpdateSchema } from './carousel';

const validSlide = {
  id: 'slide-1',
  image_url: '/api/images/img_123',
  alt_text: 'Kegiatan Pasar Modal GIBEI',
  caption: 'Suasana Edukasi Pasar Modal',
  width: 1920,
  height: 1080,
  is_active: true,
  created_at: '2026-11-13T00:00:00.000Z',
};

describe('HeroCarouselSlideSchema', () => {
  it('menerima foto berorientasi 16:9 / landscape', () => {
    expect(HeroCarouselSlideSchema.safeParse(validSlide).success).toBe(true);
    expect(
      HeroCarouselSlideSchema.safeParse({ ...validSlide, width: 1280, height: 800 }).success
    ).toBe(true);
    expect(
      HeroCarouselSlideSchema.safeParse({ ...validSlide, width: 1200, height: 900 }).success
    ).toBe(true);
  });

  it('menolak foto portrait atau persegi', () => {
    const portrait = HeroCarouselSlideSchema.safeParse({
      ...validSlide,
      width: 1080,
      height: 1920,
    });
    expect(portrait.success).toBe(false);

    const square = HeroCarouselSlideSchema.safeParse({
      ...validSlide,
      width: 1080,
      height: 1080,
    });
    expect(square.success).toBe(false);
  });
});

describe('HeroCarouselUpdateSchema', () => {
  it('menerima pengaturan carousel yang valid dan menolak interval di luar batas', () => {
    const ok = HeroCarouselUpdateSchema.safeParse({
      slides: [validSlide],
      autoplay_seconds: 6,
      blur_level: 'medium',
      overlay_opacity: 76,
    });
    expect(ok.success).toBe(true);

    const badInterval = HeroCarouselUpdateSchema.safeParse({
      slides: [validSlide],
      autoplay_seconds: 1,
      blur_level: 'medium',
      overlay_opacity: 76,
    });
    expect(badInterval.success).toBe(false);
  });
});

