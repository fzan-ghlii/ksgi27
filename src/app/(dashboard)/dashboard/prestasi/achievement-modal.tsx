'use client';

import * as React from 'react';
import { Loader2, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import type { Achievement } from '@/types';
import { ACHIEVEMENT_LEVELS, AchievementInputSchema } from '@/lib/schemas/achievement';
import { Modal } from '@/components/ui/modal';
import { Field, Select, Textarea } from '@/components/ui/form-controls';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ImageUrlInput } from '@/components/shared/image-inputs';
import { apiFetch, zodFieldErrors } from '@/lib/api-client';

export function AchievementModal({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Achievement | null;
  onSaved: (saved: Achievement, isEdit: boolean) => void;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit Prestasi GIBEI UNIMED' : 'Tambah Prestasi Baru'}
      description="Prestasi yang ditambahkan akan tampil langsung di halaman publik Tentang Organisasi."
      size="md"
    >
      {open ? (
        <AchievementForm
          key={editing?.id ?? 'new'}
          editing={editing}
          onClose={() => onOpenChange(false)}
          onSaved={onSaved}
        />
      ) : null}
    </Modal>
  );
}

function AchievementForm({
  editing,
  onClose,
  onSaved,
}: {
  editing: Achievement | null;
  onClose: () => void;
  onSaved: (saved: Achievement, isEdit: boolean) => void;
}) {
  const [title, setTitle] = React.useState(() => editing?.title ?? '');
  const [level, setLevel] = React.useState<string>(() => editing?.level ?? 'Nasional');
  const [year, setYear] = React.useState(() => String(editing?.year ?? new Date().getFullYear()));
  const [organizer, setOrganizer] = React.useState(() => editing?.organizer ?? '');
  const [category, setCategory] = React.useState(() => editing?.category ?? '');
  const [description, setDescription] = React.useState(() => editing?.description ?? '');
  const [imageUrl, setImageUrl] = React.useState(() => editing?.image_url ?? '');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = AchievementInputSchema.safeParse({
      title,
      level,
      year,
      organizer,
      category,
      description,
      image_url: imageUrl,
    });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }

    try {
      setSaving(true);
      setErrors({});
      const endpoint = editing ? `/api/achievements/${editing.id}` : '/api/achievements';
      const method = editing ? 'PATCH' : 'POST';
      const res = await apiFetch<{ achievement: Achievement }>(endpoint, {
        method,
        body: parsed.data,
      });
      toast.success(editing ? 'Prestasi berhasil diperbarui.' : 'Prestasi berhasil ditambahkan.');
      onSaved(res.achievement, Boolean(editing));
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan prestasi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Judul Prestasi / Penghargaan" htmlFor="ach-title" required error={errors.title}>
        <Input
          id="ach-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Misal: Galeri Investasi Teraktif Kategori Edukasi"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Tingkat" htmlFor="ach-level" required error={errors.level}>
          <Select id="ach-level" value={level} onChange={(e) => setLevel(e.target.value)}>
            {ACHIEVEMENT_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Tahun" htmlFor="ach-year" required error={errors.year}>
          <Input
            id="ach-year"
            type="number"
            min={2010}
            max={2100}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Penyelenggara" htmlFor="ach-org" required error={errors.organizer}>
          <Input
            id="ach-org"
            value={organizer}
            onChange={(e) => setOrganizer(e.target.value)}
            placeholder="Misal: PT Bursa Efek Indonesia"
          />
        </Field>

        <Field label="Kategori (Opsional)" htmlFor="ach-cat" error={errors.category}>
          <Input
            id="ach-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Misal: GI BEI Awards / Kompetisi Saham"
          />
        </Field>
      </div>

      <Field label="Deskripsi Singkat (Opsional)" htmlFor="ach-desc" error={errors.description}>
        <Textarea
          id="ach-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ringkasan capaian, peringkat, atau kontribusi tim..."
          rows={3}
        />
      </Field>

      <Field
        label="Foto Piagam / Dokumentasi (Opsional)"
        htmlFor="ach-img"
        error={errors.image_url}
        hint="Unggah foto langsung (otomatis terkompresi ke WebP) atau masukkan tautan /api/images/..."
      >
        <ImageUrlInput id="ach-img" value={imageUrl} onChange={setImageUrl} />
      </Field>

      <div className="flex justify-end gap-2 pt-3 border-t border-line">
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Batal
        </Button>
        <Button type="submit" variant="gold" disabled={saving} className="gap-1.5 font-bold">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
          {editing ? 'Simpan Perubahan' : 'Tambahkan Prestasi'}
        </Button>
      </div>
    </form>
  );
}

