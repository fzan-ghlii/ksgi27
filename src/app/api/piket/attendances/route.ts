import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson } from '@/lib/api/route';
import { PiketAttendanceInputSchema } from '@/lib/schemas/piket';
import { submitPiketAttendance } from '@/lib/data/piket';

export async function POST(req: Request) {
  try {
    const actor = await requireUser('member');
    const body = await readJson(req, PiketAttendanceInputSchema);
    const attendance = await submitPiketAttendance(actor, body);
    return NextResponse.json({ success: true, attendance }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

