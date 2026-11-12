import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, type RouteCtx } from '@/lib/api/route';
import { unpublishArticle } from '@/lib/data/articles';

export async function POST(_req: NextRequest, { params }: RouteCtx<{ id: string }>) {
  try {
    const user = await requireUser('master_presidium');
    const { id } = await params;
    await unpublishArticle(user, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

