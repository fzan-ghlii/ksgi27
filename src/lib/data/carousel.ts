import 'server-only';
import { adminDb } from '@/lib/firebase/admin';
import type { HeroCarouselConfig, UserProfile } from '@/types';
import { canManageHeroCarousel } from '@/lib/auth/permissions';
import { HeroCarouselUpdateInput } from '@/lib/schemas/carousel';
import { forbidden } from '@/lib/errors';
import { buildAudit } from '@/lib/data/audit';
import { invalidatePublicCache, revalidatePublicPaths } from '@/lib/data/public';

const docRef = () => adminDb.collection('site_settings').doc('hero_carousel');

const DEFAULT_HERO_CAROUSEL_CONFIG: HeroCarouselConfig = {
  slides: [],
  autoplay_seconds: 6,
  blur_level: 'medium',
  overlay_opacity: 76,
  updated_at: '',
  updated_by: '',
};

/** Membaca konfigurasi lengkap carousel hero (termasuk slide nonaktif) untuk Presidium. */
export async function getHeroCarouselConfig(): Promise<HeroCarouselConfig> {
  const snap = await docRef().get();
  if (!snap.exists) return DEFAULT_HERO_CAROUSEL_CONFIG;
  const data = snap.data() as Partial<HeroCarouselConfig>;
  return {
    slides: Array.isArray(data.slides) ? data.slides : [],
    autoplay_seconds:
      typeof data.autoplay_seconds === 'number'
        ? data.autoplay_seconds
        : DEFAULT_HERO_CAROUSEL_CONFIG.autoplay_seconds,
    blur_level: data.blur_level ?? DEFAULT_HERO_CAROUSEL_CONFIG.blur_level,
    overlay_opacity:
      typeof data.overlay_opacity === 'number'
        ? data.overlay_opacity
        : DEFAULT_HERO_CAROUSEL_CONFIG.overlay_opacity,
    updated_at: data.updated_at ?? '',
    updated_by: data.updated_by ?? '',
    updated_by_name: data.updated_by_name,
  };
}

/** Menyimpan perubahan carousel hero beranda (hanya Presidium). */
export async function updateHeroCarouselConfig(
  actor: UserProfile,
  input: HeroCarouselUpdateInput
): Promise<HeroCarouselConfig> {
  if (!canManageHeroCarousel(actor)) {
    throw forbidden('Hanya Presidium yang dapat mengatur carousel hero beranda.');
  }

  const now = new Date().toISOString();
  const nextConfig: HeroCarouselConfig = {
    slides: input.slides,
    autoplay_seconds: input.autoplay_seconds,
    blur_level: input.blur_level,
    overlay_opacity: input.overlay_opacity,
    updated_at: now,
    updated_by: actor.uid,
    updated_by_name: actor.full_name,
  };

  const batch = adminDb.batch();
  batch.set(docRef(), nextConfig);
  const audit = buildAudit(actor, {
    action: 'UPDATE',
    target_collection: 'site_settings',
    target_id: 'hero_carousel',
    summary: `Memperbarui carousel hero beranda (${input.slides.length} slide, blur ${input.blur_level}, interval ${input.autoplay_seconds} dtk)`,
  });
  batch.set(audit.ref, audit.data);
  await batch.commit();

  invalidatePublicCache('carousel');
  revalidatePublicPaths(['/']);

  return nextConfig;
}

