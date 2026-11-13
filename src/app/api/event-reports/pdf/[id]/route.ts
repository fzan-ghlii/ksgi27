import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, type RouteCtx } from '@/lib/api/route';
import { getEventReportPdf } from '@/lib/data/event-reports';

export async function GET(_req: NextRequest, { params }: RouteCtx<{ id: string }>) {
  try {
    const user = await requireUser('member');
    const { id } = await params;
    const { buffer, name } = await getEventReportPdf(id, user);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': buffer.length.toString(),
        'Content-Disposition': `inline; filename="${name}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

