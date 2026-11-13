import 'server-only';
import { cache } from 'react';
import { revalidatePath } from 'next/cache';
import { adminDb, FieldValue } from '@/lib/firebase/admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import {
  BoardMember,
  Period,
  EventAndSpm,
  Article,
  Gallery,
  HeroCarouselConfig,
  Achievement,
} from '@/types';
import { OFFICIAL_DIVISIONS } from '@/lib/constants/divisions';
import { ORG_VISION, ORG_MISSIONS } from '@/lib/constants/identity';
import { withTimeout } from '@/lib/utils';

/**
 * In-memory TTL cache to eliminate redundant network roundtrips to Firestore.
 * Reduces subsequent render times from 500-1500ms down to ~0ms.
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const TTL_MS = 30 * 1000; // 30 seconds TTL
const memoryCache = new Map<string, CacheEntry<unknown>>();

function getFromCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setInCache<T>(key: string, data: T): T {
  memoryCache.set(key, { data, expiresAt: Date.now() + TTL_MS });
  return data;
}

const withSafetyTimeout = <T>(promise: Promise<T>): Promise<T> =>
  withTimeout(promise, 8000, 'FIRESTORE_TIMEOUT');

export type PublicCacheScope =
  | 'periods'
  | 'board'
  | 'events'
  | 'articles'
  | 'galleries'
  | 'carousel'
  | 'achievements'
  | 'all';

const CACHE_PREFIXES: Record<Exclude<PublicCacheScope, 'all'>, string[]> = {
  periods: ['public_periods'],
  board: ['public_board_'],
  events: ['public_events', 'public_event_'],
  articles: ['published_articles_', 'published_article_'],
  galleries: ['published_galleries_'],
  carousel: ['public_hero_carousel'],
  achievements: ['public_achievements'],
};

/** Hapus entri cache publik di memori agar mutasi dashboard segera terlihat. */
export function invalidatePublicCache(scope: PublicCacheScope = 'all') {
  if (scope === 'all') {
    memoryCache.clear();
    return;
  }
  const prefixes = CACHE_PREFIXES[scope];
  for (const key of memoryCache.keys()) {
    if (prefixes.some((p) => (p.endsWith('_') ? key.startsWith(p) : key === p))) {
      memoryCache.delete(key);
    }
  }
}

/** Revalidate route Next.js secara aman (aman dipanggil dari unit test Node). */
export function revalidatePublicPaths(paths: string[]) {
  try {
    for (const p of paths) revalidatePath(p);
  } catch {
    // Abaikan di luar runtime Next.js.
  }
}

const FALLBACK_PERIOD: Period = {
  id: '2026-2027',
  cabinet_name: 'Kabinet Sinergi Inklusif',
  year_range: '2026/2027',
  vision: ORG_VISION,
  missions: [...ORG_MISSIONS],
  is_current: true,
  created_at: '2026-01-01T00:00:00.000Z',
};

// ------------------------------------------------------------------ Periode & Divisi

/** Semua periode (aktif + arsip), terbaru dulu. */
export const getPublicPeriods = cache(async (): Promise<Period[]> => {
  const cacheKey = 'public_periods';
  const cached = getFromCache<Period[]>(cacheKey);
  if (cached) return cached;

  try {
    const snap = await withSafetyTimeout(adminDb.collection('periods').get());
    const list = snap.docs
      .map((d: QueryDocumentSnapshot) => d.data() as Period)
      .sort((a, b) => b.year_range.localeCompare(a.year_range));
    return setInCache(cacheKey, list.length > 0 ? list : [FALLBACK_PERIOD]);
  } catch {
    return [FALLBACK_PERIOD];
  }
});

/** Pengurus aktif satu periode, urut divisi lalu urutan tampil. */
export const getPublicBoardMembers = cache(async (periodId?: string): Promise<BoardMember[]> => {
  const cacheKey = `public_board_${periodId || 'all'}`;
  const cached = getFromCache<BoardMember[]>(cacheKey);
  if (cached) return cached;

  try {
    const col = adminDb.collection('board_members');
    const snap = await withSafetyTimeout((periodId ? col.where('period_id', '==', periodId) : col).get());
    const list = snap.docs
      .map((doc: QueryDocumentSnapshot) => doc.data() as BoardMember)
      .filter((m) => m.is_active !== false)
      .sort(
        (a, b) =>
          (OFFICIAL_DIVISIONS[a.division_code]?.order ?? 99) - (OFFICIAL_DIVISIONS[b.division_code]?.order ?? 99) ||
          a.order_index - b.order_index ||
          a.full_name.localeCompare(b.full_name)
      );
    return setInCache(cacheKey, list);
  } catch {
    return [];
  }
});

// ------------------------------------------------------------------ Event

export const getPublicEventsAndSpm = cache(async (): Promise<EventAndSpm[]> => {
  const cacheKey = 'public_events';
  const cached = getFromCache<EventAndSpm[]>(cacheKey);
  if (cached) return cached;

  try {
    const snap = await withSafetyTimeout(
      adminDb.collection('events').where('is_published', '==', true).get()
    );

    const list = snap.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      ...(doc.data() as Omit<EventAndSpm, 'id'>),
    }));

    const sorted = list.sort((a, b) => {
      const dateA = a.event_date || a.start_date || '';
      const dateB = b.event_date || b.start_date || '';
      return dateB.localeCompare(dateA);
    });

    return setInCache(cacheKey, sorted);
  } catch {
    return [];
  }
});

export const getPublicEventBySlug = cache(async (slug: string): Promise<EventAndSpm | null> => {
  const cacheKey = `public_event_${slug}`;
  const cached = getFromCache<EventAndSpm | null>(cacheKey);
  if (cached !== null) return cached;

  try {
    const snap = await withSafetyTimeout(
      adminDb
        .collection('events')
        .where('slug', '==', slug)
        .where('is_published', '==', true)
        .limit(1)
        .get()
    );

    if (!snap.empty) {
      const doc = snap.docs[0];
      const data = { id: doc.id, ...(doc.data() as Omit<EventAndSpm, 'id'>) };
      return setInCache(cacheKey, data);
    }

    // Direct ID check (tetap wajib terbit agar draft tidak bocor lewat URL ID)
    const docSnap = await withSafetyTimeout(adminDb.collection('events').doc(slug).get());
    if (docSnap.exists) {
      const raw = docSnap.data() as Omit<EventAndSpm, 'id'>;
      if (raw.is_published) {
        const data = { id: docSnap.id, ...raw };
        return setInCache(cacheKey, data);
      }
    }

    return null;
  } catch {
    return null;
  }
});

// ------------------------------------------------------------------ Artikel

/** Artikel berstatus PUBLISHED, terbaru dulu. */
export const getPublishedArticles = cache(async (limit?: number): Promise<Article[]> => {
  const cacheKey = `published_articles_${limit || 'all'}`;
  const cached = getFromCache<Article[]>(cacheKey);
  if (cached) return cached;

  try {
    const snap = await withSafetyTimeout(
      adminDb.collection('articles').where('status', '==', 'PUBLISHED').get()
    );
    const list = snap.docs
      .map((doc: QueryDocumentSnapshot) => doc.data() as Article)
      .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''));
    const result = limit ? list.slice(0, limit) : list;
    return setInCache(cacheKey, result);
  } catch {
    return [];
  }
});

export const getPublishedArticleBySlug = cache(async (slug: string): Promise<Article | null> => {
  const cacheKey = `published_article_${slug}`;
  const cached = getFromCache<Article | null>(cacheKey);
  if (cached !== null) return cached;

  try {
    const snap = await withSafetyTimeout(
      adminDb.collection('articles').where('slug', '==', slug).where('status', '==', 'PUBLISHED').limit(1).get()
    );
    if (snap.empty) return null;
    const data = snap.docs[0].data() as Article;
    return setInCache(cacheKey, data);
  } catch {
    return null;
  }
});

/** Artikel terkait: kategori sama dulu, lalu dilengkapi artikel terbaru lainnya. */
export const getRelatedArticles = cache(async (article: Article, count = 3): Promise<Article[]> => {
  const all = (await getPublishedArticles()).filter((a) => a.id !== article.id);
  const sameCategory = all.filter((a) => a.category === article.category);
  const others = all.filter((a) => a.category !== article.category);
  return [...sameCategory, ...others].slice(0, count);
});

export async function incrementArticleView(slug: string): Promise<boolean> {
  const snap = await adminDb
    .collection('articles')
    .where('slug', '==', slug)
    .where('status', '==', 'PUBLISHED')
    .limit(1)
    .get();
  if (snap.empty) return false;
  await snap.docs[0].ref.update({ view_count: FieldValue.increment(1) });
  return true;
}

// ------------------------------------------------------------------ Galeri

/** Album berstatus PUBLISHED, tanggal kegiatan terbaru dulu. */
export const getPublishedGalleries = cache(async (limit?: number): Promise<Gallery[]> => {
  const cacheKey = `published_galleries_${limit || 'all'}`;
  const cached = getFromCache<Gallery[]>(cacheKey);
  if (cached) return cached;

  try {
    const snap = await withSafetyTimeout(
      adminDb.collection('galleries').where('status', '==', 'PUBLISHED').get()
    );
    const list = snap.docs
      .map((doc: QueryDocumentSnapshot) => doc.data() as Gallery)
      .sort(
        (a, b) =>
          b.activity_date.localeCompare(a.activity_date) || b.created_at.localeCompare(a.created_at)
      );
    const result = limit ? list.slice(0, limit) : list;
    return setInCache(cacheKey, result);
  } catch {
    return [];
  }
});

// ------------------------------------------------------------------ Hero Carousel Beranda

const HERO_CAROUSEL_CACHE_KEY = 'public_hero_carousel';

export const getPublicHeroCarousel = cache(async (): Promise<HeroCarouselConfig> => {
  const cached = getFromCache<HeroCarouselConfig>(HERO_CAROUSEL_CACHE_KEY);
  if (cached) return cached;

  const fallback: HeroCarouselConfig = {
    slides: [],
    autoplay_seconds: 6,
    blur_level: 'medium',
    overlay_opacity: 76,
    updated_at: '',
    updated_by: '',
  };

  try {
    const doc = await withSafetyTimeout(
      adminDb.collection('site_settings').doc('hero_carousel').get()
    );
    if (!doc.exists) return setInCache(HERO_CAROUSEL_CACHE_KEY, fallback);
    const data = doc.data() as Partial<HeroCarouselConfig>;
    const activeSlides = Array.isArray(data.slides)
      ? data.slides.filter((s) => s.is_active !== false && Boolean(s.image_url))
      : [];
    const result: HeroCarouselConfig = {
      slides: activeSlides,
      autoplay_seconds: typeof data.autoplay_seconds === 'number' ? data.autoplay_seconds : 6,
      blur_level: data.blur_level ?? 'medium',
      overlay_opacity: typeof data.overlay_opacity === 'number' ? data.overlay_opacity : 76,
      updated_at: data.updated_at ?? '',
      updated_by: data.updated_by ?? '',
      updated_by_name: data.updated_by_name,
    };
    return setInCache(HERO_CAROUSEL_CACHE_KEY, result);
  } catch {
    return fallback;
  }
});

// ------------------------------------------------------------------ Prestasi GIBEI UNIMED

/** Daftar prestasi GIBEI UNIMED untuk halaman /tentang, urut tahun terbaru. */
export const getPublicAchievements = cache(async (): Promise<Achievement[]> => {
  const cacheKey = 'public_achievements';
  const cached = getFromCache<Achievement[]>(cacheKey);
  if (cached) return cached;

  try {
    const snap = await withSafetyTimeout(adminDb.collection('achievements').get());
    const list = snap.docs
      .map((doc: QueryDocumentSnapshot) => doc.data() as Achievement)
      .sort((a, b) => b.year - a.year || b.created_at.localeCompare(a.created_at));
    return setInCache(cacheKey, list);
  } catch {
    return [];
  }
});
