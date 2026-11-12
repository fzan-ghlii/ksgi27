import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Role, InviteStatus } from '@/types';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors border',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-slate-100 text-ink',
        cerulean: 'border-cerulean/30 bg-cerulean-light text-cerulean font-bold',
        cyan: 'border-cyan/30 bg-cyan-light text-[#556343] font-bold',
        gold: 'border-gold/40 bg-gold-light text-[#66532d] font-bold',
        outline: 'border-line text-ink-muted',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        destructive: 'border-rose-200 bg-rose-50 text-rose-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  if (role === 'creator' || role === 'master_presidium') {
    return (
      <Badge variant="gold" className={cn('font-bold', className)}>
        <span className="h-1.5 w-1.5 rounded-full bg-gold inline-block" />
        Presidium
      </Badge>
    );
  }
  if (role === 'admin_kadiv') {
    return (
      <Badge variant="cerulean" className={className}>
        <span className="h-1.5 w-1.5 rounded-full bg-cerulean inline-block" />
        Kadiv
      </Badge>
    );
  }
  if (role === 'member') {
    return (
      <Badge variant="cyan" className={className}>
        <span className="h-1.5 w-1.5 rounded-full bg-cyan inline-block" />
        Anggota
      </Badge>
    );
  }
  return <Badge variant="outline" className={className}>Publik</Badge>;
}

export function InviteStatusBadge({ status, className }: { status: InviteStatus; className?: string }) {
  switch (status) {
    case 'PENDING':
      return (
        <Badge variant="cyan" className={className}>
          <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse inline-block" />
          Aktif (Belum Terpakai)
        </Badge>
      );
    case 'USED':
      return (
        <Badge variant="cerulean" className={className}>
          <span className="h-1.5 w-1.5 rounded-full bg-cerulean inline-block" />
          Sudah Dipakai
        </Badge>
      );
    case 'EXPIRED':
      return (
        <Badge variant="outline" className={cn('text-slate-400 bg-slate-50', className)}>
          Kedaluwarsa
        </Badge>
      );
    case 'REVOKED':
      return (
        <Badge variant="destructive" className={className}>
          Dicabut
        </Badge>
      );
  }
}

export { Badge, badgeVariants };

