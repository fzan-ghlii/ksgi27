import 'server-only';
import { cache } from 'react';
import { adminDb, FieldValue } from '@/lib/firebase/admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { BoardMember, Period, Division, EventAndSpm, Article, Gallery } from '@/types';
import { OFFICIAL_DIVISIONS } from '@/lib/constants/divisions';

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

/**
 * Safety timeout: generous 8 seconds to prevent hanging during server start / network jitter,
 * without prematurely aborting normal cold gRPC handshakes.
 */
async function withSafetyTimeout<T>(promise: Promise<T>, ms: number = 8000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error('FIRESTORE_TIMEOUT')), ms);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise,
  ]);
}

const FALLBACK_PERIOD: Period = {
  id: '2026-2027',
  cabinet_name: 'Kabinet Sinergi Inklusif',
  year_range: '2026/2027',
  vision:
    'Menjadikan GIBEI UNIMED sebagai episentrum literasi dan inklusi pasar modal unggulan yang kredibel, adaptif, dan berdaya saing global.',
  missions: [
    'Mengakselerasi literasi keuangan dan pasar modal bagi civitas akademika dan masyarakat umum.',
    'Meningkatkan partisipasi aktif mahasiswa dalam Sekolah Pasar Modal (SPM) dan kompetisi investasi nasional.',
    'Membangun budaya riset pasar modal yang analitis, independen, dan berintegritas tinggi.',
    'Mengembangkan sistem tata kelola organisasi yang transparan, modern, dan berbasis teknologi digital.',
  ],
  is_current: true,
  created_at: '2026-01-01T00:00:00.000Z',
};

// ------------------------------------------------------------------ Periode & Divisi

export const getCurrentPeriod = cache(async (): Promise<Period | null> => {
  const cacheKey = 'current_period';
  const cached = getFromCache<Period | null>(cacheKey);
  if (cached !== null) return cached;

  try {
    const snap = await withSafetyTimeout(
      adminDb.collection('periods').where('is_current', '==', true).limit(1).get()
    );
    if (!snap.empty) {
      return setInCache(cacheKey, snap.docs[0].data() as Period);
    }

    // Fallback: take any available period
    const anySnap = await withSafetyTimeout(adminDb.collection('periods').limit(1).get());
    if (!anySnap.empty) {
      return setInCache(cacheKey, anySnap.docs[0].data() as Period);
    }
    return setInCache(cacheKey, FALLBACK_PERIOD);
  } catch {
    return FALLBACK_PERIOD;
  }
});

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

export const getPublicDivisions = cache(async (periodId?: string): Promise<Division[]> => {
  const cacheKey = `public_divisions_${periodId || 'all'}`;
  const cached = getFromCache<Division[]>(cacheKey);
  if (cached) return cached;

  try {
    const col = adminDb.collection('divisions');
    const snap = await withSafetyTimeout((periodId ? col.where('period_id', '==', periodId) : col).get());
    const list = snap.docs
      .map((doc: QueryDocumentSnapshot) => doc.data() as Division)
      .sort((a, b) => a.order_index - b.order_index);

    if (list.length > 0) {
      return setInCache(cacheKey, list);
    }

    // Fallback static official divisions if empty
    return Object.values(OFFICIAL_DIVISIONS).map((m) => ({
      id: `2026-2027_${m.code.toLowerCase()}`,
      period_id: '2026-2027',
      code: m.code,
      name: m.name,
      slug: m.slug,
      description: m.shortDesc,
      head_user_id: null,
      order_index: m.order,
    }));
  } catch {
    return Object.values(OFFICIAL_DIVISIONS).map((m) => ({
      id: `2026-2027_${m.code.toLowerCase()}`,
      period_id: '2026-2027',
      code: m.code,
      name: m.name,
      slug: m.slug,
      description: m.shortDesc,
      head_user_id: null,
      order_index: m.order,
    }));
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

    let list = snap.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      ...(doc.data() as Omit<EventAndSpm, 'id'>),
    }));

    if (list.length === 0) {
      const fallbackSnap = await withSafetyTimeout(
        adminDb.collection('events_and_spm').limit(10).get()
      );
      list = fallbackSnap.docs.map((doc: QueryDocumentSnapshot) => ({
        id: doc.id,
        ...(doc.data() as Omit<EventAndSpm, 'id'>),
      }));
    }

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

    // Direct ID check
    const docSnap = await withSafetyTimeout(adminDb.collection('events').doc(slug).get());
    if (docSnap.exists) {
      const data = { id: docSnap.id, ...(docSnap.data() as Omit<EventAndSpm, 'id'>) };
      return setInCache(cacheKey, data);
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
