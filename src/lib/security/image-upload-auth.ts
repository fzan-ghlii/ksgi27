import type { NextResponse } from 'next/server';
import type { ActivationInvite, UserProfile } from '@/types';
import { hasMinRole } from '@/lib/auth/roles';
import { forbidden } from '@/lib/errors';
import { isSafeDocId } from '@/lib/security/guards';
import {
  enforceRateLimit,
  RATE_LIMIT_POLICIES,
  rateLimitErrorResponse,
  type RateLimitResult,
} from '@/lib/security/rate-limit';

export interface ImageUploadActor {
  rateLimitKey: string;
  uploadedBy: string;
  uploadedByName: string;
}

export type ImageUploadAuthOutcome =
  | { allowed: true; actor: ImageUploadActor }
  | { allowed: false; response: NextResponse };

export interface ImageUploadAuthDeps {
  getSessionUser: () => Promise<UserProfile | null>;
  getInvite: (token: string) => Promise<{
    invite: ActivationInvite;
    isValid: boolean;
    statusMessage: string;
  }>;
  checkRateLimit?: (key: string) => Promise<RateLimitResult>;
}

/**
 * Mengotorisasi unggahan gambar lewat sesi pengurus aktif (`member`+)
 * atau token undangan aktivasi `PENDING` sebelum pengguna login.
 */
export async function authorizeImageUpload(
  {
    activationToken,
    clientIp,
  }: {
    activationToken: string | null | undefined;
    clientIp: string;
  },
  deps: ImageUploadAuthDeps
): Promise<ImageUploadAuthOutcome> {
  const sessionUser = await deps.getSessionUser();
  if (sessionUser && hasMinRole(sessionUser.role, 'member')) {
    return {
      allowed: true,
      actor: {
        rateLimitKey: `uid:${sessionUser.uid}`,
        uploadedBy: sessionUser.uid,
        uploadedByName: sessionUser.full_name,
      },
    };
  }

  const token = activationToken?.trim() || '';
  if (!token) {
    throw new Error(sessionUser ? 'FORBIDDEN' : 'UNAUTHORIZED');
  }

  const checkLimit =
    deps.checkRateLimit ??
    ((key: string) => enforceRateLimit(RATE_LIMIT_POLICIES.imageUpload, key));

  const ipRl = await checkLimit(`act-img-ip:${clientIp}`);
  if (!ipRl.allowed) {
    return {
      allowed: false,
      response: rateLimitErrorResponse(
        ipRl,
        'Batas unggah gambar sementara tercapai. Silakan tunggu beberapa menit.'
      ),
    };
  }

  if (!isSafeDocId(token)) {
    throw forbidden('Tautan aktivasi tidak valid atau tidak ditemukan.');
  }

  const inviteCheck = await deps.getInvite(token);
  if (!inviteCheck.isValid) {
    throw forbidden(inviteCheck.statusMessage);
  }

  const { invite } = inviteCheck;
  return {
    allowed: true,
    actor: {
      rateLimitKey: `invite:${invite.token}`,
      uploadedBy: `invite:${invite.token}`,
      uploadedByName:
        invite.recipient_name_hint || invite.assigned_position || 'Aktivasi Pengurus',
    },
  };
}

