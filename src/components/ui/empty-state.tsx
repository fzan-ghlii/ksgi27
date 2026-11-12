import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/50 p-8 text-center transition-colors sm:p-12',
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cerulean-light text-cerulean border border-cerulean/20 mb-4 shadow-sm">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold text-ink mb-1">{title}</h3>
      <p className="text-sm text-ink-muted max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="cerulean" onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

