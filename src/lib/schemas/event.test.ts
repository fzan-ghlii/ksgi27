import { describe, expect, it } from 'vitest';
import {
  EventInputSchema,
  EventRegisterSchema,
  GFormWebhookSchema,
} from './event';

describe('EventInputSchema', () => {
  const baseValidEvent = {
    title: 'Sekolah Pasar Modal Level 1 Batch 2027',
    description: 'Pelatihan dasar pasar modal untuk mahasiswa dan civitas akademika UNIMED.',
    category: 'SPM' as const,
    spm_level: 'Level 1' as const,
    division_code: 'EDUKASI' as const,
    period_id: '2026-2027',
    banner_url: '/gambar/artikel/dummy.jpg',
    location_type: 'ONLINE' as const,
    location_detail: 'Zoom Meeting Room GIBEI',
    event_date: '2027-03-20T09:00:00Z',
    registration_deadline: '2027-03-18T23:59:59Z',
    quota: 100,
    registration_mode: 'INTERNAL_FORM' as const,
    external_gform_url: '',
    spreadsheet_id: 'sheet-123456',
    sheet_tab_name: 'Pendaftar SPM L1',
  };

  it('validates a complete SPM event', () => {
    const res = EventInputSchema.safeParse(baseValidEvent);
    expect(res.success).toBe(true);
  });

  it('fails SPM event when spm_level is missing', () => {
    const res = EventInputSchema.safeParse({
      ...baseValidEvent,
      spm_level: null,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain('Sekolah Pasar Modal');
    }
  });

  it('passes regular EVENT without spm_level', () => {
    const res = EventInputSchema.safeParse({
      ...baseValidEvent,
      category: 'EVENT',
      spm_level: null,
      division_code: 'KEGIATAN',
    });
    expect(res.success).toBe(true);
  });

  it('requires external_gform_url when mode is EXTERNAL_GFORM', () => {
    const res = EventInputSchema.safeParse({
      ...baseValidEvent,
      registration_mode: 'EXTERNAL_GFORM',
      external_gform_url: '',
    });
    expect(res.success).toBe(false);
  });
});

describe('EventRegisterSchema', () => {
  const validRegistration = {
    full_name: 'Budi Santoso',
    email: 'budi@mhs.unimed.ac.id',
    nim: '7203344001',
    whatsapp: '081234567890',
    institution: 'FE UNIMED - Pendidikan Ekonomi',
    has_rdn: true,
    notes: 'Ingin belajar saham fundamental',
  };

  it('validates correct participant data', () => {
    const res = EventRegisterSchema.safeParse(validRegistration);
    expect(res.success).toBe(true);
  });

  it('fails when email is invalid', () => {
    const res = EventRegisterSchema.safeParse({
      ...validRegistration,
      email: 'not-an-email',
    });
    expect(res.success).toBe(false);
  });

  it('fails when whatsapp format is invalid', () => {
    const res = EventRegisterSchema.safeParse({
      ...validRegistration,
      whatsapp: 'abcde123',
    });
    expect(res.success).toBe(false);
  });
});

describe('GFormWebhookSchema', () => {
  it('parses webhook payload and converts text has_rdn to boolean', () => {
    const res = GFormWebhookSchema.safeParse({
      secret_token: 'valid-secret',
      event_id: 'evt-123',
      full_name: 'Dewi Lestari',
      email: 'dewi@unimed.ac.id',
      nim: '7213344002',
      whatsapp: '+6281298765432',
      institution: 'FBS UNIMED',
      has_rdn: 'Sudah',
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.has_rdn).toBe(true);
    }
  });
});
