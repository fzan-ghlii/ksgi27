'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import type { AuditLogEntry } from '@/types';

const AUDIT_ACTION_BADGES: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-800',
  DELETE: 'bg-rose-100 text-rose-800',
  ROLE_CHANGE: 'bg-amber-100 text-amber-900 border border-amber-300',
  SYNC_SHEET: 'bg-sky-100 text-sky-800',
};

const AUDIT_ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'PUBLISH',
  'ROLE_CHANGE',
  'SYNC_SHEET',
  'INVITE_GENERATED',
] as const;

function formatAuditTime(log: AuditLogEntry): string {
  const ts = log.timestamp || log.created_at;
  return ts ? new Date(ts).toLocaleString('id-ID') : '-';
}

function getAuditSummary(log: AuditLogEntry): string {
  return log.summary || (log.detail ? JSON.stringify(log.detail) : '');
}

export function SystemAuditTab({ logs }: { logs: AuditLogEntry[] }) {
  const [logActionFilter, setLogActionFilter] = React.useState<string>('ALL');
  const [logSearch, setLogSearch] = React.useState<string>('');

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

  return (
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
            {AUDIT_ACTIONS.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
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
          filteredLogs.map((log) => {
            const badgeClass = AUDIT_ACTION_BADGES[log.action] || 'bg-slate-100 text-slate-800';
            const summary = getAuditSummary(log);
            return (
              <div key={log.id} className="bg-white p-4 rounded-2xl border border-border shadow-xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-foreground">{log.actor_name || log.actor_email || log.actor_uid}</div>
                    <span className="text-[10px] font-semibold text-primary uppercase">{log.actor_role}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide shrink-0 ${badgeClass}`}>
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
                    <span className="font-mono">{formatAuditTime(log)}</span>
                  </div>
                </div>

                {summary && (
                  <div className="p-2.5 rounded-xl bg-secondary/30 text-[11px] text-muted-foreground leading-relaxed break-words">
                    {summary}
                  </div>
                )}
              </div>
            );
          })
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
                      {formatAuditTime(log)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-foreground">{log.actor_name || log.actor_email || log.actor_uid}</div>
                      <span className="text-[10px] font-semibold text-primary uppercase">{log.actor_role}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide ${
                          AUDIT_ACTION_BADGES[log.action] || 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-foreground">{log.target_label || log.target_id}</span>
                      <span className="block text-[10px] text-muted-foreground uppercase">
                        {log.target_type || log.target_collection}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-muted-foreground max-w-xs truncate">
                      {getAuditSummary(log) || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

