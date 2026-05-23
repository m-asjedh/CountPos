'use client';

import { useAuth } from '@/src/providers/auth-provider';
import { getInitials } from '@/src/lib/utils';
import { useEffect, useState } from 'react';
import { Bell, Sun, Moon, Monitor, LogOut, User, ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import api from '@/src/lib/api';
import type { Notification } from '@/src/types';
import Link from 'next/link';

export function Header() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  const themeIcon = !mounted ? null : theme === 'dark' ? (
    <Moon className="w-4 h-4" />
  ) : theme === 'light' ? (
    <Sun className="w-4 h-4" />
  ) : (
    <Monitor className="w-4 h-4" />
  );

  const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';

  const roleLabel: Record<string, string> = {
    OWNER: 'Owner',
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    CASHIER: 'Cashier',
    STAFF: 'Staff',
  };

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 gap-4 print:hidden">
      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(nextTheme)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          title="Toggle theme"
        >
          {themeIcon}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={handleNotifClick}
            className="relative w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-10 w-80 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div key={n.id} className={`px-4 py-3 border-b border-border last:border-0 transition-colors ${!n.isRead ? 'bg-primary/5' : ''}`}>
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotif(false); }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-accent transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
              {user ? getInitials(user.firstName, user.lastName) : '?'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-foreground leading-tight">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {user?.role ? roleLabel[user.role] : ''}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-48 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              <Link
                href="/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <User className="w-4 h-4" />
                Profile & Settings
              </Link>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => { setShowUserMenu(false); logout(); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showNotif || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowNotif(false); setShowUserMenu(false); }}
        />
      )}
    </header>
  );
}
