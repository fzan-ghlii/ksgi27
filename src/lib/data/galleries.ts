import 'server-only';
import type { Query } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import type { Gallery, GalleryStatus, Period, UserProfile } from '@/types';
import { divisionDocId } from '@/lib/constants/divisions';
import {
  canApproveGallery,
  canDeleteGallery,
  canEditGallery,
  isKadivUp,
  isPresidiumUp,
} from '@/lib/auth/permissions';
import { GalleryInput } from '@/lib/schemas/content';
import { badRequest, forbidden, notFound } from '@/lib/errors';
import { buildAudit } from '@/lib/data/audit';

const col = () => adminDb.collection('galleries');

const byDateDesc = (a: Gallery, b: Gallery) =>
  b.activity_date.localeCompare(a.activity_date) || b.created_at.localeCompare(a.created_at);

/** Album yang boleh dilihat aktor di dashboard. */
export async function listGalleriesForActor(actor: UserProfile): Promise<Gallery[]> {
  const toList = async (q: Query) => (await q.get()).docs.map((d) => d.data() as Gallery);

  if (isPresidiumUp(actor)) return (await toList(col())).sort(byDateDesc);

  const own = await toList(col().where('uploaded_by', '==', actor.uid));
  if (!isKadivUp(actor)) return own.sort(byDateDesc);

  // Kadiv MEDIA melihat semua; Kadiv lain hanya divisinya.
  const scope =
    actor.division_code === 'MEDIA'
      ? await toList(col())
      : actor.division_code
        ? await toList(col().where('division_code', '==', actor.division_code))
        : [];

  const map = new Map<string, Gallery>();
  [...own, ...scope].forEach((g) => map.set(g.id, g));
  return [...map.values()].sort(byDateDesc);
}

async function assertPeriodExists(periodId: string) {
  const snap = await adminDb.collection('periods').doc(periodId).get();
  if (!snap.exists) throw badRequest('Periode yang dipilih tidak ditemukan.');
  return snap.data() as Period;
}

export async function createGallery(actor: UserProfile, input: GalleryInput): Promise<Gallery> {
  await assertPeriodExists(input.period_id);

  const ref = col().doc();
  const now = new Date().toISOString();
  const status: GalleryStatus = canApproveGallery(actor, input.division_code) ? 'PUBLISHED' : 'PENDING';

  const gallery: Gallery = {
    id: ref.id,
    title: input.title,
    caption: input.caption,
    image_urls: input.image_urls,
    period_id: input.period_id,
    division_id: divisionDocId(input.period_id, input.division_code),
    division_code: input.division_code,
    event_id: null,
    uploaded_by: actor.uid,
    uploader_name: actor.full_name,
    status,
    activity_date: input.activity_date,
    published_at: status === 'PUBLISHED' ? now : null,
    approved_by: status === 'PUBLISHED' ? actor.uid : null,
    created_at: now,
    updated_at: now,
  };

  const batch = adminDb.batch();
  batch.set(ref, gallery);
  const audit = buildAudit(actor, {
    action: status === 'PUBLISHED' ? 'PUBLISH' : 'CREATE',
    target_collection: 'galleries',
    target_id: ref.id,
    summary:
      status === 'PUBLISHED'
        ? `Menerbitkan album "${gallery.title}" (${gallery.division_code}, ${gallery.image_urls.length} foto)`
        : `Mengunggah album "${gallery.title}" (${gallery.division_code}) menunggu persetujuan`,
  });
  batch.set(audit.ref, audit.data);
  await batch.commit();
  return gallery;
}

export async function updateGallery(actor: UserProfile, id: string, input: GalleryInput): Promise<void> {
  await assertPeriodExists(input.period_id);

  const ref = col().doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw notFound('Album tidak ditemukan.');
  const g = snap.data() as Gallery;

  if (!canEditGallery(actor, g)) {
    throw forbidden('Anda hanya dapat mengubah album milik Anda yang masih menunggu persetujuan.');
  }

  // Jika aktor tidak berwenang menyetujui divisi tujuan, album kembali ke Pending.
  const canKeepPublished = canApproveGallery(actor, input.division_code);
  const status: GalleryStatus = canKeepPublished ? g.status : 'PENDING';

  const patch: Record<string, unknown> = {
    title: input.title,
    caption: input.caption,
    image_urls: input.image_urls,
    period_id: input.period_id,
    division_id: divisionDocId(input.period_id, input.division_code),
    division_code: input.division_code,
    activity_date: input.activity_date,
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === 'PENDING' && g.status === 'PUBLISHED') {
    patch.published_at = null;
    patch.approved_by = null;
  }

  const batch = adminDb.batch();
  batch.update(ref, patch);
  const audit = buildAudit(actor, {
    action: 'UPDATE',
    target_collection: 'galleries',
    target_id: id,
    summary: `Memperbarui album "${input.title}" (${input.division_code}, ${status})`,
  });
  batch.set(audit.ref, audit.data);
  await batch.commit();
}

export async function approveGallery(actor: UserProfile, id: string): Promise<void> {
  const ref = col().doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw notFound('Album tidak ditemukan.');
  const g = snap.data() as Gallery;

  if (!canApproveGallery(actor, g.division_code)) {
    throw forbidden('Anda tidak berwenang menyetujui album dari divisi ini.');
  }
  if (g.status === 'PUBLISHED') throw badRequest('Album ini sudah terbit.');

  const now = new Date().toISOString();
  const batch = adminDb.batch();
  batch.update(ref, { status: 'PUBLISHED', published_at: now, approved_by: actor.uid, updated_at: now });
  const audit = buildAudit(actor, {
    action: 'PUBLISH',
    target_collection: 'galleries',
    target_id: id,
    summary: `Menyetujui album "${g.title}" (${g.division_code}) unggahan ${g.uploader_name ?? g.uploaded_by}`,
  });
  batch.set(audit.ref, audit.data);
  await batch.commit();
}

export async function unpublishGallery(actor: UserProfile, id: string): Promise<void> {
  const ref = col().doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw notFound('Album tidak ditemukan.');
  const g = snap.data() as Gallery;

  if (!canApproveGallery(actor, g.division_code)) {
    throw forbidden('Anda tidak berwenang menarik album dari divisi ini.');
  }
  if (g.status !== 'PUBLISHED') throw badRequest('Album ini belum terbit.');

  const batch = adminDb.batch();
  batch.update(ref, {
    status: 'PENDING',
    published_at: null,
    approved_by: null,
    updated_at: new Date().toISOString(),
  });
  const audit = buildAudit(actor, {
    action: 'UNPUBLISH',
    target_collection: 'galleries',
    target_id: id,
    summary: `Menarik album "${g.title}" (${g.division_code}) kembali ke Pending`,
  });
  batch.set(audit.ref, audit.data);
  await batch.commit();
}

export async function deleteGallery(actor: UserProfile, id: string): Promise<void> {
  const ref = col().doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw notFound('Album tidak ditemukan.');
  const g = snap.data() as Gallery;

  if (!canDeleteGallery(actor, g)) {
    throw forbidden('Hanya Presidium dan Creator yang dapat menghapus album yang sudah terbit.');
  }

  const batch = adminDb.batch();
  batch.delete(ref);
  const audit = buildAudit(actor, {
    action: 'DELETE',
    target_collection: 'galleries',
    target_id: id,
    summary: `Menghapus album "${g.title}" (${g.division_code}, ${g.status})`,
  });
  batch.set(audit.ref, audit.data);
  await batch.commit();
}

