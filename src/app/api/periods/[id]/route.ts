import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson, type RouteCtx } from '@/lib/api/route';
import { PeriodUpdateSchema } from '@/lib/schemas/content';
import { deletePeriod, updatePeriod } from '@/lib/data/periods';

type Ctx = RouteCtx<{ id: string }>;

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser('master_presidium');
    const { id } = await params;
    const input = await readJson(req, PeriodUpdateSchema);
    await updatePeriod(user, id, input);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser('master_presidium');
    const { id } = await params;
    await deletePeriod(user, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

