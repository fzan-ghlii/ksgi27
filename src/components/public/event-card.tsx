import { EventAndSpm } from '@/types';
import { Calendar, MapPin, Users, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';

export function EventCard({ event }: { event: EventAndSpm }) {
  const count = event.registered_count || 0;
  const quota = event.quota || 1;
  const percent = Math.min(100, Math.round((count / quota) * 100));
  const isFull = count >= quota;
  const isClosed = event.status === 'CLOSED' || isFull;
  const isSpm = event.category === 'SPM' || event.category_type === 'SPM';
  const detailLink = `/kegiatan/${event.slug || event.id}`;
  const banner = event.banner_url || event.poster_url;

  return (
    <div className="bento-card flex flex-col justify-between bg-white border border-line hover:border-cerulean transition-all shadow-sm rounded-3xl overflow-hidden group">
      <div>
        {/* Banner Poster */}
        {banner && (
          <div className="h-44 w-full relative overflow-hidden bg-slate-100 border-b border-line">
            <img
              src={banner}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 right-3">
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs ${
                  isClosed ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {isClosed ? 'Ditutup' : 'Dibuka'}
              </span>
            </div>
          </div>
        )}

        <div className="p-6 space-y-4">
          {/* Header Badges */}
          <div className="flex items-center justify-between gap-2">
            <Badge variant={isSpm ? 'gold' : 'cerulean'}>
              {isSpm ? `SPM ${event.spm_level || 'Reguler'}` : 'Program Kerja'}
            </Badge>
            <span className="text-[11px] font-semibold text-ink-muted">
              {event.division_code}
            </span>
          </div>

          {/* Title & Description */}
          <div>
            <Link href={detailLink}>
              <h3 className="text-lg font-bold text-ink hover:text-cerulean transition-colors line-clamp-2 leading-snug">
                {event.title}
              </h3>
            </Link>
            <p className="text-xs sm:text-sm text-ink-muted mt-1.5 line-clamp-2 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Date & Location */}
          <div className="space-y-1.5 text-xs text-ink-muted pt-2 border-t border-line/60">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-cerulean shrink-0" />
              <span>{formatDateTime(event.event_date || event.start_date || '')}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-cyan shrink-0" />
              <span className="truncate">
                [{event.location_type || 'ONLINE'}] {event.location_detail || event.location_or_link || '-'}
              </span>
            </div>
          </div>

          {/* Quota Progress Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-semibold text-ink">
                <Users className="h-3.5 w-3.5 text-cerulean" />
                Kuota Peserta
              </span>
              <span className="font-bold text-ink">
                {count} / {quota} ({percent}%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-line">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan to-cerulean transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="p-6 pt-0 mt-2 flex items-center justify-between">
        <span className={`text-xs font-bold ${isClosed ? 'text-rose-600' : 'text-emerald-700'}`}>
          {isClosed ? 'Kuota Penuh / Tutup' : 'Pendaftaran Tersedia'}
        </span>
        <Link href={detailLink}>
          <Button
            variant={isClosed ? 'outline' : 'gold'}
            size="sm"
            className="text-xs font-bold"
          >
            {isClosed ? 'Lihat Detail' : 'Daftar Sekarang'}
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
