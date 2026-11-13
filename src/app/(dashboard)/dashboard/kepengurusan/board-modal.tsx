'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { BoardMember, DivisionCode, UserProfile } from '@/types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, Select, Textarea } from '@/components/ui/form-controls';
import { ImageUrlInput, IMAGE_HELP } from '@/components/shared/image-inputs';
import { BoardAddSchema, BoardUpdateSchema } from '@/lib/schemas/content';
import { DIVISION_LIST } from '@/lib/constants/divisions';
import { canManageBoardStructure } from '@/lib/auth/permissions';
import { apiFetch, zodFieldErrors } from '@/lib/api-client';

export function BoardModal({
  open,
  onOpenChange,
  user,
  periodId,
  defaultDivision,
  member,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile;
  periodId: string;
  defaultDivision: DivisionCode;
  /** null = tambah baru */
  member: BoardMember | null;
}) {
  const editing = !!member;
  const isStructureAdmin = canManageBoardStructure(user);
  const [busy, setBusy] = React.useState(false);

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !busy && onOpenChange(o)}
      title={editing ? 'Edit Data Pengurus' : 'Tambah Pengurus'}
      description={
        editing
          ? isStructureAdmin
            ? 'Perubahan nama dan jabatan ikut memperbarui profil akun pengurus bila ada.'
            : 'Anda dapat mengubah jabatan, foto, dan tautan media sosial. Nama hanya dapat diubah Presidium.'
          : 'Menambah pengurus secara manual (tanpa akun). Pengurus yang aktivasi lewat link otomatis masuk struktur.'
      }
    >
      {open ? (
        <BoardForm
          key={member?.id ?? `new-${defaultDivision}`}
          periodId={periodId}
          defaultDivision={defaultDivision}
          member={member}
          isStructureAdmin={isStructureAdmin}
          busy={busy}
          onBusyChange={setBusy}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </Modal>
  );
}

function BoardForm({
  periodId,
  defaultDivision,
  member,
  isStructureAdmin,
  busy,
  onBusyChange,
  onClose,
}: {
  periodId: string;
  defaultDivision: DivisionCode;
  member: BoardMember | null;
  isStructureAdmin: boolean;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const editing = !!member;

  const [division, setDivision] = React.useState<DivisionCode>(() => member?.division_code ?? defaultDivision);
  const [fullName, setFullName] = React.useState(() => member?.full_name ?? '');
  const [position, setPosition] = React.useState(() => member?.position_title ?? '');
  const [photo, setPhoto] = React.useState(() => member?.photo_url ?? '');
  const [bio, setBio] = React.useState(() => member?.bio ?? '');
  const [linkedin, setLinkedin] = React.useState(() => member?.social_links?.linkedin ?? '');
  const [instagram, setInstagram] = React.useState(() => member?.social_links?.instagram ?? '');
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const common = {
      position_title: position,
      photo_url: photo.trim(),
      bio,
      social_links: { linkedin: linkedin.trim(), instagram: instagram.trim() },
    };

    const parsed = editing
      ? BoardUpdateSchema.safeParse({ ...common, ...(isStructureAdmin ? { full_name: fullName } : {}) })
      : BoardAddSchema.safeParse({ ...common, period_id: periodId, division_code: division, full_name: fullName });

    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});

    try {
      onBusyChange(true);
      if (editing && member) {
        await apiFetch(`/api/board/${member.id}`, { method: 'PATCH', body: parsed.data });
        toast.success('Data pengurus diperbarui.');
      } else {
        await apiFetch('/api/board', { method: 'POST', body: parsed.data });
        toast.success('Pengurus ditambahkan ke struktur.');
      }
      onClose();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan data pengurus.');
    } finally {
      onBusyChange(false);
    }
  };

  return (
      <form onSubmit={submit} className="space-y-4" noValidate>
        {!editing && (
          <Field label="Divisi" htmlFor="division" required>
            <Select id="division" value={division} onChange={(e) => setDivision(e.target.value as DivisionCode)} disabled={busy}>
              {DIVISION_LIST.map((d) => (
                <option key={d.code} value={d.code}>{d.name}</option>
              ))}
            </Select>
          </Field>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nama Lengkap" htmlFor="full_name" error={errors.full_name} required>
            <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={busy || (editing && !isStructureAdmin)} />
          </Field>
          <Field label="Jabatan" htmlFor="position" error={errors.position_title} required>
            <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Staf Divisi / Sekretaris" disabled={busy} />
          </Field>
        </div>

        <Field label="Foto Pengurus" error={errors.photo_url} hint={IMAGE_HELP}>
          <ImageUrlInput value={photo} onChange={setPhoto} placeholder="/gambar/pengurus/nama-file.jpg" disabled={busy} />
        </Field>

        <Field label="Bio Singkat" htmlFor="bio" error={errors.bio}>
          <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-[64px]" disabled={busy} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="LinkedIn" htmlFor="linkedin" error={errors.social_links}>
            <Input id="linkedin" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." disabled={busy} />
          </Field>
          <Field label="Instagram" htmlFor="instagram">
            <Input id="instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." disabled={busy} />
          </Field>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button type="submit" variant="gold" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? 'Simpan Perubahan' : 'Tambah Pengurus'}
          </Button>
        </div>
      </form>
  );
}

