import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson } from '@/lib/api/route';
import { PiketScheduleAssignSchema } from '@/lib/schemas/piket';
import { assignPiketSchedule } from '@/lib/data/piket';

export async function POST(req: Request) {
  try {
    const actor = await requireUser('member');
    const body = await readJson(req, PiketScheduleAssignSchema);
    const schedule = await assignPiketSchedule(actor, body);
    return NextResponse.json({ success: true, schedule }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

