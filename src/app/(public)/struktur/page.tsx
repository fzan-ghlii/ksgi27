import { getPublicBoardMembers, getPublicPeriods } from '@/lib/data/public';
import { PublicPageHeader } from '@/components/public/page-header';
import { StructureClient } from './structure-client';

export default async function StrukturPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const { periode } = await searchParams;
  const periods = await getPublicPeriods();
  const currentPeriod = periods.find((p) => p.is_current);

  const selectedPeriod =
    periods.find((p) => p.id === periode) ?? currentPeriod ?? periods[0];

  const members = await getPublicBoardMembers(selectedPeriod?.id);

  return (
    <div className="py-12 sm:py-16 bg-background min-h-[70vh]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl space-y-10">
        <PublicPageHeader
          badge="Struktur Organisasi"
          title="Susunan Pengurus GIBEI UNIMED"
          description={
            <>
              Periode Kepengurusan {selectedPeriod?.year_range || '2026/2027'}
              {selectedPeriod?.cabinet_name ? ` (${selectedPeriod.cabinet_name})` : ''} • Presidium Inti & 6 Divisi Resmi.
            </>
          }
        />

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
