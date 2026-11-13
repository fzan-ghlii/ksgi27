import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, RouteCtx } from '@/lib/api/route';
import { removePiketSchedule } from '@/lib/data/piket';

export async function DELETE(_req: Request, ctx: RouteCtx<{ id: string }>) {
  try {
    const actor = await requireUser('member');
    const { id } = await ctx.params;
    await removePiketSchedule(actor, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

