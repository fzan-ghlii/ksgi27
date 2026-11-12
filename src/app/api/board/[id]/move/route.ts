import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson, type RouteCtx } from '@/lib/api/route';
import { BoardMoveSchema } from '@/lib/schemas/content';
import { moveBoardMember } from '@/lib/data/board';

export async function POST(req: NextRequest, { params }: RouteCtx<{ id: string }>) {
  try {
    const user = await requireUser('admin_kadiv');
    const { id } = await params;
    const { direction } = await readJson(req, BoardMoveSchema);
    await moveBoardMember(user, id, direction);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

