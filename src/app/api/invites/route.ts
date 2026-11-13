import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson } from '@/lib/api/route';
import { listActivationInvites, createActivationInvite } from '@/lib/data/invites';
import { CreateInviteSchema } from '@/lib/schemas/activation';

export async function GET() {
  try {
    const user = await requireUser('admin_kadiv');
    const invites = await listActivationInvites(user);
    return NextResponse.json({ invites });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser('admin_kadiv');
    const body = await readJson(req, CreateInviteSchema);
    const invite = await createActivationInvite(user, body);
    return NextResponse.json({ success: true, invite });
  } catch (err) {
    return errorResponse(err);
  }
}
