'use client';

import * as React from 'react';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GibeiLogo({
  className = 'h-10 w-10',
  iconClassName = 'h-5 w-5',
}: {
  className?: string;
  iconClassName?: string;
}) {
  const [hasImage, setHasImage] = React.useState(true);

  return (
    <div
      className={cn(
        'rounded-xl bg-gradient-to-br from-cerulean to-cyan flex items-center justify-center text-white shadow-sm overflow-hidden shrink-0 relative bg-white',
        className
      )}
    >
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/images/logo.png"
          alt="Logo GIBEI UNIMED"
          className="h-full w-full object-contain p-1"
          onError={() => setHasImage(false)}
        />
      ) : (
        <TrendingUp className={iconClassName} />
      )}
    </div>
  );
}

