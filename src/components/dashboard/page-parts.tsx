import * as React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/** Kepala halaman dashboard: lencana kecil + judul + deskripsi + aksi di kanan. */
export function PageHeader({
  badge,
  title,
  description,
  actions,
  tone = 'cerulean',
}: {
  badge: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  tone?: 'cerulean' | 'gold';
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
      <div>
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border',
            tone === 'gold'
              ? 'bg-gold-light text-[#66532d] border-gold/30'
              : 'bg-cerulean-light text-cerulean-dark border-cerulean/20'
          )}
        >
          <Sparkles className="h-3 w-3" />
          {badge}
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">{title}</h1>
        <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}

/** Tab sederhana (tombol) dengan jumlah opsional, mendukung horizontal swipe di mobile. */
export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<{ id: T; label: string; count?: number }>;
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div
      role="tablist"
      className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface border border-line overflow-x-auto no-scrollbar flex-nowrap sm:flex-wrap w-full sm:w-fit max-w-full"
    >
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer inline-flex items-center gap-2 shrink-0 sm:shrink',
              active ? 'bg-cerulean text-white shadow-sm' : 'text-ink-muted hover:text-cerulean-dark hover:bg-white/80'
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] leading-none',
                  active ? 'bg-white/25 text-white' : 'bg-white text-ink-muted border border-line'
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Placeholder pemuatan seragam untuk rute dashboard (list tabel atau grid kartu). */
export function DashboardLoadingSkeleton({
  label,
  variant = 'list',
}: {
  label: string;
  variant?: 'list' | 'grid';
}) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label={label}>
      <div className="space-y-3 pb-6 border-b border-line">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-9 w-80 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className={variant === 'list' ? 'h-11 w-96 max-w-full rounded-2xl' : 'h-11 w-72 max-w-full rounded-2xl'} />
      {variant === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-line bg-white overflow-hidden space-y-3 p-4">
              <Skeleton className="h-44 w-full rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-white p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-72 max-w-full" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

