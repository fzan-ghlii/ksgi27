import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, RouteCtx } from '@/lib/api/route';
import { listRegistrations } from '@/lib/data/events';

export async function GET(_req: Request, ctx: RouteCtx<{ id: string }>) {
  try {
    const user = await requireUser('member');
    const { id } = await ctx.params;
    const participants = await listRegistrations(id, user);
    return NextResponse.json({ participants });
  } catch (err) {
    return errorResponse(err);
  }
}

