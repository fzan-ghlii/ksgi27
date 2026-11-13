import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/session';
import { errorResponse, readJson } from '@/lib/api/route';
import { createAnnouncement, listAnnouncements } from '@/lib/data/announcements';

const CreateAnnouncementSchema = z.object({
  title: z.string().trim().min(1, 'Judul dan isi pengumuman wajib diisi.').max(200),
  content: z.string().trim().min(1, 'Judul dan isi pengumuman wajib diisi.').max(3000),
  priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT']).optional(),
  target_audience: z.enum(['ALL', 'KADIV', 'PRESIDIUM']).optional(),
  event_date: z.string().optional(),
  pinned: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireUser('member');
    const announcements = await listAnnouncements(30);
    return NextResponse.json({ announcements });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser('member');
    const body = await readJson(req, CreateAnnouncementSchema);
    const announcement = await createAnnouncement(user, body);
    return NextResponse.json({ success: true, announcement });
  } catch (err) {
    return errorResponse(err);
  }
}

