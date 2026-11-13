import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse } from '@/lib/api/route';
import { seedInitialPeriodAndDivisions } from '@/lib/auth/bootstrap';
import { exportPiketAttendancesCsv } from '@/lib/data/piket';

export async function GET() {
  try {
    const actor = await requireUser('member');
    const periodId = await seedInitialPeriodAndDivisions();
    const csvData = await exportPiketAttendancesCsv(actor, periodId);

    const filename = `laporan-piket-gibei-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

