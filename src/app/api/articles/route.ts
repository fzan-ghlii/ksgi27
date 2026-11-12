import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson } from '@/lib/api/route';
import { ArticleInputSchema } from '@/lib/schemas/content';
import { createArticle, listArticlesForActor } from '@/lib/data/articles';

export async function GET() {
  try {
    const user = await requireUser('member');
    return NextResponse.json({ articles: await listArticlesForActor(user) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser('member');
    const input = await readJson(req, ArticleInputSchema);
    const article = await createArticle(user, input);
    return NextResponse.json({ success: true, article });
  } catch (err) {
    return errorResponse(err);
  }
}

