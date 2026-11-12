import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson } from '@/lib/api/route';
import { BoardAddSchema } from '@/lib/schemas/content';
import { addBoardMember, listBoardMembers } from '@/lib/data/board';
import { badRequest } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    await requireUser('admin_kadiv');
    const periodId = req.nextUrl.searchParams.get('period_id');
    if (!periodId) throw badRequest('Parameter period_id wajib diisi.');
    return NextResponse.json({ members: await listBoardMembers(periodId) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser('master_presidium');
    const input = await readJson(req, BoardAddSchema);
    const member = await addBoardMember(user, input);
    return NextResponse.json({ success: true, member });
  } catch (err) {
    return errorResponse(err);
  }
}

