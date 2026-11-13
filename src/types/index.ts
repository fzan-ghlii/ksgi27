// ========================================================
// GIBEI UNIMED - Core Domain Types & ERD Entities
// ========================================================

export type Role = 'public' | 'member' | 'admin_kadiv' | 'master_presidium' | 'creator';

export type DivisionCode = 
  | 'PRESIDIUM'
  | 'KEGIATAN'
  | 'INVESTASI'
  | 'HRD'
  | 'MEDIA'
  | 'GALERI'
  | 'EDUKASI';

export type InviteStatus = 'PENDING' | 'USED' | 'EXPIRED' | 'REVOKED';

export interface ActivationInvite {
  token: string;
  target_role: 'member' | 'admin_kadiv' | 'master_presidium';
  period_id: string;
  division_id: string;
  division_code: DivisionCode;
  assigned_position: string;
  recipient_name_hint?: string;
  status: InviteStatus;
  created_by: string; // UID
  created_by_email?: string;
  used_by_uid?: string | null;
  expires_at: string; // ISO string for easy JSON transport
  created_at: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  full_name: string;
  nim: string;
  faculty_major: string;
  phone_whatsapp: string;
  avatar_url?: string;
  role: Role;
  division_id?: string | null;
  division_code?: DivisionCode | null;
  position_title?: string;
  period_id?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface Period {
  id: string; // e.g. "2026-2027"
  cabinet_name?: string; // e.g. "Kabinet Kolaborasi Inklusif" (opsional)
  year_range: string; // "2026/2027"
  vision?: string;
  missions?: string[];
  is_current: boolean;
  created_at: string;
}

export interface Division {
  id: string;
  period_id: string;
  code: DivisionCode;
  name: string;
  slug: string;
  description: string;
  head_user_id?: string | null;
  order_index: number;
}

export interface BoardMember {
  id: string;
  period_id: string;
  division_id: string;
  division_code: DivisionCode;
  user_id: string; // '' jika pengurus ditambahkan manual tanpa akun
  full_name: string;
  position_title: string;
  order_index: number;
  photo_url?: string;
  bio?: string;
  social_links?: {
    linkedin?: string;
    instagram?: string;
  };
  /** undefined dianggap aktif (data Tahap 1 belum punya field ini) */
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface EventAndSpm {
  id: string;
  category_type?: 'SPM' | 'SEMINAR' | 'COMPETITION' | 'WORKPROGRAM';
  category: 'SPM' | 'EVENT';
  spm_level?: 'Level 1' | 'Level 2' | 'Level Lanjutan - Fundamental' | 'Level Lanjutan - Teknikal' | 'Level 3' | 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'NONE' | string | null;
  division_id: string;
  division_code: DivisionCode;
  period_id?: string;
  title: string;
  slug: string;
  description: string;
  poster_url?: string;
  banner_url?: string;
  start_date?: string;
  end_date?: string;
  event_date: string;
  registration_deadline: string;
  location_type?: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  location_detail?: string;
  location_or_link?: string;
  quota: number;
  registered_count: number;
  registration_mode: 'INTERNAL_FORM' | 'EXTERNAL_GFORM';
  gform_url?: string;
  external_gform_url?: string;
  spreadsheet_id?: string;
  sheet_tab_name?: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'COMPLETED';
  is_published?: boolean;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface Registration {
  id: string;
  event_id: string;
  participant_name: string;
  full_name?: string;
  participant_email: string;
  email?: string;
  participant_nim: string;
  nim?: string;
  participant_phone: string;
  whatsapp?: string;
  institution_faculty: string;
  institution?: string;
  has_rdn: boolean;
  attendance_status: 'Registered' | 'Attended' | 'Absent' | 'REGISTERED' | 'ATTENDED' | 'ABSENT';
  notes?: string;
  synced_to_sheet: boolean;
  registered_at: string;
}

export type ArticleStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED';
export type GalleryStatus = 'PENDING' | 'PUBLISHED';

export interface Article {
  id: string;
  title: string;
  slug: string;
  thumbnail_url?: string;
  content: string; // Markdown
  category: string;
  tags: string[];
  author_id: string;
  author_name: string;
  author_role?: Role;
  author_position?: string;
  division_id: string;
  division_code: DivisionCode;
  reviewer_id?: string | null;
  review_note?: string | null;
  status: ArticleStatus;
  is_featured?: boolean;
  reading_minutes?: number;
  view_count: number;
  submitted_at?: string | null;
  published_at?: string | null;
  created_at?: string;
  updated_at: string;
}

export interface Gallery {
  id: string;
  title: string;
  caption: string;
  image_urls: string[];
  period_id: string;
  division_id: string;
  division_code: DivisionCode;
  event_id?: string | null;
  uploaded_by: string;
  uploader_name?: string;
  status: GalleryStatus;
  activity_date: string;
  published_at?: string | null;
  approved_by?: string | null;
  created_at: string;
  updated_at?: string;
}

export type HeroBlurLevel = 'soft' | 'medium' | 'strong';

export interface HeroCarouselSlide {
  id: string;
  image_url: string;
  alt_text?: string;
  caption?: string;
  width: number;
  height: number;
  is_active: boolean;
  created_at: string;
}

export interface HeroCarouselConfig {
  slides: HeroCarouselSlide[];
  autoplay_seconds: number;
  blur_level: HeroBlurLevel;
  overlay_opacity: number;
  updated_at: string;
  updated_by: string;
  updated_by_name?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'NORMAL' | 'IMPORTANT' | 'URGENT';
  target_audience?: 'ALL' | 'KADIV' | 'PRESIDIUM';
  event_date?: string;
  author_id: string;
  author_name: string;
  author_position: string;
  pinned: boolean;
  created_at: string;
}

export type PiketDay = 'SENIN' | 'SELASA' | 'RABU' | 'KAMIS' | 'JUMAT';
export type PiketSession = 'PAGI' | 'SIANG';
export type PiketVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PiketLocationStatus = 'IN_AREA' | 'OUT_OF_AREA';
export type PiketTimeStatus = 'TEPAT_WAKTU' | 'LEBIH_AWAL' | 'TERLAMBAT' | 'DI_LUAR_SESI';

export interface PiketSettings {
  location_name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  enforce_radius: boolean;
  enforce_schedule: boolean;
  updated_at: string;
  updated_by: string;
  updated_by_name?: string;
}

export interface PiketScheduleEntry {
  id: string;
  period_id: string;
  day: PiketDay;
  session: PiketSession;
  user_id: string; // UID akun bila sudah aktivasi, atau '' jika belum
  board_member_id: string; // ID dokumen board_members atau ''
  member_name: string;
  division_code: DivisionCode;
  position_title: string;
  role: Role;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface PiketAttendance {
  id: string;
  period_id: string;
  schedule_id?: string | null;
  user_id: string;
  user_name: string;
  user_email: string;
  division_code: DivisionCode | string;
  position_title: string;
  date: string; // YYYY-MM-DD (Asia/Jakarta)
  day: PiketDay | 'SABTU' | 'MINGGU';
  session: PiketSession;
  checked_in_at: string; // ISO
  checked_in_wib: string; // e.g. "08:15 WIB"
  photo_url: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number;
  distance_meters: number;
  location_status: PiketLocationStatus;
  time_status: PiketTimeStatus;
  is_scheduled_match: boolean;
  notes?: string;
  verification_status: PiketVerificationStatus;
  verified_by?: string | null;
  verified_by_name?: string | null;
  verified_at?: string | null;
  verification_note?: string | null;
  supervisor_note?: string | null;
  supervisor_name?: string | null;
  supervisor_at?: string | null;
}

export interface PiketEligibleMember {
  key: string; // user_id || board_member_id
  user_id: string;
  board_member_id: string;
  full_name: string;
  division_code: DivisionCode;
  position_title: string;
  role: Role;
  photo_url?: string;
  has_account: boolean;
  is_mandatory_piket: boolean;
}

export interface AuditLog {
  id: string;
  actor_uid: string;
  actor_email: string;
  actor_role: string;
  actor_name?: string;
  action:
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'PUBLISH'
    | 'REJECT'
    | 'UNPUBLISH'
    | 'SET_ACTIVE_PERIOD'
    | 'ROLE_CHANGE'
    | 'INVITE_GENERATED'
    | 'INVITE_USED'
    | 'INVITE_REVOKED'
    | 'SYNC_SHEET';
  target_collection: string;
  target_id: string;
  target_label?: string;
  target_type?: string;
  summary: string;
  detail?: unknown;
  timestamp: string;
  created_at?: string;
}

export type AuditAction = AuditLog['action'];
export type AuditLogEntry = AuditLog;

// ------------------------------------------------------------------ Prestasi Organisasi

export interface Achievement {
  id: string;
  title: string;
  level: string;
  year: number;
  organizer: string;
  category?: string;
  description?: string;
  image_url?: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------------ Pelaporan Kegiatan

export type EventAttendanceProofType = 'PDF' | 'LINK';
export type EventReportStatus = 'SUBMITTED' | 'APPROVED' | 'REVISION_NEEDED';

export interface EventReport {
  id: string;
  event_id: string;
  division_code: DivisionCode;
  event_title: string;
  event_date: string;
  participant_count: number;
  location: string;
  attendance_proof_type: EventAttendanceProofType;
  attendance_proof_url: string;
  attendance_proof_name?: string;
  notes?: string;
  status: EventReportStatus;
  submitted_by: string;
  submitted_by_name: string;
  submitted_by_position?: string;
  submitted_at: string;
  reviewed_by?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  updated_at: string;
}

