import { describe, it, expect } from 'vitest';
import { EventReportSchema, EventReportReviewSchema } from './event-report';

const baseLink = {
  event_title: 'Sekolah Pasar Modal Level 1',
  event_date: '2026-11-10',
  participant_count: 85,
  location: 'Aula Fakultas Ekonomi UNIMED',
  attendance_proof_type: 'LINK' as const,
  attendance_proof_url: 'https://docs.google.com/spreadsheets/d/1AbCdEfG/edit',
  attendance_proof_name: 'Absensi SPM Level 1',
  notes: 'Berjalan lancar sesuai jadwal.',
};

describe('EventReportSchema', () => {
  it('menerima bukti absensi Link Google Spreadsheet / Google Form valid', () => {
    expect(EventReportSchema.safeParse(baseLink).success).toBe(true);
    expect(
      EventReportSchema.safeParse({
        ...baseLink,
        attendance_proof_url: 'https://forms.gle/abcdef123456',
      }).success
    ).toBe(true);
  });

  it('menerima bukti absensi PDF resmi dari endpoint internal', () => {
    expect(
      EventReportSchema.safeParse({
        ...baseLink,
        attendance_proof_type: 'PDF',
        attendance_proof_url: '/api/event-reports/pdf/pdf_1794537600_ab12cd',
        attendance_proof_name: 'absensi-spm.pdf',
      }).success
    ).toBe(true);
  });

  it('menolak PDF palsu (eksternal / traversal) dan link non-HTTPS', () => {
    expect(
      EventReportSchema.safeParse({
        ...baseLink,
        attendance_proof_type: 'PDF',
        attendance_proof_url: 'https://evil.example/file.pdf',
      }).success
    ).toBe(false);
    expect(
      EventReportSchema.safeParse({
        ...baseLink,
        attendance_proof_type: 'PDF',
        attendance_proof_url: '/api/event-reports/pdf/../secret',
      }).success
    ).toBe(false);
    expect(
      EventReportSchema.safeParse({
        ...baseLink,
        attendance_proof_url: 'javascript:alert(1)',
      }).success
    ).toBe(false);
    expect(
      EventReportSchema.safeParse({
        ...baseLink,
        attendance_proof_url: 'http://docs.google.com/spreadsheets/d/123',
      }).success
    ).toBe(false);
  });

  it('menolak tanggal salah format atau jumlah peserta negatif', () => {
    expect(EventReportSchema.safeParse({ ...baseLink, event_date: '10-11-2026' }).success).toBe(false);
    expect(EventReportSchema.safeParse({ ...baseLink, participant_count: -1 }).success).toBe(false);
  });
});

describe('EventReportReviewSchema', () => {
  it('mewajibkan catatan minimal 5 karakter saat meminta revisi', () => {
    expect(EventReportReviewSchema.safeParse({ decision: 'approve' }).success).toBe(true);
    expect(EventReportReviewSchema.safeParse({ decision: 'revise', note: 'Kurang' }).success).toBe(true);
    expect(EventReportReviewSchema.safeParse({ decision: 'revise', note: 'No' }).success).toBe(false);
  });
});

