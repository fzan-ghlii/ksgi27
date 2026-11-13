import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson, RouteCtx } from '@/lib/api/route';
import { updateUserRoleAndDivision } from '@/lib/data/system';
import { z } from 'zod';
import { DIVISION_CODES } from '@/lib/constants/divisions';
import type { Role } from '@/types';

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
    const normalizedRole = input.role
      ? ((input.role.toUpperCase() === 'MEMBER' ? 'USER' : input.role.toUpperCase()) as Role)
      : undefined;

    const updated = await updateUserRoleAndDivision(
      uid,
      {
        role: normalizedRole,
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

