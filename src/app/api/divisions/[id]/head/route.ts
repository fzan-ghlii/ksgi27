import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson, type RouteCtx } from '@/lib/api/route';
import { DivisionHeadSchema } from '@/lib/schemas/content';
import { setDivisionHead } from '@/lib/data/board';

export async function PUT(req: NextRequest, { params }: RouteCtx<{ id: string }>) {
  try {
    const user = await requireUser('master_presidium');
    const { id } = await params;
    const { user_id } = await readJson(req, DivisionHeadSchema);
    await setDivisionHead(user, id, user_id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

