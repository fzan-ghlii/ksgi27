import { cookies } from 'next/headers';
import { Header } from '@/components/public/header';
import { Footer } from '@/components/public/footer';
import { getSystemConfig } from '@/lib/data/system';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { MaintenanceView } from '@/components/public/maintenance-view';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getSystemConfig();
  const cookieStore = await cookies();
  const hasSession = !!cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (config.maintenance_mode && !hasSession) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <MaintenanceView message={config.maintenance_message} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
