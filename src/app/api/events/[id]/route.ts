import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson, RouteCtx } from '@/lib/api/route';
import { EventUpdateSchema } from '@/lib/schemas/event';
import { deleteEvent, getEventById, updateEvent } from '@/lib/data/events';
import { notFound } from '@/lib/errors';

export async function GET(_req: Request, ctx: RouteCtx<{ id: string }>) {
  try {
    const { id } = await ctx.params;
    const event = await getEventById(id);
    if (!event) throw notFound('Kegiatan tidak ditemukan.');
    return NextResponse.json({ event });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request, ctx: RouteCtx<{ id: string }>) {
  try {
    const user = await requireUser('admin_kadiv');
    const { id } = await ctx.params;
    const input = await readJson(req, EventUpdateSchema);
    const updated = await updateEvent(id, input, user);
    return NextResponse.json({ event: updated });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: Request, ctx: RouteCtx<{ id: string }>) {
  try {
    const user = await requireUser('admin_kadiv');
    const { id } = await ctx.params;
    await deleteEvent(id, user);
    return NextResponse.json({ success: true, message: 'Kegiatan berhasil dihapus.' });
  } catch (err) {
    return errorResponse(err);
  }
}

