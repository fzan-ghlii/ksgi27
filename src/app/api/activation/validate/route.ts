import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/route';
import { badRequest } from '@/lib/errors';
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

    const token = new URL(req.url).searchParams.get('token');
    if (!token) {
      throw badRequest('Token aktivasi wajib disertakan');
    }

    const result = await getInviteByToken(token);
    return NextResponse.json(result, { headers: buildRateLimitHeaders(rl) });
  } catch (err) {
    return errorResponse(err);
  }
}

