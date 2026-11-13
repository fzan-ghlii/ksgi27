'use client';

import * as React from 'react';
import { UserProfile, DivisionCode } from '@/types';
import { OFFICIAL_DIVISIONS } from '@/lib/constants/divisions';
import { getAllowedInviteRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Copy, Check, Sparkles, AlertCircle, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';

interface ModalProps {
  user: UserProfile;
  onInviteCreated?: () => void;
}

export function InviteGeneratorModal({ user, onInviteCreated }: ModalProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const allowedRoles = getAllowedInviteRoles(user.role, user.division_code);

  const [targetRole, setTargetRole] = React.useState<'member' | 'admin_kadiv' | 'master_presidium'>(
    allowedRoles[0] || 'member'
  );
  const [divisionCode, setDivisionCode] = React.useState<DivisionCode>(
    user.division_code || 'EDUKASI'
  );
  const [assignedPosition, setAssignedPosition] = React.useState('');
  const [recipientHint, setRecipientHint] = React.useState('');
  const [expiresInDays, setExpiresInDays] = React.useState(7);

  // Result state
  const [createdUrl, setCreatedUrl] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedPosition.trim()) {
      setError('Nama jabatan wajib diisi.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await apiFetch<{ invite: { token: string } }>('/api/invites', {
        method: 'POST',
        body: {
          target_role: targetRole,
          division_code: divisionCode,
          assigned_position: assignedPosition,
          recipient_name_hint: recipientHint,
          expires_in_days: expiresInDays,
        },
      });

      const fullUrl = `${window.location.origin}/aktivasi/${data.invite.token}`;
      setCreatedUrl(fullUrl);
      toast.success('Link aktivasi unik berhasil dibuat!');
      if (onInviteCreated) onInviteCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!createdUrl) return;
    navigator.clipboard.writeText(createdUrl);
    setCopied(true);
    toast.success('Link aktivasi disalin ke clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCreatedUrl(null);
    setAssignedPosition('');
    setRecipientHint('');
    setError(null);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="gold"
        onClick={() => setOpen(true)}
        className="gap-2 shadow-md shadow-gold/20"
      >
        <Plus className="h-4 w-4" />
        Buat Link Aktivasi
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-line shadow-2xl w-[calc(100%-1.5rem)] max-w-lg max-h-[90dvh] overflow-y-auto overscroll-contain p-5 sm:p-8 relative">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-line mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold-light text-[#66532d] text-[11px] font-bold border border-gold/30 mb-2">
                  <Sparkles className="h-3 w-3" />
                  Generator Link Sekali Pakai
                </div>
                <h3 className="text-xl font-bold text-ink">
                  Undang Pengurus Baru
                </h3>
                <p className="text-xs text-ink-muted mt-1">
                  Tautan unik aman untuk calon pengurus GIBEI UNIMED.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="text-slate-400 hover:text-ink text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {createdUrl ? (
              /* Success / Copy View */
              <div className="space-y-6 text-center py-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                  <Check className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-ink">
                    Tautan Aktivasi Siap Dibagikan
                  </h4>
                  <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
                    Kirimkan tautan ini ke calon pengurus. Tautan hanya dapat digunakan satu kali untuk mendaftar.
                  </p>
                </div>

                <div className="p-3 bg-surface rounded-xl border border-line flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdUrl}
                    className="bg-transparent text-xs text-ink w-full font-mono outline-none select-all"
                  />
                  <Button
                    variant="cerulean"
                    size="sm"
                    onClick={handleCopy}
                    className="shrink-0 gap-1 text-xs"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Tersalin' : 'Salin'}
                  </Button>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="outline" onClick={handleReset} className="w-full">
                    Selesai & Tutup
                  </Button>
                </div>
              </div>
            ) : (
              /* Form View */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Target Role */}
                <div className="space-y-1.5">
                  <Label>Tingkat Role</Label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as typeof targetRole)}
                    className="w-full h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-cerulean font-medium"
                  >
                    {allowedRoles.map((r) => (
                      <option key={r} value={r}>
                        {r === 'master_presidium'
                          ? 'Master Admin (Presidium Inti)'
                          : r === 'admin_kadiv'
                          ? 'Admin (Kepala Divisi / Kadiv)'
                          : 'User (Anggota Pengurus)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Division Code */}
                <div className="space-y-1.5">
                  <Label>Divisi Kerja</Label>
                  <select
                    value={divisionCode}
                    onChange={(e) => setDivisionCode(e.target.value as DivisionCode)}
                    className="w-full h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-cerulean font-medium"
                  >
                    {Object.values(OFFICIAL_DIVISIONS).map((div) => (
                      <option key={div.code} value={div.code}>
                        {div.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assigned Position */}
                <div className="space-y-1.5">
                  <Label>Jabatan Resmi</Label>
                  <Input
                    placeholder="Contoh: Staf Riset Pasar Modal / Kepala Divisi"
                    value={assignedPosition}
                    onChange={(e) => setAssignedPosition(e.target.value)}
                    required
                  />
                </div>

                {/* Recipient Hint */}
                <div className="space-y-1.5">
                  <Label>Catatan Nama Calon (Opsional)</Label>
                  <Input
                    placeholder="Contoh: Ahmad Fauzi"
                    value={recipientHint}
                    onChange={(e) => setRecipientHint(e.target.value)}
                  />
                </div>

                {/* Expiry Days */}
                <div className="space-y-1.5">
                  <Label>Masa Berlaku Link</Label>
                  <select
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(Number(e.target.value))}
                    className="w-full h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-cerulean font-medium"
                  >
                    <option value={1}>1 Hari</option>
                    <option value={3}>3 Hari</option>
                    <option value={7}>7 Hari (Standar)</option>
                    <option value={14}>14 Hari</option>
                    <option value={30}>30 Hari</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="gold"
                    disabled={loading}
                    className="gap-2 font-bold"
                  >
                    <Link2 className="h-4 w-4" />
                    {loading ? 'Memproses...' : 'Generate Link'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

