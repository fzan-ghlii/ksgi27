import { DivisionCode } from '@/types';

export interface DivisionMeta {
  code: DivisionCode;
  name: string;
  slug: string;
  shortDesc: string;
  order: number;
}

export const OFFICIAL_DIVISIONS: Record<DivisionCode, DivisionMeta> = {
  PRESIDIUM: {
    code: 'PRESIDIUM',
    name: 'Presidium Inti',
    slug: 'presidium',
    shortDesc: 'Pimpinan tertinggi organisasi dan penanggung jawab kebijakan umum GIBEI UNIMED.',
    order: 0,
  },
  KEGIATAN: {
    code: 'KEGIATAN',
    name: 'Divisi Kegiatan',
    slug: 'kegiatan',
    shortDesc: 'Pelaksana event, seminar pasar modal, perlombaan investasi, dan program kerja umum.',
    order: 1,
  },
  INVESTASI: {
    code: 'INVESTASI',
    name: 'Divisi Investasi',
    slug: 'investasi',
    shortDesc: 'Riset pasar modal, analisis emiten fundamental & teknikal, serta edukasi portofolio.',
    order: 2,
  },
  HRD: {
    code: 'HRD',
    name: 'Divisi HRD',
    slug: 'hrd',
    shortDesc: 'Pengembangan sumber daya manusia, kaderisasi, database pengurus, dan distribusi undangan aktivasi.',
    order: 3,
  },
  MEDIA: {
    code: 'MEDIA',
    name: 'Divisi Media',
    slug: 'media',
    shortDesc: 'Publikasi informasi pasar modal, penulisan artikel edukatif, dan branding digital organisasi.',
    order: 4,
  },
  GALERI: {
    code: 'GALERI',
    name: 'Divisi Galeri',
    slug: 'galeri',
    shortDesc: 'Operasional harian Galeri Investasi BEI UNIMED dan dokumentasi visual kegiatan pasar modal.',
    order: 5,
  },
  EDUKASI: {
    code: 'EDUKASI',
    name: 'Divisi Edukasi',
    slug: 'edukasi',
    shortDesc: 'Penyelenggara Sekolah Pasar Modal (SPM Level 1, 2, 3) dan kurikulum literasi keuangan kampus.',
    order: 6,
  },
};

export const DIVISION_LIST = Object.values(OFFICIAL_DIVISIONS).sort((a, b) => a.order - b.order);
export const PUBLIC_DIVISIONS = DIVISION_LIST.filter(d => d.code !== 'PRESIDIUM');

export const DIVISION_CODES = [
  'PRESIDIUM',
  'KEGIATAN',
  'INVESTASI',
  'HRD',
  'MEDIA',
  'GALERI',
  'EDUKASI',
] as const satisfies readonly DivisionCode[];

export function divisionDocId(periodId: string, code: DivisionCode): string {
  return `${periodId}_${code.toLowerCase()}`;
}

export function divisionName(code: DivisionCode | string | null | undefined): string {
  if (!code) return '-';
  return OFFICIAL_DIVISIONS[code as DivisionCode]?.name ?? String(code);
}

