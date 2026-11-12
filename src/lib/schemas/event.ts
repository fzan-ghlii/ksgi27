import { z } from 'zod';
import { DIVISION_CODES } from '@/lib/constants/divisions';
import { optionalImageRef } from '@/lib/schemas/content';
import { SLUG_PATTERN } from '@/lib/utils/content';

export const EVENT_CATEGORIES = ['SPM', 'EVENT'] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const SPM_LEVELS = [
  'Level 1',
  'Level 2',
  'Level Lanjutan - Fundamental',
  'Level Lanjutan - Teknikal',
  'Level 3',
] as const;
export type SpmLevel = (typeof SPM_LEVELS)[number];

export const SPM_LEVEL_INFO: Record<string, { label: string; desc: string }> = {
  'Level 1': {
    label: 'Level 1: Pengenalan Investasi',
    desc: 'Pengenalan dasar investasi, pasar modal, dan perencanaan keuangan.',
  },
  'Level 2': {
    label: 'Level 2: Belajar tentang Saham',
    desc: 'Mekanisme perdagangan saham, pembukaan RDN, dan dasar instrumen saham.',
  },
  'Level Lanjutan - Fundamental': {
    label: 'Level Lanjutan: Analisis Fundamental',
    desc: 'Analisis laporan keuangan, rasio valuasi, dan prospek bisnis emiten.',
  },
  'Level Lanjutan - Teknikal': {
    label: 'Level Lanjutan: Analisis Teknikal',
    desc: 'Analisis grafik harga, chart patterns, indikator teknikal, dan timing entry/exit.',
  },
  'Level 3': {
    label: 'Level Lanjutan: Analisis Lanjutan',
    desc: 'Praktik portofolio dan strategi investasi.',
  },
};

export const REGISTRATION_MODES = ['INTERNAL_FORM', 'EXTERNAL_GFORM'] as const;
export type RegistrationMode = (typeof REGISTRATION_MODES)[number];

export const LOCATION_TYPES = ['ONLINE', 'OFFLINE', 'HYBRID'] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export const EVENT_STATUSES = ['DRAFT', 'OPEN', 'CLOSED', 'COMPLETED'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const ATTENDANCE_STATUSES = ['Registered', 'Attended', 'Absent'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

const divisionCode = z.enum(DIVISION_CODES, { message: 'Divisi tidak valid.' });

const httpUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^https?:\/\//i.test(v), 'Tautan harus diawali http:// atau https://');

const optionalHttpUrl = z.union([z.literal(''), httpUrl]).optional();

export const EventBaseSchema = z.object({
  title: z.string().trim().min(5, 'Judul kegiatan minimal 5 karakter.').max(150),
  slug: z
    .union([
      z.literal(''),
      z
        .string()
        .trim()
        .max(160)
        .regex(SLUG_PATTERN, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung (-).'),
    ])
    .optional(),
  description: z.string().trim().min(20, 'Deskripsi kegiatan minimal 20 karakter.').max(5000),
  category: z.enum(EVENT_CATEGORIES, { message: 'Kategori harus SPM atau EVENT.' }),
  spm_level: z.enum(SPM_LEVELS).nullable().optional(),
  division_code: divisionCode,
  period_id: z.string().trim().min(1, 'Periode wajib dipilih.'),
  banner_url: optionalImageRef,
  location_type: z.enum(LOCATION_TYPES, { message: 'Jenis lokasi tidak valid.' }),
  location_detail: z.string().trim().min(3, 'Detail lokasi/tautan minimal 3 karakter.').max(300),
  event_date: z.string().trim().min(10, 'Tanggal kegiatan wajib diisi.'), // ISO string or YYYY-MM-DD
  registration_deadline: z.string().trim().min(10, 'Batas pendaftaran wajib diisi.'),
  quota: z.coerce.number().int().min(1, 'Kuota minimal 1 peserta.').max(10000, 'Kuota maksimal 10.000.'),
  registration_mode: z.enum(REGISTRATION_MODES, { message: 'Mode pendaftaran tidak valid.' }),
  external_gform_url: optionalHttpUrl,
  spreadsheet_id: z.string().trim().max(120).optional().default(''),
  sheet_tab_name: z.string().trim().max(100).optional().default('Pendaftar'),
  status: z.enum(EVENT_STATUSES).optional().default('OPEN'),
  is_published: z.boolean().optional().default(true),
});

export const EventInputSchema = EventBaseSchema.refine(
  (data) => {
    if (data.category === 'SPM' && !data.spm_level) {
      return false;
    }
    return true;
  },
  { message: 'Kegiatan Sekolah Pasar Modal (SPM) wajib memilih Level SPM.', path: ['spm_level'] }
).refine(
  (data) => {
    if (data.registration_mode === 'EXTERNAL_GFORM' && (!data.external_gform_url || data.external_gform_url === '')) {
      return false;
    }
    return true;
  },
  { message: 'Tautan Google Form wajib diisi jika mode pendaftaran eksternal dipilih.', path: ['external_gform_url'] }
);

export type EventInput = z.infer<typeof EventInputSchema>;

export const EventUpdateSchema = EventBaseSchema.partial();
export type EventUpdateInput = z.infer<typeof EventUpdateSchema>;

// ------------------------------------------------------------------ Pendaftaran Peserta (Data Teks)

export const PHONE_REGEX = /^(?:\+62|62|0)[0-9\s-]{8,18}$/;

export const EventRegisterSchema = z.object({
  full_name: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter.').max(100),
  email: z.string().trim().email('Alamat email tidak valid.').max(120),
  nim: z
    .string()
    .trim()
    .min(5, 'NIM/Identitas minimal 5 karakter.')
    .max(30)
    .regex(/^[A-Za-z0-9._-]+$/, 'NIM hanya boleh huruf, angka, titik, strip atau underscore.'),
  whatsapp: z
    .string()
    .trim()
    .regex(PHONE_REGEX, 'Nomor WhatsApp tidak valid (contoh: 08123456789 atau +62812...).'),
  institution: z
    .string()
    .trim()
    .min(2, 'Fakultas / Program Studi / Instansi minimal 2 karakter.')
    .max(150),
  has_rdn: z.boolean().optional().default(false),
  notes: z.string().trim().max(400).optional().default(''),
});

export type EventRegisterInput = z.infer<typeof EventRegisterSchema>;

// ------------------------------------------------------------------ Attendance Schema

export const AttendanceUpdateSchema = z.object({
  registration_id: z.string().trim().min(1, 'ID registrasi wajib diisi.'),
  attendance_status: z.enum(ATTENDANCE_STATUSES, { message: 'Status kehadiran tidak valid.' }),
});

export type AttendanceUpdateInput = z.infer<typeof AttendanceUpdateSchema>;

// ------------------------------------------------------------------ Webhook Google Form Payload

export const GFormWebhookSchema = z.object({
  secret_token: z.string().trim().min(1, 'Secret token wajib disertakan.'),
  event_id: z.string().trim().optional(),
  event_slug: z.string().trim().optional(),
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(120),
  nim: z.string().trim().min(4).max(30),
  whatsapp: z.string().trim().min(8).max(25),
  institution: z.string().trim().min(2).max(150),
  has_rdn: z.union([z.boolean(), z.string()]).transform((v) => {
    if (typeof v === 'boolean') return v;
    const s = String(v).toLowerCase().trim();
    return s === 'ya' || s === 'true' || s === 'sudah' || s === 'punya' || s === '1';
  }),
  notes: z.string().trim().max(400).optional().default(''),
});

export type GFormWebhookInput = z.infer<typeof GFormWebhookSchema>;
