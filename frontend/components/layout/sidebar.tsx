'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/providers/auth-provider';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Warehouse,
  Users,
  Truck,
  UserCheck,
  BarChart3,
  Settings,
  CheckSquare,
  ShoppingBag,
  Search,
} from 'lucide-react';

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER', 'STAFF'],
  },
  {
    label: 'POS Billing',
    href: '/billing',
    icon: ShoppingCart,
    roles: ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER', 'STAFF'],
    highlight: true,
  },
  {
    label: 'Invoices',
    href: '/invoices',
    icon: FileText,
    roles: ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER', 'STAFF'],
  },
  {
    label: 'Products',
    href: '/products',
    icon: Package,
    roles: ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER', 'STAFF'],
  },
  {
    label: 'Approvals',
    href: '/product-approval',
    icon: CheckSquare,
    roles: ['OWNER', 'ADMIN', 'MANAGER'],
  },
  {
    label: 'Inventory',
    href: '/inventory',
    icon: Warehouse,
    roles: ['OWNER', 'ADMIN', 'MANAGER'],
  },
  {
    label: 'Customers',
    href: '/customers',
    icon: Users,
    roles: ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER', 'STAFF'],
  },
  {
    label: 'Suppliers',
    href: '/suppliers',
    icon: Truck,
    roles: ['OWNER', 'ADMIN', 'MANAGER'],
  },
  {
    label: 'Staff',
    href: '/staff',
    icon: UserCheck,
    roles: ['OWNER', 'ADMIN', 'MANAGER'],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChart3,
    roles: ['OWNER', 'ADMIN', 'MANAGER'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['OWNER', 'ADMIN'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredNav = navItems.filter(
    (item) => user && item.roles.includes(user.role),
  );

  const quickLinks = filteredNav.filter((i) =>
    ['/billing', '/invoices', '/products'].includes(i.href),
  );

  return (
    <aside className="relative flex h-full w-[240px] shrink-0 flex-col border-r border-border bg-card print:hidden">
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShoppingBag className="h-4 w-4" />
        </div>
        <div className="min-w-0 overflow-hidden">
          <div className="truncate text-sm font-bold text-foreground">CountPos</div>
          <div className="truncate text-xs text-muted-foreground">
            {user?.company?.name || 'Your store'}
          </div>
        </div>
      </div>

      <div className="px-3 py-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-sm text-muted-foreground">Search</span>
          <kbd className="rounded border border-border bg-background px-1.5 text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-3 no-scrollbar">
        <div>
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Menu
          </p>
          <div className="space-y-0.5">
            {filteredNav.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    item.highlight && !isActive && 'text-primary',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isActive ? 'text-primary' : 'text-muted-foreground',
                      item.highlight && !isActive && 'text-primary',
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {quickLinks.length > 0 && (
          <div>
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Quick access
            </p>
            <div className="space-y-0.5">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={`quick-${item.href}`}
                    href={item.href}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <div className="rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 p-4 text-white">
          <p className="text-sm font-semibold">Need more insights?</p>
          <p className="mt-1 text-xs text-indigo-100">Export sales & profit reports</p>
          <Link
            href="/reports"
            className="mt-3 block w-full rounded-lg bg-slate-900 py-2 text-center text-xs font-semibold text-white hover:bg-slate-800"
          >
            Open reports
          </Link>
        </div>
      </div>
    </aside>
  );
}
