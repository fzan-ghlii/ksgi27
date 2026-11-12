import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, type RouteCtx } from '@/lib/api/route';
import { incrementArticleView } from '@/lib/data/public';

/**
 * Menambah jumlah pembaca. Publik (tanpa login). Pembatasan 1x per sesi browser
 * dilakukan di komponen client (ViewTracker) agar refresh tidak menggelembungkan angka.
 */
export async function POST(_req: NextRequest, { params }: RouteCtx<{ slug: string }>) {
  try {
    const { slug } = await params;
    const ok = await incrementArticleView(slug);
    return NextResponse.json({ success: ok });
  } catch (err) {
    return errorResponse(err);
  }
}

