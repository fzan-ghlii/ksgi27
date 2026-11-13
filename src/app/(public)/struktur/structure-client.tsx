'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { BoardMember, Period } from '@/types';
import { OFFICIAL_DIVISIONS } from '@/lib/constants/divisions';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/form-controls';
import { Users, Shield, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StructureClientProps {
  periods: Period[];
  currentPeriodId: string;
  initialMembers: BoardMember[];
  periodYear: string;
  cabinetName: string;
}

export function StructureClient({
  periods,
  currentPeriodId,
  initialMembers,
  periodYear,
  cabinetName,
}: StructureClientProps) {
  const router = useRouter();
  const [selectedDivision, setSelectedDivision] = React.useState<string>('ALL');

  const filteredMembers = React.useMemo(() => {
    if (selectedDivision === 'ALL') return initialMembers;
    return initialMembers.filter((m) => m.division_code === selectedDivision);
  }, [initialMembers, selectedDivision]);

  const divisionFilterTabs = [
    { code: 'ALL', name: 'Semua Divisi' },
    ...Object.values(OFFICIAL_DIVISIONS),
  ];

  return (
    <div className="space-y-8">
      {/* Period Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-line shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-cerulean-dark shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Periode Kepengurusan:
            </span>
          </div>
          <Select
            value={currentPeriodId}
            onChange={(e) => router.push(`/struktur?periode=${e.target.value}`)}
            className="w-full sm:w-auto min-w-[200px] text-xs h-9 font-bold"
            aria-label="Pilih Periode Kepengurusan"
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                Periode {p.year_range}{p.cabinet_name ? ` (${p.cabinet_name})` : ''} {p.is_current ? '(Aktif)' : '(Arsip)'}
              </option>
            ))}
          </Select>
        </div>

        <div className="text-xs text-ink-muted font-medium self-end sm:self-auto">
          Menampilkan <strong>{filteredMembers.length}</strong> pengurus terpilih
        </div>
      </div>

      {/* Filter Tabs 6 Divisi + Presidium (Swipeable on mobile) */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface border border-line overflow-x-auto no-scrollbar flex-nowrap sm:flex-wrap max-w-full">
        {divisionFilterTabs.map((tab) => {
          const isActive = selectedDivision === tab.code;
          const count =
            tab.code === 'ALL'
              ? initialMembers.length
              : initialMembers.filter((m) => m.division_code === tab.code).length;

          return (
            <button
              key={tab.code}
              onClick={() => setSelectedDivision(tab.code)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer inline-flex items-center gap-1.5',
                isActive
                  ? 'bg-cerulean text-white shadow-sm'
                  : 'text-ink-muted hover:text-cerulean-dark hover:bg-white/80'
              )}
            >
              <span>{tab.name}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px]',
                  isActive ? 'bg-white/20 text-white' : 'bg-white text-ink-muted border border-line'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Members Grid */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMembers.map((member) => {
            const isPresidium = member.division_code === 'PRESIDIUM';
            return (
              <div
                key={member.id}
                className={cn(
                  'bento-card p-6 flex flex-col items-center text-center bg-white border border-line hover:border-cerulean transition-all shadow-sm',
                  isPresidium &&
                    'border-gold/40 shadow-gold/5 bg-gradient-to-b from-white via-white to-gold-light/20'
                )}
              >
                {/* Photo / Avatar */}
                <div className="relative mb-4">
                  {member.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.photo_url}
                      alt={member.full_name}
                      className="h-24 w-24 rounded-2xl object-cover border-2 border-white shadow-md shadow-slate-200"
                    />
                  ) : (
                    <div
                      className={cn(
                        'h-24 w-24 rounded-2xl flex items-center justify-center font-bold text-2xl border-2 border-white shadow-md',
                        isPresidium
                          ? 'bg-gold-light text-[#66532d] shadow-gold/20'
                          : 'bg-cerulean-light text-cerulean shadow-cerulean/20'
                      )}
                    >
                      {member.full_name.charAt(0)}
                    </div>
                  )}

                  {isPresidium && (
                    <div
                      className="absolute -bottom-2 -right-2 p-1 rounded-lg bg-gold text-ink shadow-xs"
                      title="Presidium Inti"
                    >
                      <Shield className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <h3 className="text-base font-bold text-ink leading-tight line-clamp-1">
                  {member.full_name}
                </h3>
                <p className="text-xs font-semibold text-cerulean-dark mt-1 line-clamp-1">
                  {member.position_title}
                </p>

                {member.bio && (
                  <p className="text-[11px] text-ink-muted mt-2 line-clamp-2 leading-relaxed">
                    &ldquo;{member.bio}&rdquo;
                  </p>
                )}

                <div className="mt-3">
                  <Badge variant={isPresidium ? 'gold' : 'cerulean'} className="text-[10px]">
                    {member.division_code}
                  </Badge>
                </div>

                {/* Social Links */}
                {(member.social_links?.linkedin || member.social_links?.instagram) && (
                  <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-center gap-2">
                    {member.social_links.linkedin && (
                      <a
                        href={member.social_links.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-ink-muted hover:text-cerulean-dark hover:bg-surface transition-colors"
                        title="LinkedIn"
                      >
                        <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                      </a>
                    )}
                    {member.social_links.instagram && (
                      <a
                        href={member.social_links.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-ink-muted hover:text-rose-600 hover:bg-surface transition-colors"
                        title="Instagram"
                      >
                        <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="Belum Ada Pengurus Terdaftar"
          description={`Belum ada data pengurus aktif untuk divisi ini pada periode ${periodYear} (${cabinetName}).`}
        />
      )}
    </div>
  );
}
