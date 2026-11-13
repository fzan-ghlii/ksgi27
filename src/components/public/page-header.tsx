import * as React from 'react';
import { cn } from '@/lib/utils';

export function PublicPageHeader({
  badge,
  icon,
  title,
  description,
  tone = 'cerulean',
  className,
}: {
  badge: string;
  icon?: React.ReactNode;
  title: string;
  description: React.ReactNode;
  tone?: 'cerulean' | 'gold';
  className?: string;
}) {
  return (
    <div className={cn('max-w-3xl', className)}>
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border',
          tone === 'gold'
            ? 'bg-gold-light text-[#66532d] border-gold/30'
            : 'bg-cerulean-light text-cerulean-dark border-cerulean/20'
        )}
      >
        {icon}
        {badge}
      </div>
      <h1 className="text-3xl sm:text-5xl font-black text-ink tracking-tight">{title}</h1>
      <p className="mt-3 text-base sm:text-lg text-ink-muted leading-relaxed">{description}</p>
    </div>
  );
}

