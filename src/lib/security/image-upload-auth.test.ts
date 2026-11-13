import { describe, it, expect, vi } from 'vitest';
import { authorizeImageUpload } from './image-upload-auth';
import type { ActivationInvite, UserProfile } from '@/types';

const memberUser: UserProfile = {
  uid: 'u1',
  email: 'pengurus@gibei.test',
  full_name: 'Siti Aminah',
  nim: '7213210001',
  faculty_major: 'FE / Akuntansi',
  phone_whatsapp: '081234567890',
  role: 'member',
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
};

const validInvite: ActivationInvite = {
  token: 'valid-invite-token-0123456789abcdef',
  target_role: 'member',
  period_id: '2026-2027',
  division_id: '2026-2027_HRD',
  division_code: 'HRD',
  assigned_position: 'Staf HRD',
  recipient_name_hint: 'Calon Pengurus',
  status: 'PENDING',
  created_by: 'creator-1',
  expires_at: '2099-01-01T00:00:00.000Z',
  created_at: '2026-01-01T00:00:00.000Z',
};

const allowedRl = async () => ({
  allowed: true,
  limit: 20,
  remaining: 19,
  resetAt: Date.now() + 60_000,
  retryAfterSeconds: 60,
  backend: 'memory' as const,
});

describe('authorizeImageUpload', () => {
  it('mengizinkan pengguna bersesi member+ tanpa membaca undangan', async () => {
    const getInvite = vi.fn();
    const res = await authorizeImageUpload(
      { activationToken: null, clientIp: '1.2.3.4' },
      { getSessionUser: async () => memberUser, getInvite, checkRateLimit: allowedRl }
    );

    expect(res.allowed).toBe(true);
    if (res.allowed) {
      expect(res.actor.uploadedBy).toBe('u1');
      expect(res.actor.rateLimitKey).toBe('uid:u1');
    }
    expect(getInvite).not.toHaveBeenCalled();
  });

  it('menolak pengunjung tanpa sesi dan tanpa token aktivasi (401)', async () => {
    await expect(
      authorizeImageUpload(
        { activationToken: '', clientIp: '1.2.3.4' },
        { getSessionUser: async () => null, getInvite: vi.fn(), checkRateLimit: allowedRl }
      )
    ).rejects.toThrow('UNAUTHORIZED');
  });

  it('menolak role public tanpa token aktivasi (403)', async () => {
    await expect(
      authorizeImageUpload(
        { activationToken: null, clientIp: '1.2.3.4' },
        {
          getSessionUser: async () => ({ ...memberUser, role: 'public' }),
          getInvite: vi.fn(),
          checkRateLimit: allowedRl,
        }
      )
    ).rejects.toThrow('FORBIDDEN');
  });

  it('mengizinkan unggahan dengan token undangan PENDING yang valid sebelum login', async () => {
    const res = await authorizeImageUpload(
      { activationToken: validInvite.token, clientIp: '1.2.3.4' },
      {
        getSessionUser: async () => null,
        getInvite: async () => ({
          invite: validInvite,
          isValid: true,
          statusMessage: 'Tautan aktivasi valid.',
        }),
        checkRateLimit: allowedRl,
      }
    );

    expect(res.allowed).toBe(true);
    if (res.allowed) {
      expect(res.actor.uploadedBy).toBe(`invite:${validInvite.token}`);
      expect(res.actor.uploadedByName).toBe('Calon Pengurus');
      expect(res.actor.rateLimitKey).toBe(`invite:${validInvite.token}`);
    }
  });

  it('menolak token berformat path traversal sebelum memanggil getInvite', async () => {
    const getInvite = vi.fn();
    await expect(
      authorizeImageUpload(
        { activationToken: '../users/admin', clientIp: '1.2.3.4' },
        { getSessionUser: async () => null, getInvite, checkRateLimit: allowedRl }
      )
    ).rejects.toThrow('Tautan aktivasi tidak valid');
    expect(getInvite).not.toHaveBeenCalled();
  });

  it('menolak token kedaluwarsa, dicabut, atau sudah dipakai', async () => {
    await expect(
      authorizeImageUpload(
        { activationToken: validInvite.token, clientIp: '1.2.3.4' },
        {
          getSessionUser: async () => null,
          getInvite: async () => ({
            invite: { ...validInvite, status: 'USED' },
            isValid: false,
            statusMessage: 'Tautan aktivasi ini sudah pernah digunakan oleh pengurus lain.',
          }),
          checkRateLimit: allowedRl,
        }
      )
    ).rejects.toThrow('sudah pernah digunakan');
  });

  it('mengembalikan 429 bila batas percobaan IP terlampaui', async () => {
    const getInvite = vi.fn();
    const res = await authorizeImageUpload(
      { activationToken: validInvite.token, clientIp: '1.2.3.4' },
      {
        getSessionUser: async () => null,
        getInvite,
        checkRateLimit: async () => ({
          allowed: false,
          limit: 20,
          remaining: 0,
          resetAt: Date.now() + 60_000,
          retryAfterSeconds: 60,
          backend: 'memory',
        }),
      }
    );

    expect(res.allowed).toBe(false);
    if (!res.allowed) {
      expect(res.response.status).toBe(429);
    }
    expect(getInvite).not.toHaveBeenCalled();
  });
});

