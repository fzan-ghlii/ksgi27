import { NextResponse } from 'next/server';
import { errorResponse, readJson, RouteCtx } from '@/lib/api/route';
import { EventRegisterSchema } from '@/lib/schemas/event';
import { registerParticipant } from '@/lib/data/events';
import { badRequest, forbidden } from '@/lib/errors';
import {
  buildRateLimitHeaders,
  enforceRateLimit,
  getClientIp,
  RATE_LIMIT_POLICIES,
  rateLimitErrorResponse,
} from '@/lib/security/rate-limit';
import { verifyTurnstileToken } from '@/lib/security/turnstile';

export async function POST(req: Request, ctx: RouteCtx<{ id: string }>) {
  try {
    const ip = getClientIp(req);
    const rl = await enforceRateLimit(RATE_LIMIT_POLICIES.eventRegister, ip);
    if (!rl.allowed) {
      return rateLimitErrorResponse(
        rl,
        'Terlalu banyak percobaan pendaftaran dari jaringan Anda. Silakan tunggu beberapa menit.'
      );
    }

    const { id } = await ctx.params;
    const input = await readJson(req, EventRegisterSchema);

    // Perangkap honeypot untuk bot pengisi form otomatis
    if (input.company_website && input.company_website.trim() !== '') {
      throw badRequest('Permintaan pendaftaran tidak valid.');
    }

    // Verifikasi Cloudflare Turnstile bila secret aktif
    const turnstile = await verifyTurnstileToken({
      token: input.turnstile_token,
      remoteIp: ip,
      expectedAction: 'event_register',
    });
    if (!turnstile.ok) {
      throw forbidden('Verifikasi keamanan anti-bot gagal. Silakan muat ulang captcha dan coba lagi.');
    }

    const { turnstile_token: _tt, company_website: _hp, ...participantData } = input;
    const result = await registerParticipant(id, participantData);
    return NextResponse.json(
      {
        success: true,
        message: 'Pendaftaran Anda berhasil tercatat!',
        registration: result.registration,
        sheet_status: result.sheetResult,
      },
      {
        status: 201,
        headers: buildRateLimitHeaders(rl),
      }
    );
  } catch (err) {
    return errorResponse(err);
  }
}

