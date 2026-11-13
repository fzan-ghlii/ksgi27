'use client';

import * as React from 'react';
import { CheckCircle2, Loader2, Save, SlidersHorizontal, Sparkles } from 'lucide-react';
import type { HeroBlurLevel } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/form-controls';

interface CarouselSettingsPanelProps {
  blurOptions: Array<{ value: HeroBlurLevel; label: string; desc: string }>;
  blurLevel: HeroBlurLevel;
  onBlurChange: (value: HeroBlurLevel) => void;
  autoplaySeconds: number;
  onAutoplayChange: (value: number) => void;
  overlayOpacity: number;
  onOverlayChange: (value: number) => void;
  updatedAt?: string | null;
  updatedByName?: string | null;
  saving: boolean;
  onSave: () => void;
}

export function CarouselSettingsPanel({
  blurOptions,
  blurLevel,
  onBlurChange,
  autoplaySeconds,
  onAutoplayChange,
  overlayOpacity,
  onOverlayChange,
  updatedAt,
  updatedByName,
  saving,
  onSave,
}: CarouselSettingsPanelProps) {
  return (
    <div className="lg:col-span-4 rounded-3xl border border-line bg-white p-5 sm:p-6 shadow-sm space-y-5">
      <div className="border-b border-line pb-3">
        <h2 className="text-base font-extrabold text-ink flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-cerulean" />
          Efek Visual &amp; Kecepatan
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Sesuaikan tingkat buram dan lapisan putih agar judul hero selalu jelas terbaca.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-ink block">Tingkat Buram Background</label>
        <div className="grid grid-cols-3 gap-2">
          {blurOptions.map((opt) => {
            const selected = blurLevel === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onBlurChange(opt.value)}
                className={cn(
                  'rounded-xl border p-2.5 text-center transition-all cursor-pointer',
                  selected
                    ? 'border-cerulean bg-cerulean-light/50 text-cerulean-dark ring-2 ring-cerulean/20'
                    : 'border-line bg-surface/50 text-ink hover:bg-white'
                )}
              >
                <span className="block text-xs font-extrabold">{opt.label}</span>
                <span className="block text-[10px] text-ink-muted mt-0.5">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Field
        label={`Interval Ganti Slide (${autoplaySeconds} detik)`}
        htmlFor="carousel-interval"
        hint="Durasi tampil setiap slide sebelum berganti otomatis (3–15 detik)."
      >
        <input
          id="carousel-interval"
          type="range"
          min={3}
          max={15}
          step={1}
          value={autoplaySeconds}
          onChange={(e) => onAutoplayChange(Number(e.target.value))}
          className="w-full accent-cerulean cursor-pointer"
        />
      </Field>

      <Field
        label={`Kecerahan Lapisan Putih (${overlayOpacity}%)`}
        htmlFor="carousel-overlay"
        hint="Semakin tinggi persentase, semakin tipis bayangan foto di belakang teks."
      >
        <input
          id="carousel-overlay"
          type="range"
          min={45}
          max={92}
          step={2}
          value={overlayOpacity}
          onChange={(e) => onOverlayChange(Number(e.target.value))}
          className="w-full accent-cerulean cursor-pointer"
        />
      </Field>

      <div className="rounded-2xl border border-line bg-surface/60 p-3.5 space-y-1.5 text-xs text-ink-muted">
        <p className="font-bold text-ink flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-gold" />
          Pedoman Pengaturan Presidium
        </p>
        <ul className="space-y-1 list-disc pl-4">
          <li>
            Hanya menerima gambar rasio <strong>16:9 / landscape</strong>.
          </li>
          <li>
            Upload PNG/JPG otomatis dikompres ke format ringan <strong>WebP</strong>.
          </li>
          <li>
            Pengaturan ini hanya dapat diakses dan diubah oleh <strong>Presidium</strong>.
          </li>
        </ul>
      </div>

      {updatedAt && (
        <p className="text-[11px] text-ink-muted flex items-center gap-1.5 pt-1 border-t border-line">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>
            Terakhir disimpan oleh <strong>{updatedByName || 'Presidium'}</strong>
          </span>
        </p>
      )}

      <Button type="button" variant="gold" className="w-full font-bold" onClick={onSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Simpan Pengaturan Carousel
      </Button>
    </div>
  );
}

