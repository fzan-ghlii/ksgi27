import { getPublicEventsAndSpm } from '@/lib/data/public';
import { PublicPageHeader } from '@/components/public/page-header';
import { Sparkles } from 'lucide-react';
import { KegiatanClient } from './kegiatan-client';

export default async function KegiatanPage() {
  const events = await getPublicEventsAndSpm();

  return (
    <div className="py-12 sm:py-16 bg-background min-h-[70vh]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl space-y-10">
        <PublicPageHeader
          badge="Agenda Resmi & Sekolah Pasar Modal"
          tone="gold"
          icon={<Sparkles className="h-3 w-3" />}
          title="Kegiatan & Pelatihan Investasi"
          description="Tingkatkan literasi finansial Anda melalui Sekolah Pasar Modal (SPM) berjenjang, riset emiten, dan seminar pasar modal bersama Galeri Investasi BEI UNIMED."
        />

        {/* Client Tabs & Grid */}
        <KegiatanClient events={events} />
      </div>
    </div>
  );
}
