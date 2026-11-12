import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson, type RouteCtx } from '@/lib/api/route';
import { ArticleInputSchema } from '@/lib/schemas/content';
import { deleteArticle, getArticleForEdit, updateArticle } from '@/lib/data/articles';
import { notFound } from '@/lib/errors';

type Ctx = RouteCtx<{ id: string }>;

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser('member');
    const { id } = await params;
    const article = await getArticleForEdit(user, id);
    if (!article) throw notFound('Artikel tidak ditemukan atau Anda tidak berhak mengeditnya.');
    return NextResponse.json({ article });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser('member');
    const { id } = await params;
    const input = await readJson(req, ArticleInputSchema);
    const article = await updateArticle(user, id, input);
    return NextResponse.json({ success: true, article });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser('member');
    const { id } = await params;
    await deleteArticle(user, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

