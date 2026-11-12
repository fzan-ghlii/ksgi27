'use client';

import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      richColors
      toastOptions={{
        style: {
          background: '#ffffff',
          color: '#142820',
          border: '1px solid #dfd7c5',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 25px -5px rgba(30, 59, 47, 0.08)',
          fontFamily: 'inherit',
        },
      }}
    />
  );
}

