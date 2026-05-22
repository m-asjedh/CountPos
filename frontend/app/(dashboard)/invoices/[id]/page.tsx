'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Printer, CreditCard, CheckCircle, X } from 'lucide-react';
import api from '@/src/lib/api';
import { formatCurrency, getStatusColor } from '@/src/lib/utils';
import type { Invoice } from '@/src/types';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/invoices/${id}`);
        setInvoice(res.data.data);
      } catch {
        toast.error('Invoice not found');
        router.push('/invoices');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const handlePayCredit = async () => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { toast.error('Enter valid amount'); return; }
    setIsPaying(true);
    try {
      await api.post(`/invoices/${id}/pay-credit`, { amount });
      toast.success('Payment recorded');
      setShowPayModal(false);
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading...</div>;
  if (!invoice) return null;

  const profitMargin = invoice.totalAmount > 0 ? ((invoice.profit / invoice.totalAmount) * 100).toFixed(1) : '0';

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-mono">{invoice.invoiceNumber}</h1>
          <p className="text-sm text-muted-foreground">{new Date(invoice.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status !== 'PAID' && invoice.paymentMethod === 'CREDIT' && (
            <button onClick={() => setShowPayModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all">
              <CreditCard className="w-4 h-4" /> Record Payment
            </button>
          )}
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-all">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Invoice card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden print:shadow-none print:border-none">
        {/* Status bar */}
        <div className={`px-6 py-3 flex items-center justify-between ${invoice.status === 'PAID' ? 'bg-green-50 dark:bg-green-950/30' : invoice.status === 'CANCELLED' ? 'bg-muted' : 'bg-orange-50 dark:bg-orange-950/30'}`}>
          <div className="flex items-center gap-2">
            {invoice.status === 'PAID' ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : invoice.status === 'CANCELLED' ? (
              <X className="w-4 h-4 text-muted-foreground" />
            ) : (
              <CreditCard className="w-4 h-4 text-orange-500" />
            )}
            <span className={`text-sm font-semibold ${getStatusColor(invoice.status)} px-0 py-0 bg-transparent`}>
              {invoice.status}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${invoice.paymentMethod === 'CASH' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
              {invoice.paymentMethod}
            </span>
            <span className="text-muted-foreground">by {invoice.createdBy?.firstName} {invoice.createdBy?.lastName}</span>
          </div>
        </div>

        <div className="p-6">
          {/* Customer info */}
          {invoice.customer && (
            <div className="flex items-start justify-between mb-6 pb-6 border-b border-border">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Customer</p>
                <p className="font-semibold text-foreground">{invoice.customer.name}</p>
                {invoice.customer.phone && <p className="text-sm text-muted-foreground">{invoice.customer.phone}</p>}
              </div>
            </div>
          )}

          {/* Line items */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Product</th>
                <th className="text-center py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Qty</th>
                <th className="text-right py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Unit Price</th>
                <th className="text-right py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Discount</th>
                <th className="text-right py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoice.items?.map((item) => (
                <tr key={item.id}>
                  <td className="py-3">
                    <p className="font-medium text-foreground">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">{item.sku} • {item.unit}</p>
                  </td>
                  <td className="py-3 text-center text-muted-foreground">{item.quantity}</td>
                  <td className="py-3 text-right text-muted-foreground">{formatCurrency(Number(item.sellingPrice))}</td>
                  <td className="py-3 text-right text-green-600 dark:text-green-400">
                    {Number(item.discountAmount) > 0 ? `-${formatCurrency(Number(item.discountAmount))}` : '-'}
                  </td>
                  <td className="py-3 text-right font-medium">{formatCurrency(Number(item.lineTotal))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t border-border pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(Number(invoice.subtotal))}</span>
            </div>
            {Number(invoice.discountAmount) > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount</span>
                <span>-{formatCurrency(Number(invoice.discountAmount))}</span>
              </div>
            )}
            {Number(invoice.taxAmount) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>{formatCurrency(Number(invoice.taxAmount))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-border pt-2">
              <span>Total</span>
              <span>{formatCurrency(Number(invoice.totalAmount))}</span>
            </div>
            {invoice.paymentMethod === 'CASH' && Number(invoice.cashReceived) > 0 && (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>Cash Received</span>
                  <span>{formatCurrency(Number(invoice.cashReceived))}</span>
                </div>
                <div className="flex justify-between text-blue-600 dark:text-blue-400 font-medium">
                  <span>Change</span>
                  <span>{formatCurrency(Number(invoice.changeGiven))}</span>
                </div>
              </>
            )}
            {invoice.paymentMethod === 'CREDIT' && (
              <>
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Paid</span>
                  <span>{formatCurrency(Number(invoice.paidAmount))}</span>
                </div>
                {Number(invoice.balanceAmount) > 0 && (
                  <div className="flex justify-between text-orange-500 font-medium">
                    <span>Balance Due</span>
                    <span>{formatCurrency(Number(invoice.balanceAmount))}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profit info (hidden from print) */}
      <div className="bg-muted/30 border border-border rounded-xl p-4 print:hidden">
        <p className="text-sm font-medium text-muted-foreground">Profit: <span className="text-green-600 dark:text-green-400 font-semibold">{formatCurrency(Number(invoice.profit))}</span> ({profitMargin}% margin)</p>
      </div>

      {/* Pay credit modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl p-6">
            <h3 className="font-semibold mb-2">Record Payment</h3>
            <p className="text-sm text-muted-foreground mb-4">Balance due: {formatCurrency(Number(invoice.balanceAmount))}</p>
            <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Amount" max={Number(invoice.balanceAmount)} className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowPayModal(false)} className="flex-1 py-2.5 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm hover:bg-secondary/80 transition-all">Cancel</button>
              <button onClick={handlePayCredit} disabled={isPaying} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-all">
                {isPaying ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
