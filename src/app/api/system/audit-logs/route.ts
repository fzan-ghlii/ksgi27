import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse } from '@/lib/api/route';
import { queryAuditLogs } from '@/lib/data/system';
import type { AuditAction, Role } from '@/types';

export async function GET(req: Request) {
  try {
    await requireUser('creator');
    const { searchParams } = new URL(req.url);
    const actorRole = searchParams.get('actor_role') as Role | null;
    const action = searchParams.get('action') as AuditAction | null;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const logs = await queryAuditLogs({
      actorRole: actorRole || undefined,
      action: action || undefined,
      limit,
    });

    return NextResponse.json({ logs });
  } catch (err) {
    return errorResponse(err);
  }
}

