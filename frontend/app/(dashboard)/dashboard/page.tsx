'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/src/providers/auth-provider';
import { useCompanySettings } from '@/src/providers/company-settings-provider';
import type { DashboardSummary, Invoice } from '@/src/types';
import api from '@/src/lib/api';
import Link from 'next/link';
import {
  ChevronDown,
  DollarSign,
  FolderOpen,
  MoreHorizontal,
  Package,
  PiggyBank,
  Search,
  TrendingUp,
  Upload,
  Wallet,
  AlertTriangle,
  CheckSquare,
  PackageX,
} from 'lucide-react';

const periods = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface SalesTrendItem {
  date: string;
  sales: number;
  profit: number;
}

interface TopProduct {
  productId: string;
  productName: string;
  _sum: { lineTotal: number; quantity: number; profit: number };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function aggregateByMonth(trend: SalesTrendItem[]) {
  const year = new Date().getFullYear();
  const monthly = Array.from({ length: 12 }, (_, i) => ({
    month: MONTHS[i],
    monthIndex: i,
    sales: 0,
    profit: 0,
  }));

  for (const row of trend) {
    const d = new Date(row.date);
    if (d.getFullYear() !== year) continue;
    const m = d.getMonth();
    monthly[m].sales += row.sales;
    monthly[m].profit += row.profit;
  }

  const maxSales = Math.max(...monthly.map((m) => m.sales), 1);
  return monthly.map((m) => ({
    ...m,
    heightPct: Math.round((m.sales / maxSales) * 100) || 4,
  }));
}

const statusBadge: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-rose-50 text-rose-600',
  PARTIALLY_PAID: 'bg-amber-50 text-amber-700',
  DRAFT: 'bg-slate-100 text-slate-600',
  CANCELLED: 'bg-slate-100 text-slate-400',
};

export default function DashboardPage() {
  const { formatMoney } = useCompanySettings();
  const { user } = useAuth();
  const [period, setPeriod] = useState('month');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [yearTrend, setYearTrend] = useState<SalesTrendItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodOpen, setPeriodOpen] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, [period]);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const [summaryRes, trendRes, topRes, recentRes] = await Promise.all([
        api.get(`/dashboard/summary?period=${period}`),
        api.get('/dashboard/sales-trend?days=365'),
        api.get(`/dashboard/top-products?period=${period}`),
        api.get('/dashboard/recent-invoices'),
      ]);
      setSummary(summaryRes.data.data);
      setYearTrend(trendRes.data.data || []);
      setTopProducts(topRes.data.data || []);
      setRecentInvoices(recentRes.data.data || []);
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  const monthlyBars = useMemo(() => aggregateByMonth(yearTrend), [yearTrend]);
  const peakMonth = monthlyBars.reduce(
    (best, m) => (m.sales > best.sales ? m : best),
    monthlyBars[0],
  );
  const currentMonthIndex = new Date().getMonth();

  const topProductMax = Math.max(
    ...topProducts.map((p) => Number(p._sum.lineTotal) || 0),
    1,
  );

  const periodLabel = periods.find((p) => p.value === period)?.label ?? 'This Month';

  const heroCards = summary
    ? [
        {
          label: 'Total sales',
          value: formatMoney(summary.sales),
          sub: periodLabel,
          icon: Wallet,
          iconBg: 'bg-indigo-100 text-indigo-600',
        },
        {
          label: 'Profit',
          value: formatMoney(summary.profit),
          sub: 'After cost',
          icon: DollarSign,
          iconBg: 'bg-emerald-100 text-emerald-600',
        },
        {
          label: 'Cash received',
          value: formatMoney(summary.receivedCash),
          sub: 'Collected',
          icon: Wallet,
          iconBg: 'bg-rose-100 text-rose-600',
        },
        {
          label: 'Credit due',
          value: formatMoney(summary.pendingCredit),
          sub: 'Outstanding',
          icon: PiggyBank,
          iconBg: 'bg-sky-100 text-sky-600',
        },
      ]
    : [];

  const alertCards = summary
    ? [
        {
          label: 'Low stock',
          value: summary.lowStockCount,
          href: '/inventory',
          icon: AlertTriangle,
        },
        {
          label: 'Out of stock',
          value: summary.outOfStockCount,
          href: '/inventory',
          icon: PackageX,
        },
        {
          label: 'Pending approvals',
          value: summary.pendingApprovals,
          href: '/product-approval',
          icon: CheckSquare,
        },
      ]
    : [];

  const chartTotal = monthlyBars.reduce((s, m) => s + m.sales, 0);
  const topSalesTotal = topProducts.reduce(
    (s, p) => s + Number(p._sum.quantity || 0),
    0,
  );

  return (
    <div className="space-y-4">
      {/* Purple hero + 4 stats */}
      <div className="rounded-2xl bg-linear-to-br from-indigo-500 via-indigo-600 to-violet-600 p-5 md:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white md:text-2xl">
              {getGreeting()}, {user?.firstName} ✨
            </h2>
            <p className="mt-1 max-w-lg text-sm text-indigo-100">
              A clear snapshot of your sales, profit, and recent invoices for{' '}
              {user?.company?.name || 'your store'}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setPeriodOpen(!periodOpen)}
                className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm"
              >
                {periodLabel}
                <ChevronDown className="h-4 w-4" />
              </button>
              {periodOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setPeriodOpen(false)}
                    aria-hidden
                  />
                  <div className="absolute right-0 z-20 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg">
                    {periods.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => {
                          setPeriod(p.value);
                          setPeriodOpen(false);
                        }}
                        className={`block w-full px-4 py-2 text-left text-sm hover:bg-accent ${
                          period === p.value ? 'font-semibold text-primary' : 'text-popover-foreground'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <Link
              href="/reports"
              className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
            >
              <Upload className="h-4 w-4" />
              Export
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-white/20" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {heroCards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl bg-card/95 p-4 shadow-sm backdrop-blur-sm dark:bg-card"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className={`rounded-lg p-2 ${card.iconBg}`}>
                    <card.icon className="h-4 w-4" />
                  </div>
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground/50" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                <p className="text-xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.sub}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inventory alerts */}
      {!isLoading && summary && (
        <div className="flex flex-wrap gap-3">
          {alertCards.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="rounded-lg bg-muted p-2">
                <a.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{a.label}</p>
                <p className="text-lg font-bold text-foreground">{a.value}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">Transactions overview</p>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? '—' : formatMoney(chartTotal)}
              </p>
            </div>
            <span className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
              This Year <ChevronDown className="h-3 w-3" />
            </span>
          </div>
          <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
              Total sales
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-slate-200" />
              Profit
            </span>
          </div>
          {isLoading ? (
            <div className="h-40 animate-pulse rounded-lg bg-muted" />
          ) : (
            <div className="flex h-44 items-end justify-between gap-1 pt-2">
              {monthlyBars.map((m) => {
                const isHighlight = m.monthIndex === currentMonthIndex;
                const isPeak = m.month === peakMonth.month && peakMonth.sales > 0;
                return (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                    {isPeak && (
                      <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {formatMoney(m.sales)}
                      </span>
                    )}
                    <div
                      className={`w-full max-w-5 rounded-t-sm ${
                        isHighlight || isPeak
                          ? 'bg-indigo-500'
                          : 'bg-[repeating-linear-gradient(135deg,#e2e8f0_0,#e2e8f0_2px,#f8fafc_2px,#f8fafc_4px)]'
                      }`}
                      style={{ height: `${m.heightPct}%`, minHeight: 4 }}
                      title={`${m.month}: ${formatMoney(m.sales)}`}
                    />
                    <span className="text-[10px] text-muted-foreground">{m.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Sales overview</p>
          </div>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {isLoading ? '—' : topSalesTotal.toLocaleString()}
            </span>
            {topProducts.length > 0 && (
              <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                <TrendingUp className="h-3.5 w-3.5" />
                Top sellers
              </span>
            )}
          </div>
          <p className="mb-3 text-xs text-muted-foreground">By revenue ({periodLabel.toLowerCase()})</p>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-6 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Package className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No sales in this period</p>
              <Link href="/billing" className="mt-2 text-sm font-medium text-primary hover:underline">
                Start a sale →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.slice(0, 5).map((p) => {
                const pct = Math.round(
                  (Number(p._sum.lineTotal) / topProductMax) * 100,
                );
                return (
                  <div key={p.productId}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="truncate font-medium text-foreground pr-2">
                        {p.productName}
                      </span>
                      <span className="shrink-0 text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-indigo-400 to-indigo-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders / invoices */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h3 className="font-semibold text-foreground">Recent orders</h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Search invoices...</span>
            </div>
            <Link
              href="/invoices"
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
            >
              View all <ChevronDown className="h-3 w-3 -rotate-90" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="w-10 px-5 py-3">
                  <input type="checkbox" readOnly className="rounded border-slate-300" />
                </th>
                <th className="px-3 py-3">Product info</th>
                <th className="px-3 py-3">Order Id</th>
                <th className="px-3 py-3">Date</th>
                <th className="hidden px-3 py-3 sm:table-cell">Customer</th>
                <th className="hidden px-3 py-3 md:table-cell">Payment</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Items</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                    No invoices yet.{' '}
                    <Link href="/billing" className="font-medium text-primary hover:underline">
                      Start a sale
                    </Link>
                  </td>
                </tr>
              ) : (
                recentInvoices.map((inv) => {
                  const lineItem = inv.items?.[0];
                  const itemCount = inv._count?.items ?? inv.items?.length ?? 0;
                  return (
                    <tr
                      key={inv.id}
                      className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/50"
                    >
                      <td className="px-5 py-3">
                        <input type="checkbox" readOnly className="rounded border-slate-300" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                            <Package className="h-5 w-5 text-indigo-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {lineItem?.productName || 'Invoice sale'}
                            </p>
                            {itemCount > 1 && (
                              <p className="text-xs text-muted-foreground">+{itemCount - 1} more</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="font-mono text-primary hover:underline"
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {new Date(inv.createdAt).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="hidden px-3 py-3 text-foreground sm:table-cell">
                        {inv.customer?.name || 'Walk-in'}
                      </td>
                      <td className="hidden px-3 py-3 md:table-cell">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            inv.paymentMethod === 'CASH'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {inv.paymentMethod}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            statusBadge[inv.status] || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {inv.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-foreground">
                        {formatMoney(inv.totalAmount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
