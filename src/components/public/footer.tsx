import Link from 'next/link';
import { Mail, MapPin, Shield } from 'lucide-react';
import { PUBLIC_DIVISIONS } from '@/lib/constants/divisions';
import { GibeiLogo } from '@/components/shared/logo';

export function Footer() {
  return (
    <footer className="bg-surface border-t border-line shrink-0 w-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Organization Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <GibeiLogo className="h-10 w-10 shadow-md shadow-cerulean/20" />
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-ink">GIBEI UNIMED</span>
                <span className="text-xs text-ink-muted">Galeri Investasi Bursa Efek Indonesia</span>
              </div>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed max-w-md">
              Pusat edukasi, riset, dan literasi pasar modal resmi Universitas Negeri Medan, bekerja sama dengan PT Bursa Efek Indonesia (BEI) dan Perusahaan Sekuritas Mitra.
            </p>
            <div className="flex items-center gap-3 text-ink-muted pt-1">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer"
                className="p-2 rounded-lg bg-white border border-line hover:text-cerulean-dark hover:border-cerulean transition-colors flex items-center justify-center"
                aria-label="Instagram GIBEI UNIMED"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer"
                className="p-2 rounded-lg bg-white border border-line hover:text-cerulean-dark hover:border-cerulean transition-colors flex items-center justify-center"
                aria-label="LinkedIn GIBEI UNIMED"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <Link
                href="/login"
                className="p-2 rounded-lg bg-white border border-line hover:text-gold hover:border-gold transition-colors text-xs font-semibold flex items-center gap-1.5"
                title="Akses Internal Pengurus"
              >
                <Shield className="h-4 w-4 text-gold" />
                <span className="text-[11px]">Portal Internal</span>
              </Link>
            </div>
          </div>

          {/* 6 Official Divisions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cerulean-dark">
              6 Divisi Resmi
            </h4>
            <ul className="space-y-2 text-sm">
              {PUBLIC_DIVISIONS.map((div) => (
                <li key={div.code}>
                  <Link
                    href={`/struktur?divisi=${div.code}`}
                    className="text-ink-muted hover:text-cerulean-dark transition-colors inline-block"
                  >
                    {div.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Program & Edukasi */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cerulean-dark">
              Program & Layanan
            </h4>
            <ul className="space-y-2 text-sm text-ink-muted">
              <li>
                <Link href="/sejarah" className="hover:text-cerulean-dark transition-colors font-medium text-ink">
                  Sejarah & Makna Logo
                </Link>
              </li>
              <li>
                <Link href="/kegiatan" className="hover:text-cerulean-dark transition-colors">
                  Sekolah Pasar Modal (SPM)
                </Link>
              </li>
              <li>
                <Link href="/kegiatan" className="hover:text-cerulean-dark transition-colors">
                  Seminar & Webinar Saham
                </Link>
              </li>
              <li>
                <Link href="/artikel" className="hover:text-cerulean-dark transition-colors">
                  Riset & Analisis Emiten
                </Link>
              </li>
              <li>
                <Link href="/galeri" className="hover:text-cerulean-dark transition-colors">
                  Dokumentasi Kegiatan
                </Link>
              </li>
              <li>
                <Link href="/struktur" className="hover:text-cerulean-dark transition-colors">
                  Bagan Kepengurusan
                </Link>
              </li>
            </ul>
          </div>

          {/* Lokasi & Kontak */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cerulean-dark">
              Sekretariat & Lokasi
            </h4>
            <div className="text-sm text-ink-muted space-y-2.5">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-cerulean mt-0.5 shrink-0" />
                <span>Gedung Fakultas Ekonomi, Universitas Negeri Medan, Jl. Willem Iskandar Pasar V, Medan</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-cyan shrink-0" />
                <span>gibei@unimed.ac.id</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between text-xs text-ink-muted gap-3">
          <p>© 2026 Galeri Investasi BEI Universitas Negeri Medan. Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-4">
            <Link href="/tentang" className="hover:text-cerulean-dark">Visi & Misi</Link>
            <span>•</span>
            <Link href="/kontak" className="hover:text-cerulean-dark">Peta Lokasi</Link>
            <span>•</span>
            <Link href="/login" className="hover:text-cerulean-dark font-medium">Akses Pengurus</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
