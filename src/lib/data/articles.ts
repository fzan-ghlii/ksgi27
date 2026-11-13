import 'server-only';
import type { Query } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import type { Article, ArticleStatus, DivisionCode, UserProfile } from '@/types';
import { divisionDocId } from '@/lib/constants/divisions';
import {
  canDeleteArticle,
  canEditArticle,
  canPublishArticleDirectly,
  canReviewArticle,
  canSetArticleFeatured,
  canSubmitArticle,
  canUnpublishArticle,
  isKadivUp,
  isPresidiumUp,
} from '@/lib/auth/permissions';
import { ARTICLE_MIN_CONTENT, ArticleInput, ArticleReviewInput } from '@/lib/schemas/content';
import { readingMinutes, slugify } from '@/lib/utils/content';
import { badRequest, forbidden, notFound } from '@/lib/errors';
import { buildAudit } from '@/lib/data/audit';
import { invalidatePublicCache, revalidatePublicPaths } from '@/lib/data/public';
import { ensureUniqueSlug } from '@/lib/data/slug';

const col = () => adminDb.collection('articles');

function invalidateArticleCaches(slug?: string) {
  invalidatePublicCache('articles');
  revalidatePublicPaths(['/', '/artikel', ...(slug ? [`/artikel/${slug}`] : [])]);
}

const STATUS_FOR_ACTION: Record<ArticleInput['action'], ArticleStatus> = {
  draft: 'DRAFT',
  submit: 'PENDING_REVIEW',
  publish: 'PUBLISHED',
};

function authorDivision(actor: UserProfile): { code: DivisionCode; id: string } {
  const code: DivisionCode = actor.division_code ?? 'PRESIDIUM';
  return { code, id: actor.division_id ?? divisionDocId(actor.period_id ?? '', code) };
}

function assertReadyToSend(input: ArticleInput) {
  if (input.action === 'draft') return;
  if (input.content.trim().length < ARTICLE_MIN_CONTENT) {
    throw badRequest(`Isi artikel minimal ${ARTICLE_MIN_CONTENT} karakter sebelum dikirim atau diterbitkan.`);
  }
}

function byUpdatedDesc(a: Article, b: Article) {
  return b.updated_at.localeCompare(a.updated_at);
}

/** Daftar artikel yang boleh dilihat aktor di dashboard. */
export async function listArticlesForActor(actor: UserProfile): Promise<Article[]> {
  const toList = async (q: Query) => (await q.get()).docs.map((d) => d.data() as Article);

  if (isPresidiumUp(actor)) {
    return (await toList(col())).sort(byUpdatedDesc);
  }

  const own = await toList(col().where('author_id', '==', actor.uid));
  if (!isKadivUp(actor) || !actor.division_code) {
    return own.sort(byUpdatedDesc);
  }

  // Kadiv: miliknya + artikel divisinya yang sudah dikirim (draf anggota tidak terlihat).
  const division = await toList(col().where('division_code', '==', actor.division_code));
  const map = new Map<string, Article>();
  own.forEach((a) => map.set(a.id, a));
  division.filter((a) => a.status !== 'DRAFT').forEach((a) => map.set(a.id, a));
  return [...map.values()].sort(byUpdatedDesc);
}

/** Ambil artikel untuk diedit; null bila tidak ada atau aktor tidak berhak. */
export async function getArticleForEdit(actor: UserProfile, id: string): Promise<Article | null> {
  const snap = await col().doc(id).get();
  if (!snap.exists) return null;
  const art = snap.data() as Article;
  return canEditArticle(actor, art) ? art : null;
}

export async function createArticle(actor: UserProfile, input: ArticleInput): Promise<Article> {
  if (input.action === 'publish' && !canPublishArticleDirectly(actor)) {
    throw forbidden('Hanya Presidium dan Creator yang dapat menerbitkan langsung. Kirim untuk review.');
  }
  assertReadyToSend(input);

  const ref = col().doc();
  const now = new Date().toISOString();
  const status = STATUS_FOR_ACTION[input.action];
  const division = authorDivision(actor);
  const base = input.slug || slugify(input.title);

  const article = await adminDb.runTransaction(async (tx) => {
    const slug = await ensureUniqueSlug(col(), base, { tx });
    const data: Article = {
      id: ref.id,
      title: input.title,
      slug,
      thumbnail_url: input.thumbnail_url ?? '',
      content: input.content,
      category: input.category,
      tags: input.tags,
      author_id: actor.uid,
      author_name: actor.full_name,
      author_role: actor.role,
      author_position: actor.position_title ?? '',
      division_id: division.id,
      division_code: division.code,
      reviewer_id: status === 'PUBLISHED' ? actor.uid : null,
      review_note: null,
      status,
      is_featured: canSetArticleFeatured(actor) ? !!input.is_featured : false,
      reading_minutes: readingMinutes(input.content),
      view_count: 0,
      submitted_at: status === 'PENDING_REVIEW' ? now : null,
      published_at: status === 'PUBLISHED' ? now : null,
      created_at: now,
      updated_at: now,
    };
    tx.set(ref, data);

    const audit = buildAudit(actor, {
      action: status === 'PUBLISHED' ? 'PUBLISH' : 'CREATE',
      target_collection: 'articles',
      target_id: ref.id,
      summary:
        status === 'PUBLISHED'
          ? `Menerbitkan artikel "${data.title}"`
          : `Membuat artikel "${data.title}" (${status === 'DRAFT' ? 'Draft' : 'Pending Review'})`,
    });
    tx.set(audit.ref, audit.data);
    return data;
  });

  if (article.status === 'PUBLISHED') invalidateArticleCaches(article.slug);
  return article;
}

export async function updateArticle(actor: UserProfile, id: string, input: ArticleInput): Promise<Article> {
  assertReadyToSend(input);

  const updated = await adminDb.runTransaction(async (tx) => {
    const ref = col().doc(id);
    const snap = await tx.get(ref);
    if (!snap.exists) throw notFound('Artikel tidak ditemukan.');
    const art = snap.data() as Article;

    if (!canEditArticle(actor, art)) {
      throw forbidden('Anda hanya dapat mengubah artikel milik Anda yang belum terbit.');
    }
    if (input.action === 'publish' && !canPublishArticleDirectly(actor)) {
      throw forbidden('Hanya Presidium dan Creator yang dapat menerbitkan langsung.');
    }
    if (input.action === 'submit' && art.author_id !== actor.uid && !isPresidiumUp(actor)) {
      throw forbidden('Hanya penulis yang dapat mengirim artikel untuk review.');
    }

    const now = new Date().toISOString();
    const wasPublished = art.status === 'PUBLISHED';

    // Artikel yang sudah terbit tetap terbit saat diedit Presidium/Creator.
    let status: ArticleStatus = wasPublished ? 'PUBLISHED' : STATUS_FOR_ACTION[input.action];
    // Penulis mengedit artikel yang sedang menunggu review => kembali ke Draft agar tidak ada
    // perubahan yang lolos tanpa dilihat reviewer.
    if (!wasPublished && art.status === 'PENDING_REVIEW' && input.action === 'draft') status = 'DRAFT';

    const base = input.slug || art.slug;
    const slug = base === art.slug ? art.slug : await ensureUniqueSlug(col(), base, { tx, selfId: id });

    const patch: Partial<Article> & { updated_at: string } = {
      title: input.title,
      slug,
      thumbnail_url: input.thumbnail_url ?? '',
      content: input.content,
      category: input.category,
      tags: input.tags,
      reading_minutes: readingMinutes(input.content),
      status,
      updated_at: now,
    };
    if (canSetArticleFeatured(actor) && input.is_featured !== undefined) {
      patch.is_featured = input.is_featured;
    }
    if (status === 'PENDING_REVIEW' && art.status !== 'PENDING_REVIEW') {
      patch.submitted_at = now;
      patch.review_note = null;
    }
    if (status === 'PUBLISHED' && !wasPublished) {
      patch.published_at = now;
      patch.reviewer_id = actor.uid;
      patch.review_note = null;
    }

    tx.update(ref, patch);

    const becamePublished = status === 'PUBLISHED' && !wasPublished;
    const audit = buildAudit(actor, {
      action: becamePublished ? 'PUBLISH' : 'UPDATE',
      target_collection: 'articles',
      target_id: id,
      summary: becamePublished
        ? `Menerbitkan artikel "${input.title}"`
        : `Memperbarui artikel "${input.title}" (${status})`,
    });
    tx.set(audit.ref, audit.data);
    return { ...art, ...patch } as Article;
  });

  if (updated.status === 'PUBLISHED') invalidateArticleCaches(updated.slug);
  return updated;
}

/** Penulis mengirim draf yang sudah ada ke Pending Review. */
export async function submitArticle(actor: UserProfile, id: string): Promise<void> {
  await adminDb.runTransaction(async (tx) => {
    const ref = col().doc(id);
    const snap = await tx.get(ref);
    if (!snap.exists) throw notFound('Artikel tidak ditemukan.');
    const art = snap.data() as Article;

    if (!canSubmitArticle(actor, art)) {
      throw forbidden('Hanya penulis yang dapat mengirim artikel berstatus Draft atau Rejected.');
    }
    if (art.content.trim().length < ARTICLE_MIN_CONTENT) {
      throw badRequest(`Isi artikel minimal ${ARTICLE_MIN_CONTENT} karakter sebelum dikirim.`);
    }

    const now = new Date().toISOString();
    tx.update(ref, { status: 'PENDING_REVIEW', submitted_at: now, review_note: null, updated_at: now });
    const audit = buildAudit(actor, {
      action: 'UPDATE',
      target_collection: 'articles',
      target_id: id,
      summary: `Mengirim artikel "${art.title}" untuk review`,
    });
    tx.set(audit.ref, audit.data);
  });
}

/** Terbitkan atau tolak artikel yang menunggu review. */
export async function reviewArticle(
  actor: UserProfile,
  id: string,
  input: ArticleReviewInput
): Promise<void> {
  const publishedSlug = await adminDb.runTransaction(async (tx) => {
    const ref = col().doc(id);
    const snap = await tx.get(ref);
    if (!snap.exists) throw notFound('Artikel tidak ditemukan.');
    const art = snap.data() as Article;

    if (art.status !== 'PENDING_REVIEW') {
      throw badRequest('Artikel ini tidak sedang menunggu review.');
    }
    if (!canReviewArticle(actor, art)) {
      throw forbidden(
        art.author_role === 'admin_kadiv' || art.author_id === actor.uid
          ? 'Artikel milik Kadiv harus disetujui oleh Presidium.'
          : 'Anda hanya dapat mereview artikel anggota di divisi Anda.'
      );
    }

    const now = new Date().toISOString();
    const publish = input.decision === 'publish';
    tx.update(
      ref,
      publish
        ? {
            status: 'PUBLISHED',
            published_at: now,
            reviewer_id: actor.uid,
            review_note: input.note?.trim() || null,
            updated_at: now,
          }
        : {
            status: 'REJECTED',
            reviewer_id: actor.uid,
            review_note: input.note?.trim() ?? null,
            updated_at: now,
          }
    );

    const audit = buildAudit(actor, {
      action: publish ? 'PUBLISH' : 'REJECT',
      target_collection: 'articles',
      target_id: id,
      summary: publish
        ? `Menyetujui & menerbitkan artikel "${art.title}" karya ${art.author_name}`
        : `Menolak artikel "${art.title}" karya ${art.author_name}: ${input.note?.trim()}`,
    });
    tx.set(audit.ref, audit.data);
    return publish ? art.slug : null;
  });

  if (publishedSlug) invalidateArticleCaches(publishedSlug);
}

export async function unpublishArticle(actor: UserProfile, id: string): Promise<void> {
  if (!canUnpublishArticle(actor)) {
    throw forbidden('Hanya Presidium dan Creator yang dapat menarik publikasi artikel.');
  }
  const slug = await adminDb.runTransaction(async (tx) => {
    const ref = col().doc(id);
    const snap = await tx.get(ref);
    if (!snap.exists) throw notFound('Artikel tidak ditemukan.');
    const art = snap.data() as Article;
    if (art.status !== 'PUBLISHED') throw badRequest('Artikel ini belum terbit.');

    tx.update(ref, {
      status: 'DRAFT',
      published_at: null,
      is_featured: false,
      updated_at: new Date().toISOString(),
    });
    const audit = buildAudit(actor, {
      action: 'UNPUBLISH',
      target_collection: 'articles',
      target_id: id,
      summary: `Menarik publikasi artikel "${art.title}" (kembali ke Draft)`,
    });
    tx.set(audit.ref, audit.data);
    return art.slug;
  });

  invalidateArticleCaches(slug);
}

export async function deleteArticle(actor: UserProfile, id: string): Promise<void> {
  const deletedPublishedSlug = await adminDb.runTransaction(async (tx) => {
    const ref = col().doc(id);
    const snap = await tx.get(ref);
    if (!snap.exists) throw notFound('Artikel tidak ditemukan.');
    const art = snap.data() as Article;

    if (!canDeleteArticle(actor, art)) {
      throw forbidden('Anda hanya dapat menghapus artikel milik Anda yang belum terbit.');
    }

    tx.delete(ref);
    const audit = buildAudit(actor, {
      action: 'DELETE',
      target_collection: 'articles',
      target_id: id,
      summary: `Menghapus artikel "${art.title}" (${art.status}) karya ${art.author_name}`,
    });
    tx.set(audit.ref, audit.data);
    return art.status === 'PUBLISHED' ? art.slug : null;
  });

  if (deletedPublishedSlug) invalidateArticleCaches(deletedPublishedSlug);
}

