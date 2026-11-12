import Link from 'next/link';
import { TrendingUp, ArrowLeft } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-surface via-background to-background">
      {/* Top minimal header */}
      <div className="container mx-auto px-4 py-6 max-w-7xl flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cerulean to-cyan flex items-center justify-center text-white shadow-sm shadow-cerulean/20">
            <TrendingUp className="h-4 w-4" />
          </div>
          <span className="font-extrabold text-base text-ink">GIBEI UNIMED</span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-cerulean-dark transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Beranda
        </Link>
      </div>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        {children}
      </main>

      <footer className="py-6 text-center text-xs text-ink-muted border-t border-line">
        © 2026 Galeri Investasi BEI Universitas Negeri Medan • Akses Pengurus Terproteksi
      </footer>
    </div>
  );
}

