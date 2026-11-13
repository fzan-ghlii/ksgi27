'use client';

import * as React from 'react';
import { ActivationInvite, UserProfile } from '@/types';
import { InviteGeneratorModal } from '@/components/dashboard/invite-generator-modal';
import { InviteTable } from '@/components/dashboard/invite-table';
import { PageHeader } from '@/components/dashboard/page-parts';
import { EmptyState } from '@/components/ui/empty-state';
import { Link2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api-client';
import { toast } from 'sonner';

interface AktivasiClientProps {
  initialInvites: ActivationInvite[];
  user: UserProfile;
}

export function AktivasiClient({ initialInvites, user }: AktivasiClientProps) {
  const [invites, setInvites] = React.useState<ActivationInvite[]>(initialInvites);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchInvites = async () => {
    try {
      setRefreshing(true);
      const data = await apiFetch<{ invites?: ActivationInvite[] }>('/api/invites');
      setInvites(data.invites || []);
    } catch {
      toast.error('Gagal memperbarui daftar undangan.');
    } finally {
      setRefreshing(false);
    }
  };

  const pendingCount = invites.filter((i) => i.status === 'PENDING').length;
  const usedCount = invites.filter((i) => i.status === 'USED').length;

  return (
    <div className="space-y-8">
      <PageHeader
        badge="Manajemen Onboarding"
        tone="gold"
        title="Generator Link Aktivasi Pengurus"
        description="Buat tautan pendaftaran unik sekali pakai untuk menambahkan pengurus baru ke dalam organisasi."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchInvites}
              disabled={refreshing}
              className="text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Perbarui
            </Button>
            <InviteGeneratorModal user={user} onInviteCreated={fetchInvites} />
          </>
        }
      />

      {/* Quick Stats Pill */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-line shadow-xs">
          <span className="text-xs font-semibold text-ink-muted uppercase">Total Tautan Dibuat</span>
          <div className="text-2xl font-bold text-ink mt-1">{invites.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-cyan-light/40 border border-cyan/30 shadow-xs">
          <span className="text-xs font-semibold text-[#556343] uppercase">Aktif (Belum Terpakai)</span>
          <div className="text-2xl font-bold text-[#556343] mt-1">{pendingCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-cerulean-light/40 border border-cerulean/30 shadow-xs">
          <span className="text-xs font-semibold text-cerulean-dark uppercase">Sudah Berhasil Aktivasi</span>
          <div className="text-2xl font-bold text-cerulean-dark mt-1">{usedCount}</div>
        </div>
      </div>

      {/* Invites List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-ink">
          Riwayat Tautan Aktivasi
        </h2>

        {invites.length > 0 ? (
          <InviteTable
            invites={invites}
            onRefresh={fetchInvites}
          />
        ) : (
          <EmptyState
            icon={Link2}
            title="Belum Ada Link Aktivasi"
            description="Belum ada tautan aktivasi yang dibuat. Tekan tombol 'Buat Link Aktivasi' untuk membuat tautan undangan pertama."
          />
        )}
      </div>
    </div>
  );
}

