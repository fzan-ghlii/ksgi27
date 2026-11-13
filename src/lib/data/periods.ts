import 'server-only';
import { adminDb } from '@/lib/firebase/admin';
import type { Division, Period, UserProfile } from '@/types';
import { DIVISION_LIST, divisionDocId } from '@/lib/constants/divisions';
import { canManagePeriods } from '@/lib/auth/permissions';
import { invalidateSeededPeriodCache } from '@/lib/auth/bootstrap';
import { PeriodInput, PeriodUpdateInput } from '@/lib/schemas/content';
import { badRequest, conflict, forbidden, notFound } from '@/lib/errors';
import { buildAudit } from '@/lib/data/audit';
import { invalidatePublicCache, revalidatePublicPaths } from '@/lib/data/public';

function invalidatePeriodCaches() {
  invalidateSeededPeriodCache();
  invalidatePublicCache('periods');
  invalidatePublicCache('board');
  revalidatePublicPaths(['/', '/struktur', '/tentang', '/kegiatan', '/galeri']);
}

function periodIdFromRange(yearRange: string): string {
  return yearRange.replace('/', '-');
}

export async function listPeriods(): Promise<Period[]> {
  const snap = await adminDb.collection('periods').get();
  return snap.docs
    .map((d) => d.data() as Period)
    .sort((a, b) => b.year_range.localeCompare(a.year_range));
}

export async function listDivisionsByPeriod(periodId: string): Promise<Division[]> {
  const snap = await adminDb.collection('divisions').where('period_id', '==', periodId).get();
  return snap.docs.map((d) => d.data() as Division).sort((a, b) => a.order_index - b.order_index);
}

export async function createPeriod(actor: UserProfile, input: PeriodInput): Promise<Period> {
  if (!canManagePeriods(actor)) throw forbidden('Hanya Presidium dan Creator yang dapat mengelola periode.');

  const id = periodIdFromRange(input.year_range);
  const ref = adminDb.collection('periods').doc(id);
  const period: Period = {
    id,
    cabinet_name: input.cabinet_name,
    year_range: input.year_range,
    vision: input.vision,
    missions: input.missions,
    is_current: false,
    created_at: new Date().toISOString(),
  };

  await adminDb.runTransaction(async (tx) => {
    if ((await tx.get(ref)).exists) {
      throw conflict(`Periode ${input.year_range} sudah ada.`);
    }
    tx.set(ref, period);

    // Divisi disimpan per periode: salin 7 divisi resmi ke periode baru.
    for (const meta of DIVISION_LIST) {
      const divId = divisionDocId(id, meta.code);
      const division: Division = {
        id: divId,
        period_id: id,
        code: meta.code,
        name: meta.name,
        slug: meta.slug,
        description: meta.shortDesc,
        head_user_id: null,
        order_index: meta.order,
      };
      tx.set(adminDb.collection('divisions').doc(divId), division);
    }

    const audit = buildAudit(actor, {
      action: 'CREATE',
      target_collection: 'periods',
      target_id: id,
      summary: `Membuat periode ${input.year_range} (${input.cabinet_name}) beserta 7 divisi resmi`,
    });
    tx.set(audit.ref, audit.data);
  });

  if (input.is_current) {
    await setActivePeriod(actor, id);
    period.is_current = true;
  } else {
    invalidatePeriodCaches();
  }
  return period;
}

export async function updatePeriod(
  actor: UserProfile,
  id: string,
  input: PeriodUpdateInput
): Promise<void> {
  if (!canManagePeriods(actor)) throw forbidden('Hanya Presidium dan Creator yang dapat mengelola periode.');

  const ref = adminDb.collection('periods').doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw notFound('Periode tidak ditemukan.');
  const existing = snap.data() as Period;

  if (input.is_current === false && existing.is_current) {
    throw badRequest('Periode aktif tidak bisa dinonaktifkan langsung. Aktifkan periode lain terlebih dahulu.');
  }

  const batch = adminDb.batch();
  batch.update(ref, {
    cabinet_name: input.cabinet_name,
    vision: input.vision,
    missions: input.missions,
  });
  const audit = buildAudit(actor, {
    action: 'UPDATE',
    target_collection: 'periods',
    target_id: id,
    summary: `Memperbarui periode ${existing.year_range} (${input.cabinet_name})`,
  });
  batch.set(audit.ref, audit.data);
  await batch.commit();

  if (input.is_current === true && !existing.is_current) {
    await setActivePeriod(actor, id);
  } else {
    invalidatePeriodCaches();
  }
}

/**
 * Jadikan satu periode aktif. Periode aktif sebelumnya otomatis menjadi arsip.
 * Data pengurus/divisi tidak disentuh.
 */
export async function setActivePeriod(actor: UserProfile, id: string): Promise<void> {
  if (!canManagePeriods(actor)) throw forbidden('Hanya Presidium dan Creator yang dapat mengelola periode.');

  const ref = adminDb.collection('periods').doc(id);
  await adminDb.runTransaction(async (tx) => {
    const target = await tx.get(ref);
    if (!target.exists) throw notFound('Periode tidak ditemukan.');
    const currents = await tx.get(adminDb.collection('periods').where('is_current', '==', true));

    for (const d of currents.docs) {
      if (d.id !== id) tx.update(d.ref, { is_current: false });
    }
    tx.update(ref, { is_current: true });

    const audit = buildAudit(actor, {
      action: 'SET_ACTIVE_PERIOD',
      target_collection: 'periods',
      target_id: id,
      summary: `Mengaktifkan periode ${(target.data() as Period).year_range}; periode lain menjadi arsip`,
    });
    tx.set(audit.ref, audit.data);
  });
  invalidatePeriodCaches();
}

export async function deletePeriod(actor: UserProfile, id: string): Promise<void> {
  if (!canManagePeriods(actor)) throw forbidden('Hanya Presidium dan Creator yang dapat mengelola periode.');

  const ref = adminDb.collection('periods').doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw notFound('Periode tidak ditemukan.');
  const period = snap.data() as Period;

  if (period.is_current) {
    throw badRequest('Periode aktif tidak dapat dihapus. Aktifkan periode lain terlebih dahulu.');
  }

  const [members, galleries] = await Promise.all([
    adminDb.collection('board_members').where('period_id', '==', id).limit(1).get(),
    adminDb.collection('galleries').where('period_id', '==', id).limit(1).get(),
  ]);
  if (!members.empty || !galleries.empty) {
    throw badRequest(
      'Periode masih memiliki data pengurus atau album galeri. Periode seperti ini cukup dibiarkan sebagai arsip.'
    );
  }

  const divisions = await adminDb.collection('divisions').where('period_id', '==', id).get();
  const batch = adminDb.batch();
  divisions.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(ref);
  const audit = buildAudit(actor, {
    action: 'DELETE',
    target_collection: 'periods',
    target_id: id,
    summary: `Menghapus periode ${period.year_range} (${period.cabinet_name})`,
  });
  batch.set(audit.ref, audit.data);
  await batch.commit();
  invalidatePeriodCaches();
}

