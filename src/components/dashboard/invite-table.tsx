'use client';

import * as React from 'react';
import { ActivationInvite, UserProfile } from '@/types';
import { InviteStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check, Trash2, Link2, ExternalLink } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

interface TableProps {
  invites: ActivationInvite[];
  user: UserProfile;
  onRefresh: () => void;
}

export function InviteTable({ invites, user, onRefresh }: TableProps) {
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null);
  const [revokingToken, setRevokingToken] = React.useState<string | null>(null);

  const handleCopy = (token: string) => {
    const fullUrl = `${window.location.origin}/aktivasi/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    toast.success('Link aktivasi disalin ke clipboard!');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRevoke = async (token: string, position: string) => {
    const confirm = window.confirm(`Cabut tautan aktivasi untuk "${position}"? Tautan tidak akan bisa digunakan lagi.`);
    if (!confirm) return;

    try {
      setRevokingToken(token);
      const res = await fetch(`/api/invites/${token}/revoke`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mencabut tautan.');

      toast.success('Tautan berhasil dicabut.');
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mencabut tautan.');
    } finally {
      setRevokingToken(null);
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
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
  );
}

