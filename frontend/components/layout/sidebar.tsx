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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

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
  const [collapsed, setCollapsed] = useState(false);

  const filteredNav = navItems.filter(
    (item) => user && item.roles.includes(user.role),
  );

  return (
    <aside
      className={cn(
        'relative flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-sidebar-border', collapsed && 'justify-center px-2')}>
        <div className="flex-shrink-0 w-8 h-8 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg flex items-center justify-center">
          <ShoppingBag className="w-4 h-4" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-bold text-sidebar-foreground leading-tight">CountPos</div>
            <div className="text-xs text-muted-foreground truncate max-w-[140px]">
              {user?.company?.name || 'Loading...'}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 no-scrollbar">
        <div className="space-y-0.5">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium group',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  item.highlight && !isActive && 'text-sidebar-primary',
                  collapsed && 'justify-center px-2',
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0', item.highlight && !isActive && 'text-sidebar-primary')} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-sidebar-border rounded-full flex items-center justify-center hover:bg-border transition-colors z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-foreground" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-foreground" />
        )}
      </button>
    </aside>
  );
}
