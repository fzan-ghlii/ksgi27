'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { UserProfile } from '@/types';
import { OFFICIAL_DIVISIONS } from '@/lib/constants/divisions';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api-client';

const ROLE_OPTIONS = [
  { value: 'creator', label: 'Presidium Utama' },
  { value: 'master_presidium', label: 'Presidium' },
  { value: 'admin_kadiv', label: 'Kepala Divisi' },
  { value: 'member', label: 'Anggota' },
] as const;

interface SystemUsersTabProps {
  usersList: UserProfile[];
  onUsersChange: React.Dispatch<React.SetStateAction<UserProfile[]>>;
}

export function SystemUsersTab({ usersList, onUsersChange }: SystemUsersTabProps) {
  const router = useRouter();
  const [userSearch, setUserSearch] = React.useState<string>('');
  const [editingUserUid, setEditingUserUid] = React.useState<string | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<string>('USER');
  const [selectedDivision, setSelectedDivision] = React.useState<string>('PRESIDIUM');
  const [updatingUser, setUpdatingUser] = React.useState(false);

  const handleSaveUserOverride = async (uid: string) => {
    try {
      setUpdatingUser(true);
      await apiFetch(`/api/system/users/${uid}`, {
        method: 'PATCH',
        body: { role: selectedRole, division_code: selectedDivision },
      });

      toast.success('Hak akses pengguna berhasil diperbarui.');
      onUsersChange((prev) =>
        prev.map((u) =>
          u.uid === uid
            ? {
                ...u,
                role: selectedRole as UserProfile['role'],
                division_code: selectedDivision as UserProfile['division_code'],
              }
            : u
        )
      );
      setEditingUserUid(null);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah role.');
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleToggleUserActive = async (targetUser: UserProfile) => {
    const nextActive = !targetUser.is_active;
    try {
      await apiFetch(`/api/system/users/${targetUser.uid}`, {
        method: 'PATCH',
        body: { is_active: nextActive },
      });

      toast.success(`Akun ${targetUser.full_name} ${nextActive ? 'diaktifkan' : 'dinonaktifkan'}.`);
      onUsersChange((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, is_active: nextActive } : u))
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal update status.');
    }
  };

  const startEditing = (u: UserProfile) => {
    setEditingUserUid(u.uid);
    setSelectedRole(u.role);
    setSelectedDivision(u.division_code || 'PRESIDIUM');
  };

  const filteredUsers = usersList.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.nim || '').toLowerCase().includes(q)
    );
  });

  const renderRoleSelect = (className: string) => (
    <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className={className}>
      {ROLE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );

  const renderDivisionSelect = (className: string) => (
    <select value={selectedDivision} onChange={(e) => setSelectedDivision(e.target.value)} className={className}>
      {Object.values(OFFICIAL_DIVISIONS).map((d) => (
        <option key={d.code} value={d.code}>
          {d.name}
        </option>
      ))}
    </select>
  );

  const formatDivision = (code?: UserProfile['division_code']) =>
    code ? OFFICIAL_DIVISIONS[code]?.name || code : '-';

  const formatRoleBadge = (role: UserProfile['role']) => (
    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20">
      {role === 'creator' ? 'Presidium Utama' : role}
    </span>
  );

  const renderActiveToggle = (u: UserProfile, extraClass = '') => (
    <button
      onClick={() => handleToggleUserActive(u)}
      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${extraClass} ${
        u.is_active !== false
          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
          : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
      }`}
    >
      {u.is_active !== false ? 'Aktif' : 'Nonaktif'}
    </button>
  );

  return (
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
                  {renderActiveToggle(u, 'shrink-0')}
                </div>

                <div className="pt-2 border-t border-border/60 space-y-2 text-xs">
                  {isEditing ? (
                    <div className="space-y-2 bg-secondary/30 p-3 rounded-xl border border-border">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                          Tingkatan Role:
                        </label>
                        {renderRoleSelect('w-full px-2 py-1.5 rounded-lg text-xs border border-border bg-white')}
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                          Divisi Resmi:
                        </label>
                        {renderDivisionSelect('w-full px-2 py-1.5 rounded-lg text-xs border border-border bg-white')}
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
                        {formatRoleBadge(u.role)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[11px]">Divisi:</span>
                        <span className="font-semibold text-foreground">{formatDivision(u.division_code)}</span>
                      </div>
                      <div className="pt-1 flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(u)}
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
                      {isEditing
                        ? renderRoleSelect('px-2 py-1 rounded-lg text-xs border border-border bg-white')
                        : formatRoleBadge(u.role)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {isEditing ? (
                        renderDivisionSelect('px-2 py-1 rounded-lg text-xs border border-border bg-white')
                      ) : (
                        <span className="text-xs font-semibold text-foreground">{formatDivision(u.division_code)}</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">{renderActiveToggle(u)}</td>

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
                          onClick={() => startEditing(u)}
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
  );
}

