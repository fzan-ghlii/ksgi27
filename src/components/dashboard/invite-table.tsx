'use client';

import * as React from 'react';
import { ActivationInvite } from '@/types';
import { InviteStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/modal';
import { Copy, Check, Trash2, ExternalLink } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

interface TableProps {
  invites: ActivationInvite[];
  onRefresh: () => void;
}

export function InviteTable({ invites, onRefresh }: TableProps) {
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null);
  const [revokingToken, setRevokingToken] = React.useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = React.useState<{ token: string; position: string } | null>(null);

  const handleCopy = (token: string) => {
    const fullUrl = `${window.location.origin}/aktivasi/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    toast.success('Link aktivasi disalin ke clipboard!');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRevoke = (token: string, position: string) => {
    setRevokeTarget({ token, position });
  };

  const confirmRevoke = async () => {
    if (!revokeTarget) return;
    const { token } = revokeTarget;
    try {
      setRevokingToken(token);
      await apiFetch(`/api/invites/${token}/revoke`, { method: 'POST' });
      toast.success('Tautan berhasil dicabut.');
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mencabut tautan.');
    } finally {
      setRevokingToken(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile Card View (md:hidden) */}
      <div className="md:hidden space-y-3">
        {invites.map((inv) => {
          const isPending = inv.status === 'PENDING';
          return (
            <div
              key={inv.token}
              className="p-4 rounded-2xl border border-line bg-white shadow-xs space-y-3"
            >
              {/* Header: Position & Status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-ink">{inv.assigned_position}</h3>
                  <div className="text-xs text-cerulean-dark font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="font-semibold">{inv.division_code}</span>
                    <span>•</span>
                    <span className="capitalize">{inv.target_role.replace('_', ' ')}</span>
                  </div>
                </div>
                <InviteStatusBadge status={inv.status} />
              </div>

              {/* Details List */}
              <div className="text-xs space-y-1.5 pt-2 border-t border-line/60 text-ink-muted">
                {inv.recipient_name_hint && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Calon Pengurus:</span>
                    <span className="font-semibold text-ink">{inv.recipient_name_hint}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Kedaluwarsa:</span>
                  <span>{formatDateTime(inv.expires_at)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Dibuat:</span>
                  <span className="truncate max-w-[180px]">{inv.created_by_email || 'Admin'}</span>
                </div>
              </div>

              {/* Actions */}
              {isPending ? (
                <div className="flex items-center gap-2 pt-2 border-t border-line">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(inv.token)}
                    className="flex-1 h-9 text-xs gap-1.5 border-line hover:border-cerulean text-ink"
                  >
                    {copiedToken === inv.token ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-cerulean" />
                    )}
                    <span>{copiedToken === inv.token ? 'Link Disalin!' : 'Salin Tautan'}</span>
                  </Button>

                  <a
                    href={`/aktivasi/${inv.token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 px-3 rounded-xl border border-line hover:bg-surface text-ink-muted hover:text-cerulean-dark inline-flex items-center justify-center"
                    title="Buka Halaman Aktivasi"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={revokingToken === inv.token}
                    onClick={() => handleRevoke(inv.token, inv.assigned_position)}
                    className="h-9 px-3 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    title="Cabut Tautan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="pt-2 border-t border-line text-right">
                  <span className="text-xs text-slate-400 italic">Tautan telah selesai digunakan</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Table View (hidden md:block) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface border-b border-line text-xs uppercase font-bold text-ink-muted">
            <tr>
              <th className="px-5 py-3.5">Jabatan & Divisi</th>
              <th className="px-5 py-3.5">Calon Pengurus</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Kedaluwarsa</th>
              <th className="px-5 py-3.5">Dibuat Oleh</th>
              <th className="px-5 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {invites.map((inv) => {
              const isPending = inv.status === 'PENDING';
              return (
                <tr key={inv.token} className="hover:bg-surface/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-bold text-ink">{inv.assigned_position}</div>
                    <div className="text-xs text-cerulean-dark font-medium flex items-center gap-1.5 mt-0.5">
                      <span>{inv.division_code}</span>
                      <span>•</span>
                      <span className="capitalize">{inv.target_role.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-ink-muted">
                    {inv.recipient_name_hint || (
                      <span className="italic text-slate-400">Tidak ditentukan</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <InviteStatusBadge status={inv.status} />
                  </td>
                  <td className="px-5 py-4 text-xs text-ink-muted">
                    {formatDateTime(inv.expires_at)}
                  </td>
                  <td className="px-5 py-4 text-xs text-ink-muted">
                    <div className="truncate max-w-[140px]">{inv.created_by_email || 'Admin'}</div>
                    <div className="text-[11px] text-slate-400">{formatDateTime(inv.created_at)}</div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isPending && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(inv.token)}
                            className="h-8 px-2.5 text-xs gap-1 border-line hover:border-cerulean text-ink"
                            title="Salin Link Aktivasi"
                          >
                            {copiedToken === inv.token ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-cerulean" />
                            )}
                            <span>{copiedToken === inv.token ? 'Disalin' : 'Salin'}</span>
                          </Button>

                          <a
                            href={`/aktivasi/${inv.token}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg border border-line hover:bg-surface text-ink-muted hover:text-cerulean-dark"
                            title="Buka Halaman Aktivasi"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>

                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={revokingToken === inv.token}
                            onClick={() => handleRevoke(inv.token, inv.assigned_position)}
                            className="h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            title="Cabut Tautan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {!isPending && (
                        <span className="text-xs text-slate-400 italic">Selesai</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(o) => !o && setRevokeTarget(null)}
        title="Cabut Tautan Aktivasi?"
        description={
          <>
            Tautan aktivasi untuk jabatan <strong>&ldquo;{revokeTarget?.position}&rdquo;</strong> tidak akan dapat digunakan lagi setelah dicabut.
          </>
        }
        confirmLabel="Ya, cabut tautan"
        onConfirm={confirmRevoke}
      />
    </div>
  );
}

