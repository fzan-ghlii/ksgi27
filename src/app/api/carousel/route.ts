import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson } from '@/lib/api/route';
import { isPresidiumUp } from '@/lib/auth/permissions';
import { forbidden } from '@/lib/errors';
import { HeroCarouselUpdateSchema } from '@/lib/schemas/carousel';
import { getHeroCarouselConfig, updateHeroCarouselConfig } from '@/lib/data/carousel';

export async function GET() {
  try {
    const actor = await requireUser('member');
    if (!isPresidiumUp(actor)) {
      throw forbidden('Hanya Presidium yang dapat mengakses pengaturan carousel.');
    }
    const config = await getHeroCarouselConfig();
    return NextResponse.json({ config });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const actor = await requireUser('member');
    const body = await readJson(req, HeroCarouselUpdateSchema);
    const config = await updateHeroCarouselConfig(actor, body);
    return NextResponse.json({ success: true, config });
  } catch (err) {
    return errorResponse(err);
  }
}

