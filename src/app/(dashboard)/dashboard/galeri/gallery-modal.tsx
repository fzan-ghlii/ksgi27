'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DivisionCode, Gallery, Period, UserProfile } from '@/types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, Select, Textarea } from '@/components/ui/form-controls';
import { ImageListInput, IMAGE_HELP } from '@/components/shared/image-inputs';
import { GalleryInputSchema } from '@/lib/schemas/content';
import { DIVISION_LIST } from '@/lib/constants/divisions';
import { canApproveGallery } from '@/lib/auth/permissions';
import { apiFetch, zodFieldErrors } from '@/lib/api-client';

interface GalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile;
  periods: Period[];
  initialGallery?: Gallery | null;
}

export function GalleryModal({
  open,
  onOpenChange,
  user,
  periods,
  initialGallery,
}: GalleryModalProps) {
  const router = useRouter();
  const editing = !!initialGallery;

  const [title, setTitle] = React.useState('');
  const [caption, setCaption] = React.useState('');
  const [activityDate, setActivityDate] = React.useState(
    new Date().toISOString().split('T')[0]
  );
  const [divisionCode, setDivisionCode] = React.useState<DivisionCode>(
    user.division_code ?? 'GALERI'
  );
  const [periodId, setPeriodId] = React.useState('');
  const [imageUrls, setImageUrls] = React.useState<string[]>(['']);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (initialGallery) {
      setTitle(initialGallery.title);
      setCaption(initialGallery.caption);
      setActivityDate(initialGallery.activity_date);
      setDivisionCode(initialGallery.division_code);
      setPeriodId(initialGallery.period_id);
      setImageUrls(initialGallery.image_urls.length > 0 ? initialGallery.image_urls : ['']);
    } else {
      setTitle('');
      setCaption('');
      setActivityDate(new Date().toISOString().split('T')[0]);
      setDivisionCode(user.division_code ?? 'GALERI');
      const activePeriod = periods.find((p) => p.is_current) ?? periods[0];
      setPeriodId(activePeriod?.id ?? '');
      setImageUrls(['']);
    }
    setErrors({});
  }, [open, initialGallery, user, periods]);

  const willAutoPublish = canApproveGallery(user, divisionCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrls = imageUrls.map((u) => u.trim()).filter(Boolean);

    const payload = {
      title,
      caption,
      activity_date: activityDate,
      division_code: divisionCode,
      period_id: periodId,
      image_urls: cleanUrls,
    };

    const parsed = GalleryInputSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      toast.error('Mohon periksa kolom formulir galeri yang belum lengkap.');
      return;
    }
    setErrors({});

    try {
      setBusy(true);
      if (editing && initialGallery) {
        await apiFetch(`/api/galleries/${initialGallery.id}`, {
          method: 'PATCH',
          body: parsed.data,
        });
        toast.success('Album dokumentasi berhasil diperbarui.');
      } else {
        await apiFetch('/api/galleries', {
          method: 'POST',
          body: parsed.data,
        });
        toast.success(
          willAutoPublish
            ? 'Album dokumentasi berhasil diterbitkan ke portal publik!'
            : 'Album dokumentasi berhasil diunggah dan menunggu persetujuan Kadiv/Presidium.'
        );
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan album.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !busy && onOpenChange(o)}
      title={editing ? 'Edit Album Dokumentasi' : 'Tambah Album Dokumentasi Kegiatan'}
      description={
        willAutoPublish
          ? 'Anda memiliki wewenang kurasi: album ini akan langsung berstatus Diterbitkan (Published).'
          : 'Album yang diunggah akan masuk antrean persetujuan Kadiv MEDIA / Presidium sebelum tampil di publik.'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Judul Kegiatan" htmlFor="gal-title" error={errors.title} required>
          <Input
            id="gal-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Kunjungan Edukasi IDX & Pelatihan Analisis Teknikal"
            disabled={busy}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Tanggal Kegiatan" htmlFor="act-date" error={errors.activity_date} required>
            <Input
              id="act-date"
              type="date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              disabled={busy}
            />
          </Field>

          <Field label="Divisi Terkait" htmlFor="div-code" error={errors.division_code} required>
            <Select
              id="div-code"
              value={divisionCode}
              onChange={(e) => setDivisionCode(e.target.value as DivisionCode)}
              disabled={busy}
            >
              {DIVISION_LIST.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Periode Kabinet" htmlFor="per-id" error={errors.period_id} required>
            <Select
              id="per-id"
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
              disabled={busy}
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.year_range} {p.is_current ? '(Aktif)' : ''}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Keterangan / Deskripsi Kegiatan" htmlFor="gal-caption" error={errors.caption}>
          <Textarea
            id="gal-caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Ringkasan pelaksanaan kegiatan, narasumber, atau suasana acara..."
            className="min-h-[80px]"
            disabled={busy}
          />
        </Field>

        <Field label="Daftar Foto Dokumentasi" error={errors.image_urls} hint={IMAGE_HELP} required>
          <ImageListInput
            values={imageUrls}
            onChange={setImageUrls}
            disabled={busy}
            max={30}
          />
        </Field>

        <div className="flex justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Batal
          </Button>
          <Button type="submit" variant="gold" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? 'Simpan Perubahan' : 'Simpan & Unggah Album'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

