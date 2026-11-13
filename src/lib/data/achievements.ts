import 'server-only';
import { adminDb } from '@/lib/firebase/admin';
import type { Achievement, UserProfile } from '@/types';
import type { AchievementInput } from '@/lib/schemas/achievement';
import { canManageAchievements } from '@/lib/auth/permissions';
import { buildAudit } from '@/lib/data/audit';
import { invalidatePublicCache, revalidatePublicPaths } from '@/lib/data/public';
import { badRequest, forbidden, notFound } from '@/lib/errors';
import { isSafeDocId } from '@/lib/security/guards';

const col = () => adminDb.collection('achievements');

const byYearDesc = (a: Achievement, b: Achievement) =>
  b.year - a.year || b.created_at.localeCompare(a.created_at);

function invalidateAchievementCaches() {
  invalidatePublicCache('achievements');
  revalidatePublicPaths(['/tentang']);
}

function assertPresidium(actor: UserProfile) {
  if (!canManageAchievements(actor)) {
    throw forbidden('Hanya Presidium yang dapat mengelola daftar prestasi GIBEI UNIMED.');
  }
}

export async function listAchievements(): Promise<Achievement[]> {
  const snap = await col().get();
  return snap.docs.map((d) => d.data() as Achievement).sort(byYearDesc);
}

export async function createAchievement(
  actor: UserProfile,
  input: AchievementInput
): Promise<Achievement> {
  assertPresidium(actor);

  const ref = col().doc();
  const now = new Date().toISOString();
  const item: Achievement = {
    id: ref.id,
    title: input.title,
    level: input.level,
    year: input.year,
    organizer: input.organizer,
    category: input.category || '',
    description: input.description || '',
    image_url: input.image_url || '',
    created_by: actor.uid,
    created_by_name: actor.full_name,
    created_at: now,
    updated_at: now,
  };

  const batch = adminDb.batch();
  batch.set(ref, item);
  const audit = buildAudit(actor, {
    action: 'CREATE',
    target_collection: 'achievements',
    target_id: ref.id,
    summary: `Menambah prestasi "${item.title}" (${item.level}, ${item.year})`,
  });
  batch.set(audit.ref, audit.data);
  await batch.commit();

  invalidateAchievementCaches();
  return item;
}

export async function updateAchievement(
  actor: UserProfile,
  id: string,
  input: AchievementInput
): Promise<Achievement> {
  assertPresidium(actor);
  if (!isSafeDocId(id)) throw badRequest('ID prestasi tidak valid.');

  const ref = col().doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw notFound('Data prestasi tidak ditemukan.');
  const existing = snap.data() as Achievement;

  const patch: Partial<Achievement> = {
    title: input.title,
    level: input.level,
    year: input.year,
    organizer: input.organizer,
    category: input.category || '',
    description: input.description || '',
    image_url: input.image_url || '',
    updated_at: new Date().toISOString(),
  };

  const batch = adminDb.batch();
  batch.update(ref, patch);
  const audit = buildAudit(actor, {
    action: 'UPDATE',
    target_collection: 'achievements',
    target_id: id,
    summary: `Memperbarui prestasi "${patch.title}" (${patch.level}, ${patch.year})`,
  });
  batch.set(audit.ref, audit.data);
  await batch.commit();

  invalidateAchievementCaches();
  return { ...existing, ...patch };
}

export async function deleteAchievement(actor: UserProfile, id: string): Promise<void> {
  assertPresidium(actor);
  if (!isSafeDocId(id)) throw badRequest('ID prestasi tidak valid.');

  const ref = col().doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw notFound('Data prestasi tidak ditemukan.');
  const existing = snap.data() as Achievement;

  const batch = adminDb.batch();
  batch.delete(ref);
  const audit = buildAudit(actor, {
    action: 'DELETE',
    target_collection: 'achievements',
    target_id: id,
    summary: `Menghapus prestasi "${existing.title}" (${existing.year})`,
  });
  batch.set(audit.ref, audit.data);
  await batch.commit();

  invalidateAchievementCaches();
}

