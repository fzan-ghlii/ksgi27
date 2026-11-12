import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse } from '@/lib/api/route';
import { listAllUsers } from '@/lib/data/system';

export async function GET() {
  try {
    const user = await requireUser('creator');
    const users = await listAllUsers(user);
    return NextResponse.json({ users });
  } catch (err) {
    return errorResponse(err);
  }
}

