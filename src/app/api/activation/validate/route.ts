import { NextRequest, NextResponse } from 'next/server';
import { getInviteByToken } from '@/lib/data/invites';
import {
  buildRateLimitHeaders,
  enforceRateLimit,
  getClientIp,
  RATE_LIMIT_POLICIES,
  rateLimitErrorResponse,
} from '@/lib/security/rate-limit';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await enforceRateLimit(RATE_LIMIT_POLICIES.activationValidate, ip);
    if (!rl.allowed) {
      return rateLimitErrorResponse(
        rl,
        'Terlalu banyak percobaan verifikasi undangan. Silakan coba lagi nanti.'
      );
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token aktivasi wajib disertakan' }, { status: 400 });
    }

    const result = await getInviteByToken(token);
    return NextResponse.json(result, { headers: buildRateLimitHeaders(rl) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memverifikasi token';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

