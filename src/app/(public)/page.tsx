import Link from 'next/link';
import { 
  ArrowRight, 
  ShieldCheck, 
  Award, 
  BookOpen, 
  Sparkles, 
  Newspaper, 
  Camera, 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BentoGrid } from '@/components/public/bento-grid';
import { EventCard } from '@/components/public/event-card';
import { ArticleCard } from '@/components/public/article-card';
import { GalleryCard } from '@/components/public/gallery-card';
import { HeroBackgroundCarousel } from '@/components/public/hero-background-carousel';
import { 
  getPublicEventsAndSpm, 
  getPublishedArticles, 
  getPublishedGalleries,
  getPublicHeroCarousel,
} from '@/lib/data/public';

export default async function HomePage() {
  const [events, articles, galleries, heroCarousel] = await Promise.all([
    getPublicEventsAndSpm(),
    getPublishedArticles(3),
    getPublishedGalleries(4),
    getPublicHeroCarousel(),
  ]);

  const hasCarouselSlides = heroCarousel.slides.length > 0;

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-surface/60 via-background to-background">
        {hasCarouselSlides ? (
          <HeroBackgroundCarousel config={heroCarousel} />
        ) : (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-cerulean/10 via-cyan/10 to-transparent blur-3xl pointer-events-none" />
        )}

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-line text-xs font-bold text-ink shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-cyan animate-pulse" />
              <span className="text-cerulean-dark font-extrabold">GIBEI UNIMED</span>
              <span className="text-slate-300">•</span>
              <span className="text-ink-muted">Galeri Investasi Bursa Efek Indonesia</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-ink tracking-tight leading-[1.15] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
              Episentrum Literasi &{' '}
              <span className="bg-gradient-to-r from-cerulean-dark to-cerulean bg-clip-text text-transparent">
                Riset Pasar Modal
              </span>{' '}
              Kampus
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-ink font-semibold leading-relaxed max-w-2xl mx-auto drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]">
              Wadah resmi edukasi investasi saham, reksa dana, dan obligasi bagi mahasiswa Universitas Negeri Medan yang bersinergi langsung dengan Bursa Efek Indonesia dan mitra sekuritas.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link href="/kegiatan" className="w-full sm:w-auto">
                <Button variant="gold" size="lg" className="w-full sm:w-auto gap-2 shadow-lg shadow-gold/25 text-base">
                  Daftar Sekolah Pasar Modal (SPM)
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sejarah#visi-misi" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base hover:border-cerulean">
                  Pelajari Visi &amp; Misi
                </Button>
              </Link>
            </div>

            {/* Trust Pills */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-bold text-ink/90 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cerulean" />
                <span>Terdaftar & Resmi BEI</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-gold" />
                <span>Sekolah Pasar Modal Berjenjang</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-cyan" />
                <span>Riset Fundamental & Teknikal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Highlights (6 Divisi & Program Kerja) */}
      <BentoGrid />

      {/* Featured Events & SPM Section */}
      <section className="py-16 sm:py-20 bg-surface/40 border-t border-line">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-light text-[#66532d] text-xs font-bold uppercase tracking-wider mb-2 border border-gold/30">
                <Sparkles className="h-3 w-3" />
                Jadwal & Pendaftaran
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                Sekolah Pasar Modal & Agenda Kegiatan
              </h2>
              <p className="text-sm text-ink-muted mt-1">
                Pilih batch pelatihan atau seminar investasi yang sesuai dengan kebutuhan belajarmu.
              </p>
            </div>
            <Link href="/kegiatan">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold">
                Lihat Semua Kegiatan <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white border border-line text-center text-xs text-ink-muted">
              Jadwal kegiatan dan Sekolah Pasar Modal (SPM) akan segera diumumkan.
            </div>
          )}
        </div>
      </section>

      {/* Latest Articles Section (Tahap 2 Dynamic) */}
      <section className="py-16 sm:py-20 bg-background border-t border-line">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cerulean-light text-cerulean-dark text-xs font-bold uppercase tracking-wider mb-2 border border-cerulean/20">
                <Newspaper className="h-3 w-3 text-cerulean" />
                Riset & Edukasi Terkini
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                Warta Pasar Modal & Analisis Investasi
              </h2>
              <p className="text-sm text-ink-muted mt-1">
                Karya analisis fundamental, teknikal, dan opini ekonomi dari pengurus GIBEI UNIMED.
              </p>
            </div>
            <Link href="/artikel">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold">
                Lihat Semua Artikel <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((art) => (
                <ArticleCard key={art.id} article={art} excerptLength={120} imageHeightClass="h-44" />
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white border border-line text-center text-xs text-ink-muted">
              Artikel edukasi sedang disiapkan oleh tim riset GIBEI UNIMED.
            </div>
          )}
        </div>
      </section>

      {/* Latest Gallery Moments Section (Tahap 2 Dynamic) */}
      <section className="py-16 sm:py-20 bg-surface/40 border-t border-line">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-light text-[#66532d] text-xs font-bold uppercase tracking-wider mb-2 border border-gold/30">
                <Camera className="h-3 w-3" />
                Dokumentasi Kegiatan
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                Momen & Galeri Kegiatan Kampus
              </h2>
              <p className="text-sm text-ink-muted mt-1">
                Kilas balik pelaksanaan program kerja, audiensi bursa efek, dan workshop investasi.
              </p>
            </div>
            <Link href="/galeri">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold">
                Lihat Semua Foto <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {galleries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {galleries.map((gal) => (
                <GalleryCard key={gal.id} gallery={gal} />
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white border border-line text-center text-xs text-ink-muted">
              Dokumentasi visual kegiatan akan diperbarui secara berkala.
            </div>
          )}
        </div>
      </section>

      {/* Conversion Banner Section */}
      <section className="py-16 sm:py-20 bg-background border-t border-line">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="rounded-3xl bg-gradient-to-br from-cerulean via-cerulean-dark to-[#04618a] p-8 sm:p-12 lg:p-16 text-white text-center relative overflow-hidden shadow-xl shadow-cerulean/20">
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-2xl mx-auto space-y-5">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Mulai Perjalanan Investasimu Bersama GIBEI UNIMED
              </h2>
              <p className="text-sm sm:text-base text-white/90 leading-relaxed">
                Jadilah bagian dari generasi cerdas finansial. Buka wawasan pasar modal, ikuti pelatihan resmi, dan bergabung dalam diskusi bersama praktisi bursa.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <Link href="/kegiatan">
                  <Button variant="gold" size="lg" className="w-full sm:w-auto shadow-lg text-base">
                    Daftar Sekolah Pasar Modal
                  </Button>
                </Link>
                <Link href="/kontak">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 text-white border-white/30 hover:bg-white/20 text-base">
                    Kunjungi Galeri Kampus
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
