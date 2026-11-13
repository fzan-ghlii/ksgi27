'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AuditLogEntry, UserProfile } from '@/types';
import { OFFICIAL_DIVISIONS } from '@/lib/constants/divisions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ShieldAlert,
  Settings,
  History,
  Users,
  Database,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Key,
  RefreshCw,
  Power,
  ShieldCheck,
  Edit,
  Loader2,
} from 'lucide-react';

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
    sheetsTest: {
      configured: boolean;
      connected: boolean;
      message: string;
      sheetTitle?: string;
    };
  };
  initialLogs: AuditLogEntry[];
  initialUsers: UserProfile[];
}

export function SystemClient({
  user,
  initialMetrics,
  initialLogs,
  initialUsers,
}: SystemClientProps) {
  const router = useRouter();

  // Tabs kendali
  const [activeTab, setActiveTab] = React.useState<'audit' | 'users' | 'integrations' | 'maintenance'>('maintenance');

  // Maintenance state
  const [maintenanceMode, setMaintenanceMode] = React.useState(initialMetrics.config.maintenance_mode);
  const [maintenanceMessage, setMaintenanceMessage] = React.useState(initialMetrics.config.maintenance_message);
  const [updatingMaintenance, setUpdatingMaintenance] = React.useState(false);

  // Sheets & Integrations
  const [defaultSheetId, setDefaultSheetId] = React.useState(initialMetrics.config.default_spreadsheet_id || '');
  const [webhookSecret, setWebhookSecret] = React.useState(initialMetrics.config.gform_webhook_secret || '');
  const [sheetsStatus, setSheetsStatus] = React.useState(initialMetrics.sheetsTest);
  const [testingSheet, setTestingSheet] = React.useState(false);

  // Audit Logs state
  const [logs, setLogs] = React.useState<AuditLogEntry[]>(initialLogs);
  const [logActionFilter, setLogActionFilter] = React.useState<string>('ALL');
  const [logSearch, setLogSearch] = React.useState<string>('');

  // Users state
  const [usersList, setUsersList] = React.useState<UserProfile[]>(initialUsers);
  const [userSearch, setUserSearch] = React.useState<string>('');
  const [editingUserUid, setEditingUserUid] = React.useState<string | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<string>('USER');
  const [selectedDivision, setSelectedDivision] = React.useState<string>('PRESIDIUM');
  const [updatingUser, setUpdatingUser] = React.useState(false);

  // Toggle Maintenance Mode
  const handleToggleMaintenance = async () => {
    try {
      setUpdatingMaintenance(true);
      const nextState = !maintenanceMode;
      const res = await fetch('/api/system/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maintenance_mode: nextState,
          maintenance_message: maintenanceMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah status pemeliharaan.');

      setMaintenanceMode(nextState);
      toast.success(
        nextState
          ? 'Maintenance Mode AKTIF: Pengunjung publik akan dialihkan ke halaman pemeliharaan.'
          : 'Maintenance Mode DINONAKTIFKAN: Website publik kembali normal.'
      );
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      toast.error(msg);
    } finally {
      setUpdatingMaintenance(false);
    }
  };

  // Uji Koneksi Google Sheets
  const handleTestSheets = async () => {
    try {
      setTestingSheet(true);
      const res = await fetch('/api/system/test-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheet_id: defaultSheetId.trim() || undefined }),
      });
      const data = await res.json();
      setSheetsStatus(data);
      if (data.connected) {
        toast.success(data.message);
      } else {
        toast.warning(data.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Koneksi gagal.';
      toast.error(msg);
    } finally {
      setTestingSheet(false);
    }
  };

  // Update Role/Divisi/Status User
  const handleSaveUserOverride = async (uid: string) => {
    try {
      setUpdatingUser(true);
      const res = await fetch(`/api/system/users/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          division_code: selectedDivision,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengupdate akun user.');

      toast.success(`Hak akses pengguna berhasil diperbarui.`);
      setUsersList((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role: selectedRole as any, division_code: selectedDivision as any } : u))
      );
      setEditingUserUid(null);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengubah role.';
      toast.error(msg);
    } finally {
      setUpdatingUser(false);
    }
  };

  // Toggle Akun Aktif / Nonaktif
  const handleToggleUserActive = async (targetUser: UserProfile) => {
    const nextActive = !targetUser.is_active;
    try {
      const res = await fetch(`/api/system/users/${targetUser.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah status aktif user.');

      toast.success(`Akun ${targetUser.full_name} ${nextActive ? 'diaktifkan' : 'dinonaktifkan'}.`);
      setUsersList((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, is_active: nextActive } : u))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal update status.';
      toast.error(msg);
    }
  };

  // Filter audit logs
  const filteredLogs = logs.filter((l) => {
    if (logActionFilter !== 'ALL' && l.action !== logActionFilter) return false;
    if (logSearch.trim()) {
      const q = logSearch.toLowerCase();
      const actor = (l.actor_name || l.actor_email || l.actor_uid || '').toLowerCase();
      const target = (l.target_label || l.target_id || l.target_collection || '').toLowerCase();
      const summary = (l.summary || '').toLowerCase();
      const act = (l.action || '').toLowerCase();
      if (!actor.includes(q) && !target.includes(q) && !summary.includes(q) && !act.includes(q)) return false;
    }
    return true;
  });

  // Filter users
  const filteredUsers = usersList.filter((u) => {
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      const name = (u.full_name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const nim = (u.nim || '').toLowerCase();
      if (!name.includes(q) && !email.includes(q) && !nim.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gold-light text-[#66532d] border border-gold/30">
              <ShieldAlert className="w-5 h-5 text-gold" />
            </span>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Creator System Console
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gold text-ink shadow-xs">
              Superuser Level
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Ruang kendali infrastruktur utama: Audit log aktivitas, override perizinan pengurus, integrasi ekosistem Google, dan saklar Maintenance Mode.
          </p>
        </div>
      </div>

      {/* Navigasi Tab Kendali */}
      <div className="flex items-center gap-2 p-1.5 bg-secondary/50 rounded-2xl border border-border w-full sm:w-fit overflow-x-auto no-scrollbar flex-nowrap">
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'maintenance'
              ? 'bg-white text-foreground shadow-xs border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Power className="w-4 h-4 text-amber-500" />
          Maintenance Mode
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'audit'
              ? 'bg-white text-foreground shadow-xs border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="w-4 h-4 text-primary" />
          Audit Log Explorer
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'users'
              ? 'bg-white text-foreground shadow-xs border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4 text-cyan" />
          Override Pengguna & Role
        </button>

        <button
          onClick={() => setActiveTab('integrations')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'integrations'
              ? 'bg-white text-foreground shadow-xs border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-600" />
          Koleksi & Integrasi Google
        </button>
      </div>

      {/* TAB 1: MAINTENANCE MODE */}
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
                onClick={handleToggleMaintenance}
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

            {/* Pesan Pemeliharaan */}
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
                onClick={async () => {
                  try {
                    await fetch('/api/system/maintenance', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        maintenance_mode: maintenanceMode,
                        maintenance_message: maintenanceMessage,
                      }),
                    });
                    toast.success('Pesan pemeliharaan berhasil disimpan.');
                  } catch {
                    toast.error('Gagal menyimpan pesan.');
                  }
                }}
                className="text-xs font-semibold"
              >
                Simpan Pesan Saja
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOG EXPLORER */}
      {activeTab === 'audit' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Filter Bar */}
          <div className="bg-white p-3 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari log nama pelaku, target, tindakan..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-secondary/30 border border-border focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-muted-foreground">Tindakan:</span>
              <select
                value={logActionFilter}
                onChange={(e) => setLogActionFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs bg-secondary/30 border border-border focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="ALL">Semua Tindakan</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="PUBLISH">PUBLISH</option>
                <option value="ROLE_CHANGE">ROLE_CHANGE</option>
                <option value="SYNC_SHEET">SYNC_SHEET</option>
                <option value="INVITE_GENERATED">INVITE_GENERATED</option>
              </select>
            </div>
          </div>

          {/* Mobile Card View (md:hidden) */}
          <div className="md:hidden space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-border text-center text-xs text-muted-foreground">
                Tidak ada log audit yang sesuai kriteria.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="bg-white p-4 rounded-2xl border border-border shadow-xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-foreground">{log.actor_name || log.actor_email || log.actor_uid}</div>
                      <span className="text-[10px] font-semibold text-primary uppercase">
                        {log.actor_role}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide shrink-0 ${
                        log.action === 'CREATE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.action === 'DELETE'
                          ? 'bg-rose-100 text-rose-800'
                          : log.action === 'ROLE_CHANGE'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : log.action === 'SYNC_SHEET'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {log.action}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 pt-2 border-t border-border/60">
                    <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                      <span>Target:</span>
                      <span className="font-semibold text-foreground text-right truncate max-w-[200px]">
                        {log.target_label || log.target_id}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                      <span>Tipe:</span>
                      <span className="uppercase text-[10px]">{log.target_type || log.target_collection}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                      <span>Waktu:</span>
                      <span className="font-mono">{log.timestamp || log.created_at ? new Date(log.timestamp || log.created_at!).toLocaleString('id-ID') : '-'}</span>
                    </div>
                  </div>

                  {(log.summary || log.detail) && (
                    <div className="p-2.5 rounded-xl bg-secondary/30 text-[11px] text-muted-foreground leading-relaxed break-words">
                      {log.summary || JSON.stringify(log.detail)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Tabel Log Desktop (hidden md:block) */}
          <div className="hidden md:block bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/40 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-36">Waktu</th>
                    <th className="py-3 px-4">Pelaku (Actor)</th>
                    <th className="py-3 px-4 text-center">Tindakan</th>
                    <th className="py-3 px-4">Entitas Target</th>
                    <th className="py-3 px-4">Rincian Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Tidak ada log audit yang sesuai kriteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-secondary/15 transition-colors">
                        <td className="py-3 px-4 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                          {log.timestamp || log.created_at ? new Date(log.timestamp || log.created_at!).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-foreground">{log.actor_name || log.actor_email || log.actor_uid}</div>
                          <span className="text-[10px] font-semibold text-primary uppercase">
                            {log.actor_role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide ${
                              log.action === 'CREATE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.action === 'DELETE'
                                ? 'bg-rose-100 text-rose-800'
                                : log.action === 'ROLE_CHANGE'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : log.action === 'SYNC_SHEET'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-foreground">{log.target_label || log.target_id}</span>
                          <span className="block text-[10px] text-muted-foreground uppercase">{log.target_type || log.target_collection}</span>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-muted-foreground max-w-xs truncate">
                          {log.summary || (log.detail ? JSON.stringify(log.detail) : '-')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OVERRIDE PENGGUNA & ROLE */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white p-3 rounded-2xl border border-border shadow-xs flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari pengguna berdasarkan nama, email, NIM..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-secondary/30 border border-border focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <span className="text-xs text-muted-foreground font-semibold">
              Total Pengurus: {usersList.length} Akun
            </span>
          </div>

          {/* Mobile Card View (md:hidden) */}
          <div className="md:hidden space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-border text-center text-xs text-muted-foreground">
                Tidak ada pengguna yang cocok dengan pencarian.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isEditing = editingUserUid === u.uid;
                return (
                  <div key={u.uid} className="bg-white p-4 rounded-2xl border border-border shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm text-foreground">{u.full_name || 'Tanpa Nama'}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                        {u.nim && <div className="text-[10px] font-mono text-muted-foreground mt-0.5">NIM: {u.nim}</div>}
                      </div>
                      <button
                        onClick={() => handleToggleUserActive(u)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all shrink-0 ${
                          u.is_active !== false
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        {u.is_active !== false ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </div>

                    <div className="pt-2 border-t border-border/60 space-y-2 text-xs">
                      {isEditing ? (
                        <div className="space-y-2 bg-secondary/30 p-3 rounded-xl border border-border">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                              Tingkatan Role:
                            </label>
                            <select
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg text-xs border border-border bg-white"
                            >
                              <option value="creator">Presidium Utama</option>
                              <option value="master_presidium">Presidium</option>
                              <option value="admin_kadiv">Kepala Divisi</option>
                              <option value="member">Anggota</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                              Divisi Resmi:
                            </label>
                            <select
                              value={selectedDivision}
                              onChange={(e) => setSelectedDivision(e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg text-xs border border-border bg-white"
                            >
                              {Object.values(OFFICIAL_DIVISIONS).map((d) => (
                                <option key={d.code} value={d.code}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <Button
                              size="sm"
                              disabled={updatingUser}
                              onClick={() => handleSaveUserOverride(u.uid)}
                              className="bg-gold hover:bg-gold-hover text-ink font-bold text-xs flex-1 h-8"
                            >
                              {updatingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin text-ink mr-1" /> : null}
                              Simpan
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingUserUid(null)}
                              className="text-xs h-8 px-3"
                            >
                              Batal
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-[11px]">Role:</span>
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20">
                              {u.role === 'creator' ? 'Presidium Utama' : u.role}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-[11px]">Divisi:</span>
                            <span className="font-semibold text-foreground">
                              {u.division_code ? OFFICIAL_DIVISIONS[u.division_code]?.name || u.division_code : '-'}
                            </span>
                          </div>
                          <div className="pt-1 flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingUserUid(u.uid);
                                setSelectedRole(u.role);
                                setSelectedDivision(u.division_code || 'PRESIDIUM');
                              }}
                              className="text-primary hover:text-primary hover:bg-primary/10 text-xs h-7 px-3 w-full"
                            >
                              <Edit className="w-3.5 h-3.5 mr-1" />
                              Ubah Hak Akses
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View (hidden md:block) */}
          <div className="hidden md:block bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/40 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3 px-4">Nama Lengkap & Kontak</th>
                    <th className="py-3 px-4 text-center">Tingkatan Role</th>
                    <th className="py-3 px-4 text-center">Divisi Resmi</th>
                    <th className="py-3 px-4 text-center">Status Akun</th>
                    <th className="py-3 px-4 text-center">Aksi Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredUsers.map((u) => {
                    const isEditing = editingUserUid === u.uid;

                    return (
                      <tr key={u.uid} className="hover:bg-secondary/15 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-foreground">{u.full_name || 'Tanpa Nama'}</div>
                          <div className="text-[11px] text-muted-foreground">{u.email}</div>
                          {u.nim && <div className="text-[10px] font-mono text-muted-foreground">NIM: {u.nim}</div>}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isEditing ? (
                            <select
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value)}
                              className="px-2 py-1 rounded-lg text-xs border border-border bg-white"
                            >
                              <option value="creator">Presidium Utama</option>
                              <option value="master_presidium">Presidium</option>
                              <option value="admin_kadiv">Kepala Divisi</option>
                              <option value="member">Anggota</option>
                            </select>
                          ) : (
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20">
                              {u.role === 'creator' ? 'Presidium Utama' : u.role}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isEditing ? (
                            <select
                              value={selectedDivision}
                              onChange={(e) => setSelectedDivision(e.target.value)}
                              className="px-2 py-1 rounded-lg text-xs border border-border bg-white"
                            >
                              {Object.values(OFFICIAL_DIVISIONS).map((d) => (
                                <option key={d.code} value={d.code}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs font-semibold text-foreground">
                              {u.division_code ? OFFICIAL_DIVISIONS[u.division_code]?.name || u.division_code : '-'}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleUserActive(u)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                              u.is_active !== false
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {u.is_active !== false ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                disabled={updatingUser}
                                onClick={() => handleSaveUserOverride(u.uid)}
                                className="bg-gold hover:bg-gold-hover text-ink font-bold text-[11px] h-7 px-2.5"
                              >
                                {updatingUser ? <Loader2 className="w-3 h-3 animate-spin text-ink" /> : 'Simpan'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingUserUid(null)}
                                className="text-[11px] h-7 px-2"
                              >
                                Batal
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingUserUid(u.uid);
                                setSelectedRole(u.role);
                                setSelectedDivision(u.division_code || 'PRESIDIUM');
                              }}
                              className="text-primary hover:text-primary hover:bg-primary/10 text-xs h-7 px-2"
                            >
                              <Edit className="w-3.5 h-3.5 mr-1" />
                              Ubah Hak Akses
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INTEGRASI GOOGLE & METRIK KOLEKSI */}
      {activeTab === 'integrations' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Ringkasan Koleksi Database */}
          <div className="bg-white p-6 rounded-3xl border border-border shadow-xs space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Metrik Dokumen Firestore Database
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(initialMetrics.counts).map(([col, count]) => (
                <div key={col} className="p-3 rounded-2xl bg-secondary/30 border border-border">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
                    {col}
                  </span>
                  <span className="text-xl font-black text-foreground mt-0.5 block">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pengujian Google Sheets API */}
          <div className="bg-white p-6 rounded-3xl border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Status Integrasi Google Sheets API v4
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  sheetsStatus.connected
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {sheetsStatus.connected ? 'Terhubung' : 'Kredensial Belum Terhubung'}
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {sheetsStatus.message}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <Input
                placeholder="Uji akses Spreadsheet ID tertentu..."
                value={defaultSheetId}
                onChange={(e) => setDefaultSheetId(e.target.value)}
                className="text-xs"
              />
              <Button
                onClick={handleTestSheets}
                disabled={testingSheet}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0"
              >
                {testingSheet ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin text-white" /> : <RefreshCw className="w-4 h-4 mr-1.5 text-white" />}
                Uji Koneksi Sheet
              </Button>
            </div>
          </div>

          {/* Webhook Secret Key */}
          <div className="bg-white p-6 rounded-3xl border border-border shadow-xs space-y-3">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Key className="w-5 h-5 text-accent-gold" />
              Webhook Secret Key untuk Google Form
            </h3>
            <p className="text-xs text-muted-foreground">
              Gunakan kunci rahasia ini pada skrip pemicu (Google Apps Script) di Google Form / Spreadsheet untuk mengirimkan data responden ke endpoint <code>/api/webhooks/gform</code>:
            </p>
            <div className="p-3 rounded-xl bg-secondary/50 font-mono text-xs text-foreground border border-border select-all">
              {webhookSecret}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

