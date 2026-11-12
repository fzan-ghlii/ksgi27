'use client';

import * as React from 'react';
import { Plus, Trash2, ImageOff, Upload, Loader2, Sparkles, Link as LinkIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { isValidImageRef } from '@/lib/utils/image-ref';
import { convertImageToWebP } from '@/lib/utils/image-converter';
import { toast } from 'sonner';

/** Pratinjau kecil; menampilkan placeholder bila gambar gagal dimuat. */
export function ImagePreview({ src, className = 'h-16 w-16' }: { src: string; className?: string }) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [src]);
  const valid = isValidImageRef(src);

  if (!src || !valid || failed) {
    return (
      <div
        className={`${className} shrink-0 rounded-lg border border-dashed border-line bg-surface flex items-center justify-center text-slate-400`}
        title={src && !valid ? 'URL belum valid' : src ? 'Gambar tidak dapat dimuat' : 'Belum ada gambar'}
      >
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt="Pratinjau"
      onError={() => setFailed(true)}
      className={`${className} shrink-0 rounded-lg border border-line object-cover bg-white`}
    />
  );
}

/**
 * Satu kolom input URL gambar dengan tombol unggah berkas langsung (Auto convert PNG/JPG ke WebP).
 */
export function ImageUrlInput({
  id,
  value,
  onChange,
  placeholder = 'Unggah berkas foto atau ketik URL https://...',
  disabled,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [showManualInput, setShowManualInput] = React.useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      toast.info('Mengonversi gambar PNG/JPG ke WebP...');

      // 1. Validasi & Auto convert ke WebP client-side
      const converted = await convertImageToWebP(file);

      // 2. Simpan ke database melalui API
      const res = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: converted.file.name,
          base64: converted.base64,
          size: converted.webpSize,
          original_size: converted.originalSize,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan gambar ke database.');
      }

      onChange(data.url);
      const savedPercent = Math.round(
        ((converted.originalSize - converted.webpSize) / converted.originalSize) * 100
      );
      toast.success(
        `Gambar berhasil diunggah & dikonversi ke WebP! (${(converted.webpSize / 1024).toFixed(0)} KB${
          savedPercent > 0 ? `, hemat ${savedPercent}%` : ''
        })`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengunggah gambar.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <ImagePreview src={value} />

        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              onChange={handleFileChange}
              className="hidden"
              disabled={disabled || uploading}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className="gap-2 font-medium border-cerulean/40 text-cerulean-dark hover:bg-cerulean-light/50"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-cerulean" />
                  Mengonversi ke WebP...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 text-cerulean" />
                  Pilih & Unggah Foto (PNG/JPG)
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-xs text-ink-muted hover:text-ink gap-1"
            >
              <LinkIcon className="h-3 w-3" />
              {showManualInput ? 'Sembunyikan URL' : 'Tulis URL Manual'}
            </Button>
          </div>

          {showManualInput ? (
            <Input
              id={id}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled || uploading}
              className="text-xs"
            />
          ) : (
            value && (
              <div className="text-[11px] text-ink-muted truncate font-mono bg-surface px-2 py-0.5 rounded border border-line">
                {value}
              </div>
            )
          )}
        </div>
      </div>
      <p className="text-[11px] text-ink-muted flex items-center gap-1">
        <Sparkles className="h-3 w-3 text-gold shrink-0" />
        Maksimal 1 MB (PNG / JPG). Sistem otomatis mengonversi ke WebP agar hemat kuota & cepat dimuat.
      </p>
    </div>
  );
}

/** Daftar banyak URL foto (album galeri) dengan dukungan unggah banyak berkas sekaligus. */
export function ImageListInput({
  values,
  onChange,
  max = 30,
  disabled,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  max?: number;
  disabled?: boolean;
}) {
  const multiFileRef = React.useRef<HTMLInputElement | null>(null);
  const [uploadingBatch, setUploadingBatch] = React.useState(false);

  const set = (i: number, v: string) => onChange(values.map((x, idx) => (idx === i ? v : x)));
  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (values.filter(Boolean).length + files.length > max) {
      toast.error(`Maksimal ${max} foto per album.`);
      return;
    }

    try {
      setUploadingBatch(true);
      toast.info(`Memproses & mengonversi ${files.length} foto ke WebP...`);

      const newUrls: string[] = [];
      for (const file of files) {
        const converted = await convertImageToWebP(file);
        const res = await fetch('/api/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: converted.file.name,
            base64: converted.base64,
            size: converted.webpSize,
            original_size: converted.originalSize,
          }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          newUrls.push(data.url);
        }
      }

      // Gabungkan dengan nilai yang ada (menghapus item kosong bila perlu)
      const existing = values.filter(Boolean);
      onChange([...existing, ...newUrls]);
      toast.success(`${newUrls.length} foto berhasil diunggah & dikonversi ke WebP!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sebagian atau semua foto gagal diunggah.');
    } finally {
      setUploadingBatch(false);
      if (multiFileRef.current) multiFileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Tombol Unggah Banyak Berkas */}
      <div className="p-3 bg-surface rounded-xl border border-line flex flex-wrap items-center justify-between gap-3">
        <input
          type="file"
          ref={multiFileRef}
          accept=".png,.jpg,.jpeg,image/png,image/jpeg"
          multiple
          onChange={handleBatchUpload}
          className="hidden"
          disabled={disabled || uploadingBatch}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => multiFileRef.current?.click()}
          disabled={disabled || uploadingBatch}
          className="gap-2 font-medium border-cerulean/40 text-cerulean-dark hover:bg-cerulean-light/50"
        >
          {uploadingBatch ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-cerulean" />
              Mengonversi & Mengunggah...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 text-cerulean" />
              Unggah Foto dari Komputer (PNG/JPG)
            </>
          )}
        </Button>
        <span className="text-[11px] text-ink-muted">
          Maks 1 MB per file • Auto convert ke WebP
        </span>
      </div>

      <div className="space-y-2.5">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-3">
            <ImagePreview src={v} />
            <Input
              value={v}
              onChange={(e) => set(i, e.target.value)}
              placeholder="https://... atau /api/images/... atau /gambar/galeri/..."
              disabled={disabled || uploadingBatch}
              aria-label={`URL foto ${i + 1}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(i)}
              disabled={disabled || values.length <= 1 || uploadingBatch}
              aria-label={`Hapus foto ${i + 1}`}
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...values, ''])}
          disabled={disabled || values.length >= max || uploadingBatch}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah Baris Foto Manual
        </Button>
      </div>
    </div>
  );
}

export const IMAGE_HELP = (
  <>
    Unggah foto langsung (PNG/JPG, maks 1 MB — otomatis dikonversi ke WebP ringan) atau gunakan URL eksternal (<code>https://…</code>).
  </>
);
