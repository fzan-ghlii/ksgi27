import { describe, it, expect } from 'vitest';
import { CreateInviteSchema, CompleteActivationSchema } from './activation';

describe('CreateInviteSchema', () => {
  it('validates correct invite input', () => {
    const valid = {
      target_role: 'member',
      division_code: 'EDUKASI',
      assigned_position: 'Staf Edukasi SPM',
      recipient_name_hint: 'Fauzi',
      expires_in_days: 7,
    };
    const res = CreateInviteSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects short position name', () => {
    const invalid = {
      target_role: 'member',
      division_code: 'EDUKASI',
      assigned_position: 'ab',
    };
    const res = CreateInviteSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('rejects invalid division code', () => {
    const invalid = {
      target_role: 'member',
      division_code: 'INVALID_DIV',
      assigned_position: 'Staf Edukasi SPM',
    };
    const res = CreateInviteSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });
});

describe('CompleteActivationSchema', () => {
  it('validates correct complete activation input', () => {
    const valid = {
      token: 'secure-token-123',
      id_token: 'firebase-id-token-abc',
      full_name: 'Budi Santoso',
      nim: '7213210045',
      faculty_major: 'Fakultas Ekonomi / Manajemen',
      phone_whatsapp: '081234567890',
      avatar_url: 'https://example.com/photo.jpg',
    };
    const res = CompleteActivationSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('allows empty avatar_url', () => {
    const valid = {
      token: 'secure-token-123',
      id_token: 'firebase-id-token-abc',
      full_name: 'Budi Santoso',
      nim: '7213210045',
      faculty_major: 'FE / Manajemen',
      phone_whatsapp: '081234567890',
      avatar_url: '',
    };
    const res = CompleteActivationSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects short phone number', () => {
    const invalid = {
      token: 'secure-token-123',
      id_token: 'firebase-id-token-abc',
      full_name: 'Budi Santoso',
      nim: '7213210045',
      faculty_major: 'FE / Manajemen',
      phone_whatsapp: '123',
    };
    const res = CompleteActivationSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });
});

