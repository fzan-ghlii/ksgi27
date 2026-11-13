import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getEventById, listRegistrations } from '@/lib/data/events';
import { ParticipantClient } from './participant-client';
import type { Registration } from '@/types';

export default async function EventParticipantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  let participants: Registration[] = [];
  try {
    participants = await listRegistrations(id, user);
  } catch {
    redirect('/dashboard/event-spm');
  }

  return <ParticipantClient event={event} initialParticipants={participants} />;
}

