import { NextRequest, NextResponse } from 'next/server';
import { createSession, clearSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id_token } = body;

    if (!id_token || typeof id_token !== 'string') {
      return NextResponse.json({ error: 'Token autentikasi tidak valid.' }, { status: 400 });
    }

    const { profile } = await createSession(id_token);

    return NextResponse.json({
      success: true,
      user: profile,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memproses sesi.';
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function DELETE() {
  try {
    await clearSession();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal keluar.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

