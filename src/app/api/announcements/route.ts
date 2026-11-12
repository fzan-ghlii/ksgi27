import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse } from '@/lib/api/route';
import { adminDb } from '@/lib/firebase/admin';
import { canManageCalendarAndAnnouncements } from '@/lib/auth/permissions';
import { forbidden, badRequest } from '@/lib/errors';
import { Announcement } from '@/types';

export async function GET() {
  try {
    await requireUser('member');

    const snap = await adminDb
      .collection('announcements')
      .orderBy('pinned', 'desc')
      .orderBy('created_at', 'desc')
      .limit(30)
      .get();

    const announcements = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Announcement[];

    return NextResponse.json({ announcements });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser('member');

    if (!canManageCalendarAndAnnouncements(user)) {
      throw forbidden('Hanya Sekretaris, Wakil Sekretaris, Presidium, atau Administrator yang dapat membuat pengumuman.');
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.title || !body.content) {
      throw badRequest('Judul dan isi pengumuman wajib diisi.');
    }

    const id = `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const announcement: Announcement = {
      id,
      title: body.title.trim(),
      content: body.content.trim(),
      priority: body.priority || 'NORMAL',
      target_audience: body.target_audience || 'ALL',
      event_date: body.event_date || undefined,
      author_id: user.uid,
      author_name: user.full_name,
      author_position: user.position_title || 'Sekretariat GIBEI',
      pinned: !!body.pinned,
      created_at: new Date().toISOString(),
    };

    await adminDb.collection('announcements').doc(id).set(announcement);

    return NextResponse.json({ success: true, announcement });
  } catch (err) {
    return errorResponse(err);
  }
}

