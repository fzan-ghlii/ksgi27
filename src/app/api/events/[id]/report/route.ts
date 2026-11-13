import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson, type RouteCtx } from '@/lib/api/route';
import { EventReportReviewSchema, EventReportSchema } from '@/lib/schemas/event-report';
import {
  getEventReportByEventId,
  reviewEventReport,
  upsertEventReport,
} from '@/lib/data/event-reports';

type Ctx = RouteCtx<{ id: string }>;

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser('member');
    const { id } = await params;
    const report = await getEventReportByEventId(id, user);
    return NextResponse.json({ report });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser('member');
    const { id } = await params;
    const input = await readJson(req, EventReportSchema);
    const report = await upsertEventReport(id, input, user);
    return NextResponse.json({ success: true, report });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser('master_presidium');
    const { id } = await params;
    const input = await readJson(req, EventReportReviewSchema);
    const report = await reviewEventReport(id, input, user);
    return NextResponse.json({ success: true, report });
  } catch (err) {
    return errorResponse(err);
  }
}

