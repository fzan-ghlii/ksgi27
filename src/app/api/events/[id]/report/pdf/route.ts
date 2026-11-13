import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, type RouteCtx } from '@/lib/api/route';
import { saveEventReportPdf } from '@/lib/data/event-reports';
import {
  enforceRateLimit,
  RATE_LIMIT_POLICIES,
  rateLimitErrorResponse,
} from '@/lib/security/rate-limit';
import { badRequest } from '@/lib/errors';

export async function POST(req: NextRequest, { params }: RouteCtx<{ id: string }>) {
  try {
    const user = await requireUser('member');
    const rl = await enforceRateLimit(RATE_LIMIT_POLICIES.imageUpload, `uid:${user.uid}`);
    if (!rl.allowed) {
      return rateLimitErrorResponse(
        rl,
        'Batas unggah berkas sementara tercapai. Silakan tunggu beberapa menit.'
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      throw badRequest('Body unggah PDF tidak valid.');
    }

    const { id } = await params;
    const saved = await saveEventReportPdf(
      id,
      body as { name?: unknown; base64?: unknown },
      user
    );

    return NextResponse.json({ success: true, ...saved });
  } catch (err) {
    return errorResponse(err);
  }
}

