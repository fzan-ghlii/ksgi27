import Link from 'next/link';
import {
  History,
  Target,
  Compass,
  CheckCircle2,
  TrendingUp,
  Shield,
  Layers,
  Award,
  ArrowRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { GibeiLogo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Sejarah, Makna Logo, Visi & Misi | GIBEI UNIMED',
  description:
    'Historikal perjalanan Galeri Investasi BEI Universitas Negeri Medan, filosofi dan makna logo, serta Visi dan Misi tetap organisasi.',
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
              Mengenal rekam jejak berdirinya Galeri Investasi Bursa Efek Indonesia di Universitas Negeri Medan, nilai-nilai filosofis yang terkandung dalam identitas visual kami, serta visi misi tetap yang memandu langkah organisasi.
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
            {/* Makna 1: Grafik Naik */}
            <div className="bento-card p-6 sm:p-8 bg-white border border-line space-y-3 flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-cerulean-light text-cerulean shrink-0 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-cerulean" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-base text-ink">
                  Grafik Pertumbuhan & Panah Naik (Ascending Growth)
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Melambangkan akselerasi pertumbuhan investasi dan literasi finansial yang terus menanjak secara konsisten. Bentuk panah ke atas mencerminkan optimisme, progresivitas, dan keberanian mahasiswa untuk berkembang menjadi investor yang cerdas dan mandiri.
                </p>
              </div>
            </div>

            {/* Makna 2: Warna Biru Cerulean & Cyan */}
            <div className="bento-card p-6 sm:p-8 bg-white border border-line space-y-3 flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-cyan-light text-cyan shrink-0 flex items-center justify-center">
                <Shield className="h-6 w-6 text-cyan" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-base text-ink">
                  Warna Biru Cerulean & Cyan (Integritas & Kepercayaan)
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Warna biru melambangkan integritas tinggi, profesionalisme, dan transparansi yang menjadi pilar utama dalam pasar modal. Gradasi ke arah cyan mencerminkan kejernihan analitis, adaptabilitas terhadap teknologi, serta kedalaman pemikiran akademis.
                </p>
              </div>
            </div>

            {/* Makna 3: Fondasi Tripartit */}
            <div className="bento-card p-6 sm:p-8 bg-white border border-line space-y-3 flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0 flex items-center justify-center">
                <Layers className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-base text-ink">
                  Pilar Sinergi Tiga Pilar (Tripartit)
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Mencerminkan fondasi kokoh yang terbangun dari kerja sama harmonis tiga pilar institusi: Universitas Negeri Medan sebagai wadah akademisi, Bursa Efek Indonesia sebagai pengatur pasar, dan Perusahaan Sekuritas sebagai praktisi industri.
                </p>
              </div>
            </div>

            {/* Makna 4: Lingkaran Kontinuitas */}
            <div className="bento-card p-6 sm:p-8 bg-white border border-line space-y-3 flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gold-light text-gold shrink-0 flex items-center justify-center">
                <Award className="h-6 w-6 text-[#7a6026]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-base text-ink">
                  Dinamika Melingkar & Kontinuitas Regenerasi
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Lengkungan yang menyatu melambangkan inklusivitas tanpa batas—merangkul seluruh civitas akademika tanpa memandang disiplin ilmu—serta regenerasi kepengurusan yang berkelanjutan untuk terus mengabdi bagi kemajuan literasi finansial bangsa.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            BAGIAN 3: VISI DAN MISI TETAP GIBEI UNIMED
        ======================================================== */}
        <div className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cerulean-dark uppercase tracking-wider">
              <Target className="h-4 w-4" />
              Bagian III
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-ink mt-1">
              Visi & Misi Tetap GIBEI UNIMED
            </h2>
            <p className="text-sm sm:text-base text-ink-muted mt-2 max-w-3xl">
              Visi dan Misi ini bersifat tetap (konstan) pada tingkat organisasi sebagai kompas utama bagi seluruh kepengurusan dalam menjalankan setiap program kerja.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Visi Tetap */}
            <div className="bento-card p-6 sm:p-8 bg-gradient-to-br from-white via-cerulean-light/30 to-cyan-light/20 border border-cerulean/30 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-cerulean text-white flex items-center justify-center shadow-md shadow-cerulean/30">
                <Target className="h-6 w-6" />
              </div>
              <span className="text-xs font-extrabold uppercase text-cerulean-dark tracking-wider">
                Visi Tetap Organisasi
              </span>
              <p className="text-base sm:text-lg text-ink font-bold leading-relaxed">
                "Menjadi Galeri Investasi Bursa Efek Indonesia terdepan, unggul, dan berdaya saing nasional dalam memajukan literasi serta inklusi pasar modal di lingkungan civitas akademika Universitas Negeri Medan dan masyarakat umum, berlandaskan integritas, profesionalisme, dan inovasi berkelanjutan."
              </p>
            </div>

            {/* 5 Misi Tetap */}
            <div className="bento-card p-6 sm:p-8 bg-white border border-line lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-line">
                <Compass className="h-5 w-5 text-cerulean" />
                <span className="text-xs font-extrabold uppercase text-cerulean-dark tracking-wider">
                  5 Misi Strategis Tetap
                </span>
              </div>

              <ul className="space-y-4">
                {[
                  {
                    title: 'Edukasi Pasar Modal Berjenjang',
                    desc: 'Menyelenggarakan Sekolah Pasar Modal (SPM) berjenjang (Level 1 Pengenalan Investasi, Level 2 Belajar Saham, serta Level Lanjutan Analisis Fundamental & Teknikal) secara berkala, inklusif, dan berkualitas tinggi.',
                  },
                  {
                    title: 'Peningkatan Investor Muda Aktif & RDN',
                    desc: 'Mendorong pembukaan Rekening Dana Nasabah (RDN) resmi dan membina investor muda di kalangan mahasiswa agar mampu mengambil keputusan investasi yang rasional, etis, dan bertanggung jawab.',
                  },
                  {
                    title: 'Pengembangan Budaya Riset Emiten',
                    desc: 'Menumbuhkan tradisi penelitian dan analisis pasar modal yang mendalam, independen, dan berintegritas melalui publikasi riset berkala serta kajian valuasi emiten.',
                  },
                  {
                    title: 'Sinergi Strategis Tripartit',
                    desc: 'Mempererat kemitraan dengan PT Bursa Efek Indonesia (BEI), Perusahaan Sekuritas Mitra, Otoritas Jasa Keuangan (OJK), serta pemangku kepentingan industri keuangan lainnya.',
                  },
                  {
                    title: 'Tata Kelola Berbasis Teknologi Modern',
                    desc: 'Mengembangkan sistem tata kelola organisasi yang transparan, profesional, akuntabel, dan mengadopsi teknologi digital dalam seluruh lini operasional kepengurusan.',
                  },
                ].map((misi, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-cyan shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-ink block font-bold">{misi.title}</strong>
                      <span className="text-ink-muted text-xs leading-relaxed">{misi.desc}</span>
                    </div>
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

