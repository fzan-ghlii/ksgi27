import { describe, expect, it } from 'vitest';
import { toSheetRow } from './sheets';

describe('toSheetRow', () => {
  it('maps participant fields into the 10 expected columns with Indonesian RDN label', () => {
    expect(
      toSheetRow('reg-123', {
        registered_at: '2026-11-13T08:00:00Z',
        full_name: 'Siti Aminah',
        nim: '4231234567',
        email: 'siti@example.com',
        whatsapp: '08123456789',
        institution: 'FE UNIMED',
        has_rdn: true,
        attendance_status: 'Attended',
        notes: 'Hadir tepat waktu',
      })
    ).toEqual([
      '2026-11-13T08:00:00Z',
      'Siti Aminah',
      '4231234567',
      'siti@example.com',
      '08123456789',
      'FE UNIMED',
      'Sudah Ada',
      'Attended',
      'Hadir tepat waktu',
      'reg-123',
    ]);
  });

  it('fills default labels when notes or attendance_status are empty and has_rdn is false', () => {
    expect(
      toSheetRow('reg-456', {
        registered_at: '2026-11-13T09:00:00Z',
        full_name: 'Budi',
        nim: '4239999999',
        email: 'budi@example.com',
        whatsapp: '08987654321',
        institution: 'UNIMED',
        has_rdn: false,
        attendance_status: '',
      })
    ).toEqual([
      '2026-11-13T09:00:00Z',
      'Budi',
      '4239999999',
      'budi@example.com',
      '08987654321',
      'UNIMED',
      'Belum Ada',
      'Registered',
      '-',
      'reg-456',
    ]);
  });
});

