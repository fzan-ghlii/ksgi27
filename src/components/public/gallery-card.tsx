import Link from 'next/link';
import { Camera, Eye, Image as ImageIcon } from 'lucide-react';
import type { Gallery } from '@/types';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export function GalleryCard({
  gallery,
  onClick,
}: {
  gallery: Gallery;
  onClick?: () => void;
}) {
  const cover = gallery.image_urls[0] || '';
  const isInteractive = Boolean(onClick);

  const content = (
    <>
      <div className="relative overflow-hidden bg-slate-100">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={gallery.title}
            className={
              isInteractive
                ? 'w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300'
                : 'w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300'
            }
          />
        ) : (
          <div className={isInteractive ? 'h-48 flex items-center justify-center text-slate-400' : 'h-44 flex items-center justify-center text-slate-400'}>
            {isInteractive ? <ImageIcon className="h-10 w-10" /> : <Camera className="h-8 w-8" />}
          </div>
        )}

        {isInteractive ? (
          <>
            <div className="absolute top-3 left-3">
              <Badge variant="cerulean" className="shadow-xs text-[10px]">
                {gallery.division_code}
              </Badge>
            </div>
            <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-ink/75 backdrop-blur-xs text-white text-[11px] font-semibold flex items-center gap-1">
              <Camera className="h-3 w-3" />
              <span>{gallery.image_urls.length} foto</span>
            </div>
            <div className="absolute inset-0 bg-ink/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
              <Eye className="h-4 w-4" /> Buka Album Foto
            </div>
          </>
        ) : (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-ink/75 text-white text-[10px] font-semibold">
            {gallery.image_urls.length} foto
          </div>
        )}
      </div>

      {isInteractive ? (
        <div className="p-4 sm:p-5 space-y-1.5">
          <div className="text-[11px] text-ink-muted">{formatDate(gallery.activity_date)}</div>
          <h3 className="font-bold text-sm sm:text-base text-ink group-hover:text-cerulean-dark transition-colors leading-snug">
            {gallery.title}
          </h3>
          {gallery.caption && (
            <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">{gallery.caption}</p>
          )}
        </div>
      ) : (
        <div className="p-4 space-y-1">
          <Badge variant="cerulean" className="text-[9px] py-0 px-1.5">
            {gallery.division_code}
          </Badge>
          <h3 className="font-bold text-sm text-ink line-clamp-1 group-hover:text-cerulean-dark transition-colors">
            {gallery.title}
          </h3>
          <p className="text-[11px] text-ink-muted">{formatDate(gallery.activity_date)}</p>
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <div
        onClick={onClick}
        className="bento-card overflow-hidden bg-white border border-line hover:border-cerulean transition-all shadow-xs group cursor-pointer"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href="/galeri"
      className="bento-card overflow-hidden bg-white border border-line hover:border-cerulean transition-all shadow-xs group block"
    >
      {content}
    </Link>
  );
}

