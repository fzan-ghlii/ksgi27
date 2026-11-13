import Link from 'next/link';
import { 
  GraduationCap, 
  LineChart, 
  Users2, 
  Sparkles, 
  ArrowUpRight, 
  Camera, 
  Newspaper, 
  CalendarDays,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BentoGrid() {
  return (
    <section className="py-16 sm:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cerulean-light text-cerulean-dark text-xs font-bold uppercase tracking-wider mb-3 border border-cerulean/20">
            <Sparkles className="h-3.5 w-3.5 text-cerulean" />
            Struktur & Program Unggulan
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
            Tata Kelola Dinamis & Literasi Pasar Modal
          </h2>
          <p className="mt-3 text-base sm:text-lg text-ink-muted">
            Menghubungkan mahasiswa dengan dunia investasi riil melalui 6 divisi kerja spesialis dan Sekolah Pasar Modal terstruktur.
          </p>
        </div>

        {/* Bento Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: SPM Big Highlight (Spans 2 cols, 2 rows on large) */}
          <div className="bento-card md:col-span-2 lg:col-span-2 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white via-surface to-cerulean-light/30 border-cerulean/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan/10 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-4 relative z-10">
              <div className="h-12 w-12 rounded-xl bg-cerulean text-white flex items-center justify-center shadow-md shadow-cerulean/25">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cerulean-dark">
                  Divisi Edukasi
                </span>
                <h3 className="text-2xl font-extrabold text-ink mt-1">
                  Sekolah Pasar Modal (SPM)
                </h3>
                <p className="text-sm text-ink-muted mt-2 leading-relaxed max-w-md">
                  Pelatihan berjenjang resmi (Level 1 Pengenalan Investasi, Level 2 Belajar Saham, serta Level Lanjutan Analisis Fundamental & Teknikal) yang dibimbing langsung oleh BEI dan praktisi pasar modal berlisensi, lengkap dengan pembukaan Rekening Dana Nasabah (RDN).
                </p>
              </div>

              {/* Stats pill */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="p-3 rounded-xl bg-white border border-line">
                  <div className="text-xl font-black text-cerulean">4</div>
                  <div className="text-[11px] text-ink-muted font-medium">Tingkat Level</div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-line">
                  <div className="text-xl font-black text-cyan">100%</div>
                  <div className="text-[11px] text-ink-muted font-medium">Praktik Riil</div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-line">
                  <div className="text-xl font-black text-gold">Free</div>
                  <div className="text-[11px] text-ink-muted font-medium">E-Sertifikat</div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-line/60 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Pendaftaran Dibuka
              </span>
              <Link href="/kegiatan">
                <Button variant="gold" size="sm" className="gap-1.5 shadow-md">
                  Lihat Jadwal Batch
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Card 2: Divisi Investasi & Riset Emiten */}
          <div className="bento-card md:col-span-1 lg:col-span-2 p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-light text-cyan border border-cyan/30 flex items-center justify-center">
                <LineChart className="h-5 w-5 text-cyan" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan">
                Divisi Investasi
              </span>
              <h3 className="text-xl font-bold text-ink">
                Riset & Analisis Emiten
              </h3>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                Kajian fundamental laporan keuangan, analisis teknikal grafik saham, dan pemodelan valuasi untuk rekomendasi portofolio edukatif.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-line flex justify-end">
              <Link href="/artikel" className="text-xs font-bold text-cerulean-dark hover:underline flex items-center gap-1">
                Jelajahi Artikel Riset <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Divisi Kegiatan & Seminar */}
          <div className="bento-card p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-cerulean-light text-cerulean flex items-center justify-center border border-cerulean/30">
                <CalendarDays className="h-5 w-5 text-cerulean-dark" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-cerulean-dark">
                Divisi Kegiatan
              </span>
              <h4 className="text-lg font-bold text-ink">
                Seminar & Kompetisi
              </h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Pelaksanaan seminar nasional, workshop investasi, dan simulasi trading saham tingkat universitas.
              </p>
            </div>
            <div className="pt-3 border-t border-line mt-3">
              <Link href="/kegiatan" className="text-xs font-bold text-cerulean-dark hover:underline inline-flex items-center gap-1">
                Agenda Event <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 4: Divisi HRD & Tata Kelola Pengurus */}
          <div className="bento-card p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-gold-light text-[#66532d] border border-gold/30 flex items-center justify-center">
                <Users2 className="h-5 w-5 text-gold" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#66532d]">
                Divisi HRD
              </span>
              <h4 className="text-lg font-bold text-ink">
                Kaderisasi & Pengurus
              </h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Manajemen talenta pengurus lintas periode dengan sistem aktivasi token sekali pakai yang terverifikasi.
              </p>
            </div>
            <div className="pt-3 border-t border-line mt-3">
              <Link href="/struktur" className="text-xs font-bold text-cerulean-dark hover:underline inline-flex items-center gap-1">
                Bagan Pengurus <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 5: Divisi Media & Publikasi */}
          <div className="bento-card p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-surface text-cerulean-dark border border-line flex items-center justify-center">
                <Newspaper className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-cerulean-dark">
                Divisi Media
              </span>
              <h4 className="text-lg font-bold text-ink">
                Branding & Edukasi
              </h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Publikasi wawasan pasar finansial, infografis pasar modal terkini, dan berita perkembangan bursa.
              </p>
            </div>
            <div className="pt-3 border-t border-line mt-3">
              <Link href="/artikel" className="text-xs font-bold text-cerulean-dark hover:underline inline-flex items-center gap-1">
                Baca Warta <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 6: Divisi Galeri & Dokumentasi */}
          <div className="bento-card p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-light text-cyan border border-cyan/20 flex items-center justify-center">
                <Camera className="h-5 w-5 text-cyan" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan">
                Divisi Galeri
              </span>
              <h4 className="text-lg font-bold text-ink">
                Dokumentasi & Galeri BEI
              </h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Operasional harian Galeri Investasi BEI di kampus serta arsip visual seluruh kegiatan organisasi.
              </p>
            </div>
            <div className="pt-3 border-t border-line mt-3">
              <Link href="/galeri" className="text-xs font-bold text-cerulean-dark hover:underline inline-flex items-center gap-1">
                Buka Album <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

