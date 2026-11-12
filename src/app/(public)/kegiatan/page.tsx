import { getPublicEventsAndSpm } from '@/lib/data/public';
import { Sparkles } from 'lucide-react';
import { KegiatanClient } from './kegiatan-client';

export default async function KegiatanPage() {
  const events = await getPublicEventsAndSpm();

  return (
    <div className="py-12 sm:py-16 bg-background min-h-[70vh]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl space-y-10">
        {/* Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-light text-[#66532d] text-xs font-bold uppercase tracking-wider mb-3 border border-gold/30">
            <Sparkles className="h-3 w-3" />
            Agenda Resmi & Sekolah Pasar Modal
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-ink tracking-tight">
            Kegiatan & Pelatihan Investasi
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-muted">
            Tingkatkan literasi finansial Anda melalui Sekolah Pasar Modal (SPM) berjenjang, riset emiten, dan seminar pasar modal bersama Galeri Investasi BEI UNIMED.
          </p>
        </div>

        {/* Client Tabs & Grid */}
        <KegiatanClient events={events} />
      </div>
    </div>
  );
}
