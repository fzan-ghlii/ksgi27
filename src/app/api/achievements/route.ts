import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson } from '@/lib/api/route';
import { AchievementInputSchema } from '@/lib/schemas/achievement';
import { createAchievement, listAchievements } from '@/lib/data/achievements';

export async function GET() {
  try {
    await requireUser('master_presidium');
    return NextResponse.json({ achievements: await listAchievements() });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser('master_presidium');
    const input = await readJson(req, AchievementInputSchema);
    const achievement = await createAchievement(user, input);
    return NextResponse.json({ success: true, achievement }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

