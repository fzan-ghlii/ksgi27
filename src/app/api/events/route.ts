import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson } from '@/lib/api/route';
import { EventInputSchema } from '@/lib/schemas/event';
import { createEvent, listEvents } from '@/lib/data/events';
import type { DivisionCode } from '@/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') as 'SPM' | 'EVENT' | null;
    const division_code = searchParams.get('division_code') as DivisionCode | null;
    const status = searchParams.get('status') || undefined;
    const published_only = searchParams.get('published_only') === 'true';
    const period_id = searchParams.get('period_id') || undefined;

    const events = await listEvents({
      category: category || undefined,
      division_code: division_code || undefined,
      status,
      published_only,
      period_id,
    });

    return NextResponse.json({ events });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser('admin_kadiv');
    const input = await readJson(req, EventInputSchema);
    const created = await createEvent(input, user);
    return NextResponse.json({ event: created }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

