import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, RouteCtx } from '@/lib/api/route';
import { badRequest } from '@/lib/errors';
import { revokeInvite } from '@/lib/data/invites';

export async function POST(
  _req: NextRequest,
  { params }: RouteCtx<{ token: string }>
) {
  try {
    const user = await requireUser('admin_kadiv');
    const { token } = await params;

    if (!token) {
      throw badRequest('Token diperlukan.');
    }

    await revokeInvite(token, user);
    return NextResponse.json({ success: true, message: 'Tautan berhasil dicabut.' });
  } catch (err) {
    return errorResponse(err);
  }
}

