import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse } from '@/lib/api/route';
import { adminDb } from '@/lib/firebase/admin';
import { badRequest } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser('member');

    const body = await req.json().catch(() => null);
    if (!body || !body.base64) {
      throw badRequest('Data gambar tidak valid atau kosong.');
    }

    const { name, base64, size, original_size } = body;

    // Pastikan ukuran string base64 tidak melebihi batas simpan Firestore (maks ~900 KB payload)
    const approximateBytes = Math.ceil((base64.length * 3) / 4);
    if (approximateBytes > 950 * 1024) {
      throw badRequest('Ukuran gambar hasil kompresi masih melebihi batas penyimpanan database (950 KB).');
    }

    const id = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const cleanName = (name || 'image.webp').replace(/[^a-zA-Z0-9_.-]/g, '-');

    const imageData = {
      id,
      name: cleanName,
      mime_type: 'image/webp',
      base64,
      size: size || approximateBytes,
      original_size: original_size || size || approximateBytes,
      uploaded_by: user.uid,
      uploaded_by_name: user.full_name,
      created_at: new Date().toISOString(),
    };

    await adminDb.collection('images').doc(id).set(imageData);

    return NextResponse.json({
      success: true,
      id,
      url: `/api/images/${id}`,
      name: cleanName,
      size: imageData.size,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

