import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson, RouteCtx } from '@/lib/api/route';
import { AttendanceUpdateSchema } from '@/lib/schemas/event';
import { updateAttendance } from '@/lib/data/events';

export async function PATCH(req: Request, ctx: RouteCtx<{ id: string }>) {
  try {
    const user = await requireUser('member');
    const { id } = await ctx.params;
    const input = await readJson(req, AttendanceUpdateSchema);
    const updated = await updateAttendance(id, input.registration_id, input.attendance_status, user);
    return NextResponse.json({ success: true, registration: updated });
  } catch (err) {
    return errorResponse(err);
  }
}

