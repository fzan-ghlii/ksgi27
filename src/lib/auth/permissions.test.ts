import { describe, it, expect } from 'vitest';
import {
  canManagePeriods,
  canManageBoardStructure,
  canEditBoardMember,
  canEditArticle,
  canDeleteArticle,
  canSubmitArticle,
  canReviewArticle,
  canPublishArticleDirectly,
  canUnpublishArticle,
  canApproveGallery,
  canEditGallery,
  canDeleteGallery,
  canManagePiket,
  canSupervisePiket,
  canViewAllPiketReports,
  canSubmitPiketAttendance,
  canManageHeroCarousel,
  canAccessEventDashboard,
  canMarkEventCompleted,
  canSubmitEventReport,
  canReviewEventReport,
  canManageAchievements,
  type Actor,
  type PiketActor,
  type ArticleRef,
} from './permissions';

const member: Actor = { uid: 'm1', role: 'member', division_code: 'EDUKASI' };
const kadivEdu: Actor = { uid: 'k1', role: 'admin_kadiv', division_code: 'EDUKASI' };
const kadivHrd: Actor = { uid: 'k2', role: 'admin_kadiv', division_code: 'HRD' };
const kadivMedia: Actor = { uid: 'k3', role: 'admin_kadiv', division_code: 'MEDIA' };
const kadivGaleri: Actor = { uid: 'k4', role: 'admin_kadiv', division_code: 'GALERI' };
const presidium: Actor = { uid: 'p1', role: 'master_presidium', division_code: 'PRESIDIUM' };
const creator: Actor = { uid: 'c1', role: 'creator', division_code: null };

const art = (over: Partial<ArticleRef> = {}): ArticleRef => ({
  author_id: 'm1',
  author_role: 'member',
  division_code: 'EDUKASI',
  status: 'DRAFT',
  ...over,
});

describe('Periode & struktur', () => {
  it('hanya Presidium & Creator yang kelola periode dan struktur', () => {
    expect(canManagePeriods(creator)).toBe(true);
    expect(canManagePeriods(presidium)).toBe(true);
    expect(canManagePeriods(kadivHrd)).toBe(false);
    expect(canManageBoardStructure(kadivEdu)).toBe(false);
    expect(canManageBoardStructure(member)).toBe(false);
  });

  it('Kadiv edit pengurus divisinya, HRD lintas divisi', () => {
    expect(canEditBoardMember(kadivEdu, 'EDUKASI')).toBe(true);
    expect(canEditBoardMember(kadivEdu, 'MEDIA')).toBe(false);
    expect(canEditBoardMember(kadivHrd, 'MEDIA')).toBe(true);
    expect(canEditBoardMember(presidium, 'GALERI')).toBe(true);
    expect(canEditBoardMember(member, 'EDUKASI')).toBe(false);
  });
});

describe('Artikel', () => {
  it('penulis hanya edit/hapus miliknya yang belum terbit', () => {
    expect(canEditArticle(member, art())).toBe(true);
    expect(canEditArticle(member, art({ status: 'REJECTED' }))).toBe(true);
    expect(canEditArticle(member, art({ status: 'PUBLISHED' }))).toBe(false);
    expect(canEditArticle(member, art({ author_id: 'lain' }))).toBe(false);
    expect(canDeleteArticle(member, art({ status: 'PUBLISHED' }))).toBe(false);
  });

  it('Presidium & Creator kontrol penuh', () => {
    expect(canEditArticle(presidium, art({ author_id: 'x', status: 'PUBLISHED' }))).toBe(true);
    expect(canDeleteArticle(creator, art({ author_id: 'x', status: 'PUBLISHED' }))).toBe(true);
    expect(canPublishArticleDirectly(presidium)).toBe(true);
    expect(canUnpublishArticle(creator)).toBe(true);
    expect(canPublishArticleDirectly(kadivEdu)).toBe(false);
    expect(canUnpublishArticle(kadivEdu)).toBe(false);
  });

  it('hanya penulis yang mengirim Draft/Rejected ke review', () => {
    expect(canSubmitArticle(member, art())).toBe(true);
    expect(canSubmitArticle(member, art({ status: 'REJECTED' }))).toBe(true);
    expect(canSubmitArticle(member, art({ status: 'PENDING_REVIEW' }))).toBe(false);
    expect(canSubmitArticle(kadivEdu, art())).toBe(false);
  });

  it('Kadiv review artikel anggota divisinya saja', () => {
    const pending = art({ status: 'PENDING_REVIEW' });
    expect(canReviewArticle(kadivEdu, pending)).toBe(true);
    expect(canReviewArticle(kadivMedia, pending)).toBe(false); // divisi lain
    expect(canReviewArticle(member, pending)).toBe(false);
    expect(canReviewArticle(kadivEdu, art({ status: 'DRAFT' }))).toBe(false);
  });

  it('artikel milik Kadiv wajib disetujui Presidium', () => {
    const kadivOwn = art({
      author_id: 'k1',
      author_role: 'admin_kadiv',
      status: 'PENDING_REVIEW',
    });
    expect(canReviewArticle(kadivEdu, kadivOwn)).toBe(false); // tidak boleh self-approve
    expect(canReviewArticle(kadivHrd, { ...kadivOwn, division_code: 'HRD', author_id: 'k1x' })).toBe(false);
    expect(canReviewArticle(presidium, kadivOwn)).toBe(true);
    expect(canReviewArticle(creator, kadivOwn)).toBe(true);
  });
});

describe('Galeri', () => {
  it('Kadiv MEDIA lintas divisi, Kadiv lain hanya divisinya', () => {
    expect(canApproveGallery(kadivMedia, 'EDUKASI')).toBe(true);
    expect(canApproveGallery(kadivEdu, 'EDUKASI')).toBe(true);
    expect(canApproveGallery(kadivEdu, 'MEDIA')).toBe(false);
    expect(canApproveGallery(kadivGaleri, 'EDUKASI')).toBe(false); // bukan MEDIA
    expect(canApproveGallery(presidium, 'KEGIATAN')).toBe(true);
    expect(canApproveGallery(member, 'EDUKASI')).toBe(false);
  });

  it('anggota edit/hapus album miliknya hanya saat Pending', () => {
    const g = { uploaded_by: 'm1', division_code: 'EDUKASI' as const, status: 'PENDING' as const };
    expect(canEditGallery(member, g)).toBe(true);
    expect(canDeleteGallery(member, g)).toBe(true);
    expect(canEditGallery(member, { ...g, status: 'PUBLISHED' })).toBe(false);
    expect(canDeleteGallery(member, { ...g, status: 'PUBLISHED' })).toBe(false);
    expect(canDeleteGallery(kadivMedia, g)).toBe(false); // hapus = Presidium/Creator
    expect(canDeleteGallery(presidium, { ...g, status: 'PUBLISHED' })).toBe(true);
  });
});

describe('Piket Galeri & Pengawasan', () => {
  const wakadivGaleri: PiketActor = {
    uid: 'wg1',
    role: 'member',
    division_code: 'GALERI',
    position_title: 'Wakil Kepala Divisi Galeri',
  };
  const stafGaleri: PiketActor = {
    uid: 'sg1',
    role: 'member',
    division_code: 'GALERI',
    position_title: 'Staf Divisi Galeri',
  };

  it('hanya Kadiv & Wakadiv Galeri (+ Creator) yang mengelola jadwal dan laporan piket', () => {
    expect(canManagePiket(kadivGaleri)).toBe(true);
    expect(canManagePiket(wakadivGaleri)).toBe(true);
    expect(canManagePiket(creator)).toBe(true);

    expect(canManagePiket(stafGaleri)).toBe(false);
    expect(canManagePiket(kadivEdu)).toBe(false);
    expect(canManagePiket(member)).toBe(false);
    expect(canManagePiket(presidium)).toBe(false);
  });

  it('Presidium bertugas sebagai pengawas dan dapat melihat semua laporan', () => {
    expect(canSupervisePiket(presidium)).toBe(true);
    expect(canViewAllPiketReports(presidium)).toBe(true);
    expect(canViewAllPiketReports(kadivGaleri)).toBe(true);
    expect(canViewAllPiketReports(wakadivGaleri)).toBe(true);
    expect(canViewAllPiketReports(member)).toBe(false);
    expect(canViewAllPiketReports(kadivMedia)).toBe(false);
  });

  it('semua pengurus selain Presidium wajib melakukan absen piket termasuk Kadiv/Wakadiv Galeri', () => {
    expect(canSubmitPiketAttendance(member)).toBe(true);
    expect(canSubmitPiketAttendance(kadivEdu)).toBe(true);
    expect(canSubmitPiketAttendance(kadivGaleri)).toBe(true);
    expect(canSubmitPiketAttendance(wakadivGaleri)).toBe(true);
    expect(canSubmitPiketAttendance(stafGaleri)).toBe(true);

    expect(canSubmitPiketAttendance(presidium)).toBe(false);
  });
});

describe('Carousel Hero Beranda', () => {
  it('hanya Presidium yang dapat mengatur carousel hero beranda', () => {
    expect(canManageHeroCarousel(presidium)).toBe(true);
    expect(canManageHeroCarousel(creator)).toBe(true);
    expect(canManageHeroCarousel(kadivMedia)).toBe(false);
    expect(canManageHeroCarousel(kadivGaleri)).toBe(false);
    expect(canManageHeroCarousel(kadivHrd)).toBe(false);
    expect(canManageHeroCarousel(member)).toBe(false);
  });
});

describe('Pelaporan Kegiatan & Prestasi', () => {
  const wakadivEdu: PiketActor = {
    uid: 'w1',
    role: 'member',
    division_code: 'EDUKASI',
    position_title: 'Wakil Kepala Divisi Edukasi',
  };

  it('Kadiv, Wakadiv divisi terkait, & Presidium boleh tandai selesai & lapor kegiatan', () => {
    expect(canAccessEventDashboard(wakadivEdu)).toBe(true);
    expect(canAccessEventDashboard(member)).toBe(false);

    expect(canMarkEventCompleted(wakadivEdu, 'EDUKASI')).toBe(true);
    expect(canMarkEventCompleted(wakadivEdu, 'MEDIA')).toBe(false);
    expect(canMarkEventCompleted(kadivEdu, 'EDUKASI')).toBe(true);
    expect(canMarkEventCompleted(presidium, 'MEDIA')).toBe(true);
    expect(canMarkEventCompleted(member, 'EDUKASI')).toBe(false);

    expect(canSubmitEventReport(wakadivEdu, 'EDUKASI')).toBe(true);
    expect(canSubmitEventReport(member, 'EDUKASI')).toBe(false);
    expect(canReviewEventReport(presidium)).toBe(true);
    expect(canReviewEventReport(creator)).toBe(true);
    expect(canReviewEventReport(kadivEdu)).toBe(false);
    expect(canReviewEventReport(wakadivEdu)).toBe(false);
  });

  it('hanya Presidium & Creator yang boleh CRUD prestasi', () => {
    expect(canManageAchievements(presidium)).toBe(true);
    expect(canManageAchievements(creator)).toBe(true);
    expect(canManageAchievements(kadivEdu)).toBe(false);
    expect(canManageAchievements(wakadivEdu)).toBe(false);
    expect(canManageAchievements(member)).toBe(false);
  });
});

