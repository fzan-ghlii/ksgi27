'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Period } from '@/types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/form-controls';
import { PeriodSchema, PeriodUpdateSchema } from '@/lib/schemas/content';
import { apiFetch, zodFieldErrors } from '@/lib/api-client';

export function PeriodModal({
  open,
  onOpenChange,
  period,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = buat baru */
  period: Period | null;
}) {
  const router = useRouter();
  const editing = !!period;

  const [cabinetName, setCabinetName] = React.useState('');
  const [yearRange, setYearRange] = React.useState('');
  const [makeActive, setMakeActive] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setCabinetName(period?.cabinet_name ?? '');
    setYearRange(period?.year_range ?? '');
    setMakeActive(false);
    setErrors({});
  }, [open, period]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      cabinet_name: cabinetName.trim(),
      year_range: yearRange.trim(),
      vision: period?.vision || '',
      missions: period?.missions || [],
      ...(editing ? {} : { is_current: makeActive }),
    };

    const parsed = editing ? PeriodUpdateSchema.safeParse(payload) : PeriodSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});

    try {
      setBusy(true);
      if (editing && period) {
        await apiFetch(`/api/periods/${period.id}`, { method: 'PATCH', body: parsed.data });
        toast.success('Periode kepengurusan berhasil diperbarui.');
      } else {
        await apiFetch('/api/periods', { method: 'POST', body: parsed.data });
        toast.success('Periode baru dibuat beserta 7 divisi resminya.');
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan periode.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !busy && onOpenChange(o)}
      title={editing ? 'Edit Periode Kepengurusan' : 'Tambah Periode Kepengurusan'}
      description={
        editing
          ? 'Rentang tahun tidak dapat diubah karena menjadi ID periode.'
          : 'Visi & Misi GIBEI bersifat tetap. 7 divisi resmi otomatis disalin ke periode baru.'
      }
      size="md"
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field
          label="Rentang Tahun Periode"
          htmlFor="year"
          error={errors.year_range}
          hint="Format tahun/tahun berikutnya, contoh: 2026/2027 atau 2027/2028"
          required
        >
          <Input
            id="year"
            value={yearRange}
            onChange={(e) => setYearRange(e.target.value)}
            placeholder="2026/2027"
            disabled={busy || editing}
          />
        </Field>

        <Field
          label="Nama Kabinet (Opsional)"
          htmlFor="cabinet"
          error={errors.cabinet_name}
          hint="Opsional. Jika dikosongkan, yang ditampilkan adalah periode tahun (mis. Periode 2026/2027)"
        >
          <Input
            id="cabinet"
            value={cabinetName}
            onChange={(e) => setCabinetName(e.target.value)}
            placeholder="Contoh: Kabinet Sinergi (opsional)"
            disabled={busy}
          />
        </Field>

        {!editing && (
          <label className="flex items-start gap-3 rounded-xl border border-line bg-surface/60 p-3.5 cursor-pointer">
            <input
              type="checkbox"
              checked={makeActive}
              onChange={(e) => setMakeActive(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-cerulean"
              disabled={busy}
            />
            <div className="text-xs">
              <span className="font-bold text-ink">Langsung jadikan periode aktif</span>
              <p className="text-ink-muted">
                Periode yang sedang aktif saat ini otomatis menjadi arsip kepengurusan.
              </p>
            </div>
          </label>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-line">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Batal
          </Button>
          <Button type="submit" variant="cerulean" disabled={busy} className="gap-2">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? 'Simpan Perubahan' : 'Buat Periode'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
