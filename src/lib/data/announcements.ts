import 'server-only';
import { adminDb } from '@/lib/firebase/admin';
import { canManageCalendarAndAnnouncements } from '@/lib/auth/permissions';
import { badRequest, forbidden, notFound } from '@/lib/errors';
import type { Announcement, UserProfile } from '@/types';

const col = () => adminDb.collection('announcements');

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  priority?: 'NORMAL' | 'IMPORTANT' | 'URGENT';
  target_audience?: 'ALL' | 'KADIV' | 'PRESIDIUM';
  event_date?: string;
  pinned?: boolean;
}

export async function listAnnouncements(limit = 30): Promise<Announcement[]> {
  const snap = await col()
    .orderBy('pinned', 'desc')
    .orderBy('created_at', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Announcement);
}

export async function createAnnouncement(
  actor: UserProfile,
  input: CreateAnnouncementInput
): Promise<Announcement> {
  if (!canManageCalendarAndAnnouncements(actor)) {
    throw forbidden('Hanya Sekretaris, Wakil Sekretaris, Presidium, atau Administrator yang dapat membuat pengumuman.');
  }

  const title = input.title?.trim();
  const content = input.content?.trim();
  if (!title || !content) {
    throw badRequest('Judul dan isi pengumuman wajib diisi.');
  }

  const id = `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const announcement: Announcement = {
    id,
    title,
    content,
    priority: input.priority || 'NORMAL',
    target_audience: input.target_audience || 'ALL',
    event_date: input.event_date || undefined,
    author_id: actor.uid,
    author_name: actor.full_name,
    author_position: actor.position_title || 'Sekretariat GIBEI',
    pinned: !!input.pinned,
    created_at: new Date().toISOString(),
  };

  await col().doc(id).set(announcement);
  return announcement;
}

export async function deleteAnnouncement(actor: UserProfile, id: string): Promise<void> {
  if (!canManageCalendarAndAnnouncements(actor)) {
    throw forbidden('Hanya Sekretaris, Wakil Sekretaris, Presidium, atau Administrator yang dapat menghapus pengumuman.');
  }

  const ref = col().doc(id);
  const doc = await ref.get();
  if (!doc.exists) {
    throw notFound('Pengumuman tidak ditemukan.');
  }

  await ref.delete();
}

