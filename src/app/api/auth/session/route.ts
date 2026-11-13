import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { errorResponse, readJson } from '@/lib/api/route';
import { AppError } from '@/lib/errors';
import { createSession, clearSession } from '@/lib/auth/session';
import {
  buildRateLimitHeaders,
  enforceRateLimit,
  getClientIp,
  RATE_LIMIT_POLICIES,
  rateLimitErrorResponse,
} from '@/lib/security/rate-limit';

const SessionLoginSchema = z.object({
  id_token: z.string().trim().min(1, 'Token autentikasi tidak valid.'),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await enforceRateLimit(RATE_LIMIT_POLICIES.authSession, ip);
    if (!rl.allowed) {
      return rateLimitErrorResponse(
        rl,
        'Terlalu banyak percobaan masuk. Silakan tunggu beberapa menit sebelum mencoba lagi.'
      );
    }

    const { id_token } = await readJson(req, SessionLoginSchema);

    let profile;
    try {
      ({ profile } = await createSession(id_token));
    } catch (authErr) {
      if (authErr instanceof AppError) throw authErr;
      const msg = authErr instanceof Error ? authErr.message : 'Gagal memproses sesi.';
      throw new AppError(msg, 401);
    }

    return NextResponse.json(
      { success: true, user: profile },
      { headers: buildRateLimitHeaders(rl) }
    );
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE() {
  try {
    await clearSession();
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

