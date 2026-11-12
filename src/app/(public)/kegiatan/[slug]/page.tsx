import { notFound } from 'next/navigation';
import { getPublicEventBySlug } from '@/lib/data/public';
import { EventDetailClient } from './event-detail-client';
import type { Metadata } from 'next';

interface KegiatanDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: KegiatanDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicEventBySlug(slug);

  if (!event) {
    return {
      title: 'Kegiatan Tidak Ditemukan | GIBEI UNIMED',
    };
  }

  return {
    title: `${event.title} | GIBEI UNIMED`,
    description: event.description.slice(0, 160),
    openGraph: {
      title: event.title,
      description: event.description.slice(0, 160),
      images: event.banner_url || event.poster_url ? [event.banner_url || event.poster_url!] : [],
    },
  };
}

export default async function KegiatanDetailPage({ params }: KegiatanDetailPageProps) {
  const { slug } = await params;
  const event = await getPublicEventBySlug(slug);

  if (!event) {
    notFound();
  }

  return (
    <div className="py-10 sm:py-16 bg-background min-h-[75vh]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <EventDetailClient event={event} />
      </div>
    </div>
  );
}

