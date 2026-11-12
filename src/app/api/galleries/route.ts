import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson } from '@/lib/api/route';
import { GalleryInputSchema } from '@/lib/schemas/content';
import { createGallery, listGalleriesForActor } from '@/lib/data/galleries';

export async function GET() {
  try {
    const user = await requireUser('member');
    return NextResponse.json({ galleries: await listGalleriesForActor(user) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser('member');
    const input = await readJson(req, GalleryInputSchema);
    const gallery = await createGallery(user, input);
    return NextResponse.json({ success: true, gallery });
  } catch (err) {
    return errorResponse(err);
  }
}

