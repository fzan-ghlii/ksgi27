import { getPublishedGalleries, getPublicPeriods } from '@/lib/data/public';
import { PublicPageHeader } from '@/components/public/page-header';
import { Camera } from 'lucide-react';
import { GaleriPublicClient } from './galeri-public-client';

export default async function GaleriPage() {
  const [galleries, periods] = await Promise.all([
    getPublishedGalleries(),
    getPublicPeriods(),
  ]);

  return (
    <div className="py-12 sm:py-16 bg-background min-h-[70vh]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl space-y-10">
        <PublicPageHeader
          badge="Dokumentasi Visual"
          icon={<Camera className="h-3.5 w-3.5 text-cerulean" />}
          title="Galeri Kegiatan GIBEI UNIMED"
          description="Arsip foto pelaksanaan Sekolah Pasar Modal, seminar nasional, audiensi bursa, dan kegiatan keorganisasian."
        />

        {/* Gallery Client Grid & Lightbox */}
        <GaleriPublicClient
          initialGalleries={galleries}
          periods={periods}
        />
      </div>
    </div>
  );
}
