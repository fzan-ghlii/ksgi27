import { getPublicBoardMembers, getPublicPeriods, getCurrentPeriod } from '@/lib/data/public';
import { StructureClient } from './structure-client';

export default async function StrukturPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const { periode } = await searchParams;
  const periods = await getPublicPeriods();
  const currentPeriod = await getCurrentPeriod();

  const selectedPeriod =
    periods.find((p) => p.id === periode) ?? currentPeriod ?? periods[0];

  const members = await getPublicBoardMembers(selectedPeriod?.id);

  return (
    <div className="py-12 sm:py-16 bg-background min-h-[70vh]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl space-y-10">
        {/* Header Title */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cerulean-light text-cerulean-dark text-xs font-bold uppercase tracking-wider mb-3 border border-cerulean/20">
            Struktur Organisasi
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-ink tracking-tight">
            Susunan Pengurus GIBEI UNIMED
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-muted">
            Periode Kepengurusan {selectedPeriod?.year_range || '2026/2027'}{selectedPeriod?.cabinet_name ? ` (${selectedPeriod.cabinet_name})` : ''} • Presidium Inti & 6 Divisi Resmi.
          </p>
        </div>

        {/* Interactive Filterable Structure */}
        <StructureClient
          periods={periods}
          currentPeriodId={selectedPeriod?.id || '2026-2027'}
          initialMembers={members}
          periodYear={selectedPeriod?.year_range || '2026/2027'}
          cabinetName={selectedPeriod?.cabinet_name || ''}
        />
      </div>
    </div>
  );
}
