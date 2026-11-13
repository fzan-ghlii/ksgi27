'use client';

import * as React from 'react';
import { Info, Search, Users } from 'lucide-react';
import type { DivisionCode, PiketEligibleMember, PiketScheduleEntry, PiketSession } from '@/types';
import { PIKET_DAYS, PIKET_SESSIONS } from '@/lib/utils/piket';
import { PUBLIC_DIVISIONS, divisionName } from '@/lib/constants/divisions';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/form-controls';
import type { WibClock } from './piket-shared';

interface PiketJadwalTabProps {
  periodId: string;
  schedules: PiketScheduleEntry[];
  wib: WibClock;
  isMySchedule: (entry: PiketScheduleEntry) => boolean;
  mandatoryMembers: PiketEligibleMember[];
  unscheduledMandatory: PiketEligibleMember[];
  scheduledMandatoryCount: number;
}

export function PiketJadwalTab({
  periodId,
  schedules,
  wib,
  isMySchedule,
  mandatoryMembers,
  unscheduledMandatory,
  scheduledMandatoryCount,
}: PiketJadwalTabProps) {
  const [scheduleSearch, setScheduleSearch] = React.useState('');
  const [scheduleDivisionFilter, setScheduleDivisionFilter] = React.useState<'ALL' | DivisionCode>('ALL');
  const [showComplianceDrawer, setShowComplianceDrawer] = React.useState(false);

  const filteredSchedules = React.useMemo(() => {
    const q = scheduleSearch.trim().toLowerCase();
    return schedules.filter((s) => {
      if (scheduleDivisionFilter !== 'ALL' && s.division_code !== scheduleDivisionFilter) {
        return false;
      }
      if (!q) return true;
      return (
        s.member_name.toLowerCase().includes(q) ||
        s.position_title.toLowerCase().includes(q) ||
        divisionName(s.division_code).toLowerCase().includes(q)
      );
    });
  }, [schedules, scheduleSearch, scheduleDivisionFilter]);

  return (
    <div className="space-y-5">
      {/* Banner Info Aturan Piket & Tata Kelola */}
      <div className="rounded-2xl border border-cerulean/20 bg-cerulean-light/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-cerulean shrink-0 mt-0.5" />
          <div className="text-xs text-ink space-y-0.5">
            <p className="font-bold text-sm">Jadwal Piket Galeri Investasi BEI UNIMED (Periode {periodId})</p>
            <p className="text-ink-muted leading-relaxed">
              Jadwal bersifat lihat-saja bagi anggota. Perubahan jadwal dikelola oleh Kadiv &amp;
              Wakadiv Galeri, diawasi oleh Presidium. Sesi Pagi: 08.00–12.00 WIB · Sesi Siang:
              14.00–17.00 WIB.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => setShowComplianceDrawer((v) => !v)}
        >
          <Users className="h-3.5 w-3.5" />
          {showComplianceDrawer
            ? 'Tutup Status Kepatuhan'
            : `Cek Pengurus Belum Terjadwal (${unscheduledMandatory.length})`}
        </Button>
      </div>

      {showComplianceDrawer && (
        <div className="rounded-2xl border border-line bg-white p-4 sm:p-5 space-y-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-ink">Kepatuhan Penjadwalan Piket Pengurus Wajib</h3>
              <p className="text-xs text-ink-muted">
                Seluruh pengurus lintas divisi termasuk Kadiv &amp; Wakadiv Galeri wajib memiliki jadwal
                piket. Presidium bertindak sebagai pengawas.
              </p>
            </div>
            <Badge variant={unscheduledMandatory.length === 0 ? 'success' : 'gold'}>
              {scheduledMandatoryCount} / {mandatoryMembers.length} Terjadwal
            </Badge>
          </div>

          {unscheduledMandatory.length === 0 ? (
            <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              Semua pengurus wajib piket sudah tercantum dalam jadwal mingguan Galeri.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto">
              {unscheduledMandatory.map((m) => (
                <div
                  key={m.key}
                  className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink truncate">{m.full_name}</p>
                    <p className="text-[11px] text-ink-muted truncate">
                      {divisionName(m.division_code)} · {m.position_title}
                    </p>
                  </div>
                  <Badge variant="gold" className="text-[10px] shrink-0">
                    Belum Ada
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter Pencarian Jadwal */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={scheduleSearch}
            onChange={(e) => setScheduleSearch(e.target.value)}
            placeholder="Cari nama pengurus, jabatan, atau divisi..."
            className="pl-9"
          />
        </div>
        <Select
          value={scheduleDivisionFilter}
          onChange={(e) => setScheduleDivisionFilter(e.target.value as 'ALL' | DivisionCode)}
          className="sm:w-56"
          aria-label="Filter divisi jadwal"
        >
          <option value="ALL">Semua Divisi</option>
          {PUBLIC_DIVISIONS.map((d) => (
            <option key={d.code} value={d.code}>
              {d.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Matriks Jadwal Responsif: 1 kolom di mobile -> 2 tablet -> 5 desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3.5">
        {PIKET_DAYS.map((dayObj) => {
          const isToday = wib.isWeekday && wib.dayCode === dayObj.code;
          return (
            <div
              key={dayObj.code}
              className={cn(
                'rounded-2xl border bg-white overflow-hidden flex flex-col shadow-sm',
                isToday ? 'border-cerulean ring-2 ring-cerulean/15' : 'border-line'
              )}
            >
              <div
                className={cn(
                  'px-4 py-3 border-b flex items-center justify-between',
                  isToday ? 'bg-cerulean text-white border-cerulean' : 'bg-surface border-line'
                )}
              >
                <span className="font-extrabold text-sm">{dayObj.label}</span>
                {isToday && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-cerulean">
                    Hari Ini
                  </span>
                )}
              </div>

              <div className="divide-y divide-line flex-1">
                {(['PAGI', 'SIANG'] as PiketSession[]).map((sesCode) => {
                  const sesMeta = PIKET_SESSIONS[sesCode];
                  const slotItems = filteredSchedules.filter(
                    (s) => s.day === dayObj.code && s.session === sesCode
                  );
                  return (
                    <div key={sesCode} className="p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-extrabold text-ink">{sesMeta.label}</p>
                          <p className="text-[11px] text-ink-muted">{sesMeta.timeRange}</p>
                        </div>
                        <Badge variant={sesCode === 'PAGI' ? 'cerulean' : 'cyan'} className="text-[10px]">
                          {slotItems.length} Orang
                        </Badge>
                      </div>

                      {slotItems.length === 0 ? (
                        <p className="text-[11px] italic text-ink-muted py-1.5">
                          Belum ada petugas terjadwal.
                        </p>
                      ) : (
                        <ul className="space-y-1.5">
                          {slotItems.map((entry) => {
                            const mine = isMySchedule(entry);
                            return (
                              <li
                                key={entry.id}
                                className={cn(
                                  'rounded-xl border px-2.5 py-2 text-xs',
                                  mine ? 'border-cerulean bg-cerulean-light/40' : 'border-line bg-surface/60'
                                )}
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className="font-bold text-ink truncate">{entry.member_name}</span>
                                  {mine && (
                                    <span className="text-[10px] font-extrabold text-cerulean shrink-0">Saya</span>
                                  )}
                                </div>
                                <p className="text-[11px] text-ink-muted truncate">
                                  {divisionName(entry.division_code)} · {entry.position_title}
                                </p>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

