import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, RouteCtx } from '@/lib/api/route';
import { badRequest } from '@/lib/errors';
import { PiketSupervisorNoteSchema, PiketVerifyInputSchema } from '@/lib/schemas/piket';
import { addPiketSupervisorNote, verifyPiketAttendance } from '@/lib/data/piket';

export async function PATCH(req: Request, ctx: RouteCtx<{ id: string }>) {
  try {
    const actor = await requireUser('member');
    const { id } = await ctx.params;

    const raw = await req.json().catch(() => null);
    if (!raw || typeof raw !== 'object') {
      throw badRequest('Data permintaan tidak valid.');
    }

    if (raw.mode === 'supervisor' || ('supervisor_note' in raw && !('verification_status' in raw))) {
      const parsed = PiketSupervisorNoteSchema.safeParse(raw);
      if (!parsed.success) {
        throw badRequest(parsed.error.issues[0]?.message ?? 'Catatan pengawas tidak valid.');
      }
      const attendance = await addPiketSupervisorNote(actor, id, parsed.data);
      return NextResponse.json({ success: true, attendance });
    }

    const parsed = PiketVerifyInputSchema.safeParse(raw);
    if (!parsed.success) {
      throw badRequest(parsed.error.issues[0]?.message ?? 'Data verifikasi tidak valid.');
    }
    const attendance = await verifyPiketAttendance(actor, id, parsed.data);
    return NextResponse.json({ success: true, attendance });
  } catch (err) {
    return errorResponse(err);
  }
}

