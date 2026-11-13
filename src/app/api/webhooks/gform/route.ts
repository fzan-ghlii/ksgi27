import { NextResponse } from 'next/server';
import { errorResponse, readJson } from '@/lib/api/route';
import { GFormWebhookSchema } from '@/lib/schemas/event';
import { getSystemConfig } from '@/lib/data/system';
import { badRequest, forbidden } from '@/lib/errors';
import { registerParticipant } from '@/lib/data/events';
import { timingSafeSecretEqual } from '@/lib/security/guards';
import {
  enforceRateLimit,
  getClientIp,
  RATE_LIMIT_POLICIES,
  rateLimitErrorResponse,
} from '@/lib/security/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = await enforceRateLimit(RATE_LIMIT_POLICIES.webhookGform, ip);
    if (!rl.allowed) {
      return rateLimitErrorResponse(rl, 'Rate limit webhook tercapai.');
    }

    const input = await readJson(req, GFormWebhookSchema);
    const config = await getSystemConfig();

    const providedSecret = req.headers.get('x-webhook-secret') || input.secret_token;
    const expectedSecret = process.env.GFORM_WEBHOOK_SECRET || config.gform_webhook_secret;

    // Verifikasi secret token webhook secara constant-time (mendukung header x-webhook-secret maupun payload)
    if (!timingSafeSecretEqual(providedSecret, expectedSecret)) {
      throw forbidden('Secret token webhook tidak valid.');
    }

    const eventKey = input.event_id || input.event_slug;
    if (!eventKey) {
      throw badRequest('Parameter event_id atau event_slug wajib disertakan dalam payload webhook.');
    }

    const result = await registerParticipant(eventKey, {
      full_name: input.full_name,
      email: input.email,
      nim: input.nim,
      whatsapp: input.whatsapp,
      institution: input.institution,
      has_rdn: input.has_rdn,
      notes: input.notes || 'Pendaftaran via Google Form Webhook',
    });

    return NextResponse.json({
      success: true,
      message: 'Respon Google Form berhasil disinkronkan ke database GIBEI.',
      registration_id: result.registration.id,
      registered_count: result.event.registered_count,
      quota: result.event.quota,
    }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

