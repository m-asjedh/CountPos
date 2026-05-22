'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { BarChart3, Download, TrendingUp, DollarSign, Users, ShoppingCart, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '@/src/lib/api';
import { formatCurrency } from '@/src/lib/utils';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

interface SalesReport {
  totalSales: number;
  totalProfit: number;
  totalReceived: number;
  totalPending: number;
  totalDiscounts: number;
  totalInvoices: number;
  avgOrderValue: number;
  cashSales: { amount: number; count: number };
  creditSales: { amount: number; count: number };
}

interface StaffPerformance {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  totalSales: number;
  totalProfit: number;
  invoiceCount: number;
}

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const params = `?startDate=${startDate}&endDate=${endDate}`;
      const [salesRes, staffRes] = await Promise.all([
        api.get(`/reports/sales${params}`),
        api.get(`/reports/staff-performance${params}`),
      ]);
      setSalesReport(salesRes.data.data);
      setStaffPerformance(staffRes.data.data || []);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const exportCSV = async () => {
    try {
      const response = await api.get(`/reports/export/sales?startDate=${startDate}&endDate=${endDate}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-report-${startDate}-${endDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const paymentData = salesReport ? [
    { name: 'Cash', value: salesReport.cashSales.amount, count: salesReport.cashSales.count },
    { name: 'Credit', value: salesReport.creditSales.amount, count: salesReport.creditSales.count },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Analytics and performance insights</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-accent transition-all">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Date filter */}
      <div className="flex flex-wrap items-end gap-3 bg-card border border-border rounded-xl p-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <button onClick={fetchReports} disabled={isLoading} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all">
          {isLoading ? 'Loading...' : 'Apply Filter'}
        </button>
      </div>

      {salesReport && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Sales', value: formatCurrency(salesReport.totalSales), icon: DollarSign, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' },
              { label: 'Total Profit', value: formatCurrency(salesReport.totalProfit), icon: TrendingUp, color: 'text-green-500 bg-green-50 dark:bg-green-950/30' },
              { label: 'Total Invoices', value: salesReport.totalInvoices.toString(), icon: ShoppingCart, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30' },
              { label: 'Avg Order Value', value: formatCurrency(salesReport.avgOrderValue), icon: Award, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30' },
            ].map((card, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${card.color.split(' ').slice(1).join(' ')}`}>
                  <card.icon className={`w-4 h-4 ${card.color.split(' ')[0]}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cash vs Credit */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold mb-4">Cash vs Credit Sales</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={5}>
                    {paymentData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v) => formatCurrency(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                {paymentData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-muted-foreground">{d.name}: {formatCurrency(d.value)} ({d.count} invoices)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff performance */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold mb-4">Staff Performance</h3>
              {staffPerformance.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <Users className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No sales data</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={staffPerformance}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey={(d) => `${d.firstName} ${d.lastName}`} tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v) => formatCurrency(Number(v))} />
                    <Bar dataKey="totalSales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Sales" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Additional stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-sm text-muted-foreground">Cash Received</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(salesReport.totalReceived)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-sm text-muted-foreground">Pending Credit</p>
              <p className="text-2xl font-bold text-orange-500 mt-1">{formatCurrency(salesReport.totalPending)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-sm text-muted-foreground">Total Discounts Given</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{formatCurrency(salesReport.totalDiscounts)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
