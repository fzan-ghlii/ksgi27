import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, RouteCtx } from '@/lib/api/route';
import { deleteAnnouncement } from '@/lib/data/announcements';

export async function DELETE(
  _req: NextRequest,
  { params }: RouteCtx<{ id: string }>
) {
  try {
    const user = await requireUser('member');
    const { id } = await params;
    await deleteAnnouncement(user, id);
    return NextResponse.json({ success: true, message: 'Pengumuman berhasil dihapus.' });
  } catch (err) {
    return errorResponse(err);
  }
}

