'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Images,
  Upload,
  Loader2,
  Save,
  ExternalLink,
  Link as LinkIcon,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import type { HeroBlurLevel, HeroCarouselConfig, HeroCarouselSlide } from '@/types';
import { isLandscapeAspect, uploadWebpImage } from '@/lib/utils/image-converter';
import { apiFetch } from '@/lib/api-client';
import { PageHeader } from '@/components/dashboard/page-parts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/form-controls';
import { ConfirmDialog } from '@/components/ui/modal';
import { HeroBackgroundCarousel } from '@/components/public/hero-background-carousel';
import { CarouselSlideList } from './carousel-slide-list';
import { CarouselSettingsPanel } from './carousel-settings-panel';

interface CarouselClientProps {
  initialConfig: HeroCarouselConfig;
}

const BLUR_OPTIONS: Array<{ value: HeroBlurLevel; label: string; desc: string }> = [
  { value: 'soft', label: 'Ringan', desc: 'Blur 3px' },
  { value: 'medium', label: 'Sedang', desc: 'Blur 6px' },
  { value: 'strong', label: 'Tebal', desc: 'Blur 12px' },
];

function formatAspectLabel(w: number, h: number): string {
  if (!w || !h) return 'Landscape';
  const ratio = w / h;
  if (Math.abs(ratio - 16 / 9) < 0.08) return '16:9';
  if (Math.abs(ratio - 16 / 10) < 0.08) return '16:10';
  if (Math.abs(ratio - 4 / 3) < 0.08) return '4:3';
  if (ratio > 2.0) return 'Ultrawide';
  return 'Landscape';
}

function measureImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      reject(
        new Error('Gagal memuat gambar dari tautan tersebut. Pastikan URL valid dan dapat diakses.')
      );
    };
    img.src = url;
  });
}

export function CarouselClient({ initialConfig }: CarouselClientProps) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [slides, setSlides] = React.useState<HeroCarouselSlide[]>(initialConfig.slides);
  const [autoplaySeconds, setAutoplaySeconds] = React.useState<number>(
    initialConfig.autoplay_seconds || 6
  );
  const [blurLevel, setBlurLevel] = React.useState<HeroBlurLevel>(
    initialConfig.blur_level || 'medium'
  );
  const [overlayOpacity, setOverlayOpacity] = React.useState<number>(
    initialConfig.overlay_opacity || 76
  );
  const [dirty, setDirty] = React.useState(false);

  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [manualUrl, setManualUrl] = React.useState('');
  const [checkingUrl, setCheckingUrl] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<HeroCarouselSlide | null>(null);

  const activeCount = React.useMemo(
    () => slides.filter((s) => s.is_active !== false).length,
    [slides]
  );

  const previewConfig = React.useMemo(
    () => ({
      slides,
      autoplay_seconds: autoplaySeconds,
      blur_level: blurLevel,
      overlay_opacity: overlayOpacity,
    }),
    [slides, autoplaySeconds, blurLevel, overlayOpacity]
  );

  const persistConfig = React.useCallback(
    async (
      nextSlides: HeroCarouselSlide[],
      nextAutoplay: number,
      nextBlur: HeroBlurLevel,
      nextOpacity: number,
      successMsg: string
    ) => {
      setSaving(true);
      try {
        const res = await apiFetch<{ config: HeroCarouselConfig }>('/api/carousel', {
          method: 'PUT',
          body: {
            slides: nextSlides,
            autoplay_seconds: Math.min(15, Math.max(3, Math.round(nextAutoplay))),
            blur_level: nextBlur,
            overlay_opacity: Math.min(92, Math.max(45, Math.round(nextOpacity))),
          },
        });
        setSlides(res.config.slides);
        setAutoplaySeconds(res.config.autoplay_seconds);
        setBlurLevel(res.config.blur_level);
        setOverlayOpacity(res.config.overlay_opacity);
        setDirty(false);
        toast.success(successMsg);
        router.refresh();
        return true;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan carousel.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [router]
  );

  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (slides.length + files.length > 12) {
      toast.error('Maksimal 12 foto pada carousel hero beranda.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    const addedSlides: HeroCarouselSlide[] = [];
    let failedCount = 0;

    try {
      for (const file of files) {
        try {
          const { url, converted } = await uploadWebpImage(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.85,
            requireLandscape: true,
          });

          addedSlides.push({
            id: `slide_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            image_url: url,
            alt_text: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' '),
            caption: '',
            width: converted.width,
            height: converted.height,
            is_active: true,
            created_at: new Date().toISOString(),
          });
        } catch (err) {
          failedCount += 1;
          toast.error(err instanceof Error ? err.message : `Gagal memproses ${file.name}`);
        }
      }

      if (addedSlides.length > 0) {
        const nextSlides = [...slides, ...addedSlides];
        setSlides(nextSlides);
        await persistConfig(
          nextSlides,
          autoplaySeconds,
          blurLevel,
          overlayOpacity,
          `${addedSlides.length} foto landscape berhasil disimpan ke carousel beranda!`
        );
      } else if (failedCount > 0) {
        toast.error('Tidak ada foto yang lolos validasi landscape / 16:9.');
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddManualUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = manualUrl.trim();
    if (!url) return;

    if (slides.length >= 12) {
      toast.error('Maksimal 12 foto pada carousel hero beranda.');
      return;
    }

    if (!/^https?:\/\//i.test(url) && !url.startsWith('/api/images/')) {
      toast.error('URL gambar harus diawali https:// atau /api/images/.');
      return;
    }

    setCheckingUrl(true);
    try {
      const dims = await measureImageDimensions(url);
      if (!isLandscapeAspect(dims.width, dims.height)) {
        toast.error(
          `Foto wajib berorientasi landscape / 16:9 (dimensi foto: ${dims.width}×${dims.height} px, bukan landscape).`
        );
        return;
      }

      const nextSlides: HeroCarouselSlide[] = [
        ...slides,
        {
          id: `slide_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          image_url: url,
          alt_text: 'Dokumentasi GIBEI UNIMED',
          caption: '',
          width: dims.width,
          height: dims.height,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ];
      setSlides(nextSlides);
      setManualUrl('');
      await persistConfig(
        nextSlides,
        autoplaySeconds,
        blurLevel,
        overlayOpacity,
        'Slide landscape berhasil ditambahkan dan disimpan ke beranda.'
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memverifikasi URL gambar.');
    } finally {
      setCheckingUrl(false);
    }
  };

  const updateSlide = (id: string, patch: Partial<HeroCarouselSlide>) => {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    setDirty(true);
  };

  const moveSlide = (index: number, dir: -1 | 1) => {
    const nextIndex = index + dir;
    if (nextIndex < 0 || nextIndex >= slides.length) return;
    const copy = [...slides];
    const [item] = copy.splice(index, 1);
    copy.splice(nextIndex, 0, item);
    setSlides(copy);
    void persistConfig(
      copy,
      autoplaySeconds,
      blurLevel,
      overlayOpacity,
      'Urutan slide carousel diperbarui.'
    );
  };

  const removeSlide = (slide: HeroCarouselSlide) => {
    const nextSlides = slides.filter((s) => s.id !== slide.id);
    setSlides(nextSlides);
    void persistConfig(
      nextSlides,
      autoplaySeconds,
      blurLevel,
      overlayOpacity,
      'Slide dihapus dari carousel beranda.'
    );
  };

  const handleSave = async () => {
    await persistConfig(
      slides,
      autoplaySeconds,
      blurLevel,
      overlayOpacity,
      'Pengaturan carousel hero beranda berhasil disimpan dan dipublikasikan!'
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Khusus Presidium"
        title="Carousel Background Beranda"
        description="Atur foto carousel yang tampil buram di belakang judul 'Episentrum Literasi & Riset Pasar Modal Kampus' pada halaman utama publik. Hanya menerima foto berasio 16:9 atau landscape."
        tone="gold"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-xs font-semibold text-ink hover:bg-surface hover:border-cerulean transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-cerulean" />
              Lihat Beranda
            </Link>
            <Button
              type="button"
              variant="gold"
              size="sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        }
      />

      {dirty && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-amber-900 font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              Terdapat perubahan carousel yang belum disimpan ke beranda publik.
            </span>
          </div>
          <Button
            type="button"
            variant="gold"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="shrink-0"
          >
            <Save className="h-3.5 w-3.5" />
            Simpan Sekarang
          </Button>
        </div>
      )}

      {activeCount === 1 && (
        <div className="rounded-2xl border border-cerulean/25 bg-cerulean-light/40 p-3.5 flex items-center gap-2.5 text-xs text-ink font-semibold">
          <Sparkles className="h-4 w-4 text-cerulean shrink-0" />
          <span>
            Saat ini baru terdapat <strong>1 foto aktif</strong>. Tambahkan minimal{' '}
            <strong>2 foto landscape / 16:9</strong> agar carousel dapat berganti slide otomatis dan
            menampilkan tombol navigasi slide.
          </span>
        </div>
      )}

      {/* LIVE PREVIEW HERO BERANDA */}
      <div className="rounded-3xl border border-line bg-white p-4 sm:p-6 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-ink">
              Pratinjau Langsung Background Hero
            </h2>
            <p className="text-xs text-ink-muted">
              Simulasi tampilan beranda dengan {activeCount} slide aktif · blur{' '}
              {BLUR_OPTIONS.find((b) => b.value === blurLevel)?.label.toLowerCase()} · lapisan{' '}
              {overlayOpacity}%.
            </p>
          </div>
          <Badge variant={activeCount > 0 ? 'success' : 'outline'}>
            {activeCount > 0 ? `${activeCount} Slide Aktif` : 'Menggunakan Latar Gradasi Default'}
          </Badge>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-surface/60 via-background to-background min-h-[240px] sm:min-h-[280px] flex items-center justify-center px-4 py-10">
          {activeCount > 0 ? (
            <HeroBackgroundCarousel config={previewConfig} showDots />
          ) : (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-56 bg-gradient-to-tr from-cerulean/10 via-cyan/10 to-transparent blur-3xl pointer-events-none" />
          )}

          <div className="relative z-10 text-center max-w-xl mx-auto space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 border border-line text-[10px] font-bold text-ink shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
              <span className="text-cerulean-dark">GIBEI UNIMED</span>
              <span className="text-slate-300">•</span>
              <span className="text-ink-muted">Galeri Investasi Bursa Efek Indonesia</span>
            </div>
            <h3 className="text-xl sm:text-3xl font-black text-ink tracking-tight leading-tight">
              Episentrum Literasi &amp;{' '}
              <span className="bg-gradient-to-r from-cerulean to-cyan bg-clip-text text-transparent">
                Riset Pasar Modal
              </span>{' '}
              Kampus
            </h3>
            <p className="text-xs text-ink-muted max-w-md mx-auto">
              Pratinjau kontras teks terhadap latar foto carousel yang diburamkan.
            </p>
          </div>
        </div>
      </div>

      {/* GRID ATUR UPLOAD + PENGATURAN TAMPILAN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KIRI: TAMBAH FOTO & DAFTAR SLIDE */}
        <div className="lg:col-span-8 space-y-5">
          {/* Card Tambah Foto Landscape */}
          <div className="rounded-3xl border border-line bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <div className="border-b border-line pb-3">
              <h2 className="text-base font-extrabold text-ink flex items-center gap-2">
                <Images className="h-5 w-5 text-cerulean" />
                Tambah Foto Carousel (Wajib 16:9 / Landscape)
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Foto portrait atau persegi akan ditolak otomatis. Berkas PNG/JPG maksimal 1 MB dan
                otomatis dikonversi ke WebP.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-dashed border-cerulean/35 bg-cerulean-light/20 p-5 text-center space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                multiple
                onChange={handleUploadFiles}
                className="hidden"
                disabled={uploading || slides.length >= 12}
              />
              <div className="mx-auto h-11 w-11 rounded-2xl bg-cerulean-light text-cerulean flex items-center justify-center">
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Upload className="h-5 w-5" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-ink">
                  Unggah Foto Landscape Kegiatan / Galeri
                </p>
                <p className="text-xs text-ink-muted">
                  Rekomendasi resolusi 16:9 (misalnya 1920×1080 atau 1280×720), maks 1 MB per foto.
                </p>
              </div>
              <Button
                type="button"
                variant="cerulean"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || slides.length >= 12}
              >
                {uploading ? 'Memvalidasi & Mengonversi WebP...' : 'Pilih Foto Landscape (PNG/JPG)'}
              </Button>
            </div>

            <form onSubmit={handleAddManualUrl} className="pt-1">
              <Field
                label="Atau Masukkan Tautan Gambar Landscape (Opsional)"
                htmlFor="manual-carousel-url"
                hint="Sistem tetap memeriksa orientasi gambar dari URL sebelum ditambahkan."
              >
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="h-4 w-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      id="manual-carousel-url"
                      value={manualUrl}
                      onChange={(e) => setManualUrl(e.target.value)}
                      placeholder="https://... atau /api/images/..."
                      className="pl-9"
                      disabled={checkingUrl || slides.length >= 12}
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    size="default"
                    disabled={checkingUrl || !manualUrl.trim() || slides.length >= 12}
                  >
                    {checkingUrl && <Loader2 className="h-4 w-4 animate-spin" />}
                    Tambah URL
                  </Button>
                </div>
              </Field>
            </form>
          </div>

          {/* Daftar Slide Carousel */}
          <CarouselSlideList
            slides={slides}
            formatAspectLabel={formatAspectLabel}
            onMoveSlide={moveSlide}
            onUpdateSlide={updateSlide}
            onDeleteSlide={setDeleteTarget}
          />
        </div>

        {/* KANAN: PENGATURAN EFEK BLUR, INTERVAL & OVERLAY */}
        <CarouselSettingsPanel
          blurOptions={BLUR_OPTIONS}
          blurLevel={blurLevel}
          onBlurChange={(value) => {
            setBlurLevel(value);
            setDirty(true);
          }}
          autoplaySeconds={autoplaySeconds}
          onAutoplayChange={(value) => {
            setAutoplaySeconds(value);
            setDirty(true);
          }}
          overlayOpacity={overlayOpacity}
          onOverlayChange={(value) => {
            setOverlayOpacity(value);
            setDirty(true);
          }}
          updatedAt={initialConfig.updated_at}
          updatedByName={initialConfig.updated_by_name}
          saving={saving}
          onSave={handleSave}
        />
      </div>

      {/* Modal Konfirmasi Hapus Slide */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Slide Carousel"
        description="Apakah Anda yakin ingin menghapus foto ini dari daftar carousel hero beranda?"
        confirmLabel="Ya, Hapus Slide"
        onConfirm={() => {
          if (deleteTarget) {
            removeSlide(deleteTarget);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}

