'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Power } from 'lucide-react';
import { toast } from 'sonner';
import type { AuditLogEntry, UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/form-controls';
import { PageHeader, TabBar } from '@/components/dashboard/page-parts';
import { apiFetch } from '@/lib/api-client';
import { SystemAuditTab } from './system-audit-tab';
import { SystemUsersTab } from './system-users-tab';
import { SystemIntegrationsTab, type SheetsTestStatus } from './system-integrations-tab';

interface SystemClientProps {
  user: UserProfile;
  initialMetrics: {
    counts: Record<string, number>;
    config: {
      maintenance_mode: boolean;
      maintenance_message: string;
      default_spreadsheet_id: string;
      gform_webhook_secret: string;
    };
    sheetsTest: SheetsTestStatus;
  };
  initialLogs: AuditLogEntry[];
  initialUsers: UserProfile[];
}

export function SystemClient({
  initialMetrics,
  initialLogs,
  initialUsers,
}: SystemClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<'audit' | 'users' | 'integrations' | 'maintenance'>('maintenance');

  const [maintenanceMode, setMaintenanceMode] = React.useState(initialMetrics.config.maintenance_mode);
  const [maintenanceMessage, setMaintenanceMessage] = React.useState(initialMetrics.config.maintenance_message);
  const [updatingMaintenance, setUpdatingMaintenance] = React.useState(false);
  const [usersList, setUsersList] = React.useState<UserProfile[]>(initialUsers);

  const saveMaintenance = async (nextMode: boolean, successMsg: string, refreshAfter = false) => {
    try {
      setUpdatingMaintenance(true);
      await apiFetch('/api/system/maintenance', {
        method: 'POST',
        body: {
          maintenance_mode: nextMode,
          maintenance_message: maintenanceMessage,
        },
      });
      setMaintenanceMode(nextMode);
      toast.success(successMsg);
      if (refreshAfter) router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setUpdatingMaintenance(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Superuser Level"
        tone="gold"
        title="Creator System Console"
        description="Ruang kendali infrastruktur utama: Audit log aktivitas, override perizinan pengurus, integrasi ekosistem Google, dan saklar Maintenance Mode."
      />

      <TabBar
        value={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'maintenance', label: 'Maintenance Mode' },
          { id: 'audit', label: 'Audit Log Explorer', count: initialLogs.length },
          { id: 'users', label: 'Override Pengguna & Role', count: usersList.length },
          { id: 'integrations', label: 'Koleksi & Integrasi Google' },
        ]}
      />

      {activeTab === 'maintenance' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-border shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Status Akses Publik
                </span>
                <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                  Mode Pemeliharaan (Maintenance Mode)
                  {maintenanceMode ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300">
                      AKTIF (TERKUNCI)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                      NORMAL (PUBLIK AKTIF)
                    </span>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground max-w-xl">
                  Bila diaktifkan, seluruh rute publik akan otomatis menampilkan halaman pemeliharaan resmi GIBEI UNIMED. Akses login dan dashboard internal tetap dapat diakses oleh Creator dan pengurus.
                </p>
              </div>

              <Button
                size="lg"
                onClick={() => {
                  const nextState = !maintenanceMode;
                  saveMaintenance(
                    nextState,
                    nextState
                      ? 'Maintenance Mode AKTIF: Pengunjung publik akan dialihkan ke halaman pemeliharaan.'
                      : 'Maintenance Mode DINONAKTIFKAN: Website publik kembali normal.',
                    true
                  );
                }}
                disabled={updatingMaintenance}
                className={`font-black text-xs px-6 py-3 rounded-2xl shadow-sm transition-all ${
                  maintenanceMode
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                {updatingMaintenance ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
                ) : (
                  <Power className="w-4 h-4 mr-2 text-white" />
                )}
                {maintenanceMode ? 'Matikan Maintenance Mode' : 'Aktifkan Maintenance Mode'}
              </Button>
            </div>

            <div className="pt-6 space-y-4">
              <label className="text-xs font-bold text-foreground block">
                Pesan Pemeliharaan untuk Pengunjung Publik:
              </label>
              <Textarea
                rows={3}
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="Tuliskan alasan pemeliharaan atau estimasi waktu selesai..."
                className="text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={updatingMaintenance}
                onClick={() => saveMaintenance(maintenanceMode, 'Pesan pemeliharaan berhasil disimpan.')}
                className="text-xs font-semibold"
              >
                Simpan Pesan Saja
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && <SystemAuditTab logs={initialLogs} />}

      {activeTab === 'users' && <SystemUsersTab usersList={usersList} onUsersChange={setUsersList} />}

      {activeTab === 'integrations' && (
        <SystemIntegrationsTab
          counts={initialMetrics.counts}
          defaultSpreadsheetId={initialMetrics.config.default_spreadsheet_id || ''}
          webhookSecret={initialMetrics.config.gform_webhook_secret || ''}
          initialSheetsTest={initialMetrics.sheetsTest}
        />
      )}
    </div>
  );
}
