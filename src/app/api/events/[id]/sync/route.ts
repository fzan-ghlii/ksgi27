import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, RouteCtx } from '@/lib/api/route';
import { syncEventToGoogleSheet } from '@/lib/data/events';

export async function POST(_req: Request, ctx: RouteCtx<{ id: string }>) {
  try {
    const user = await requireUser('admin_kadiv');
    const { id } = await ctx.params;
    const result = await syncEventToGoogleSheet(id, user);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}

