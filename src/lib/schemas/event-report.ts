import { z } from 'zod';

export const ATTENDANCE_PROOF_TYPES = ['PDF', 'LINK'] as const;

const PDF_PATH_REGEX = /^\/api\/event-reports\/pdf\/[A-Za-z0-9_-]{1,128}$/;

function isValidHttpsUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export const EventReportSchema = z
  .object({
    event_title: z.string().trim().min(3, 'Nama kegiatan minimal 3 karakter.').max(150),
    event_date: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal pelaksanaan harus berformat YYYY-MM-DD.'),
    participant_count: z.coerce
      .number()
      .int('Jumlah peserta harus berupa angka bulat.')
      .min(0, 'Jumlah peserta tidak boleh negatif.')
      .max(50000, 'Jumlah peserta maksimal 50.000.'),
    location: z.string().trim().min(3, 'Lokasi kegiatan minimal 3 karakter.').max(250),
    attendance_proof_type: z.enum(ATTENDANCE_PROOF_TYPES, {
      message: 'Pilih jenis bukti absensi (PDF atau Link).',
    }),
    attendance_proof_url: z.string().trim().min(1, 'Bukti absensi wajib dilampirkan.').max(600),
    attendance_proof_name: z.string().trim().max(160).optional().default(''),
    notes: z.string().trim().max(1000).optional().default(''),
  })
  .superRefine((val, ctx) => {
    if (val.attendance_proof_type === 'PDF' && !PDF_PATH_REGEX.test(val.attendance_proof_url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['attendance_proof_url'],
        message: 'Berkas bukti absensi harus berupa file PDF yang diunggah.',
      });
    }
    if (val.attendance_proof_type === 'LINK' && !isValidHttpsUrl(val.attendance_proof_url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['attendance_proof_url'],
        message: 'Link bukti absensi (Spreadsheet / Google Form) harus berupa URL https:// yang valid.',
      });
    }
  });

export type EventReportInput = z.infer<typeof EventReportSchema>;

export const EventReportReviewSchema = z
  .object({
    decision: z.enum(['approve', 'revise']),
    note: z.string().trim().max(500).optional().default(''),
  })
  .refine((v) => v.decision === 'approve' || v.note.trim().length >= 5, {
    message: 'Catatan revisi minimal 5 karakter saat meminta perbaikan laporan.',
    path: ['note'],
  });

export type EventReportReviewInput = z.infer<typeof EventReportReviewSchema>;

