import Link from 'next/link';
import { Target, Compass, CheckCircle2, History, ArrowRight, Sparkles, Building, Layers } from 'lucide-react';
import { DIVISION_LIST } from '@/lib/constants/divisions';
import { Button } from '@/components/ui/button';
import { GibeiLogo } from '@/components/shared/logo';

export const metadata = {
  title: 'Tentang Organisasi | GIBEI UNIMED',
  description: 'Profil, visi dan misi tetap, serta 6 divisi resmi Galeri Investasi BEI Universitas Negeri Medan.',
};

export default function TentangPage() {
  return (
    <div className="py-12 sm:py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl space-y-16 sm:space-y-20">
        {/* Header Title */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cerulean-light text-cerulean-dark text-xs font-bold uppercase tracking-wider border border-cerulean/20">
            Profil Organisasi
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-ink tracking-tight">
            Tentang GIBEI UNIMED
          </h1>
          <p className="text-base sm:text-lg text-ink-muted leading-relaxed">
            Galeri Investasi Bursa Efek Indonesia Universitas Negeri Medan (GIBEI UNIMED) adalah laboratorium edukasi dan pusat literasi pasar modal yang didirikan atas kerja sama tripartit antara PT Bursa Efek Indonesia, Perusahaan Sekuritas Mitra, dan Fakultas Ekonomi Universitas Negeri Medan.
          </p>
        </div>

        {/* Banner Link ke Sejarah & Makna Logo */}
        <div className="rounded-3xl border border-cerulean/30 bg-gradient-to-r from-cerulean-light/50 via-white to-cyan-light/30 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <GibeiLogo className="h-16 w-16 shadow-md shadow-cerulean/20" iconClassName="h-8 w-8" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-cerulean-dark uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-gold" />
                Halaman Khusus
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-ink">
                Sejarah, Makna Filosofi Logo, & Visi Misi GIBEI
              </h3>
              <p className="text-xs sm:text-sm text-ink-muted">
                Ketahui historikal pendirian GIBEI, arti setiap guratan pada logo resmi, dan kompas pergerakan kami.
              </p>
            </div>
          </div>

          <Link href="/sejarah" className="shrink-0">
            <Button variant="cerulean" className="gap-2 font-bold shadow-sm">
              <History className="h-4 w-4" />
              Buka Halaman Sejarah & Logo
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Vision & Mission Card (Visi & Misi Tetap GIBEI UNIMED) */}
        <div className="rounded-3xl border border-line bg-surface/60 p-8 sm:p-12 space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-line flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <Target className="h-6 w-6 text-cerulean" />
              <h2 className="text-2xl font-extrabold text-ink">
                Visi & Misi Tetap GIBEI UNIMED
              </h2>
            </div>
            <span className="text-xs font-bold text-cerulean-dark bg-white px-3 py-1 rounded-full border border-line">
              Landasan Permanen Organisasi
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Vision */}
            <div className="bento-card p-6 bg-white border border-line space-y-3">
              <span className="text-xs font-bold uppercase text-cerulean-dark tracking-wider">
                Visi Organisasi
              </span>
              <p className="text-base text-ink font-semibold leading-relaxed">
                "Menjadi Galeri Investasi Bursa Efek Indonesia terdepan, unggul, dan berdaya saing nasional dalam memajukan literasi serta inklusi pasar modal di lingkungan civitas akademika Universitas Negeri Medan dan masyarakat umum, berlandaskan integritas, profesionalisme, dan inovasi berkelanjutan."
              </p>
            </div>

            {/* Mission List */}
            <div className="bento-card p-6 bg-white border border-line lg:col-span-2 space-y-3">
              <span className="text-xs font-bold uppercase text-cerulean-dark tracking-wider">
                Misi Strategis Tetap
              </span>
              <ul className="space-y-3.5 pt-1">
                {[
                  'Menyelenggarakan Sekolah Pasar Modal (SPM) berjenjang (Level 1 Pengenalan Investasi, Level 2 Belajar Saham, serta Level Lanjutan Analisis Fundamental & Teknikal) secara berkala dan berkualitas.',
                  'Memfasilitasi pembukaan Rekening Dana Nasabah (RDN) dan membina investor muda di kalangan mahasiswa agar mampu berinvestasi secara rasional, etis, dan mandiri.',
                  'Membangun budaya riset pasar modal yang mendalam, independen, dan aplikatif melalui analisis emiten dan publikasi edukasi berkala.',
                  'Menjalin kemitraan strategis yang solid dan berkesinambungan dengan PT Bursa Efek Indonesia, Perusahaan Sekuritas Mitra, dan industri keuangan.',
                  'Mengembangkan tata kelola organisasi internal yang transparan, modern, profesional, dan berbasis teknologi digital.',
                ].map((m, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-ink-muted">
                    <CheckCircle2 className="h-4 w-4 text-cyan shrink-0 mt-0.5" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 6 Divisions Focus Areas */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">
              6 Divisi Resmi Organisasi
            </h2>
            <p className="text-sm text-ink-muted mt-1">
              Fokus kerja terstruktur untuk memastikan tercapainya seluruh pilar Tridharma Perguruan Tinggi di sektor keuangan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DIVISION_LIST.map((div) => (
              <div key={div.code} className="bento-card p-6 bg-white border border-line space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cerulean-dark bg-cerulean-light px-2.5 py-0.5 rounded-full border border-cerulean/20">
                    {div.code}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-ink">{div.name}</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  {div.shortDesc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
