import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getInviteByToken } from '@/lib/data/invites';
import { errorResponse } from '@/lib/api/route';
import { adminDb } from '@/lib/firebase/admin';
import { badRequest } from '@/lib/errors';
import { isValidWebpBuffer } from '@/lib/security/guards';
import { authorizeImageUpload } from '@/lib/security/image-upload-auth';
import {
  enforceRateLimit,
  getClientIp,
  RATE_LIMIT_POLICIES,
  rateLimitErrorResponse,
} from '@/lib/security/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeImageUpload(
      {
        activationToken: req.headers.get('x-activation-token'),
        clientIp: getClientIp(req),
      },
      {
        getSessionUser: getCurrentUser,
        getInvite: getInviteByToken,
      }
    );
    if (!auth.allowed) {
      return auth.response;
    }

    const rl = await enforceRateLimit(RATE_LIMIT_POLICIES.imageUpload, auth.actor.rateLimitKey);
    if (!rl.allowed) {
      return rateLimitErrorResponse(
        rl,
        'Batas unggah gambar sementara tercapai. Silakan tunggu beberapa menit.'
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.base64 !== 'string' || !body.base64.trim()) {
      throw badRequest('Data gambar tidak valid atau kosong.');
    }

    const { name, base64, size, original_size } = body;

    // Pastikan ukuran string base64 tidak melebihi batas simpan Firestore (maks ~900 KB payload)
    const approximateBytes = Math.ceil((base64.length * 3) / 4);
    if (approximateBytes > 950 * 1024) {
      throw badRequest('Ukuran gambar hasil kompresi masih melebihi batas penyimpanan database (950 KB).');
    }

    const buffer = Buffer.from(base64, 'base64');
    if (!isValidWebpBuffer(buffer) || buffer.length > 950 * 1024) {
      throw badRequest('Format gambar harus file WebP yang valid.');
    }

    const cleanBase64 = buffer.toString('base64');
    const id = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const cleanName = (typeof name === 'string' && name ? name : 'image.webp').replace(/[^a-zA-Z0-9_.-]/g, '-');

    const imageData = {
      id,
      name: cleanName,
      mime_type: 'image/webp',
      base64: cleanBase64,
      size: typeof size === 'number' && size > 0 ? size : buffer.length,
      original_size: typeof original_size === 'number' && original_size > 0 ? original_size : buffer.length,
      uploaded_by: auth.actor.uploadedBy,
      uploaded_by_name: auth.actor.uploadedByName,
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

