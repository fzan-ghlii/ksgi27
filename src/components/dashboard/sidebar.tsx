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
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Images
} from 'lucide-react';
import { UserProfile } from '@/types';
import { RoleBadge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { GibeiLogo } from '@/components/shared/logo';

interface SidebarProps {
  user: UserProfile;
}

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

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
      title: 'Profil Saya',
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
      title: 'Piket Galeri',
      href: '/dashboard/piket',
      icon: ClipboardCheck,
      show: true,
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
      title: 'Carousel Beranda',
      href: '/dashboard/carousel',
      icon: Images,
      show: isCreator || isPresidium,
      badge: 'Presidium',
    },
    {
      title: 'Pengaturan Sistem',
      href: '/dashboard/sistem',
      icon: Settings,
      show: isCreator,
      badge: 'Sistem',
    },
  ];

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

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-white border-r border-line transition-all duration-300 z-30 shrink-0 h-screen sticky top-0',
        collapsed ? 'w-20' : 'w-64 sm:w-72'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between p-4 border-b border-line h-16">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <GibeiLogo className="h-10 w-10 shrink-0" />
          {!collapsed && (
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
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface border border-line hidden sm:block"
          aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* User Information Banner */}
      {!collapsed ? (
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

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {menuItems
          .filter((item) => item.show)
          .map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.title : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
                  isActive
                    ? 'bg-cerulean-light text-cerulean-dark font-bold shadow-sm'
                    : 'text-ink-muted hover:text-ink hover:bg-surface',
                  collapsed && 'justify-center px-0'
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors',
                    isActive ? 'text-cerulean' : 'text-slate-400'
                  )}
                />
                {!collapsed && (
                  <span className="flex-1 truncate">{item.title}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gold-light text-[#66532d] border border-gold/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-line space-y-2">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-ink-muted hover:text-cerulean-dark hover:bg-surface rounded-lg transition-colors',
            collapsed && 'justify-center px-0'
          )}
          title="Ke Halaman Publik"
        >
          <TrendingUp className="h-4 w-4 shrink-0 text-cerulean" />
          {!collapsed && <span>Lihat Web Publik</span>}
        </Link>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50',
            collapsed && 'justify-center px-0'
          )}
          title="Keluar Akun"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{isLoggingOut ? 'Keluar...' : 'Keluar'}</span>}
        </button>
      </div>
    </aside>
  );
}

