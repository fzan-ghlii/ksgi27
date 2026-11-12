import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'cerulean' | 'cyan' | 'gold' | 'default';
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
}: StatCardProps) {
  const iconColor = {
    cerulean: 'bg-cerulean-light text-cerulean border-cerulean/30',
    cyan: 'bg-cyan-light text-[#556343] border-cyan/30',
    gold: 'bg-gold-light text-[#66532d] border-gold/30',
    default: 'bg-surface text-ink-muted border-line',
  }[variant];

  return (
    <div className="bento-card p-6 flex items-start justify-between bg-white border border-line shadow-sm">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
          {title}
        </p>
        <div className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-ink-muted pt-1">
            {subtitle}
          </p>
        )}
      </div>
      <div className={cn('p-3 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs', iconColor)}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}

