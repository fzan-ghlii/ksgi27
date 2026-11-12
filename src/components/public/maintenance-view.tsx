import Link from 'next/link';
import { AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';

interface MaintenanceViewProps {
  message?: string;
}

export function MaintenanceView({ message }: MaintenanceViewProps) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-border text-center relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent-gold/10 rounded-full blur-2xl pointer-events-none" />

        <div className="w-20 h-20 rounded-2xl bg-gold-light border border-gold/30 text-gold mx-auto flex items-center justify-center mb-6 shadow-sm">
          <AlertTriangle className="w-10 h-10 animate-pulse text-gold" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gold-light text-[#66532d] border border-gold/40 mb-4">
          <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
          Pemeliharaan Sistem Berkala
        </span>

        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mb-3">
          Sistem Sedang Ditingkatkan
        </h1>

        <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-8">
          {message ||
            'Website Galeri Investasi BEI UNIMED sedang dalam peningkatan performa dan sinkronisasi basis data. Akses publik sementara dialihkan. Terima kasih atas pengertian Anda.'}
        </p>

        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gold hover:bg-gold-hover text-ink shadow-sm transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-ink" />
            Login Pengurus
            <ArrowRight className="w-4 h-4 text-ink" />
          </Link>
        </div>

        <p className="text-xs text-muted-foreground/80 mt-6">
          GIBEI UNIMED &bull; Bursa Efek Indonesia &bull; Universitas Negeri Medan
        </p>
      </div>
    </div>
  );
}

