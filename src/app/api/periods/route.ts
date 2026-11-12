import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson } from '@/lib/api/route';
import { PeriodSchema } from '@/lib/schemas/content';
import { createPeriod, listPeriods } from '@/lib/data/periods';

export async function GET() {
  try {
    await requireUser('admin_kadiv');
    return NextResponse.json({ periods: await listPeriods() });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser('master_presidium');
    const input = await readJson(req, PeriodSchema);
    const period = await createPeriod(user, input);
    return NextResponse.json({ success: true, period });
  } catch (err) {
    return errorResponse(err);
  }
}

