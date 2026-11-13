import 'server-only';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { BoardMember, Division, UserProfile } from '@/types';
import { OFFICIAL_DIVISIONS, divisionDocId } from '@/lib/constants/divisions';
import { canEditBoardMember, canManageBoardStructure } from '@/lib/auth/permissions';
import { BoardAddInput, BoardUpdateInput } from '@/lib/schemas/content';
import { badRequest, forbidden, notFound } from '@/lib/errors';
import { buildAudit } from '@/lib/data/audit';
import { invalidatePublicCache, revalidatePublicPaths } from '@/lib/data/public';

function invalidateBoardCaches(withDivisions = false) {
  invalidatePublicCache('board');
  if (withDivisions) invalidatePublicCache('periods');
  revalidatePublicPaths(['/', '/struktur']);
}

const MANAGE_ERR = 'Hanya Presidium dan Creator yang dapat mengubah struktur pengurus.';

function sortMembers(list: BoardMember[]): BoardMember[] {
  return list.sort(
    (a, b) =>
      (OFFICIAL_DIVISIONS[a.division_code]?.order ?? 99) - (OFFICIAL_DIVISIONS[b.division_code]?.order ?? 99) ||
      a.order_index - b.order_index ||
      a.full_name.localeCompare(b.full_name)
  );
}

/** Semua pengurus satu periode, termasuk yang nonaktif (untuk dashboard). */
export async function listBoardMembers(periodId: string): Promise<BoardMember[]> {
  const snap = await adminDb.collection('board_members').where('period_id', '==', periodId).get();
  return sortMembers(snap.docs.map((d) => d.data() as BoardMember));
}

async function nextOrderIndex(periodId: string, divisionCode: string): Promise<number> {
  const snap = await adminDb
    .collection('board_members')
    .where('period_id', '==', periodId)
    .where('division_code', '==', divisionCode)
    .get();
  if (snap.empty) return 0;
  return Math.max(...snap.docs.map((d) => (d.data() as BoardMember).order_index ?? 0)) + 1;
}

export async function addBoardMember(actor: UserProfile, input: BoardAddInput): Promise<BoardMember> {
  if (!canManageBoardStructure(actor)) throw forbidden(MANAGE_ERR);

  const divisionId = divisionDocId(input.period_id, input.division_code);
  const divSnap = await adminDb.collection('divisions').doc(divisionId).get();
  if (!divSnap.exists) throw notFound('Divisi pada periode tersebut tidak ditemukan.');

  const ref = adminDb.collection('board_members').doc();
  const now = new Date().toISOString();
  const member: BoardMember = {
    id: ref.id,
    period_id: input.period_id,
    division_id: divisionId,
    division_code: input.division_code,
    user_id: '',
    full_name: input.full_name,
    position_title: input.position_title,
    order_index: input.order_index ?? (await nextOrderIndex(input.period_id, input.division_code)),
    photo_url: input.photo_url ?? '',
    bio: input.bio ?? '',
    social_links: {
      linkedin: input.social_links?.linkedin ?? '',
      instagram: input.social_links?.instagram ?? '',
    },
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  const batch = adminDb.batch();
  batch.set(ref, member);
  const audit = buildAudit(actor, {
    action: 'CREATE',
    target_collection: 'board_members',
    target_id: ref.id,
    summary: `Menambah pengurus "${member.full_name}" (${member.position_title} - ${member.division_code}) periode ${member.period_id}`,
  });
  batch.set(audit.ref, audit.data);
  await batch.commit();
  invalidateBoardCaches();
  return member;
}

export async function updateBoardMember(
  actor: UserProfile,
  id: string,
  input: BoardUpdateInput
): Promise<void> {
  const ref = adminDb.collection('board_members').doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw notFound('Data pengurus tidak ditemukan.');
  const member = snap.data() as BoardMember;

  if (!canEditBoardMember(actor, member.division_code)) {
    throw forbidden('Anda hanya dapat mengubah pengurus di divisi Anda.');
  }
  // Nama & status aktif adalah wewenang struktur (Presidium/Creator).
  if ((input.full_name !== undefined || input.is_active !== undefined) && !canManageBoardStructure(actor)) {
    throw forbidden('Mengubah nama atau status aktif pengurus hanya untuk Presidium dan Creator.');
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.full_name !== undefined) patch.full_name = input.full_name;
  if (input.position_title !== undefined) patch.position_title = input.position_title;
  if (input.order_index !== undefined) patch.order_index = input.order_index;
  if (input.photo_url !== undefined) patch.photo_url = input.photo_url;
  if (input.bio !== undefined) patch.bio = input.bio;
  if (input.is_active !== undefined) patch.is_active = input.is_active;
  if (input.social_links !== undefined) {
    patch.social_links = {
      linkedin: input.social_links.linkedin ?? '',
      instagram: input.social_links.instagram ?? '',
    };
  }

  const batch = adminDb.batch();
  batch.update(ref, patch);

  // Sinkronkan profil akun bila pengurus ini punya akun.
  if (member.user_id && (input.full_name !== undefined || input.position_title !== undefined || input.photo_url !== undefined)) {
    const userRef = adminDb.collection('users').doc(member.user_id);
    if ((await userRef.get()).exists) {
      const userPatch: Record<string, unknown> = {};
      if (input.full_name !== undefined) userPatch.full_name = input.full_name;
      if (input.position_title !== undefined) userPatch.position_title = input.position_title;
      if (input.photo_url !== undefined) userPatch.avatar_url = input.photo_url;
      batch.update(userRef, userPatch);
    }
  }

  const audit = buildAudit(actor, {
    action: 'UPDATE',
    target_collection: 'board_members',
    target_id: id,
    summary:
      input.is_active !== undefined && Object.keys(patch).length === 2
        ? `${input.is_active ? 'Mengaktifkan' : 'Menonaktifkan'} pengurus "${member.full_name}"`
        : `Memperbarui data pengurus "${input.full_name ?? member.full_name}" (${member.division_code})`,
  });
  batch.set(audit.ref, audit.data);
  await batch.commit();
  invalidateBoardCaches();
}

/** Geser urutan tampil satu langkah dalam divisi yang sama. */
export async function moveBoardMember(
  actor: UserProfile,
  id: string,
  direction: 'up' | 'down'
): Promise<void> {
  const snap = await adminDb.collection('board_members').doc(id).get();
  if (!snap.exists) throw notFound('Data pengurus tidak ditemukan.');
  const member = snap.data() as BoardMember;
  if (!canEditBoardMember(actor, member.division_code)) {
    throw forbidden('Anda hanya dapat mengatur urutan pengurus di divisi Anda.');
  }

  const siblingsSnap = await adminDb
    .collection('board_members')
    .where('period_id', '==', member.period_id)
    .where('division_code', '==', member.division_code)
    .get();
  const siblings = siblingsSnap.docs
    .map((d) => d.data() as BoardMember)
    .sort((a, b) => a.order_index - b.order_index || a.full_name.localeCompare(b.full_name));

  const idx = siblings.findIndex((s) => s.id === id);
  const target = direction === 'up' ? idx - 1 : idx + 1;
  if (idx < 0 || target < 0 || target >= siblings.length) return; // sudah di ujung

  [siblings[idx], siblings[target]] = [siblings[target], siblings[idx]];

  const batch = adminDb.batch();
  siblings.forEach((s, i) => {
    if (s.order_index !== i) {
      batch.update(adminDb.collection('board_members').doc(s.id), {
        order_index: i,
        updated_at: new Date().toISOString(),
      });
    }
  });
  await batch.commit();
  invalidateBoardCaches();
}

export async function deleteBoardMember(actor: UserProfile, id: string): Promise<void> {
  if (!canManageBoardStructure(actor)) throw forbidden(MANAGE_ERR);

  const ref = adminDb.collection('board_members').doc(id);
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw notFound('Data pengurus tidak ditemukan.');
    const member = snap.data() as BoardMember;

    const divRef = adminDb.collection('divisions').doc(member.division_id);
    const divSnap = await tx.get(divRef);

    tx.delete(ref);
    if (divSnap.exists && member.user_id && (divSnap.data() as Division).head_user_id === member.user_id) {
      tx.update(divRef, { head_user_id: null });
    }

    const audit = buildAudit(actor, {
      action: 'DELETE',
      target_collection: 'board_members',
      target_id: id,
      summary: `Menghapus pengurus "${member.full_name}" (${member.position_title} - ${member.division_code}) dari struktur ${member.period_id}`,
    });
    tx.set(audit.ref, audit.data);
  });
  invalidateBoardCaches(true);
}

/**
 * Tetapkan Kepala Divisi.
 * - Pengurus harus punya akun aktif yang berada di divisi tersebut.
 * - Anggota yang ditetapkan naik menjadi Kadiv.
 * - Kadiv sebelumnya (jika berbeda) kembali menjadi Anggota.
 * - Mengosongkan jabatan hanya menghapus penanda; role tidak diubah.
 */
export async function setDivisionHead(
  actor: UserProfile,
  divisionId: string,
  userId: string | null
): Promise<void> {
  if (!canManageBoardStructure(actor)) throw forbidden(MANAGE_ERR);

  const roleChanges: Array<{ uid: string; role: UserProfile['role']; division_code: string | null }> = [];

  await adminDb.runTransaction(async (tx) => {
    roleChanges.length = 0;
    const divRef = adminDb.collection('divisions').doc(divisionId);
    const divSnap = await tx.get(divRef);
    if (!divSnap.exists) throw notFound('Divisi tidak ditemukan.');
    const division = divSnap.data() as Division;
    if (division.code === 'PRESIDIUM') {
      throw badRequest('Presidium Inti dipimpin secara kolektif. Kepala Divisi hanya untuk 6 divisi kerja.');
    }

    const prevId = division.head_user_id ?? null;
    const newRef = userId ? adminDb.collection('users').doc(userId) : null;
    const prevRef = prevId && prevId !== userId ? adminDb.collection('users').doc(prevId) : null;

    const newSnap = newRef ? await tx.get(newRef) : null;
    const prevSnap = prevRef ? await tx.get(prevRef) : null;

    let newUser: UserProfile | null = null;
    if (userId) {
      if (!newSnap?.exists) throw badRequest('Pengurus ini belum memiliki akun, sehingga belum bisa menjadi Kepala Divisi.');
      newUser = newSnap.data() as UserProfile;
      if (!newUser.is_active || newUser.division_code !== division.code) {
        throw badRequest('Kepala Divisi harus pengurus aktif yang berada di divisi ini.');
      }
      if (newUser.role !== 'member' && newUser.role !== 'admin_kadiv') {
        throw badRequest('Hanya Anggota atau Kadiv yang dapat ditetapkan sebagai Kepala Divisi.');
      }
    }

    tx.update(divRef, { head_user_id: userId });

    if (newUser && newRef && newUser.role === 'member') {
      tx.update(newRef, { role: 'admin_kadiv' });
      roleChanges.push({ uid: newUser.uid, role: 'admin_kadiv', division_code: newUser.division_code ?? null });
    }
    if (prevRef && prevSnap?.exists) {
      const prevUser = prevSnap.data() as UserProfile;
      if (prevUser.role === 'admin_kadiv' && prevUser.division_code === division.code) {
        tx.update(prevRef, { role: 'member' });
        roleChanges.push({ uid: prevUser.uid, role: 'member', division_code: prevUser.division_code ?? null });
      }
    }

    const audit = buildAudit(actor, {
      action: 'ROLE_CHANGE',
      target_collection: 'divisions',
      target_id: divisionId,
      summary: userId
        ? `Menetapkan ${newUser?.full_name} sebagai Kepala ${division.name}`
        : `Mengosongkan jabatan Kepala ${division.name}`,
    });
    tx.set(audit.ref, audit.data);
  });

  // Sinkronkan custom claims (best effort; sumber kebenaran role tetap Firestore).
  await Promise.all(
    roleChanges.map((c) =>
      adminAuth.setCustomUserClaims(c.uid, { role: c.role, division_code: c.division_code }).catch(() => undefined)
    )
  );
  invalidateBoardCaches(true);
}

