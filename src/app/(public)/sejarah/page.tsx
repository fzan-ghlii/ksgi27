import Link from 'next/link';
import {
  History,
  Target,
  Compass,
  CheckCircle2,
  Type,
  Trees,
  Users,
  Star,
  ArrowRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { GibeiLogo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { ORG_VISION, ORG_MISSIONS, ORG_MOTTO, ORG_MOTTO_MEANING } from '@/lib/constants/identity';

export const metadata = {
  title: 'Sejarah, Makna Logo, Visi & Misi | GIBEI UNIMED',
  description:
    'Historikal perjalanan Galeri Investasi BEI Universitas Negeri Medan, filosofi dan makna logo, serta Visi, Misi, dan Motto organisasi.',
};

export default function SejarahGibeiPage() {
  return (
    <div className="py-12 sm:py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl space-y-16 sm:space-y-20">
        {/* Header / Hero */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-line">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cerulean-light text-cerulean-dark text-xs font-bold uppercase tracking-wider border border-cerulean/20">
              <History className="h-3.5 w-3.5" />
              Historikal & Identitas Resmi
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-ink tracking-tight">
              Sejarah, Makna Logo, & Visi Misi GIBEI
            </h1>
            <p className="text-base sm:text-lg text-ink-muted leading-relaxed">
              Mengenal rekam jejak berdirinya Galeri Investasi Bursa Efek Indonesia di Universitas Negeri Medan, nilai-nilai filosofis yang terkandung dalam identitas visual kami, serta visi, misi, dan motto yang memandu langkah organisasi.
            </p>
          </div>

          <div className="flex flex-col items-center p-6 rounded-3xl bg-surface border border-line shadow-xs">
            <GibeiLogo className="h-24 w-24 sm:h-28 sm:w-28 shadow-md shadow-cerulean/25" iconClassName="h-12 w-12" />
            <span className="font-extrabold text-sm text-ink mt-3">GIBEI UNIMED</span>
            <span className="text-[11px] text-ink-muted">Galeri Investasi Bursa Efek Indonesia</span>
          </div>
        </div>

        {/* ========================================================
            BAGIAN 1: HISTORIKAL PERJALANAN GIBEI UNIMED
        ======================================================== */}
        <div className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cerulean uppercase tracking-wider">
              <History className="h-4 w-4" />
              Bagian I
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-ink mt-1">
              Historikal Perjalanan GIBEI UNIMED
            </h2>
            <p className="text-sm sm:text-base text-ink-muted mt-2 max-w-3xl">
              Galeri Investasi BEI UNIMED lahir sebagai wujud nyata sinergi tridharma perguruan tinggi di era keterbukaan pasar finansial nasional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bento-card p-6 bg-white border border-line space-y-3">
              <div className="h-10 w-10 rounded-xl bg-cerulean-light text-cerulean flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-bold text-lg text-ink">Inisiasi & Sinergi Tripartit</h3>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                GIBEI didirikan atas kerja sama resmi tripartit antara <strong>PT Bursa Efek Indonesia (BEI)</strong>, <strong>Perusahaan Sekuritas Mitra</strong>, dan <strong>Fakultas Ekonomi Universitas Negeri Medan</strong> untuk mendekatkan dunia pasar modal langsung ke lingkungan kampus.
              </p>
            </div>

            <div className="bento-card p-6 bg-white border border-line space-y-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-light text-cyan-dark flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-bold text-lg text-ink">Pusat Laboratorium Pasar Modal</h3>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                Tidak sekadar pojok bacaan, GIBEI bertransformasi menjadi laboratorium edukasi pasar modal aktif tempat mahasiswa mempelajari analisis fundamental, teknikal, mekanisme perdagangan saham, hingga simulasi investasi praktis.
              </p>
            </div>

            <div className="bento-card p-6 bg-white border border-line space-y-3">
              <div className="h-10 w-10 rounded-xl bg-gold-light text-[#7a6026] flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-bold text-lg text-ink">Era Akselerasi & Digitalisasi</h3>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                Kini GIBEI UNIMED terus berkembang melalui platform digital terpadu, Sekolah Pasar Modal (SPM) berjenjang, riset pasar emiten, pembinaan calon investor muda, dan keikutsertaan aktif dalam kompetisi pasar modal tingkat nasional.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================
            BAGIAN 2: MAKNA DAN FILOSOFI LOGO GIBEI
        ======================================================== */}
        <div className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              Bagian II
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-ink mt-1">
              Makna & Filosofi Logo GIBEI
            </h2>
            <p className="text-sm sm:text-base text-ink-muted mt-2 max-w-3xl">
              Setiap elemen garis, bentuk, dan gradasi warna pada logo GIBEI UNIMED memiliki makna filosofis mendalam yang mencerminkan visi dan semangat kami.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Makna 1: Tulisan Awal GIBEI UNIMED */}
            <div className="bento-card p-6 sm:p-8 bg-white border border-line space-y-3 flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-cerulean-light text-cerulean shrink-0 flex items-center justify-center">
                <Type className="h-6 w-6 text-cerulean" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-base text-ink">
                  1. Tulisan Awal &ldquo;GIBEI UNIMED&rdquo;
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Pada tulisan awal GIBEI UNIMED, melambangkan unsur awal dan utama sebagai tempat atau wadah pembentukan kepengurusan Galeri Investasi Bursa Efek Indonesia Fakultas Ekonomi dan Bisnis UNIMED.
                </p>
              </div>
            </div>

            {/* Makna 2: Gambar Pohon yang Melambangkan IDX */}
            <div className="bento-card p-6 sm:p-8 bg-white border border-line space-y-3 flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0 flex items-center justify-center">
                <Trees className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-base text-ink">
                  2. Gambar Pohon yang Melambangkan IDX
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Menggambarkan peran IDX (Bursa Efek Indonesia) dalam mengarahkan, membimbing, serta membantu berdirinya GIBEI UNIMED itu sendiri.
                </p>
              </div>
            </div>

            {/* Makna 3: Lima (5) Simbol Tangan */}
            <div className="bento-card p-6 sm:p-8 bg-white border border-line space-y-3 flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-cyan-light text-cyan shrink-0 flex items-center justify-center">
                <Users className="h-6 w-6 text-cyan" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-base text-ink">
                  3. Lima (5) Simbol Tangan
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Melambangkan kerja sama antar setiap divisi yang saling bahu-membahu dalam menjalankan berbagai tugas masing-masing untuk mengajak dan membimbing mahasiswa serta masyarakat umum terjun ke dalam dunia investasi saham.
                </p>
              </div>
            </div>

            {/* Makna 4: Bintang & Lingkaran */}
            <div className="bento-card p-6 sm:p-8 bg-white border border-line space-y-3 flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gold-light text-gold shrink-0 flex items-center justify-center">
                <Star className="h-6 w-6 text-[#7a6026]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-base text-ink">
                  4. Bintang &amp; Lingkaran
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Simbol bintang diambil sebagai bentuk apresiasi kepada beberapa dosen yang pada awalnya ingin membentuk GIBEI meskipun sempat belum terwujud dan baru terwujud di kemudian hari. Adapun lingkaran berkaitan dengan batas ruang lingkup tugas dari kepengurusan.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            BAGIAN 3: VISI, MISI, DAN MOTTO GIBEI UNIMED
        ======================================================== */}
        <div id="visi-misi" className="space-y-8 scroll-mt-24">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cerulean-dark uppercase tracking-wider">
              <Target className="h-4 w-4" />
              Bagian III
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-ink mt-1">
              Visi, Misi &amp; Motto GIBEI UNIMED
            </h2>
            <p className="text-sm sm:text-base text-ink-muted mt-2 max-w-3xl">
              Kompas utama dan landasan semangat seluruh kepengurusan GIBEI UNIMED dalam menjalankan setiap program kerja.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Visi & Motto */}
            <div className="flex flex-col gap-6">
              <div className="bento-card p-6 sm:p-8 bg-gradient-to-br from-white via-cerulean-light/30 to-cyan-light/20 border border-cerulean/30 space-y-4 flex-1">
                <div className="h-12 w-12 rounded-2xl bg-cerulean text-white flex items-center justify-center shadow-md shadow-cerulean/30">
                  <Target className="h-6 w-6" />
                </div>
                <span className="text-xs font-extrabold uppercase text-cerulean-dark tracking-wider block">
                  Visi Organisasi
                </span>
                <p className="text-base sm:text-lg text-ink font-bold leading-relaxed">
                  &ldquo;{ORG_VISION}&rdquo;
                </p>
              </div>

              <div className="bento-card p-6 bg-gradient-to-br from-gold-light/40 via-white to-surface border border-gold/40 space-y-2">
                <span className="text-xs font-extrabold uppercase text-[#7a6026] tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-gold" />
                  Motto Organisasi
                </span>
                <p className="text-xl sm:text-2xl font-black italic text-ink tracking-tight">
                  &ldquo;{ORG_MOTTO}&rdquo;
                </p>
                <p className="text-xs font-semibold text-[#7a6026]">
                  {ORG_MOTTO_MEANING}
                </p>
              </div>
            </div>

            {/* 4 Misi */}
            <div className="bento-card p-6 sm:p-8 bg-white border border-line lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-line">
                <Compass className="h-5 w-5 text-cerulean" />
                <span className="text-xs font-extrabold uppercase text-cerulean-dark tracking-wider">
                  Misi Strategis
                </span>
              </div>

              <ul className="space-y-4">
                {ORG_MISSIONS.map((misi, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm sm:text-base">
                    <CheckCircle2 className="h-5 w-5 text-cyan shrink-0 mt-0.5" />
                    <span className="text-ink-muted leading-relaxed">{misi}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="rounded-3xl bg-surface border border-line p-8 sm:p-12 text-center space-y-6">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-ink">
            Ingin Berkolaborasi atau Mengikuti Kegiatan GIBEI?
          </h3>
          <p className="text-sm text-ink-muted max-w-xl mx-auto">
            Pelajari susunan pengurus aktif yang mengemban amanah periode ini atau daftarkan diri Anda pada Sekolah Pasar Modal (SPM) yang sedang dibuka.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/struktur" className="w-full sm:w-auto">
              <Button variant="cerulean" size="lg" className="w-full sm:w-auto gap-2">
                Lihat Struktur Pengurus
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/kegiatan" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                <BookOpen className="h-4 w-4 text-cerulean" />
                Jadwal Kegiatan & SPM
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

