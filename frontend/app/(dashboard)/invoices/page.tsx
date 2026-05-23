'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Search, FileText, Plus, ExternalLink } from 'lucide-react';
import api from '@/src/lib/api';
import { getStatusColor } from '@/src/lib/utils';
import { useCompanySettings } from '@/src/providers/company-settings-provider';
import type { Invoice } from '@/src/types';

export default function InvoicesPage() {
  const { formatMoney } = useCompanySettings();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (methodFilter) params.set('paymentMethod', methodFilter);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await api.get(`/invoices?${params.toString()}`);
      setInvoices(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, methodFilter, page]);

  useEffect(() => {
    const t = setTimeout(fetchInvoices, 300);
    return () => clearTimeout(t);
  }, [fetchInvoices]);

  const totalSales = invoices.reduce((s, i) => s + Number(i.totalAmount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} invoices • {formatMoney(totalSales)} shown</p>
        </div>
        <Link href="/billing" className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all">
          <Plus className="w-4 h-4" /> New Invoice
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search invoice number or customer..." className="w-full pl-9 pr-4 py-2 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-input bg-background rounded-lg text-sm">
          <option value="">All Status</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="PARTIALLY_PAID">Partial</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-input bg-background rounded-lg text-sm">
          <option value="">All Methods</option>
          <option value="CASH">Cash</option>
          <option value="CREDIT">Credit</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Invoice #</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Method</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Paid</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Balance</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/invoices/${inv.id}`} className="font-mono text-primary hover:underline">{inv.invoiceNumber}</Link>
                    </td>
                    <td className="px-4 py-3 text-foreground">{inv.customer?.name || 'Walk-in'}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(inv.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${inv.paymentMethod === 'CASH' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                        {inv.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatMoney(Number(inv.totalAmount))}</td>
                    <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">{formatMoney(Number(inv.paidAmount))}</td>
                    <td className="px-4 py-3 text-right text-orange-500">{Number(inv.balanceAmount) > 0 ? formatMoney(Number(inv.balanceAmount)) : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inv.status)}`}>{inv.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/invoices/${inv.id}`} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 border border-border rounded-lg text-sm disabled:opacity-50 hover:bg-accent transition-all">Previous</button>
              <button onClick={() => setPage(page + 1)} disabled={page * 20 >= total} className="px-3 py-1.5 border border-border rounded-lg text-sm disabled:opacity-50 hover:bg-accent transition-all">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
