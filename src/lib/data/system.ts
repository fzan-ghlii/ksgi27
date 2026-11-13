import 'server-only';
import { cache } from 'react';
import { randomBytes } from 'node:crypto';
import { adminDb } from '@/lib/firebase/admin';
import type { AuditAction, AuditLogEntry, DivisionCode, Role, UserProfile } from '@/types';
import { forbidden, notFound } from '@/lib/errors';
import { writeAudit } from '@/lib/data/audit';
import { testGoogleSheetsConnection } from '@/lib/google/sheets';

const SYSTEM_CONFIG_DOC = 'system_config/general';

export interface SystemConfig {
  maintenance_mode: boolean;
  maintenance_message: string;
  default_spreadsheet_id: string;
  gform_webhook_secret: string;
  updated_at: string;
  updated_by: string;
}

const DEFAULT_CONFIG: SystemConfig = {
  maintenance_mode: false,
  maintenance_message: 'Sistem GIBEI UNIMED sedang dalam pemeliharaan berkala untuk peningkatan layanan. Silakan kembali beberapa saat lagi.',
  default_spreadsheet_id: '',
  gform_webhook_secret: '',
  updated_at: new Date().toISOString(),
  updated_by: 'system',
};

// In-memory cache for ultra-fast system config retrieval (0ms on warm hits)
let systemConfigCache: { data: SystemConfig; expiresAt: number } | null = null;
const SYSTEM_CONFIG_CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * Memastikan actor adalah Creator (Superuser).
 */
function assertIsCreator(actor: UserProfile) {
  if (actor.role !== 'creator') {
    throw forbidden('Akses ditolak. Modul Sistem hanya dapat diakses oleh peran Creator.');
  }
}

/**
 * Mengambil konfigurasi sistem dengan in-memory caching & deduplikasi React cache.
 */
export const getSystemConfig = cache(async (): Promise<SystemConfig> => {
  const now = Date.now();
  if (systemConfigCache && systemConfigCache.expiresAt > now) {
    return systemConfigCache.data;
  }

  try {
    const doc = await adminDb.doc(SYSTEM_CONFIG_DOC).get();
    let data: SystemConfig;
    if (!doc.exists) {
      data = {
        ...DEFAULT_CONFIG,
        gform_webhook_secret: randomBytes(24).toString('hex'),
        updated_at: new Date().toISOString(),
      };
      await adminDb.doc(SYSTEM_CONFIG_DOC).set(data);
    } else {
      data = { ...DEFAULT_CONFIG, ...(doc.data() as Partial<SystemConfig>) };
    }
    systemConfigCache = { data, expiresAt: now + SYSTEM_CONFIG_CACHE_TTL };
    return data;
  } catch (err) {
    console.warn('[getSystemConfig Error]', err);
    return DEFAULT_CONFIG;
  }
});

/**
 * Memperbarui konfigurasi sistem (khusus Creator).
 */
export async function updateSystemConfig(
  patch: Partial<SystemConfig>,
  actor: UserProfile
): Promise<SystemConfig> {
  assertIsCreator(actor);

  const current = await getSystemConfig();
  const updated: SystemConfig = {
    ...current,
    ...patch,
    updated_at: new Date().toISOString(),
    updated_by: actor.uid,
  };

  await adminDb.doc(SYSTEM_CONFIG_DOC).set(updated, { merge: true });
  systemConfigCache = null; // Invalidate cache immediately on update

  await writeAudit(actor, {
    action: 'UPDATE',
    target_collection: 'system_config',
    target_id: 'general',
    summary:
      patch.maintenance_mode !== undefined
        ? `Maintenance Mode diubah menjadi: ${patch.maintenance_mode ? 'AKTIF' : 'NONAKTIF'}`
        : 'Pembaruan konfigurasi sistem',
  });

  return updated;
}

/**
 * Audit Log Explorer: Query log audit dengan filter lengkap.
 */
export async function queryAuditLogs(filter: {
  actorRole?: Role;
  action?: AuditAction;
  limit?: number;
}): Promise<AuditLogEntry[]> {
  let q = adminDb.collection('audit_logs').orderBy('timestamp', 'desc');

  if (filter.action) {
    q = q.where('action', '==', filter.action);
  }

  const snap = await q.limit(filter.limit || 50).get();
  let logs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AuditLogEntry, 'id'>) }));

  if (filter.actorRole) {
    logs = logs.filter((l) => l.actor_role === filter.actorRole);
  }

  return logs;
}

/**
 * Manajemen Pengguna: Ambil semua data pengguna untuk Creator Console.
 */
export async function listAllUsers(actor: UserProfile): Promise<UserProfile[]> {
  assertIsCreator(actor);

  const snap = await adminDb.collection('users').get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      email: data.email || '',
      full_name: data.full_name || '',
      role: (data.role || 'member') as Role,
      division_code: data.division_code || null,
      division_id: data.division_id || null,
      period_id: data.period_id || null,
      nim: data.nim || '',
      faculty_major: data.faculty_major || '',
      phone_whatsapp: data.phone_whatsapp || data.phone || '',
      avatar_url: data.avatar_url,
      position_title: data.position_title,
      is_active: data.is_active !== false,
      created_at: data.created_at || new Date().toISOString(),
      last_login: data.last_login,
    } as UserProfile;
  });
}

/**
 * Override Hak Akses / Role / Divisi / Status Aktif Pengguna (khusus Creator).
 */
export async function updateUserRoleAndDivision(
  targetUid: string,
  updates: {
    role?: Role;
    division_code?: DivisionCode | null;
    is_active?: boolean;
  },
  actor: UserProfile
): Promise<UserProfile> {
  assertIsCreator(actor);

  const userRef = adminDb.collection('users').doc(targetUid);
  const snap = await userRef.get();
  if (!snap.exists) {
    throw notFound('Pengguna tidak ditemukan.');
  }

  const existing = snap.data() as UserProfile;
  const patch: Partial<UserProfile> = {};

  if (updates.role !== undefined) patch.role = updates.role;
  if (updates.division_code !== undefined) patch.division_code = updates.division_code;
  if (updates.is_active !== undefined) patch.is_active = updates.is_active;

  await userRef.update(patch);

  await writeAudit(actor, {
    action: 'ROLE_CHANGE',
    target_collection: 'users',
    target_id: targetUid,
    summary: `Ubah hak akses ${existing.full_name || targetUid} (${existing.email}) -> Role: ${patch.role ?? existing.role}, Active: ${patch.is_active ?? existing.is_active}`,
  });

  return { ...existing, ...patch, uid: targetUid };
}

/**
 * Metrik Database & Status Sistem.
 */
export async function getSystemMetrics(actor: UserProfile) {
  assertIsCreator(actor);

  const collections = [
    'periods',
    'divisions',
    'board_members',
    'articles',
    'galleries',
    'events',
    'registrations',
    'invitations',
    'piket_schedules',
    'piket_attendances',
    'audit_logs',
    'users',
  ];

  const counts: Record<string, number> = {};

  await Promise.all(
    collections.map(async (c) => {
      try {
        const snap = await adminDb.collection(c).count().get();
        counts[c] = snap.data().count;
      } catch {
        counts[c] = 0;
      }
    })
  );

  const config = await getSystemConfig();
  const sheetsTest = await testGoogleSheetsConnection(config.default_spreadsheet_id || undefined);

  return {
    counts,
    config,
    sheetsTest: {
      ...sheetsTest,
      sheetTitle: sheetsTest.sheetTitle ?? undefined,
    },
  };
}
