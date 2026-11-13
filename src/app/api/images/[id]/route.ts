import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { errorResponse, RouteCtx } from '@/lib/api/route';
import { badRequest, notFound } from '@/lib/errors';
import { isSafeDocId } from '@/lib/security/guards';

const SAFE_IMAGE_MIMES = new Set(['image/webp', 'image/png', 'image/jpeg', 'image/avif']);

export async function GET(
  _req: NextRequest,
  { params }: RouteCtx<{ id: string }>
) {
  try {
    const { id } = await params;
    if (!isSafeDocId(id)) {
      throw badRequest('ID gambar tidak valid.');
    }

    const doc = await adminDb.collection('images').doc(id).get();
    if (!doc.exists) {
      throw notFound('Gambar tidak ditemukan.');
    }

    const data = doc.data();
    if (!data || typeof data.base64 !== 'string' || !data.base64) {
      throw new Error('Konten gambar tidak valid.');
    }

    const buffer = Buffer.from(data.base64, 'base64');
    const contentType =
      typeof data.mime_type === 'string' && SAFE_IMAGE_MIMES.has(data.mime_type)
        ? data.mime_type
        : 'image/webp';

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

