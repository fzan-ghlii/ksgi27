import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson } from '@/lib/api/route';
import { updateSystemConfig } from '@/lib/data/system';
import { z } from 'zod';

const MaintenanceToggleSchema = z.object({
  maintenance_mode: z.boolean(),
  maintenance_message: z.string().trim().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser('creator');
    const input = await readJson(req, MaintenanceToggleSchema);
    const updated = await updateSystemConfig(input, user);
    return NextResponse.json({
      success: true,
      maintenance_mode: updated.maintenance_mode,
      maintenance_message: updated.maintenance_message,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

