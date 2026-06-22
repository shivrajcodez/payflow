'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, CreditCard, BarChart3, Bell, Settings, Shield,
  LogOut, Menu, X, ChevronDown, Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';

interface NavItem { href: string; label: string; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean; }

const navItems: NavItem[] = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/payments',   label: 'Payments',   icon: CreditCard },
  { href: '/analytics',  label: 'Analytics',  icon: BarChart3, adminOnly: true },
  { href: '/admin',      label: 'Admin',      icon: Shield, adminOnly: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, router]);

  // Fetch unread notifications
  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/v1/notifications/unread-count')
      .then(({ data }) => setUnreadCount(data.data.count))
      .catch(() => {});
  }, [isAuthenticated]);

  useWebSocket({
    userEmail: user?.email,
    onNotification: () => setUnreadCount((c) => c + 1),
  });

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post('/v1/auth/logout');
    } catch { /* ignore */ }
    logout();
    router.push('/auth/login');
  };

  const filteredNav = navItems.filter((item) =>
    !item.adminOnly || user?.role === 'ADMIN'
  );

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-dark-900 border-r border-dark-800 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-dark-800 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center font-black text-sm">P</div>
            <span className="font-black text-lg tracking-tight">PayFlow</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-dark-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
              className={cn('nav-item', pathname === href || pathname.startsWith(href + '/') ? 'active' : '')}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Notification + User footer */}
        <div className="border-t border-dark-800 p-3 space-y-1">
          <Link href="/profile" onClick={() => setSidebarOpen(false)}
            className={cn('nav-item', pathname === '/profile' ? 'active' : '')}>
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <Link href="/dashboard" onClick={() => setSidebarOpen(false)}
            className="nav-item relative">
            <Bell className="w-4 h-4" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-auto bg-brand-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* User card */}
          <div className="mt-2 pt-2 border-t border-dark-800">
            <button onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-dark-800 transition-colors">
              <div className="w-8 h-8 rounded-full bg-brand-red/20 border border-brand-red/30 flex items-center justify-center text-xs font-bold text-brand-red-light flex-shrink-0">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-medium truncate">{user.firstName} {user.lastName}</div>
                <div className="text-xs text-dark-400 truncate">{user.email}</div>
              </div>
              <ChevronDown className={cn('w-4 h-4 text-dark-400 transition-transform', userMenuOpen && 'rotate-180')} />
            </button>
            {userMenuOpen && (
              <div className="mt-1 ml-3 mr-1 rounded-lg bg-dark-800 border border-dark-700 overflow-hidden">
                <button onClick={handleLogout} disabled={loggingOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-dark-700 transition-colors">
                  {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-dark-900/80 backdrop-blur-sm border-b border-dark-800 flex items-center px-6 gap-4 flex-shrink-0 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-dark-400 hover:text-white transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
              user.role === 'ADMIN'
                ? 'bg-brand-red/10 border-brand-red/20 text-brand-red-light'
                : 'bg-dark-800 border-dark-700 text-dark-400'
            )}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {user.role}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
