import 'server-only';
import type { CollectionReference, Transaction } from 'firebase-admin/firestore';

/** Cari slug unik di koleksi Firestore: `base`, `base-2`, `base-3`, ... */
export async function ensureUniqueSlug(
  col: CollectionReference,
  base: string,
  options?: { tx?: Transaction; selfId?: string }
): Promise<string> {
  const { tx, selfId } = options ?? {};
  for (let i = 1; i <= 50; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    const q = col.where('slug', '==', candidate).limit(2);
    const snap = tx ? await tx.get(q) : await q.get();
    if (snap.docs.every((d) => d.id === selfId)) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

