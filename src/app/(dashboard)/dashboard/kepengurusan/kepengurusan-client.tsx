'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowRightLeft, ArrowUp, Calendar, CheckCircle2, Crown, Eye, EyeOff, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { BoardMember, Division, DivisionCode, Period, UserProfile } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ActiveBadge } from '@/components/ui/status-badges';
import { ConfirmDialog } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/form-controls';
import { PageHeader, TabBar } from '@/components/dashboard/page-parts';
import { DIVISION_LIST, OFFICIAL_DIVISIONS } from '@/lib/constants/divisions';
import { canEditBoardMember, canManageBoardStructure, canManagePeriods } from '@/lib/auth/permissions';
import { apiFetch } from '@/lib/api-client';
import { cn, formatDate } from '@/lib/utils';
import { PeriodModal } from './period-modal';
import { BoardModal } from './board-modal';

interface Props {
  user: UserProfile;
  periods: Period[];
  selectedPeriodId: string;
  divisions: Division[];
  members: BoardMember[];
}

type ConfirmState =
  | { kind: 'activate'; period: Period }
  | { kind: 'delete-period'; period: Period }
  | { kind: 'delete-member'; member: BoardMember }
  | { kind: 'toggle-member'; member: BoardMember }
  | { kind: 'make-head'; member: BoardMember; division: Division }
  | null;

export function KepengurusanClient({ user, periods, selectedPeriodId, divisions, members }: Props) {
  const router = useRouter();
  const canPeriods = canManagePeriods(user);
  const canStructure = canManageBoardStructure(user);

  const [tab, setTab] = React.useState<'pengurus' | 'periode'>('pengurus');
  const [divisionFilter, setDivisionFilter] = React.useState<'ALL' | DivisionCode>('ALL');
  const [periodModal, setPeriodModal] = React.useState<{ open: boolean; period: Period | null }>({ open: false, period: null });
  const [boardModal, setBoardModal] = React.useState<{
    open: boolean;
    member: BoardMember | null;
    mode?: 'edit' | 'move';
  }>({ open: false, member: null });
  const [confirm, setConfirm] = React.useState<ConfirmState>(null);
  const [movingId, setMovingId] = React.useState<string | null>(null);

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);
  const headIds = new Set(divisions.map((d) => d.head_user_id).filter(Boolean) as string[]);
  const visible = divisionFilter === 'ALL' ? members : members.filter((m) => m.division_code === divisionFilter);

  const run = async (fn: () => Promise<unknown>, okMessage: string) => {
    try {
      await fn();
      toast.success(okMessage);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Aksi gagal.');
      throw err;
    }
  };

  const move = async (m: BoardMember, direction: 'up' | 'down') => {
    try {
      setMovingId(m.id);
      await apiFetch(`/api/board/${m.id}/move`, { method: 'POST', body: { direction } });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah urutan.');
    } finally {
      setMovingId(null);
    }
  };

  const onConfirm = async () => {
    if (!confirm) return;
    switch (confirm.kind) {
      case 'activate':
        return run(() => apiFetch(`/api/periods/${confirm.period.id}/activate`, { method: 'POST' }),
          `Periode ${confirm.period.year_range} kini aktif. Periode sebelumnya menjadi arsip.`);
      case 'delete-period':
        return run(() => apiFetch(`/api/periods/${confirm.period.id}`, { method: 'DELETE' }), 'Periode dihapus.');
      case 'delete-member':
        return run(() => apiFetch(`/api/board/${confirm.member.id}`, { method: 'DELETE' }), 'Pengurus dihapus dari struktur.');
      case 'toggle-member': {
        const next = confirm.member.is_active === false;
        return run(
          () => apiFetch(`/api/board/${confirm.member.id}`, { method: 'PATCH', body: { is_active: next } }),
          next ? 'Pengurus diaktifkan kembali.' : 'Pengurus dinonaktifkan dan disembunyikan dari halaman publik.'
        );
      }
      case 'make-head':
        return run(
          () => apiFetch(`/api/divisions/${confirm.division.id}/head`, { method: 'PUT', body: { user_id: confirm.member.user_id } }),
          `${confirm.member.full_name} kini Kepala ${confirm.division.name}.`
        );
    }
  };

  const confirmCopy = (() => {
    if (!confirm) return { title: '', description: <></>, label: '', variant: 'destructive' as const };
    switch (confirm.kind) {
      case 'activate':
        return {
          title: `Aktifkan periode ${confirm.period.year_range}?`,
          description: <>Periode yang sedang aktif akan otomatis menjadi <strong>arsip historis</strong>. Halaman publik langsung menampilkan Periode {confirm.period.year_range}{confirm.period.cabinet_name ? ` (${confirm.period.cabinet_name})` : ''}. Data pengurus tidak dihapus.</>,
          label: 'Ya, aktifkan',
          variant: 'cerulean' as const,
        };
      case 'delete-period':
        return {
          title: `Hapus periode ${confirm.period.year_range}?`,
          description: <>Periode beserta 7 divisinya akan dihapus permanen. Periode yang masih punya pengurus atau album tidak bisa dihapus.</>,
          label: 'Hapus periode',
          variant: 'destructive' as const,
        };
      case 'delete-member':
        return {
          title: 'Hapus pengurus dari struktur?',
          description: <><strong>{confirm.member.full_name}</strong> dihapus dari struktur periode ini. Akun login (jika ada) tidak ikut terhapus. Untuk menyembunyikan sementara, gunakan <em>Nonaktifkan</em>.</>,
          label: 'Hapus',
          variant: 'destructive' as const,
        };
      case 'toggle-member': {
        const activating = confirm.member.is_active === false;
        return {
          title: activating ? 'Aktifkan kembali pengurus?' : 'Nonaktifkan pengurus?',
          description: activating
            ? <><strong>{confirm.member.full_name}</strong> akan tampil lagi di halaman Struktur publik.</>
            : <><strong>{confirm.member.full_name}</strong> disembunyikan dari halaman Struktur publik. Data tetap tersimpan dan bisa diaktifkan kembali.</>,
          label: activating ? 'Aktifkan' : 'Nonaktifkan',
          variant: activating ? ('cerulean' as const) : ('destructive' as const),
        };
      }
      case 'make-head':
        return {
          title: `Jadikan Kepala ${confirm.division.name}?`,
          description: <><strong>{confirm.member.full_name}</strong> akan memperoleh role <strong>Kadiv</strong>. Kepala divisi sebelumnya (jika ada) kembali menjadi Anggota.</>,
          label: 'Tetapkan',
          variant: 'gold' as const,
        };
    }
  })();

  const tabs = [
    { id: 'pengurus' as const, label: 'Pengurus & Divisi', count: members.length },
    ...(canPeriods ? [{ id: 'periode' as const, label: 'Periode Kabinet', count: periods.length }] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Struktur Organisasi"
        title="Manajemen Periode & Kepengurusan"
        description={
          canStructure
            ? 'Kelola periode kabinet, susunan pengurus 6 divisi, dan Kepala Divisi.'
            : 'Perbarui jabatan, urutan tampil, foto, dan tautan media sosial pengurus di divisi Anda.'
        }
        actions={
          tab === 'periode' && canPeriods ? (
            <Button variant="gold" size="sm" className="gap-1.5" onClick={() => setPeriodModal({ open: true, period: null })}>
              <Plus className="h-4 w-4" /> Tambah Periode
            </Button>
          ) : tab === 'pengurus' && canStructure ? (
            <Button variant="gold" size="sm" className="gap-1.5" onClick={() => setBoardModal({ open: true, member: null })}>
              <Plus className="h-4 w-4" /> Tambah Pengurus
            </Button>
          ) : undefined
        }
      />

      <TabBar tabs={tabs} value={tab} onChange={setTab} />

      {/* ------------------------------------------------ PERIODE */}
      {tab === 'periode' && canPeriods && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {periods.map((p) => (
            <div key={p.id} className={cn('bento-card p-6 space-y-4', p.is_current && 'border-gold/50 bg-gradient-to-br from-white to-gold-light/30')}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-cerulean-dark uppercase tracking-wider">Periode {p.year_range}</div>
                  <h3 className="text-lg font-extrabold text-ink mt-0.5">
                    {p.cabinet_name ? p.cabinet_name : `Kepengurusan ${p.year_range}`}
                  </h3>
                </div>
                {p.is_current ? (
                  <Badge variant="gold" className="font-bold"><CheckCircle2 className="h-3 w-3" /> Aktif</Badge>
                ) : (
                  <Badge variant="outline" className="bg-slate-50">Arsip</Badge>
                )}
              </div>
              {p.vision && <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">{p.vision}</p>}
              <p className="text-[11px] text-ink-muted">Dibuat {formatDate(p.created_at)}</p>
              <div className="flex flex-wrap gap-2 pt-1 border-t border-line">
                <Button size="sm" variant="outline" className="gap-1.5 mt-3" onClick={() => setPeriodModal({ open: true, period: p })}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                {!p.is_current && (
                  <>
                    <Button size="sm" variant="cerulean" className="gap-1.5 mt-3" onClick={() => setConfirm({ kind: 'activate', period: p })}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Jadikan Aktif
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1.5 mt-3 text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => setConfirm({ kind: 'delete-period', period: p })}>
                      <Trash2 className="h-3.5 w-3.5" /> Hapus
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
          {periods.length === 0 && (
            <div className="lg:col-span-2">
              <EmptyState icon={Calendar} title="Belum Ada Periode" description="Buat periode kabinet pertama untuk mulai menyusun struktur pengurus." actionLabel="Tambah Periode" onAction={() => setPeriodModal({ open: true, period: null })} />
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------ PENGURUS */}
      {tab === 'pengurus' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Periode</span>
              <Select
                value={selectedPeriodId}
                onChange={(e) => router.push(`/dashboard/kepengurusan?periode=${e.target.value}`)}
                className="w-auto min-w-[220px]"
                aria-label="Pilih periode"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    Periode {p.year_range}{p.cabinet_name ? ` (${p.cabinet_name})` : ''}{p.is_current ? ' • Aktif' : ' • Arsip'}
                  </option>
                ))}
              </Select>
            </div>
            {selectedPeriod && !selectedPeriod.is_current && (
              <span className="text-xs font-semibold text-ink-muted">Periode arsip. Data tetap bisa diperbarui.</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface border border-line overflow-x-auto no-scrollbar flex-nowrap sm:flex-wrap w-full sm:w-fit max-w-full">
            {[{ code: 'ALL' as const, name: 'Semua' }, ...DIVISION_LIST].map((d) => {
              const active = divisionFilter === d.code;
              const count = d.code === 'ALL' ? members.length : members.filter((m) => m.division_code === d.code).length;
              return (
                <button
                  key={d.code}
                  onClick={() => setDivisionFilter(d.code)}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                    active ? 'bg-cerulean text-white shadow-sm' : 'text-ink-muted hover:text-cerulean-dark hover:bg-white/80'
                  )}
                >
                  {d.code === 'ALL' ? 'Semua' : OFFICIAL_DIVISIONS[d.code].name.replace('Divisi ', '')} <span className="opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum Ada Pengurus"
              description="Belum ada pengurus pada filter ini. Pengurus muncul otomatis setelah aktivasi lewat Link Aktivasi, atau tambahkan manual."
              actionLabel={canStructure ? 'Tambah Pengurus' : undefined}
              onAction={canStructure ? () => setBoardModal({ open: true, member: null }) : undefined}
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-surface/70 text-[11px] uppercase tracking-wider text-ink-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">Pengurus</th>
                    <th className="px-4 py-3 text-left font-bold">Divisi</th>
                    <th className="px-4 py-3 text-left font-bold">Status</th>
                    <th className="px-4 py-3 text-right font-bold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visible.map((m) => {
                    const siblings = members.filter((x) => x.division_code === m.division_code);
                    const idx = siblings.findIndex((x) => x.id === m.id);
                    const editable = canEditBoardMember(user, m.division_code);
                    const isHead = !!m.user_id && headIds.has(m.user_id);
                    const division = divisions.find((d) => d.code === m.division_code);
                    const inactive = m.is_active === false;

                    return (
                      <tr key={m.id} className={cn('align-middle', inactive && 'bg-slate-50/70')}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {m.photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={m.photo_url} alt="" className="h-10 w-10 rounded-xl object-cover border border-line" />
                            ) : (
                              <div className="h-10 w-10 rounded-xl bg-cerulean-light text-cerulean flex items-center justify-center font-bold">
                                {m.full_name.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className={cn('font-bold text-ink truncate flex items-center gap-1.5', inactive && 'text-slate-500')}>
                                {m.full_name}
                                {isHead && <Badge variant="gold" className="text-[10px] py-0"><Crown className="h-3 w-3" /> Kepala</Badge>}
                              </div>
                              <div className="text-xs text-ink-muted truncate">{m.position_title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={m.division_code === 'PRESIDIUM' ? 'gold' : 'cerulean'} className="text-[10px]">{m.division_code}</Badge>
                        </td>
                        <td className="px-4 py-3"><ActiveBadge active={!inactive} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-0.5">
                            <Button size="icon" variant="ghost" aria-label="Naikkan urutan" disabled={!editable || idx <= 0 || movingId === m.id} onClick={() => move(m, 'up')}>
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" aria-label="Turunkan urutan" disabled={!editable || idx === siblings.length - 1 || movingId === m.id} onClick={() => move(m, 'down')}>
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" aria-label="Edit pengurus" title="Edit pengurus" disabled={!editable} onClick={() => setBoardModal({ open: true, member: m, mode: 'edit' })}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {canStructure && (
                              <>
                                {periods.length > 1 && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label="Pindah ke periode lain"
                                    title="Pindah ke periode lain"
                                    onClick={() => setBoardModal({ open: true, member: m, mode: 'move' })}
                                  >
                                    <ArrowRightLeft className="h-4 w-4" />
                                  </Button>
                                )}
                                {division && m.user_id && m.division_code !== 'PRESIDIUM' && !isHead && !inactive && (
                                  <Button size="icon" variant="ghost" aria-label="Jadikan Kepala Divisi" title="Jadikan Kepala Divisi" className="text-[#66532d] hover:bg-gold-light" onClick={() => setConfirm({ kind: 'make-head', member: m, division })}>
                                    <Crown className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button size="icon" variant="ghost" aria-label={inactive ? 'Aktifkan' : 'Nonaktifkan'} title={inactive ? 'Aktifkan' : 'Nonaktifkan'} onClick={() => setConfirm({ kind: 'toggle-member', member: m })}>
                                  {inactive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </Button>
                                <Button size="icon" variant="ghost" aria-label="Hapus pengurus" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => setConfirm({ kind: 'delete-member', member: m })}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <PeriodModal open={periodModal.open} onOpenChange={(o) => setPeriodModal((s) => ({ ...s, open: o }))} period={periodModal.period} />
      <BoardModal
        open={boardModal.open}
        onOpenChange={(o) => setBoardModal((s) => ({ ...s, open: o }))}
        user={user}
        periods={periods}
        periodId={selectedPeriodId}
        defaultDivision={divisionFilter === 'ALL' ? 'KEGIATAN' : divisionFilter}
        member={boardModal.member}
        mode={boardModal.mode}
      />
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.label}
        variant={confirmCopy.variant}
        onConfirm={onConfirm}
      />
    </div>
  );
}

