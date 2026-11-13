'use client';

import * as React from 'react';
import { 
  Camera, 
  ChevronLeft, 
  ChevronRight, 
  X 
} from 'lucide-react';
import type { Gallery, Period } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/form-controls';
import { EmptyState } from '@/components/ui/empty-state';
import { GalleryCard } from '@/components/public/gallery-card';
import { OFFICIAL_DIVISIONS } from '@/lib/constants/divisions';
import { formatDate, cn } from '@/lib/utils';

interface GaleriPublicClientProps {
  initialGalleries: Gallery[];
  periods: Period[];
}

export function GaleriPublicClient({
  initialGalleries,
  periods,
}: GaleriPublicClientProps) {
  const [selectedDivision, setSelectedDivision] = React.useState<string>('ALL');
  const [selectedPeriodId, setSelectedPeriodId] = React.useState<string>('ALL');

  // Lightbox State
  const [activeAlbum, setActiveAlbum] = React.useState<Gallery | null>(null);
  const [photoIndex, setPhotoIndex] = React.useState(0);

  const openLightbox = (gal: Gallery, index = 0) => {
    setActiveAlbum(gal);
    setPhotoIndex(index);
  };

  const closeLightbox = () => {
    setActiveAlbum(null);
    setPhotoIndex(0);
  };

  // Keyboard navigation for Lightbox
  React.useEffect(() => {
    if (!activeAlbum) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        setPhotoIndex((prev) =>
          prev === 0 ? activeAlbum.image_urls.length - 1 : prev - 1
        );
      } else if (e.key === 'ArrowRight') {
        setPhotoIndex((prev) =>
          prev === activeAlbum.image_urls.length - 1 ? 0 : prev + 1
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeAlbum]);

  const filteredGalleries = React.useMemo(() => {
    return initialGalleries.filter((g) => {
      const matchDiv =
        selectedDivision === 'ALL' || g.division_code === selectedDivision;
      const matchPeriod =
        selectedPeriodId === 'ALL' || g.period_id === selectedPeriodId;
      return matchDiv && matchPeriod;
    });
  }, [initialGalleries, selectedDivision, selectedPeriodId]);

  const divisionTabs = [
    { code: 'ALL', name: 'Semua Divisi' },
    ...Object.values(OFFICIAL_DIVISIONS),
  ];

  return (
    <div className="space-y-8">
      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-line shadow-xs">
        {/* Division Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0 max-w-full">
          {divisionTabs.map((tab) => {
            const active = selectedDivision === tab.code;
            return (
              <button
                key={tab.code}
                onClick={() => setSelectedDivision(tab.code)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                  active
                    ? 'bg-cerulean text-white shadow-xs'
                    : 'text-ink-muted hover:text-cerulean-dark hover:bg-surface'
                )}
              >
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-ink-muted">Periode:</span>
          <Select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="w-auto text-xs h-9 font-medium"
          >
            <option value="ALL">Semua Periode</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.year_range} ({p.cabinet_name})
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Masonry / Grid Gallery Display */}
      {filteredGalleries.length > 0 ? (
        <div className="masonry">
          {filteredGalleries.map((gal) => (
            <GalleryCard key={gal.id} gallery={gal} onClick={() => openLightbox(gal, 0)} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Camera}
          title="Tidak Ada Dokumentasi"
          description="Belum ada album dokumentasi yang sesuai dengan filter divisi atau periode yang dipilih."
        />
      )}

      {/* Lightbox Fullscreen Modal */}
      {activeAlbum && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in">
          {/* Header Bar */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10 z-10">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="gold" className="text-[10px] py-0 px-2 font-bold">
                  {activeAlbum.division_code}
                </Badge>
                <span className="text-xs text-white/80">
                  {formatDate(activeAlbum.activity_date)}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                {activeAlbum.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={closeLightbox}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Tutup Galeri (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main Photo Showcase */}
          <div className="flex-1 relative flex items-center justify-center my-4 overflow-hidden select-none">
            {/* Prev Button */}
            {activeAlbum.image_urls.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setPhotoIndex((prev) =>
                    prev === 0 ? activeAlbum.image_urls.length - 1 : prev - 1
                  )
                }
                className="absolute left-2 sm:left-4 z-20 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors cursor-pointer"
                aria-label="Foto Sebelumnya"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Photo Display */}
            <div className="max-h-[60dvh] sm:max-h-[70vh] max-w-5xl w-full flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeAlbum.image_urls[photoIndex]}
                alt={`${activeAlbum.title} foto ${photoIndex + 1}`}
                className="max-h-[60dvh] sm:max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-150"
              />
            </div>

            {/* Next Button */}
            {activeAlbum.image_urls.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setPhotoIndex((prev) =>
                    prev === activeAlbum.image_urls.length - 1 ? 0 : prev + 1
                  )
                }
                className="absolute right-2 sm:right-4 z-20 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors cursor-pointer"
                aria-label="Foto Selanjutnya"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Footer Bar: Caption & Thumbnails */}
          <div className="space-y-3 pt-2 border-t border-white/10 z-10">
            {activeAlbum.caption && (
              <p className="text-xs text-white/80 text-center max-w-2xl mx-auto line-clamp-2">
                {activeAlbum.caption}
              </p>
            )}

            {/* Thumbnail Strip */}
            {activeAlbum.image_urls.length > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
                {activeAlbum.image_urls.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPhotoIndex(i)}
                    className={cn(
                      'h-12 w-12 sm:h-14 sm:w-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer',
                      photoIndex === i
                        ? 'border-gold scale-105 shadow-md'
                        : 'border-transparent opacity-50 hover:opacity-100'
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="text-[11px] text-white/50 text-center">
              Foto {photoIndex + 1} dari {activeAlbum.image_urls.length} • Tekan <strong>Esc</strong> untuk keluar, gunakan tombol panah untuk navigasi
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

