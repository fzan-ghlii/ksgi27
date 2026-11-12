'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  UserCircle,
  Link2,
  Users,
  Calendar,
  FileText,
  Image as ImageIcon,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Shield,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '@/types';
import { RoleBadge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { GibeiLogo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';

interface DashboardShellProps {
  user: UserProfile;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [desktopCollapsed, setDesktopCollapsed] = React.useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // Close mobile drawer on route change
  React.useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Determine allowed menus based on role and division
  const isCreator = user.role === 'creator';
  const isPresidium = user.role === 'master_presidium';
  const isKadiv = user.role === 'admin_kadiv';
  const isKadivHrd = isKadiv && user.division_code === 'HRD';

  const menuItems = [
    {
      title: 'Ringkasan',
      href: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      title: 'Profil Biodata',
      href: '/dashboard/profil',
      icon: UserCircle,
      show: true,
    },
    {
      title: 'Link Aktivasi',
      href: '/dashboard/aktivasi',
      icon: Link2,
      show: isCreator || isPresidium || isKadivHrd,
      badge: isKadivHrd ? 'HRD' : undefined,
    },
    {
      title: 'Kepengurusan',
      href: '/dashboard/kepengurusan',
      icon: Users,
      show: isCreator || isPresidium || isKadiv,
    },
    {
      title: 'Event & SPM',
      href: '/dashboard/event-spm',
      icon: Calendar,
      show: isCreator || isPresidium || isKadiv,
    },
    {
      title: 'Artikel & Riset',
      href: '/dashboard/artikel',
      icon: FileText,
      show: true,
    },
    {
      title: 'Galeri Foto',
      href: '/dashboard/galeri',
      icon: ImageIcon,
      show: true,
    },
    {
      title: 'Pengaturan Sistem',
      href: '/dashboard/sistem',
      icon: Settings,
      show: isCreator,
      badge: 'Sistem',
    },
  ];

  const visibleMenuItems = menuItems.filter((i) => i.show);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/session', { method: 'DELETE' });
      toast.success('Berhasil keluar dari sesi.');
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Gagal keluar.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Bottom navigation items for fast thumb access on mobile
  const bottomNavItems = [
    { label: 'Ringkasan', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Event', href: '/dashboard/event-spm', icon: Calendar },
    { label: 'Artikel', href: '/dashboard/artikel', icon: FileText },
    { label: 'Galeri', href: '/dashboard/galeri', icon: ImageIcon },
  ];

  return (
    <div className="min-h-screen flex bg-surface">
      {/* ========================================================
          1. DESKTOP SIDEBAR (Pinned on md/lg screens, hidden on mobile)
      ======================================================== */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-white border-r border-line transition-all duration-300 z-30 shrink-0 h-screen sticky top-0',
          desktopCollapsed ? 'w-20' : 'w-64 lg:w-72'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between p-4 border-b border-line h-16">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
            <GibeiLogo className="h-10 w-10 shrink-0" />
            {!desktopCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-sm text-ink tracking-tight truncate">
                  GIBEI UNIMED
                </span>
                <span className="text-[10px] text-ink-muted uppercase font-semibold">
                  Portal Internal
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setDesktopCollapsed(!desktopCollapsed)}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface border border-line hidden sm:block cursor-pointer"
            aria-label={desktopCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          >
            {desktopCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* User Information Banner */}
        {!desktopCollapsed ? (
          <div className="p-4 mx-3 my-3 rounded-2xl bg-surface border border-line flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <RoleBadge role={user.role} />
              {user.division_code && (
                <span className="text-[10px] font-bold text-cerulean-dark uppercase bg-white px-2 py-0.5 rounded-md border border-line">
                  {user.division_code}
                </span>
              )}
            </div>
            <div className="truncate">
              <div className="font-bold text-sm text-ink truncate">{user.full_name}</div>
              <div className="text-xs text-ink-muted truncate">{user.position_title || user.email}</div>
            </div>
          </div>
        ) : (
          <div className="p-3 text-center border-b border-line">
            <RoleBadge role={user.role} className="text-[10px] px-1" />
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {visibleMenuItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative cursor-pointer',
                  isActive
                    ? 'bg-cerulean text-white shadow-sm'
                    : 'text-ink-muted hover:text-ink hover:bg-surface'
                )}
                title={desktopCollapsed ? item.title : undefined}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform group-hover:scale-105',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-cerulean'
                  )}
                />
                {!desktopCollapsed && (
                  <span className="truncate flex-1">{item.title}</span>
                )}
                {!desktopCollapsed && item.badge && (
                  <span
                    className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded font-bold uppercase',
                      isActive ? 'bg-white/20 text-white' : 'bg-surface text-ink-muted border border-line'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-line">
          <Button
            variant="ghost"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              'w-full justify-start text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-9 px-3',
              desktopCollapsed && 'justify-center px-0'
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!desktopCollapsed && <span className="ml-2">Keluar Akun</span>}
          </Button>
        </div>
      </aside>

      {/* ========================================================
          2. MOBILE DRAWER (Slide-over on phone screens)
      ======================================================== */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      <div
        className={cn(
          'fixed inset-y-0 left-0 w-[82vw] max-w-xs bg-white z-50 shadow-2xl flex flex-col md:hidden transition-transform duration-300 ease-in-out',
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-line h-16">
          <div className="flex items-center gap-2.5">
            <GibeiLogo className="h-9 w-9 shrink-0" />
            <div className="flex flex-col">
              <span className="font-extrabold text-sm text-ink">GIBEI UNIMED</span>
              <span className="text-[10px] text-ink-muted uppercase font-semibold">
                Portal Internal
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface border border-line"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-surface border border-line space-y-1.5">
          <div className="flex items-center justify-between">
            <RoleBadge role={user.role} />
            {user.division_code && (
              <span className="text-[10px] font-bold text-cerulean-dark uppercase bg-white px-2 py-0.5 rounded-md border border-line">
                {user.division_code}
              </span>
            )}
          </div>
          <div className="font-bold text-sm text-ink truncate">{user.full_name}</div>
          <div className="text-xs text-ink-muted truncate">{user.position_title || user.email}</div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 overscroll-contain">
          {visibleMenuItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileDrawerOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]',
                  isActive
                    ? 'bg-cerulean text-white shadow-sm font-bold'
                    : 'text-ink-muted hover:text-ink hover:bg-surface'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0',
                    isActive ? 'text-white' : 'text-slate-400'
                  )}
                />
                <span className="flex-1 truncate">{item.title}</span>
                {item.badge && (
                  <span
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded font-bold uppercase',
                      isActive ? 'bg-white/20 text-white' : 'bg-surface text-ink-muted border border-line'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-line space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-ink-muted hover:bg-surface transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-cerulean" />
              Buka Situs Publik
            </span>
            <span className="text-[10px] text-slate-400">Tab Baru ↗</span>
          </Link>

          <Button
            variant="ghost"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full justify-start text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-10 px-3.5"
          >
            <LogOut className="h-4 w-4 shrink-0 mr-2" />
            Keluar Akun
          </Button>
        </div>
      </div>

      {/* ========================================================
          3. MAIN CONTENT AREA
      ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-line px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="p-2 -ml-1 rounded-xl text-ink hover:bg-surface border border-line md:hidden cursor-pointer"
              aria-label="Buka menu navigasi"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 truncate">
              <span className="text-xs sm:text-sm font-extrabold text-ink truncate">
                Portal Pengurus
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <div className="hidden xs:inline-block">
                <RoleBadge role={user.role} className="text-[10px] sm:text-xs" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link
              href="/"
              target="_blank"
              className="text-xs font-semibold text-ink-muted hover:text-cerulean-dark flex items-center gap-1.5 transition-colors p-2 rounded-lg hover:bg-surface"
              title="Lihat Situs Publik"
            >
              <span className="hidden sm:inline">Lihat Web</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        {/* Page Content with extra bottom padding on mobile for the bottom bar */}
        <main className="flex-1 px-4 py-5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* ========================================================
          4. MOBILE BOTTOM NAVIGATION BAR (Thumb friendly on phones)
      ======================================================== */}
      <nav
        className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-line z-30 flex items-center justify-around py-1 px-2 md:hidden shadow-lg"
        style={{ paddingBottom: 'calc(0.4rem + env(safe-area-inset-bottom, 0px))' }}
        aria-label="Navigasi Bawah Mobile"
      >
        {bottomNavItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all min-w-[60px]',
                isActive ? 'text-cerulean font-bold' : 'text-slate-400 hover:text-ink'
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-lg transition-colors',
                  isActive ? 'bg-cerulean-light text-cerulean' : ''
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] mt-0.5 leading-none">{item.label}</span>
            </Link>
          );
        })}

        {/* Menu Drawer Toggle Button */}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className={cn(
            'flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all min-w-[60px]',
            mobileDrawerOpen ? 'text-cerulean font-bold' : 'text-slate-400 hover:text-ink'
          )}
          aria-label="Buka menu lengkap"
        >
          <div className="p-1 rounded-lg">
            <Menu className="h-5 w-5" />
          </div>
          <span className="text-[10px] mt-0.5 leading-none">Menu</span>
        </button>
      </nav>
    </div>
  );
}
