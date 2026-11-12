import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cerulean focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.98] touch-manipulation',
  {
    variants: {
      variant: {
        gold: 'bg-gold text-ink hover:bg-gold-hover shadow-sm shadow-gold/20 font-bold',
        cerulean: 'bg-cerulean text-white hover:bg-cerulean-dark shadow-sm shadow-cerulean/20',
        cyan: 'bg-cyan text-white hover:bg-[#687556] shadow-sm shadow-cyan/20 font-semibold',
        outline: 'border border-line bg-white text-ink hover:bg-surface hover:border-cerulean',
        ghost: 'text-ink hover:bg-surface hover:text-cerulean-dark',
        destructive: 'bg-rose-500 text-white hover:bg-rose-600',
        link: 'text-cerulean-dark underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-xl px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'cerulean',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

