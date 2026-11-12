import 'server-only';
import type { DocumentReference } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import type { AuditLog, UserProfile } from '@/types';

type AuditActor = Pick<UserProfile, 'uid' | 'email' | 'role'>;
type AuditInput = Pick<AuditLog, 'action' | 'target_collection' | 'target_id' | 'summary'>;

/**
 * Siapkan dokumen audit. Pakai di dalam transaksi/batch yang sama dengan
 * perubahan datanya supaya log tidak bisa tertinggal:
 *
 *   const a = buildAudit(actor, {...});
 *   tx.set(a.ref, a.data);
 */
export function buildAudit(
  actor: AuditActor,
  input: AuditInput
): { ref: DocumentReference; data: AuditLog } {
  const ref = adminDb.collection('audit_logs').doc();
  return {
    ref,
    data: {
      id: ref.id,
      actor_uid: actor.uid,
      actor_email: actor.email,
      actor_role: actor.role,
      ...input,
      timestamp: new Date().toISOString(),
    },
  };
}

/** Tulis log audit mandiri (di luar transaksi). */
export async function writeAudit(actor: AuditActor, input: AuditInput): Promise<void> {
  const a = buildAudit(actor, input);
  await a.ref.set(a.data);
}

