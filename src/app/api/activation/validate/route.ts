import { NextRequest, NextResponse } from 'next/server';
import { getInviteByToken } from '@/lib/data/invites';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token aktivasi wajib disertakan' }, { status: 400 });
    }

    const result = await getInviteByToken(token);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memverifikasi token';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

