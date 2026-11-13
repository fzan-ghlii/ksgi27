import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson } from '@/lib/api/route';
import { PiketSettingsInputSchema } from '@/lib/schemas/piket';
import { updatePiketSettings } from '@/lib/data/piket';

export async function PATCH(req: Request) {
  try {
    const actor = await requireUser('member');
    const body = await readJson(req, PiketSettingsInputSchema);
    const settings = await updatePiketSettings(actor, body);
    return NextResponse.json({ success: true, settings });
  } catch (err) {
    return errorResponse(err);
  }
}

