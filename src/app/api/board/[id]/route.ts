import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson, type RouteCtx } from '@/lib/api/route';
import { BoardUpdateSchema } from '@/lib/schemas/content';
import { deleteBoardMember, updateBoardMember } from '@/lib/data/board';

type Ctx = RouteCtx<{ id: string }>;

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser('admin_kadiv');
    const { id } = await params;
    const input = await readJson(req, BoardUpdateSchema);
    await updateBoardMember(user, id, input);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser('master_presidium');
    const { id } = await params;
    await deleteBoardMember(user, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

