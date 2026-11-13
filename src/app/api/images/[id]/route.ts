import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { isSafeDocId } from '@/lib/security/guards';

const SAFE_IMAGE_MIMES = new Set(['image/webp', 'image/png', 'image/jpeg', 'image/avif']);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isSafeDocId(id)) {
      return NextResponse.json({ error: 'ID gambar tidak valid.' }, { status: 400 });
    }

    const doc = await adminDb.collection('images').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Gambar tidak ditemukan.' }, { status: 404 });
    }

    const data = doc.data();
    if (!data || typeof data.base64 !== 'string' || !data.base64) {
      return NextResponse.json({ error: 'Konten gambar tidak valid.' }, { status: 500 });
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
    console.error('[API Images GET] Error:', err);
    return NextResponse.json({ error: 'Gagal memuat gambar.' }, { status: 500 });
  }
}

