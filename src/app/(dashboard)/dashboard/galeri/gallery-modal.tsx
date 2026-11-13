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
  const editing = !!initialGallery;
  const [busy, setBusy] = React.useState(false);
  const [selectedDivision, setSelectedDivision] = React.useState<DivisionCode | null>(null);
  const activeDivision = selectedDivision ?? initialGallery?.division_code ?? user.division_code ?? 'GALERI';
  const willAutoPublish = canApproveGallery(user, activeDivision);

  const handleOpenChange = (o: boolean) => {
    if (busy) return;
    if (!o) setSelectedDivision(null);
    onOpenChange(o);
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title={editing ? 'Edit Album Dokumentasi' : 'Tambah Album Dokumentasi Kegiatan'}
      description={
        willAutoPublish
          ? 'Anda memiliki wewenang kurasi: album ini akan langsung berstatus Diterbitkan (Published).'
          : 'Album yang diunggah akan masuk antrean persetujuan Kadiv MEDIA / Presidium sebelum tampil di publik.'
      }
      size="lg"
    >
      {open ? (
        <GalleryForm
          key={initialGallery?.id ?? 'new'}
          user={user}
          periods={periods}
          initialGallery={initialGallery}
          busy={busy}
          onBusyChange={setBusy}
          onDivisionChange={setSelectedDivision}
          onClose={() => handleOpenChange(false)}
        />
      ) : null}
    </Modal>
  );
}

function GalleryForm({
  user,
  periods,
  initialGallery,
  busy,
  onBusyChange,
  onDivisionChange,
  onClose,
}: {
  user: UserProfile;
  periods: Period[];
  initialGallery?: Gallery | null;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onDivisionChange: (div: DivisionCode) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const editing = !!initialGallery;

  const [title, setTitle] = React.useState(() => initialGallery?.title ?? '');
  const [caption, setCaption] = React.useState(() => initialGallery?.caption ?? '');
  const [activityDate, setActivityDate] = React.useState(
    () => initialGallery?.activity_date ?? new Date().toISOString().split('T')[0]
  );
  const [divisionCode, setDivisionCode] = React.useState<DivisionCode>(
    () => initialGallery?.division_code ?? user.division_code ?? 'GALERI'
  );
  const [periodId, setPeriodId] = React.useState(
    () => initialGallery?.period_id ?? (periods.find((p) => p.is_current) ?? periods[0])?.id ?? ''
  );
  const [imageUrls, setImageUrls] = React.useState<string[]>(() =>
    initialGallery && initialGallery.image_urls.length > 0 ? initialGallery.image_urls : ['']
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});

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
      onBusyChange(true);
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
      onClose();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan album.');
    } finally {
      onBusyChange(false);
    }
  };

  return (
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
              onChange={(e) => {
                const next = e.target.value as DivisionCode;
                setDivisionCode(next);
                onDivisionChange(next);
              }}
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
            onClick={onClose}
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
  );
}

