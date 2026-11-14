import { z } from 'zod';
import { optionalImageRef } from '@/lib/schemas/content';

export const CreateInviteSchema = z.object({
  target_role: z.enum(['member', 'admin_kadiv', 'master_presidium']),
  division_code: z.enum([
    'PRESIDIUM',
    'KEGIATAN',
    'INVESTASI',
    'HRD',
    'MEDIA',
    'GALERI',
    'EDUKASI',
  ]),
  period_id: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{1,128}$/, 'Format ID periode tidak valid.')
    .optional(),
  assigned_position: z.string().min(3, 'Nama jabatan minimal 3 karakter'),
  recipient_name_hint: z.string().optional(),
  expires_in_days: z.coerce.number().min(1).max(30).default(7),
});

export type CreateInviteInput = z.infer<typeof CreateInviteSchema>;

export const CompleteActivationSchema = z.object({
  token: z.string().min(1, 'Token aktivasi wajib disertakan'),
  id_token: z.string().min(1, 'Autentikasi Firebase diperlukan'),
  full_name: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  nim: z.string().min(5, 'NIM minimal 5 karakter'),
  faculty_major: z.string().min(3, 'Fakultas / Program Studi wajib diisi'),
  phone_whatsapp: z.string().min(9, 'Nomor WhatsApp valid diperlukan (minimal 9 digit)'),
  avatar_url: optionalImageRef,
});

export type CompleteActivationInput = z.infer<typeof CompleteActivationSchema>;
