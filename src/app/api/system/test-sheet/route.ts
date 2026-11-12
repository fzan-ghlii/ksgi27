import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson } from '@/lib/api/route';
import { testGoogleSheetsConnection } from '@/lib/google/sheets';
import { z } from 'zod';

const TestSheetSchema = z.object({
  spreadsheet_id: z.string().trim().optional(),
});

export async function POST(req: Request) {
  try {
    await requireUser('creator');
    const input = await readJson(req, TestSheetSchema);
    const result = await testGoogleSheetsConnection(input.spreadsheet_id || undefined);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}

