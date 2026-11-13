import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, type RouteCtx } from '@/lib/api/route';
import { incrementArticleView } from '@/lib/data/public';
import {
  buildRateLimitHeaders,
  enforceRateLimit,
  getClientIp,
  RATE_LIMIT_POLICIES,
} from '@/lib/security/rate-limit';

/**
 * Menambah jumlah pembaca. Publik (tanpa login). Pembatasan dilakukan di client
 * (sessionStorage) serta rate limiter server per slug+IP agar counter tidak diinflasi.
 */
export async function POST(req: NextRequest, { params }: RouteCtx<{ slug: string }>) {
  try {
    const { slug } = await params;
    const ip = getClientIp(req);
    const rl = await enforceRateLimit(RATE_LIMIT_POLICIES.articleView, `${slug}:${ip}`);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: true, throttled: true },
        { status: 200, headers: buildRateLimitHeaders(rl) }
      );
    }

    const ok = await incrementArticleView(slug);
    return NextResponse.json({ success: ok }, { headers: buildRateLimitHeaders(rl) });
  } catch (err) {
    return errorResponse(err);
  }
}

