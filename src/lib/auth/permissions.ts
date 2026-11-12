import type { ArticleStatus, DivisionCode, GalleryStatus, Role } from '@/types';
import { hasMinRole } from '@/lib/auth/roles';

/**
 * Aturan wewenang Tahap 2 (murni, tanpa I/O) agar bisa diuji dan dipakai
 * di server (penegakan) maupun client (menyembunyikan tombol).
 */

export interface Actor {
  uid: string;
  role: Role;
  division_code?: DivisionCode | null;
}

export const isPresidiumUp = (a: Actor): boolean => hasMinRole(a.role, 'master_presidium');
export const isKadivUp = (a: Actor): boolean => hasMinRole(a.role, 'admin_kadiv');

// ---------------------------------------------------------------- Periode & struktur

export const canManagePeriods = (a: Actor): boolean => isPresidiumUp(a);

/** Tambah, hapus, nonaktifkan pengurus + tetapkan Kepala Divisi. */
export const canManageBoardStructure = (a: Actor): boolean => isPresidiumUp(a);

/** Ubah jabatan, urutan, foto, sosmed. Kadiv: divisinya. Kadiv HRD: lintas divisi. */
export function canEditBoardMember(a: Actor, targetDivision: DivisionCode): boolean {
  if (isPresidiumUp(a)) return true;
  if (a.role === 'admin_kadiv') {
    return a.division_code === 'HRD' || a.division_code === targetDivision;
  }
  return false;
}

// ---------------------------------------------------------------- Artikel

export interface ArticleRef {
  author_id: string;
  author_role?: Role;
  division_code: DivisionCode;
  status: ArticleStatus;
}

/** Presidium/Creator: semua. Penulis: selama belum terbit. */
export function canEditArticle(a: Actor, art: ArticleRef): boolean {
  if (isPresidiumUp(a)) return true;
  return art.author_id === a.uid && art.status !== 'PUBLISHED';
}

export const canDeleteArticle = canEditArticle;

/** Hanya Presidium/Creator yang boleh menerbitkan tanpa review. */
export const canPublishArticleDirectly = (a: Actor): boolean => isPresidiumUp(a);

export const canUnpublishArticle = (a: Actor): boolean => isPresidiumUp(a);

export const canSetArticleFeatured = (a: Actor): boolean => isPresidiumUp(a);

/** Penulis mengirim artikelnya sendiri dari Draft/Rejected ke Pending Review. */
export function canSubmitArticle(a: Actor, art: ArticleRef): boolean {
  return art.author_id === a.uid && (art.status === 'DRAFT' || art.status === 'REJECTED');
}

/**
 * Yang boleh menerbitkan/menolak artikel berstatus Pending Review:
 * - Presidium/Creator: semua artikel.
 * - Kadiv: hanya artikel ANGGOTA di divisinya (bukan miliknya sendiri).
 *   Artikel milik Kadiv wajib disetujui Presidium.
 */
export function canReviewArticle(a: Actor, art: ArticleRef): boolean {
  if (art.status !== 'PENDING_REVIEW') return false;
  if (isPresidiumUp(a)) return true;
  if (a.role !== 'admin_kadiv') return false;
  return (
    art.division_code === a.division_code &&
    art.author_id !== a.uid &&
    (art.author_role ?? 'member') === 'member'
  );
}

// ---------------------------------------------------------------- Galeri

/**
 * Menyetujui/menerbitkan album:
 * - Presidium/Creator: semua.
 * - Kadiv MEDIA: lintas divisi.
 * - Kadiv lain: hanya album divisinya.
 */
export function canApproveGallery(a: Actor, galleryDivision: DivisionCode): boolean {
  if (isPresidiumUp(a)) return true;
  if (a.role !== 'admin_kadiv') return false;
  return a.division_code === 'MEDIA' || a.division_code === galleryDivision;
}

export interface GalleryRef {
  uploaded_by: string;
  division_code: DivisionCode;
  status: GalleryStatus;
}

export function canEditGallery(a: Actor, g: GalleryRef): boolean {
  if (canApproveGallery(a, g.division_code)) return true;
  return g.uploaded_by === a.uid && g.status === 'PENDING';
}

/** Hapus: Presidium/Creator; pengunggah boleh menghapus album miliknya yang masih Pending. */
export function canDeleteGallery(a: Actor, g: GalleryRef): boolean {
  if (isPresidiumUp(a)) return true;
  return g.uploaded_by === a.uid && g.status === 'PENDING';
}

// ---------------------------------------------------------------- Event & SPM

/**
 * Kelola Event/SPM:
 * - Presidium & Creator: Semua kegiatan.
 * - Kadiv: Kegiatan di divisinya (Kadiv Edukasi untuk SPM).
 */
export function canManageEvent(a: Actor, eventDivision?: DivisionCode | null): boolean {
  if (isPresidiumUp(a)) return true;
  if (a.role === 'admin_kadiv') {
    return !eventDivision || a.division_code === eventDivision;
  }
  return false;
}

/**
 * Lihat peserta & data pendaftaran:
 * - Presidium & Creator: Semua kegiatan.
 * - Anggota & Kadiv: Kegiatan di divisinya.
 */
export function canViewEventRegistrations(a: Actor, eventDivision?: DivisionCode | null): boolean {
  if (isPresidiumUp(a)) return true;
  return !eventDivision || a.division_code === eventDivision;
}

/**
 * Catat kehadiran peserta:
 * - Presidium & Creator: Bebas.
 * - Anggota & Kadiv: Kegiatan divisinya.
 */
export function canMarkAttendance(a: Actor, eventDivision?: DivisionCode | null): boolean {
  return canViewEventRegistrations(a, eventDivision);
}

// ---------------------------------------------------------------- Kalender & Pengumuman Pengurus

/**
 * Kelola Jadwal Kalender & Papan Pengumuman:
 * - Creator
 * - Presidium (Ketua Umum, Sekretaris, Wakil Sekretaris)
 * - Khusus posisi Sekretaris & Wakil Sekretaris (Sekre & Wasekre)
 */
export function canManageCalendarAndAnnouncements(user: { role: Role; position_title?: string }): boolean {
  if (user.role === 'creator' || user.role === 'master_presidium') return true;
  const pos = (user.position_title || '').toLowerCase();
  return (
    pos.includes('sekretaris') ||
    pos.includes('sekre') ||
    pos.includes('wasekre') ||
    pos.includes('wakil sekretaris')
  );
}



