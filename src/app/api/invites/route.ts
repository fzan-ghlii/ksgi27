import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { listActivationInvites, createActivationInvite } from '@/lib/data/invites';
import { CreateInviteSchema } from '@/lib/schemas/activation';

export async function GET() {
  try {
    const user = await requireUser('admin_kadiv');
    const invites = await listActivationInvites(user);
    return NextResponse.json({ invites });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Akses ditolak';
    const status = msg === 'UNAUTHORIZED' ? 401 : msg === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser('admin_kadiv');
    const rawBody = await req.json();
    const parsed = CreateInviteSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ 
        error: parsed.error.issues[0]?.message || 'Input tidak valid' 
      }, { status: 400 });
    }

    const invite = await createActivationInvite(user, parsed.data);
    return NextResponse.json({ success: true, invite });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal membuat tautan';
    const status = msg === 'UNAUTHORIZED' ? 401 : msg === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
