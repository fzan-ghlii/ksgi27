import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { revokeInvite } from '@/lib/data/invites';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const user = await requireUser('admin_kadiv');
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json({ error: 'Token diperlukan' }, { status: 400 });
    }

    await revokeInvite(token, user);
    return NextResponse.json({ success: true, message: 'Tautan berhasil dicabut.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mencabut tautan';
    const status = msg === 'UNAUTHORIZED' ? 401 : msg === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

