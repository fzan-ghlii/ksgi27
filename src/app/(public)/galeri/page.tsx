import { getPublishedGalleries, getPublicPeriods } from '@/lib/data/public';
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
        {/* Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cerulean-light text-cerulean-dark text-xs font-bold uppercase tracking-wider mb-3 border border-cerulean/20">
            <Camera className="h-3.5 w-3.5 text-cerulean" />
            Dokumentasi Visual
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-ink tracking-tight">
            Galeri Kegiatan GIBEI UNIMED
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-muted">
            Arsip foto pelaksanaan Sekolah Pasar Modal, seminar nasional, audiensi bursa, dan kegiatan keorganisasian.
          </p>
        </div>

        {/* Gallery Client Grid & Lightbox */}
        <GaleriPublicClient
          initialGalleries={galleries}
          periods={periods}
        />
      </div>
    </div>
  );
}
