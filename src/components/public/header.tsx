'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, TrendingUp, LogIn, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GibeiLogo } from '@/components/shared/logo';

const NAV_ITEMS = [
  { label: 'Beranda', href: '/' },
  { label: 'Tentang', href: '/tentang' },
  { label: 'Sejarah', href: '/sejarah' },
  { label: 'Struktur', href: '/struktur' },
  { label: 'Kegiatan & SPM', href: '/kegiatan' },
  { label: 'Artikel', href: '/artikel' },
  { label: 'Galeri', href: '/galeri' },
  { label: 'Kontak', href: '/kontak' },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Close mobile menu on route navigation
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className="fixed top-0 inset-x-0 z-40 w-full shrink-0 glass-header border-b border-line shadow-xs pt-[env(safe-area-inset-top,0px)]"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <GibeiLogo className="h-9 w-9 sm:h-10 sm:w-10 shadow-md shadow-cerulean/20 group-hover:scale-105 transition-transform" />
          <div className="flex flex-col">
            <span className="font-extrabold text-base sm:text-lg leading-tight tracking-tight text-ink flex items-center gap-1.5">
              GIBEI <span className="text-cerulean-dark">UNIMED</span>
            </span>
            <span className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold">
              Galeri Investasi BEI
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'text-cerulean-dark bg-cerulean-light/70 font-bold'
                    : 'text-ink-muted hover:text-cerulean-dark hover:bg-surface'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA / Login */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold border-cerulean/30 hover:border-cerulean text-cerulean-dark hover:bg-cerulean-light/50">
              <LogIn className="h-3.5 w-3.5 text-cerulean" />
              Portal Pengurus
            </Button>
          </Link>
          <Link href="/kegiatan">
            <Button variant="gold" size="sm" className="text-xs shadow-md shadow-gold/25">
              Daftar SPM
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-xl text-ink hover:bg-surface focus:outline-none border border-line cursor-pointer"
          aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu navigasi'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 top-16 bg-black/40 backdrop-blur-xs z-30 md:hidden animate-in fade-in duration-150"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-line bg-background/98 backdrop-blur-2xl px-4 pt-3 pb-6 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 relative z-40 max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain">
          <div className="flex flex-col space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between min-h-[44px]',
                    isActive
                      ? 'bg-cerulean-light text-cerulean-dark font-bold'
                      : 'text-ink hover:bg-surface'
                  )}
                >
                  <span>{item.label}</span>
                  {isActive && <div className="h-2 w-2 rounded-full bg-cerulean" />}
                </Link>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-line flex flex-col gap-2.5">
            <Link href="/kegiatan" onClick={() => setMobileOpen(false)}>
              <Button variant="gold" size="lg" className="w-full justify-center text-sm font-bold shadow-md shadow-gold/20">
                Daftar Sekolah Pasar Modal
              </Button>
            </Link>
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" size="lg" className="w-full justify-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-cerulean" />
                Masuk Portal Pengurus
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

