import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'GIBEI UNIMED - Galeri Investasi Bursa Efek Indonesia',
  description: 'Portal Resmi & Sistem Manajemen Organisasi Galeri Investasi BEI Universitas Negeri Medan.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1e3b2f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col bg-white text-ink font-sans overflow-x-hidden">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
