import 'server-only';
import crypto from 'crypto';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { QueryDocumentSnapshot, Transaction } from 'firebase-admin/firestore';
import { ActivationInvite, UserProfile, BoardMember, InviteStatus } from '@/types';
import { CreateInviteInput, CompleteActivationInput } from '@/lib/schemas/activation';
import { canIssueInvite } from '@/lib/auth/roles';
import { seedInitialPeriodAndDivisions } from '@/lib/auth/bootstrap';
import { AppError, badRequest, conflict, forbidden, notFound } from '@/lib/errors';
import { buildAudit, writeAudit } from '@/lib/data/audit';
import { invalidatePublicCache, revalidatePublicPaths } from '@/lib/data/public';
import { isSafeDocId } from '@/lib/security/guards';

export async function createActivationInvite(
  actor: UserProfile,
  input: CreateInviteInput
): Promise<ActivationInvite> {
  // 1. Check actor authorization
  if (!canIssueInvite(actor.role, actor.division_code, input.target_role)) {
    throw forbidden('Anda tidak memiliki wewenang untuk membuat tautan aktivasi dengan role ini.');
  }

  // 2. Ensure initial period & divisions exist
  const periodId = await seedInitialPeriodAndDivisions();

  // Find target division document
  const divQuery = await adminDb
    .collection('divisions')
    .where('period_id', '==', periodId)
    .where('code', '==', input.division_code)
    .limit(1)
    .get();

  if (divQuery.empty) {
    throw notFound(`Divisi ${input.division_code} tidak ditemukan untuk periode ${periodId}.`);
  }
  const divisionDoc = divQuery.docs[0];

  // 3. Generate secure URL-safe token (24 bytes = 32 chars base64url)
  const token = crypto.randomBytes(24).toString('base64url');

  const now = new Date();
  const expiresAt = new Date(now.getTime() + input.expires_in_days * 24 * 60 * 60 * 1000);

  const inviteData: ActivationInvite = {
    token,
    target_role: input.target_role,
    period_id: periodId,
    division_id: divisionDoc.id,
    division_code: input.division_code,
    assigned_position: input.assigned_position.trim(),
    recipient_name_hint: input.recipient_name_hint?.trim() || '',
    status: 'PENDING',
    created_by: actor.uid,
    created_by_email: actor.email,
    used_by_uid: null,
    expires_at: expiresAt.toISOString(),
    created_at: now.toISOString(),
  };

  await adminDb.collection('activation_invites').doc(token).set(inviteData);

  await writeAudit(actor, {
    action: 'INVITE_GENERATED',
    target_collection: 'activation_invites',
    target_id: token,
    summary: `Membuat link aktivasi untuk jabatan "${input.assigned_position}" (${input.division_code}) role: ${input.target_role}`,
  });

  return inviteData;
}

export async function getInviteByToken(token: string): Promise<{
  invite: ActivationInvite;
  isValid: boolean;
  statusMessage: string;
}> {
  if (!isSafeDocId(token)) {
    return {
      invite: null as unknown as ActivationInvite,
      isValid: false,
      statusMessage: 'Tautan aktivasi tidak valid atau tidak ditemukan.',
    };
  }

  const docRef = adminDb.collection('activation_invites').doc(token);
  const snap = await docRef.get();

  if (!snap.exists) {
    return {
      invite: null as unknown as ActivationInvite,
      isValid: false,
      statusMessage: 'Tautan aktivasi tidak valid atau tidak ditemukan.',
    };
  }

  const invite = snap.data() as ActivationInvite;
  let status: InviteStatus = invite.status;

  // Check if expired
  if (status === 'PENDING' && new Date(invite.expires_at) < new Date()) {
    status = 'EXPIRED';
  }

  if (status === 'USED') {
    return {
      invite,
      isValid: false,
      statusMessage: 'Tautan aktivasi ini sudah pernah digunakan oleh pengurus lain.',
    };
  }

  if (status === 'REVOKED') {
    return {
      invite,
      isValid: false,
      statusMessage: 'Tautan aktivasi ini telah dicabut oleh Presidium/HRD.',
    };
  }

  if (status === 'EXPIRED') {
    return {
      invite,
      isValid: false,
      statusMessage: 'Tautan aktivasi ini telah kedaluwarsa. Silakan minta tautan baru kepada Presidium/HRD.',
    };
  }

  return {
    invite,
    isValid: true,
    statusMessage: 'Tautan aktivasi valid.',
  };
}

export async function listActivationInvites(actor: UserProfile): Promise<ActivationInvite[]> {
  let query = adminDb.collection('activation_invites').orderBy('created_at', 'desc');

  // If Kadiv HRD, only show member invites
  if (actor.role === 'admin_kadiv') {
    query = query.where('target_role', '==', 'member') as typeof query;
  }

  const snapshot = await query.limit(50).get();
  const invites = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
    const data = doc.data() as ActivationInvite;
    // dynamically check expiry if PENDING
    if (data.status === 'PENDING' && new Date(data.expires_at) < new Date()) {
      data.status = 'EXPIRED';
    }
    return data;
  });

  return invites;
}

export async function revokeInvite(token: string, actor: UserProfile): Promise<void> {
  const docRef = adminDb.collection('activation_invites').doc(token);
  const snap = await docRef.get();

  if (!snap.exists) {
    throw notFound('Tautan aktivasi tidak ditemukan.');
  }

  const invite = snap.data() as ActivationInvite;
  if (!canIssueInvite(actor.role, actor.division_code, invite.target_role)) {
    throw forbidden('Anda tidak berhak mencabut tautan aktivasi ini.');
  }

  if (invite.status === 'USED') {
    throw badRequest('Tautan yang sudah terpakai tidak dapat dicabut.');
  }

  await docRef.update({
    status: 'REVOKED',
  });

  await writeAudit(actor, {
    action: 'INVITE_REVOKED',
    target_collection: 'activation_invites',
    target_id: token,
    summary: `Mencabut tautan aktivasi token ${token.slice(0, 8)}... (${invite.assigned_position})`,
  });
}

export async function completeActivation(input: CompleteActivationInput): Promise<UserProfile> {
  // 1. Verify ID token from Firebase Auth
  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(input.id_token);
  } catch {
    throw new AppError('Token autentikasi Google tidak valid atau sudah kedaluwarsa.', 401);
  }
  const uid = decodedToken.uid;
  const email = decodedToken.email || '';

  const inviteRef = adminDb.collection('activation_invites').doc(input.token);
  const userRef = adminDb.collection('users').doc(uid);
  const boardMemberRef = adminDb.collection('board_members').doc();

  const now = new Date().toISOString();

  // Run in a Firestore transaction to prevent race conditions and double activations
  const resultProfile = await adminDb.runTransaction(async (transaction: Transaction) => {
    const inviteDoc = await transaction.get(inviteRef);
    if (!inviteDoc.exists) {
      throw notFound('Tautan aktivasi tidak valid.');
    }

    const invite = inviteDoc.data() as ActivationInvite;
    if (invite.status !== 'PENDING') {
      throw badRequest('Tautan aktivasi sudah tidak berlaku atau sudah terpakai.');
    }

    if (new Date(invite.expires_at) < new Date()) {
      throw badRequest('Tautan aktivasi telah kedaluwarsa.');
    }

    const existingUser = await transaction.get(userRef);
    if (existingUser.exists) {
      throw conflict('Akun ini sudah terdaftar sebagai pengurus.');
    }

    // 2. Prepare user profile
    const profile: UserProfile = {
      uid,
      email: email.toLowerCase().trim(),
      full_name: input.full_name.trim(),
      nim: input.nim.trim(),
      faculty_major: input.faculty_major.trim(),
      phone_whatsapp: input.phone_whatsapp.trim(),
      avatar_url: input.avatar_url?.trim() || '',
      role: invite.target_role,
      division_id: invite.division_id,
      division_code: invite.division_code,
      position_title: invite.assigned_position,
      period_id: invite.period_id,
      is_active: true,
      created_at: now,
      last_login: now,
    };

    // 3. Prepare board member document for public structure
    const boardMember: BoardMember = {
      id: boardMemberRef.id,
      period_id: invite.period_id,
      division_id: invite.division_id,
      division_code: invite.division_code,
      user_id: uid,
      full_name: input.full_name.trim(),
      position_title: invite.assigned_position,
      order_index: invite.target_role === 'master_presidium' ? 1 : (invite.target_role === 'admin_kadiv' ? 5 : 10),
      photo_url: input.avatar_url?.trim() || '',
      social_links: {},
      created_at: now,
    };

    // 4. Update invite to USED
    transaction.update(inviteRef, {
      status: 'USED',
      used_by_uid: uid,
      used_at: now,
    });

    // 5. Create user profile & board member record
    transaction.set(userRef, profile);
    transaction.set(boardMemberRef, boardMember);

    // 6. Record audit log
    const audit = buildAudit(
      { uid, email, role: invite.target_role },
      {
        action: 'INVITE_USED',
        target_collection: 'activation_invites',
        target_id: input.token,
        summary: `Pengurus baru "${profile.full_name}" berhasil aktivasi akun (${profile.position_title} - ${profile.division_code})`,
      }
    );
    transaction.set(audit.ref, audit.data);

    return profile;
  });

  // Assign Firebase Auth Custom Claims
  await adminAuth.setCustomUserClaims(uid, {
    role: resultProfile.role,
    division_code: resultProfile.division_code,
  });

  invalidatePublicCache('board');
  revalidatePublicPaths(['/', '/struktur']);

  return resultProfile;
}
