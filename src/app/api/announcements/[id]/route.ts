import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse } from '@/lib/api/route';
import { adminDb } from '@/lib/firebase/admin';
import { canManageCalendarAndAnnouncements } from '@/lib/auth/permissions';
import { forbidden, notFound } from '@/lib/errors';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser('member');

    if (!canManageCalendarAndAnnouncements(user)) {
      throw forbidden('Hanya Sekretaris, Wakil Sekretaris, Presidium, atau Administrator yang dapat menghapus pengumuman.');
    }

    const { id } = await params;
    const ref = adminDb.collection('announcements').doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      throw notFound('Pengumuman tidak ditemukan.');
    }

    await ref.delete();

    return NextResponse.json({ success: true, message: 'Pengumuman berhasil dihapus.' });
  } catch (err) {
    return errorResponse(err);
  }
}

