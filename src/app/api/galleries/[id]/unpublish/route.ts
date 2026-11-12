import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, type RouteCtx } from '@/lib/api/route';
import { unpublishGallery } from '@/lib/data/galleries';

export async function POST(_req: NextRequest, { params }: RouteCtx<{ id: string }>) {
  try {
    const user = await requireUser('admin_kadiv');
    const { id } = await params;
    await unpublishGallery(user, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

