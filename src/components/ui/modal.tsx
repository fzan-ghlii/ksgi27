'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const SIZES = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' } as const;

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  size = 'md',
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: keyof typeof SIZES;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-150" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2',
            'max-h-[88dvh] overflow-y-auto overscroll-contain rounded-3xl border border-line bg-white p-5 sm:p-8 shadow-2xl',
            'focus:outline-none animate-in fade-in zoom-in-95 duration-150',
            SIZES[size]
          )}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-extrabold text-ink">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-xs leading-relaxed text-ink-muted">
                  {description}
                </Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface hover:text-ink cursor-pointer"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Dialog konfirmasi sebelum aksi yang merusak/tidak bisa dibatalkan. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Ya, lanjutkan',
  variant = 'destructive',
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  variant?: 'destructive' | 'cerulean' | 'gold';
  onConfirm: () => Promise<void> | void;
}) {
  const [busy, setBusy] = React.useState(false);

  const handle = async () => {
    try {
      setBusy(true);
      await onConfirm();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={(o) => !busy && onOpenChange(o)} title={title} size="sm">
      <div className="text-sm leading-relaxed text-ink-muted">{description}</div>
      <div className="mt-6 flex justify-end gap-2.5">
        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>
          Batal
        </Button>
        <Button variant={variant} size="sm" onClick={handle} disabled={busy}>
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
