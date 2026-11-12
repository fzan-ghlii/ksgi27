import { NextRequest, NextResponse } from 'next/server';
import { CompleteActivationSchema } from '@/lib/schemas/activation';
import { completeActivation } from '@/lib/data/invites';
import { createSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parsed = CompleteActivationSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({
        error: parsed.error.issues[0]?.message || 'Data pendaftaran tidak valid',
      }, { status: 400 });
    }

    // Execute atomic activation
    const profile = await completeActivation(parsed.data);

    // Issue session cookie immediately
    await createSession(parsed.data.id_token);

    return NextResponse.json({
      success: true,
      user: profile,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyelesaikan aktivasi akun.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
