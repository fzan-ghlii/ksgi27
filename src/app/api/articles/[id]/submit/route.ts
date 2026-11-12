import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, type RouteCtx } from '@/lib/api/route';
import { submitArticle } from '@/lib/data/articles';

export async function POST(_req: NextRequest, { params }: RouteCtx<{ id: string }>) {
  try {
    const user = await requireUser('member');
    const { id } = await params;
    await submitArticle(user, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

