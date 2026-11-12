import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID gambar tidak valid.' }, { status: 400 });
    }

    const doc = await adminDb.collection('images').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Gambar tidak ditemukan.' }, { status: 404 });
    }

    const data = doc.data();
    if (!data || !data.base64) {
      return NextResponse.json({ error: 'Konten gambar tidak valid.' }, { status: 500 });
    }

    const buffer = Buffer.from(data.base64, 'base64');

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': data.mime_type || 'image/webp',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('[API Images GET] Error:', err);
    return NextResponse.json({ error: 'Gagal memuat gambar.' }, { status: 500 });
  }
}

