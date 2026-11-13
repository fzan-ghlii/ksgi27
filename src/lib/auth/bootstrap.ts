import 'server-only';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { UserProfile, Period, Division } from '@/types';
import { OFFICIAL_DIVISIONS } from '@/lib/constants/divisions';
import { withTimeout } from '@/lib/utils';

const SEED_TTL_MS = 5 * 60 * 1000;
let cachedPeriod: { id: string; expiresAt: number } | null = null;
let pendingSeed: Promise<string> | null = null;

/** Hapus cache periode hasil seed setelah data periode diubah. */
export function invalidateSeededPeriodCache() {
  cachedPeriod = null;
}

function getCreatorEmails(): string[] {
  const env = process.env.CREATOR_EMAILS || '';
  return env
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
}

function isCreatorEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const list = getCreatorEmails();
  return list.includes(email.toLowerCase().trim());
}

/**
 * Mengembalikan ID periode aktif. Data awal (periode 2026-2027 + 7 divisi) HANYA dibuat
 * bila koleksi periods benar-benar kosong, supaya periode yang sengaja dihapus atau
 * diarsipkan Presidium tidak muncul kembali.
 */
export async function seedInitialPeriodAndDivisions(): Promise<string> {
  if (cachedPeriod && Date.now() < cachedPeriod.expiresAt) {
    return cachedPeriod.id;
  }
  if (pendingSeed) return pendingSeed;

  pendingSeed = resolveOrSeedPeriod().finally(() => {
    pendingSeed = null;
  });
  return pendingSeed;
}

async function resolveOrSeedPeriod(): Promise<string> {
  const periodId = '2026-2027';
  try {
    const anyPeriod = await withTimeout(adminDb.collection('periods').limit(1).get(), 800);
    if (!anyPeriod.empty) {
      const current = await withTimeout(
        adminDb.collection('periods').where('is_current', '==', true).limit(1).get(),
        800
      );
      const id = current.empty ? anyPeriod.docs[0].id : current.docs[0].id;
      cachedPeriod = { id, expiresAt: Date.now() + SEED_TTL_MS };
      return id;
    }

    const periodRef = adminDb.collection('periods').doc(periodId);
    const periodSnap = await withTimeout(periodRef.get(), 800);

    if (!periodSnap.exists) {
      const periodData: Period = {
        id: periodId,
        cabinet_name: 'Kabinet Sinergi Inklusif',
        year_range: '2026/2027',
        vision: 'Menjadikan GIBEI UNIMED sebagai episentrum literasi dan inklusi pasar modal unggulan yang kredibel, adaptif, dan berdaya saing global.',
        missions: [
          'Mengakselerasi literasi keuangan dan pasar modal bagi civitas akademika dan masyarakat umum.',
          'Meningkatkan partisipasi aktif mahasiswa dalam Sekolah Pasar Modal (SPM) dan kompetisi investasi nasional.',
          'Membangun budaya riset pasar modal yang analitis, independen, dan berintegritas tinggi.',
          'Mengembangkan sistem tata kelola organisasi yang transparan, modern, dan berbasis teknologi digital.'
        ],
        is_current: true,
        created_at: new Date().toISOString(),
      };
      await withTimeout(periodRef.set(periodData), 800);
    }

    // Check and seed 7 Divisions (Presidium + 6 Divisi)
    const divSnapshot = await withTimeout(
      adminDb.collection('divisions').where('period_id', '==', periodId).get(),
      800
    );
    if (divSnapshot.empty) {
      const batch = adminDb.batch();
      for (const [code, meta] of Object.entries(OFFICIAL_DIVISIONS)) {
        const divRef = adminDb.collection('divisions').doc(`${periodId}_${code.toLowerCase()}`);
        const divData: Division = {
          id: `${periodId}_${code.toLowerCase()}`,
          period_id: periodId,
          code: meta.code,
          name: meta.name,
          slug: meta.slug,
          description: meta.shortDesc,
          head_user_id: null,
          order_index: meta.order,
        };
        batch.set(divRef, divData);
      }
      await withTimeout(batch.commit(), 800);
    }
    cachedPeriod = { id: periodId, expiresAt: Date.now() + SEED_TTL_MS };
  } catch {
    // If database is not reachable during build/prerender, fallback gracefully without caching
  }

  return periodId;
}

/**
 * Bootstrap the creator account on login if eligible
 */
export async function checkAndBootstrapCreator(uid: string, email: string): Promise<UserProfile | null> {
  if (!isCreatorEmail(email)) {
    return null;
  }

  const userRef = adminDb.collection('users').doc(uid);
  const userSnap = await userRef.get();

  if (userSnap.exists) {
    const existing = userSnap.data() as UserProfile;
    if (existing.role !== 'creator') {
      await userRef.update({ role: 'creator', is_active: true });
      await adminAuth.setCustomUserClaims(uid, { role: 'creator' });
      existing.role = 'creator';
    }
    return existing;
  }

  // Seed default period & divisions
  const periodId = await seedInitialPeriodAndDivisions();

  // Create new Creator user profile
  const now = new Date().toISOString();
  const newProfile: UserProfile = {
    uid,
    email: email.toLowerCase().trim(),
    full_name: 'Pengurus GIBEI',
    nim: 'P-001',
    faculty_major: 'Fakultas Ekonomi',
    phone_whatsapp: '081200000000',
    avatar_url: '',
    role: 'creator',
    division_id: null,
    division_code: null,
    position_title: 'Presidium',
    period_id: periodId,
    is_active: true,
    created_at: now,
    last_login: now,
  };

  await userRef.set(newProfile);
  await adminAuth.setCustomUserClaims(uid, { role: 'creator' });

  // Record audit log
  await adminDb.collection('audit_logs').add({
    actor_uid: uid,
    actor_email: email,
    actor_role: 'creator',
    action: 'CREATE',
    target_collection: 'users',
    target_id: uid,
    summary: `Creator bootstrap auto-created for ${email}`,
    timestamp: now,
  });

  return newProfile;
}
