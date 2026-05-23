'use client';

import { useAuth } from '@/src/providers/auth-provider';
import { getInitials } from '@/src/lib/utils';
import { useEffect, useState } from 'react';
import { Bell, LogOut, User, ChevronDown, Search, HelpCircle } from 'lucide-react';
import api from '@/src/lib/api';
import type { Notification } from '@/src/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/layout/theme-toggle';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/billing': 'POS Billing',
  '/invoices': 'Invoices',
  '/products': 'Products',
  '/product-approval': 'Approvals',
  '/inventory': 'Inventory',
  '/customers': 'Customers',
  '/suppliers': 'Suppliers',
  '/staff': 'Staff',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

function getPageTitle(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const base = Object.keys(pageTitles).find(
    (p) => p !== '/dashboard' && pathname.startsWith(p),
  );
  return base ? pageTitles[base] : 'CountPos';
}

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.data?.count ?? 0);
    } catch {
      /* ignore */
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
    } catch {
      /* ignore */
    }
  };

  const handleNotifClick = () => {
    if (!showNotif) fetchNotifications();
    setShowNotif(!showNotif);
    setShowUserMenu(false);
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const roleLabel: Record<string, string> = {
    OWNER: 'Owner',
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    CASHIER: 'Cashier',
    STAFF: 'Staff',
  };

  const title = getPageTitle(pathname);

  return (
    <header className="flex h-[72px] shrink-0 items-center gap-4 border-b border-border bg-card px-6 print:hidden">
      <h1 className="shrink-0 text-lg font-bold text-foreground">{title}</h1>

      <div className="mx-auto hidden max-w-md flex-1 items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2.5 md:flex">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search anything..."
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <kbd className="rounded border border-border bg-background px-1.5 text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Help"
        >
          <HelpCircle className="h-5 w-5" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={handleNotifClick}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm font-semibold text-popover-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">No notifications</div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={`border-b border-border px-4 py-3 last:border-0 ${!n.isRead ? 'bg-primary/5' : ''}`}
                    >
                      <p className="text-sm font-medium text-popover-foreground">{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotif(false);
            }}
            className="flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3 hover:bg-accent"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {user ? getInitials(user.firstName, user.lastName) : '?'}
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-sm font-semibold leading-tight text-foreground">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {user?.role ? roleLabel[user.role] : ''}
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
              <Link
                href="/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-popover-foreground hover:bg-accent"
              >
                <User className="h-4 w-4" />
                Profile & Settings
              </Link>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {(showNotif || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowNotif(false);
            setShowUserMenu(false);
          }}
          aria-hidden
        />
      )}
    </header>
  );
}
