import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse } from '@/lib/api/route';
import { getSystemMetrics } from '@/lib/data/system';

export async function GET() {
  try {
    const user = await requireUser('creator');
    const metrics = await getSystemMetrics(user);
    return NextResponse.json(metrics);
  } catch (err) {
    return errorResponse(err);
  }
}

