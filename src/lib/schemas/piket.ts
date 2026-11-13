import { z } from 'zod';
import { PIKET_DAY_CODES, PIKET_SESSION_CODES } from '@/lib/utils/piket';
import { imageRefSchema } from '@/lib/schemas/content';

export const PiketScheduleAssignSchema = z.object({
  period_id: z.string().trim().min(1, 'Periode wajib dipilih.'),
  day: z.enum(PIKET_DAY_CODES, { message: 'Hari piket harus Senin hingga Jumat.' }),
  session: z.enum(PIKET_SESSION_CODES, { message: 'Sesi piket harus Pagi atau Siang.' }),
  member_key: z.string().trim().min(1, 'Pengurus wajib dipilih.'),
});
export type PiketScheduleAssignInput = z.infer<typeof PiketScheduleAssignSchema>;

export const PiketAttendanceInputSchema = z.object({
  session: z.enum(PIKET_SESSION_CODES, { message: 'Pilih sesi Pagi atau Siang.' }),
  photo_url: imageRefSchema,
  latitude: z.number().min(-90, 'Koordinat latitude tidak valid.').max(90, 'Koordinat latitude tidak valid.'),
  longitude: z.number().min(-180, 'Koordinat longitude tidak valid.').max(180, 'Koordinat longitude tidak valid.'),
  accuracy_meters: z.number().min(0).max(50000).optional().default(0),
  notes: z.string().trim().max(400, 'Catatan piket maksimal 400 karakter.').optional().default(''),
});
export type PiketAttendanceInput = z.infer<typeof PiketAttendanceInputSchema>;

export const PiketVerifyInputSchema = z.object({
  verification_status: z.enum(['PENDING', 'APPROVED', 'REJECTED'], {
    message: 'Status verifikasi tidak valid.',
  }),
  verification_note: z.string().trim().max(400).optional().default(''),
});
export type PiketVerifyInput = z.infer<typeof PiketVerifyInputSchema>;

export const PiketSupervisorNoteSchema = z.object({
  supervisor_note: z
    .string()
    .trim()
    .min(2, 'Catatan pengawas minimal 2 karakter.')
    .max(500, 'Catatan pengawas maksimal 500 karakter.'),
});
export type PiketSupervisorNoteInput = z.infer<typeof PiketSupervisorNoteSchema>;

export const PiketSettingsInputSchema = z.object({
  location_name: z.string().trim().min(3, 'Nama lokasi minimal 3 karakter.').max(120),
  latitude: z.number().min(-90, 'Latitude tidak valid.').max(90, 'Latitude tidak valid.'),
  longitude: z.number().min(-180, 'Longitude tidak valid.').max(180, 'Longitude tidak valid.'),
  radius_meters: z
    .number()
    .int('Radius harus bilangan bulat.')
    .min(20, 'Radius minimal 20 meter.')
    .max(5000, 'Radius maksimal 5000 meter.'),
  enforce_radius: z.boolean(),
  enforce_schedule: z.boolean(),
});
export type PiketSettingsInput = z.infer<typeof PiketSettingsInputSchema>;

