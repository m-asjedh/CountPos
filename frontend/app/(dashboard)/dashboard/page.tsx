'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/src/providers/auth-provider';
import { useCompanySettings } from '@/src/providers/company-settings-provider';
import type { DashboardSummary, Invoice } from '@/src/types';
import api from '@/src/lib/api';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  AlertTriangle,
  Clock,
  PackageX,
  CheckSquare,
  CreditCard,
  ArrowUp,
  Banknote,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import Link from 'next/link';

const periods = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
];

interface SalesTrendItem {
  date: string;
  sales: number;
  profit: number;
  cash: number;
  credit: number;
}

interface TopProduct {
  productId: string;
  productName: string;
  _sum: { lineTotal: number; quantity: number; profit: number };
}

export default function DashboardPage() {
  const { formatMoney } = useCompanySettings();
  const { user } = useAuth();
  const [period, setPeriod] = useState('today');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrendItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [period]);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const [summaryRes, trendRes, topRes, recentRes] = await Promise.all([
        api.get(`/dashboard/summary?period=${period}`),
        api.get('/dashboard/sales-trend?days=30'),
        api.get(`/dashboard/top-products?period=${period}`),
        api.get('/dashboard/recent-invoices'),
      ]);
      setSummary(summaryRes.data.data);
      setSalesTrend(trendRes.data.data || []);
      setTopProducts(topRes.data.data || []);
      setRecentInvoices(recentRes.data.data || []);
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = summary
    ? [
        {
          label: 'Total Sales',
          value: formatMoney(summary.sales),
          icon: DollarSign,
          color: 'text-blue-500',
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          trend: '+12%',
        },
        {
          label: 'Profit',
          value: formatMoney(summary.profit),
          icon: TrendingUp,
          color: 'text-green-500',
          bg: 'bg-green-50 dark:bg-green-950/30',
          trend: '+8%',
        },
        {
          label: 'Cash Received',
          value: formatMoney(summary.receivedCash),
          icon: Banknote,
          color: 'text-emerald-500',
          bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        },
        {
          label: 'Pending Credit',
          value: formatMoney(summary.pendingCredit),
          icon: CreditCard,
          color: 'text-orange-500',
          bg: 'bg-orange-50 dark:bg-orange-950/30',
        },
        {
          label: 'Invoices',
          value: summary.totalInvoices.toLocaleString(),
          icon: ShoppingCart,
          color: 'text-purple-500',
          bg: 'bg-purple-50 dark:bg-purple-950/30',
        },
        {
          label: 'Customers',
          value: summary.totalCustomers.toLocaleString(),
          icon: Users,
          color: 'text-cyan-500',
          bg: 'bg-cyan-50 dark:bg-cyan-950/30',
        },
        {
          label: 'Low Stock',
          value: summary.lowStockCount.toString(),
          icon: AlertTriangle,
          color: 'text-yellow-500',
          bg: 'bg-yellow-50 dark:bg-yellow-950/30',
          link: '/inventory',
        },
        {
          label: 'Out of Stock',
          value: summary.outOfStockCount.toString(),
          icon: PackageX,
          color: 'text-red-500',
          bg: 'bg-red-50 dark:bg-red-950/30',
          link: '/inventory',
        },
        {
          label: 'Pending Approvals',
          value: summary.pendingApprovals.toString(),
          icon: CheckSquare,
          color: 'text-indigo-500',
          bg: 'bg-indigo-50 dark:bg-indigo-950/30',
          link: '/product-approval',
        },
        {
          label: 'Near Expiry',
          value: summary.nearExpiry.toString(),
          icon: Clock,
          color: 'text-rose-500',
          bg: 'bg-rose-50 dark:bg-rose-950/30',
        },
      ]
    : [];

  const statusColors: Record<string, string> = {
    PAID: 'text-green-600 dark:text-green-400',
    PENDING: 'text-yellow-600 dark:text-yellow-400',
    PARTIALLY_PAID: 'text-blue-600 dark:text-blue-400',
    CANCELLED: 'text-gray-400',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            {user?.firstName}! 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here&apos;s what&apos;s happening at your store
          </p>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                period === p.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            const content = (
              <div className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.bg}`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  {card.trend && (
                    <span className="text-xs text-green-500 font-medium flex items-center gap-0.5">
                      <ArrowUp className="w-3 h-3" />{card.trend}
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                </div>
              </div>
            );

            return card.link ? (
              <Link key={i} href={card.link}>{content}</Link>
            ) : (
              <div key={i}>{content}</div>
            );
          })}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales trend */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Sales Trend</h3>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesTrend}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" fill="url(#salesGrad)" strokeWidth={2} name="Sales" />
              <Area type="monotone" dataKey="profit" stroke="#22c55e" fill="url(#profitGrad)" strokeWidth={2} name="Profit" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top products */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Top Products</h3>
            <p className="text-xs text-muted-foreground">{period === 'today' ? 'Today' : `This ${period}`}</p>
          </div>
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <ShoppingCart className="w-8 h-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No sales yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="productName" type="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="_sum.lineTotal" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent invoices */}
      <div className="bg-card border border-border rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Recent Invoices</h3>
          <Link href="/invoices" className="text-sm text-primary hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Invoice</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Customer</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Method</th>
                <th className="text-right px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Amount</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground text-sm">
                    No invoices yet. <Link href="/billing" className="text-primary hover:underline">Start a sale</Link>
                  </td>
                </tr>
              ) : (
                recentInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/invoices/${inv.id}`} className="font-mono text-primary hover:underline text-sm">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-foreground">{inv.customer?.name || 'Walk-in'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${inv.paymentMethod === 'CASH' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                        {inv.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium">{formatMoney(inv.totalAmount)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium ${statusColors[inv.status] || ''}`}>{inv.status}</span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{new Date(inv.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
