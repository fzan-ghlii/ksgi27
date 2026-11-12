import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson, type RouteCtx } from '@/lib/api/route';
import { ArticleReviewSchema } from '@/lib/schemas/content';
import { reviewArticle } from '@/lib/data/articles';

export async function POST(req: NextRequest, { params }: RouteCtx<{ id: string }>) {
  try {
    const user = await requireUser('admin_kadiv');
    const { id } = await params;
    const input = await readJson(req, ArticleReviewSchema);
    await reviewArticle(user, id, input);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

