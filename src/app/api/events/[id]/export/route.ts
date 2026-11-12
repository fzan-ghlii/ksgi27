import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, RouteCtx } from '@/lib/api/route';
import { exportRegistrationsCsv, getEventById } from '@/lib/data/events';

export async function GET(_req: Request, ctx: RouteCtx<{ id: string }>) {
  try {
    const user = await requireUser('member');
    const { id } = await ctx.params;
    const event = await getEventById(id);
    const csvData = await exportRegistrationsCsv(id, user);

    const safeSlug = (event?.slug || id).replace(/[^a-z0-9_-]/gi, '_');
    const filename = `peserta-${safeSlug}-${new Date().toISOString().slice(0, 10)}.csv`;

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

