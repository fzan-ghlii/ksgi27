'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { HeroBlurLevel, HeroCarouselConfig } from '@/types';
import { cn } from '@/lib/utils';

const BLUR_CLASSES: Record<HeroBlurLevel, string> = {
  soft: 'blur-[3px]',
  medium: 'blur-[6px]',
  strong: 'blur-[12px]',
};

interface HeroBackgroundCarouselProps {
  config: Pick<HeroCarouselConfig, 'slides' | 'autoplay_seconds' | 'blur_level' | 'overlay_opacity'>;
  showDots?: boolean;
  className?: string;
}

export function HeroBackgroundCarousel({
  config,
  showDots = true,
  className,
}: HeroBackgroundCarouselProps) {
  const activeSlides = React.useMemo(
    () => config.slides.filter((s) => s.is_active !== false && Boolean(s.image_url)),
    [config.slides]
  );

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const safeIndex = activeSlides.length > 0 && currentIndex < activeSlides.length ? currentIndex : 0;

  React.useEffect(() => {
    if (activeSlides.length <= 1) return;

    const intervalMs = Math.max(3, config.autoplay_seconds || 6) * 1000;
    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [activeSlides.length, config.autoplay_seconds]);

  if (activeSlides.length === 0) return null;

  const blurClass = BLUR_CLASSES[config.blur_level] ?? BLUR_CLASSES.medium;
  const scrimAlpha = Math.min(92, Math.max(45, config.overlay_opacity ?? 76)) / 100;

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  };

  return (
    <>
      {/* Layer Gambar Carousel yang Diburamkan */}
      <div
        aria-hidden="true"
        className={cn('absolute inset-0 z-0 overflow-hidden pointer-events-none select-none', className)}
      >
        {activeSlides.map((slide, idx) => {
          const isActive = idx === safeIndex;
          return (
            <div
              key={slide.id}
              className={cn(
                'absolute inset-0 transition-opacity duration-1000 ease-in-out',
                isActive ? 'opacity-100' : 'opacity-0'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.image_url}
                alt={slide.alt_text || ''}
                className={cn(
                  'h-full w-full object-cover object-center scale-[1.06]',
                  blurClass
                )}
              />
            </div>
          );
        })}

        {/* Lapisan Frosted Cream/Ivory senada tema agar teks hero tetap tajam */}
        <div
          className="absolute inset-0 transition-colors duration-300"
          style={{ backgroundColor: `rgba(245, 240, 230, ${scrimAlpha})` }}
        />

        {/* Gradasi halus atas & bawah menyatu dengan section berikutnya */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/45 via-transparent to-background" />
      </div>

      {/* Kontrol Carousel (Kiri/Kanan desktop + Indikator Dot Bawah) */}
      {showDots && activeSlides.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Slide latar sebelumnya"
            className="hidden lg:flex absolute left-5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-md border border-line text-ink hover:bg-white hover:border-cerulean shadow-sm transition-all cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={goNext}
            aria-label="Slide latar berikutnya"
            className="hidden lg:flex absolute right-5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-md border border-line text-ink hover:bg-white hover:border-cerulean shadow-sm transition-all cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-line shadow-sm">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Slide sebelumnya"
              className="lg:hidden p-0.5 text-ink-muted hover:text-ink cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-center gap-1.5">
              {activeSlides.map((slide, idx) => {
                const active = idx === safeIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Tampilkan latar slide ${idx + 1}${slide.caption ? `: ${slide.caption}` : ''}`}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'h-2 rounded-full transition-all duration-300 cursor-pointer',
                      active ? 'w-6 bg-cerulean' : 'w-2 bg-slate-300 hover:bg-slate-400'
                    )}
                  />
                );
              })}
            </div>

            <button
              type="button"
              onClick={goNext}
              aria-label="Slide berikutnya"
              className="lg:hidden p-0.5 text-ink-muted hover:text-ink cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}
    </>
  );
}
