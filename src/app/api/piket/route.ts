import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse } from '@/lib/api/route';
import { seedInitialPeriodAndDivisions } from '@/lib/auth/bootstrap';
import {
  getPiketSettings,
  listEligiblePiketMembers,
  listPiketAttendances,
  listPiketSchedules,
} from '@/lib/data/piket';

export async function GET() {
  try {
    const user = await requireUser('member');
    const periodId = await seedInitialPeriodAndDivisions();

    const [settings, schedules, attendances, eligibleMembers] = await Promise.all([
      getPiketSettings(),
      listPiketSchedules(periodId),
      listPiketAttendances(user, periodId),
      listEligiblePiketMembers(periodId),
    ]);

    return NextResponse.json({
      periodId,
      settings,
      schedules,
      attendances,
      eligibleMembers,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

