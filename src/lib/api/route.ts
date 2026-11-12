import 'server-only';
import { NextResponse } from 'next/server';
import type { z } from 'zod';
import { AppError, badRequest } from '@/lib/errors';

/** Ubah error apa pun menjadi respons JSON dengan status yang tepat. */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof Error) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Sesi berakhir. Silakan login kembali.' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Anda tidak memiliki wewenang untuk aksi ini.' }, { status: 403 });
    }
  }
  console.error('[API] Unhandled error:', err);
  return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
}

/** Baca body JSON dan validasi dengan Zod. Melempar AppError 400 jika tidak valid. */
export async function readJson<S extends z.ZodTypeAny>(req: Request, schema: S): Promise<z.output<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw badRequest('Isi permintaan bukan JSON yang valid.');
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? 'Input tidak valid.');
  }
  return parsed.data;
}

export type RouteCtx<P extends Record<string, string>> = { params: Promise<P> };

