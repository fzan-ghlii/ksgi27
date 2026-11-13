'use client';

import * as React from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Images, Trash2 } from 'lucide-react';
import type { HeroCarouselSlide } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';

interface CarouselSlideListProps {
  slides: HeroCarouselSlide[];
  formatAspectLabel: (w: number, h: number) => string;
  onMoveSlide: (index: number, dir: -1 | 1) => void;
  onUpdateSlide: (id: string, patch: Partial<HeroCarouselSlide>) => void;
  onDeleteSlide: (slide: HeroCarouselSlide) => void;
}

export function CarouselSlideList({
  slides,
  formatAspectLabel,
  onMoveSlide,
  onUpdateSlide,
  onDeleteSlide,
}: CarouselSlideListProps) {
  return (
    <div className="rounded-3xl border border-line bg-white p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
        <div>
          <h3 className="text-base font-extrabold text-ink">Urutan Slide Carousel</h3>
          <p className="text-xs text-ink-muted">
            Atur urutan tampil, status aktif, keterangan gambar, atau hapus slide.
          </p>
        </div>
        <Badge variant="cerulean">{slides.length} / 12 Slide</Badge>
      </div>

      {slides.length === 0 ? (
        <EmptyState
          icon={Images}
          title="Belum Ada Slide Carousel"
          description="Unggah minimal 1 foto landscape / 16:9 di atas agar background hero beranda menampilkan carousel gambar buram."
          className="p-8"
        />
      ) : (
        <div className="space-y-3.5">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={cn(
                'rounded-2xl border p-3.5 sm:p-4 flex flex-col sm:flex-row gap-4 transition-colors',
                slide.is_active
                  ? 'border-line bg-surface/40'
                  : 'border-dashed border-line bg-slate-50/70 opacity-75'
              )}
            >
              {/* Thumbnail 16:9 */}
              <div className="relative w-full sm:w-48 aspect-video rounded-xl overflow-hidden border border-line bg-slate-100 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.image_url}
                  alt={slide.alt_text || `Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 rounded-full bg-ink/75 px-2 py-0.5 text-[10px] font-bold text-white">
                  #{index + 1}
                </span>
              </div>

              {/* Info & Controls */}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="cerulean" className="text-[10px]">
                      {formatAspectLabel(slide.width, slide.height)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {slide.width}×{slide.height} px
                    </Badge>
                    <Badge variant={slide.is_active ? 'success' : 'outline'} className="text-[10px]">
                      {slide.is_active ? 'Aktif' : 'Disembunyikan'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onMoveSlide(index, -1)}
                      disabled={index === 0}
                      aria-label="Geser naik"
                      title="Geser naik"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onMoveSlide(index, 1)}
                      disabled={index === slides.length - 1}
                      aria-label="Geser turun"
                      title="Geser turun"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5"
                      onClick={() => onUpdateSlide(slide.id, { is_active: !slide.is_active })}
                    >
                      {slide.is_active ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          <span className="hidden md:inline">Sembunyikan</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden md:inline">Aktifkan</span>
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => onDeleteSlide(slide)}
                      aria-label="Hapus slide"
                      title="Hapus slide"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Input
                    value={slide.caption || ''}
                    onChange={(e) => onUpdateSlide(slide.id, { caption: e.target.value })}
                    placeholder="Label / keterangan singkat (opsional)"
                    maxLength={120}
                    className="h-9 text-xs"
                  />
                  <Input
                    value={slide.alt_text || ''}
                    onChange={(e) => onUpdateSlide(slide.id, { alt_text: e.target.value })}
                    placeholder="Alt text aksesibilitas gambar"
                    maxLength={160}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

