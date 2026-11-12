import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson, RouteCtx } from '@/lib/api/route';
import { updateUserRoleAndDivision } from '@/lib/data/system';
import { z } from 'zod';
import { DIVISION_CODES } from '@/lib/constants/divisions';

const UserOverrideSchema = z.object({
  role: z.enum(['CREATOR', 'PRESIDIUM', 'KADIV', 'USER', 'creator', 'presidium', 'kadiv', 'member', 'public']).optional(),
  division_code: z.enum(DIVISION_CODES).nullable().optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: RouteCtx<{ uid: string }>) {
  try {
    const user = await requireUser('creator');
    const { uid } = await ctx.params;
    const input = await readJson(req, UserOverrideSchema);

    // Normalisasi role ke format sistem jika perlu
    let targetRole = input.role;
    if (targetRole) {
      const upper = targetRole.toUpperCase();
      if (upper === 'MEMBER') targetRole = 'USER';
      else targetRole = upper as any;
    }

    const updated = await updateUserRoleAndDivision(
      uid,
      {
        role: targetRole as any,
        division_code: input.division_code,
        is_active: input.is_active,
      },
      user
    );

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    return errorResponse(err);
  }
}

