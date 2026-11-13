import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, readJson } from '@/lib/api/route';
import { CompleteActivationSchema } from '@/lib/schemas/activation';
import { completeActivation } from '@/lib/data/invites';
import { createSession } from '@/lib/auth/session';
import {
  buildRateLimitHeaders,
  enforceRateLimit,
  getClientIp,
  RATE_LIMIT_POLICIES,
  rateLimitErrorResponse,
} from '@/lib/security/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await enforceRateLimit(RATE_LIMIT_POLICIES.activationComplete, ip);
    if (!rl.allowed) {
      return rateLimitErrorResponse(
        rl,
        'Terlalu banyak percobaan aktivasi akun. Silakan coba lagi nanti.'
      );
    }

    const body = await readJson(req, CompleteActivationSchema);
    const profile = await completeActivation(body);
    await createSession(body.id_token);

    return NextResponse.json(
      { success: true, user: profile },
      { headers: buildRateLimitHeaders(rl) }
    );
  } catch (err) {
    return errorResponse(err);
  }
}
