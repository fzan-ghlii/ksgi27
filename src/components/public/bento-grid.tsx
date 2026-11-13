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
  CheckCircle2
} from 'lucide-react';

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

        {/* Grid 6 Divisi Resmi (3:3 sama rata) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Card 1: Divisi Edukasi */}
          <div className="bento-card p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-cerulean text-white flex items-center justify-center shadow-sm shadow-cerulean/20">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-cerulean-dark block">
                Divisi Edukasi
              </span>
              <h3 className="text-lg font-bold text-ink">
                Sekolah Pasar Modal (SPM)
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Penyelenggara Sekolah Pasar Modal berjenjang (Level 1, 2, Lanjutan Fundamental &amp; Teknikal, hingga Level 3) serta pembukaan Rekening Dana Nasabah (RDN).
              </p>
            </div>
            <div className="pt-3 border-t border-line mt-4 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Pendaftaran Aktif
              </span>
              <Link href="/kegiatan" className="text-xs font-bold text-cerulean-dark hover:underline inline-flex items-center gap-1">
                Lihat Jadwal <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Divisi Investasi */}
          <div className="bento-card p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-light text-cyan border border-cyan/30 flex items-center justify-center">
                <LineChart className="h-5 w-5 text-cyan" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan block">
                Divisi Investasi
              </span>
              <h3 className="text-lg font-bold text-ink">
                Riset & Analisis Emiten
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Kajian fundamental laporan keuangan, analisis teknikal grafik saham, dan pemodelan valuasi untuk edukasi portofolio investor muda.
              </p>
            </div>
            <div className="pt-3 border-t border-line mt-4">
              <Link href="/artikel" className="text-xs font-bold text-cerulean-dark hover:underline inline-flex items-center gap-1">
                Jelajahi Riset <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Divisi Kegiatan & Seminar */}
          <div className="bento-card p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-cerulean-light text-cerulean flex items-center justify-center border border-cerulean/30">
                <CalendarDays className="h-5 w-5 text-cerulean-dark" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-cerulean-dark block">
                Divisi Kegiatan
              </span>
              <h3 className="text-lg font-bold text-ink">
                Seminar & Kompetisi
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Pelaksanaan seminar nasional, workshop investasi, perlombaan pasar modal, dan simulasi trading saham tingkat universitas.
              </p>
            </div>
            <div className="pt-3 border-t border-line mt-4">
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
              <span className="text-xs font-bold uppercase tracking-wider text-[#66532d] block">
                Divisi HRD
              </span>
              <h3 className="text-lg font-bold text-ink">
                Kaderisasi & Pengurus
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Manajemen talenta pengurus lintas periode dengan sistem aktivasi token sekali pakai yang terverifikasi.
              </p>
            </div>
            <div className="pt-3 border-t border-line mt-4">
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
              <span className="text-xs font-bold uppercase tracking-wider text-cerulean-dark block">
                Divisi Media
              </span>
              <h3 className="text-lg font-bold text-ink">
                Branding & Edukasi
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Publikasi wawasan pasar finansial, infografis pasar modal terkini, dan berita perkembangan bursa.
              </p>
            </div>
            <div className="pt-3 border-t border-line mt-4">
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
              <span className="text-xs font-bold uppercase tracking-wider text-cyan block">
                Divisi Galeri
              </span>
              <h3 className="text-lg font-bold text-ink">
                Dokumentasi & Galeri BEI
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Operasional harian Galeri Investasi BEI di kampus serta arsip visual seluruh kegiatan organisasi.
              </p>
            </div>
            <div className="pt-3 border-t border-line mt-4">
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

