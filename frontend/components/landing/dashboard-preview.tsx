'use client';

import {
  Bell,
  ChevronDown,
  HelpCircle,
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
  MoreHorizontal,
  Search,
  TrendingUp,
  Upload,
  Users,
  Wallet,
  PiggyBank,
  DollarSign,
  FolderOpen,
} from 'lucide-react';
import Image from 'next/image';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const barHeights = [42, 55, 48, 62, 58, 70, 88, 52, 60, 45, 50, 38];

const topCategories = [
  { name: 'Grocery', pct: 81 },
  { name: 'Pharmacy', pct: 73 },
  { name: 'Hardware', pct: 54 },
  { name: 'Electronics', pct: 32 },
  { name: 'Apparel', pct: 20 },
];

const orders = [
  {
    product: "Men's Genuine Leather Sneakers",
    orderId: '#878910',
    date: '2 Dec 2026',
    customer: 'Oliver John Brown',
    category: 'Shoes, Sneakers',
    status: 'Pending',
    items: '2 Items',
    total: '$789.00',
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&h=80&fit=crop',
  },
  {
    product: 'Wireless Noise Cancelling Headphones',
    orderId: '#878911',
    date: '1 Dec 2026',
    customer: 'Sarah Mitchell',
    category: 'Electronics',
    status: 'Completed',
    items: '1 Item',
    total: '$249.00',
    img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&h=80&fit=crop',
  },
];

function NavItem({
  icon: Icon,
  label,
  active,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-medium ${
        active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-indigo-500' : 'text-slate-400'}`} />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="rounded-full bg-indigo-500 px-1.5 py-0.5 text-[8px] font-semibold text-white">
          {badge}
        </span>
      )}
    </div>
  );
}

/** SaaS dashboard mock — matches UI-Layouts hero preview (CountPos branded). */
export function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-[#f4f4f8] shadow-2xl">
      <div className="flex min-h-[520px]">
        {/* Sidebar */}
        <aside className="hidden w-[148px] shrink-0 flex-col border-r border-slate-200/80 bg-white p-3 sm:flex">
          <div className="mb-3 flex items-center gap-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500 text-[10px] font-bold text-white">
              C
            </span>
            <span className="text-[11px] font-bold text-slate-900">CountPos</span>
          </div>

          <div className="mb-3 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
            <Search className="h-3 w-3 text-slate-400" />
            <span className="flex-1 text-[9px] text-slate-400">Search</span>
            <kbd className="rounded border border-slate-200 bg-white px-1 text-[7px] text-slate-400">⌘K</kbd>
          </div>

          <p className="mb-1 px-1 text-[8px] font-semibold uppercase tracking-wider text-slate-400">Menu</p>
          <nav className="space-y-0.5">
            <NavItem icon={LayoutDashboard} label="Dashboard" active />
            <NavItem icon={TrendingUp} label="Updates" />
            <NavItem icon={Lightbulb} label="Insights" />
            <NavItem icon={MessageSquare} label="Message" badge="24" />
            <NavItem icon={Users} label="Customers" />
          </nav>

          <p className="mb-1 mt-3 px-1 text-[8px] font-semibold uppercase tracking-wider text-slate-400">
            Stores
          </p>
          <div className="space-y-1 text-[9px] text-slate-600">
            {['Main branch', 'Warehouse', 'Outlet'].map((store) => (
              <div key={store} className="flex items-center gap-1.5 rounded-md px-1 py-1 hover:bg-slate-50">
                <span className="h-4 w-4 rounded bg-slate-100" />
                <span className="truncate">{store}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 p-2.5 text-white">
            <p className="text-[9px] font-semibold leading-tight">Switch to Pro</p>
            <p className="mt-0.5 text-[8px] text-indigo-100">Unlock advanced reports</p>
            <button
              type="button"
              className="mt-2 w-full rounded-lg bg-slate-900 py-1 text-[8px] font-semibold text-white"
            >
              Upgrade Pro
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1 p-3 md:p-4">
          {/* Top bar */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Overview</h3>
            <div className="mx-auto hidden max-w-xs flex-1 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 md:flex">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] text-slate-400">Search anything...</span>
              <kbd className="ml-auto rounded border border-slate-200 px-1.5 text-[8px] text-slate-400">⌘K</kbd>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-slate-400" />
              <Bell className="h-4 w-4 text-slate-400" />
              <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-0.5 pl-0.5 pr-2">
                <div className="h-6 w-6 overflow-hidden rounded-full bg-indigo-100">
                  <Image
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop"
                    alt=""
                    width={24}
                    height={24}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
                <div className="hidden sm:block">
                  <p className="text-[9px] font-semibold leading-none text-slate-900">Al Razi</p>
                  <p className="text-[8px] text-slate-400">@store#1</p>
                </div>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Purple hero + stat cards */}
          <div className="mb-3 rounded-2xl bg-linear-to-br from-indigo-500 via-indigo-600 to-violet-600 p-3 md:p-4">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-white md:text-base">
                  Good Morning, Al Razi ✨
                </h4>
                <p className="mt-0.5 max-w-md text-[9px] text-indigo-100 md:text-[10px]">
                  Get a clear snapshot of your sales, profit, and recent invoices.
                </p>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-lg bg-white/15 px-2 py-1 text-[9px] font-medium text-white backdrop-blur-sm"
                >
                  This Month <ChevronDown className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[9px] font-semibold text-indigo-600"
                >
                  <Upload className="h-3 w-3" /> Export
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {[
                {
                  label: 'Total sales',
                  value: '$10,340',
                  sub: 'This period',
                  icon: Wallet,
                  iconBg: 'bg-indigo-100 text-indigo-600',
                },
                {
                  label: 'Profit',
                  value: '$5,200',
                  sub: 'After cost',
                  icon: DollarSign,
                  iconBg: 'bg-emerald-100 text-emerald-600',
                },
                {
                  label: 'Expenses',
                  value: '$1,475',
                  sub: 'Operating',
                  icon: Wallet,
                  iconBg: 'bg-rose-100 text-rose-600',
                },
                {
                  label: 'Credit due',
                  value: '$620',
                  sub: 'Outstanding',
                  icon: PiggyBank,
                  iconBg: 'bg-sky-100 text-sky-600',
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl bg-white/95 p-2.5 shadow-sm backdrop-blur-sm"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className={`rounded-lg p-1.5 ${card.iconBg}`}>
                      <card.icon className="h-3.5 w-3.5" />
                    </div>
                    <MoreHorizontal className="h-3.5 w-3.5 text-slate-300" />
                  </div>
                  <p className="text-[8px] font-medium text-slate-500">{card.label}</p>
                  <p className="text-sm font-bold text-slate-900">{card.value}</p>
                  <p className="text-[8px] text-slate-400">{card.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Charts row */}
          <div className="mb-3 grid gap-2 md:grid-cols-5">
            {/* Bar chart */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3 md:col-span-3">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-slate-900">Transactions overview</p>
                  <p className="text-lg font-bold text-slate-900">$8,435.00</p>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-0.5 text-[8px] font-medium text-slate-600"
                >
                  This Year <ChevronDown className="h-3 w-3" />
                </button>
              </div>
              <div className="mb-1 flex gap-3 text-[8px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-indigo-500" /> Total sales
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-slate-200" /> Profit
                </span>
              </div>
              <div className="flex h-24 items-end justify-between gap-0.5 pt-2">
                {months.map((m, i) => {
                  const isJuly = m === 'Jul';
                  return (
                    <div key={m} className="flex flex-1 flex-col items-center gap-0.5">
                      {isJuly && (
                        <span className="rounded bg-indigo-600 px-1 py-0.5 text-[7px] font-semibold text-white">
                          $22,430
                        </span>
                      )}
                      <div
                        className={`w-full max-w-[14px] rounded-t-sm ${
                          isJuly
                            ? 'bg-indigo-500'
                            : 'bg-[repeating-linear-gradient(135deg,#e2e8f0_0,#e2e8f0_2px,#f1f5f9_2px,#f1f5f9_4px)]'
                        }`}
                        style={{ height: `${barHeights[i]}%` }}
                      />
                      <span className="text-[7px] text-slate-400">{m}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Horizontal bars */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3 md:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FolderOpen className="h-3.5 w-3.5 text-indigo-500" />
                  <p className="text-[10px] font-semibold text-slate-900">Sales overview</p>
                </div>
              </div>
              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-xl font-bold text-slate-900">8379</span>
                <span className="flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600">
                  <TrendingUp className="h-3 w-3" /> +4.9%
                </span>
              </div>
              <p className="mb-2 text-[8px] text-slate-500">Total sales by category</p>
              <div className="space-y-2">
                {topCategories.map((cat) => (
                  <div key={cat.name}>
                    <div className="mb-0.5 flex justify-between text-[8px]">
                      <span className="font-medium text-slate-700">{cat.name}</span>
                      <span className="text-slate-400">{cat.pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-indigo-400 to-indigo-600"
                        style={{ width: `${cat.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent orders */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-semibold text-slate-900">Recent orders</p>
              <div className="flex gap-1.5">
                <div className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1">
                  <Search className="h-3 w-3 text-slate-400" />
                  <span className="text-[8px] text-slate-400">Search products...</span>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[8px] font-medium text-slate-600"
                >
                  Sort by <ChevronDown className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-[9px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400">
                    <th className="w-6 pb-2 pr-2">
                      <input type="checkbox" className="rounded border-slate-300" readOnly />
                    </th>
                    <th className="pb-2 font-medium">Product info</th>
                    <th className="pb-2 font-medium">Order Id</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="hidden pb-2 font-medium sm:table-cell">Customer</th>
                    <th className="hidden pb-2 font-medium md:table-cell">Category</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Items</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((row) => (
                    <tr key={row.orderId} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 pr-2">
                        <input type="checkbox" className="rounded border-slate-300" readOnly />
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                            <Image
                              src={row.img}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <span className="max-w-[120px] truncate font-medium text-slate-800">
                            {row.product}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 text-slate-600">{row.orderId}</td>
                      <td className="py-2 text-slate-600">{row.date}</td>
                      <td className="hidden py-2 text-slate-600 sm:table-cell">{row.customer}</td>
                      <td className="hidden py-2 text-slate-500 md:table-cell">{row.category}</td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[8px] font-semibold ${
                            row.status === 'Pending'
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2 text-slate-600">{row.items}</td>
                      <td className="py-2 text-right font-semibold text-slate-900">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
