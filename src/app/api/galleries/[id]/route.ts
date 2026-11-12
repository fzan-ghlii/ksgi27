import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson, type RouteCtx } from '@/lib/api/route';
import { GalleryInputSchema } from '@/lib/schemas/content';
import { deleteGallery, updateGallery } from '@/lib/data/galleries';

type Ctx = RouteCtx<{ id: string }>;

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser('member');
    const { id } = await params;
    const input = await readJson(req, GalleryInputSchema);
    await updateGallery(user, id, input);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser('member');
    const { id } = await params;
    await deleteGallery(user, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

