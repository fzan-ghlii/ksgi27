import { NextResponse } from 'next/server';
import { errorResponse, readJson, RouteCtx } from '@/lib/api/route';
import { EventRegisterSchema } from '@/lib/schemas/event';
import { registerParticipant } from '@/lib/data/events';

export async function POST(req: Request, ctx: RouteCtx<{ id: string }>) {
  try {
    const { id } = await ctx.params;
    const input = await readJson(req, EventRegisterSchema);
    const result = await registerParticipant(id, input);
    return NextResponse.json({
      success: true,
      message: 'Pendaftaran Anda berhasil tercatat!',
      registration: result.registration,
      sheet_status: result.sheetResult,
    }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

