'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  X,
  Pause,
  Play,
  DollarSign,
  CreditCard,
  Printer,
  Check,
  Barcode,
  AlertCircle,
  Package,
  Sparkles,
} from 'lucide-react';
import api from '@/src/lib/api';
import { useCompanySettings } from '@/src/providers/company-settings-provider';
import type { Product, Customer, CartItem } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface HeldInvoice {
  id: string;
  label?: string;
  cartData: { items: CartItem[]; customerId?: string };
  createdAt: string;
}

export default function BillingPage() {
  const { formatMoney, settings } = useCompanySettings();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT'>('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [heldInvoices, setHeldInvoices] = useState<HeldInvoice[]>([]);
  const [showHeld, setShowHeld] = useState(false);
  const taxEnabled = settings?.taxEnabled ?? false;
  const taxRate = Number(settings?.taxRate ?? 0);

  useEffect(() => {
    searchRef.current?.focus();
    fetchHeldInvoices();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const fetchHeldInvoices = async () => {
    try {
      const res = await api.get('/invoices/held');
      setHeldInvoices(res.data.data || []);
    } catch {
      /* ignore */
    }
  };

  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/products/pos-search?q=${encodeURIComponent(query)}`);
      setSearchResults(res.data.data || []);
    } catch {
      setSearchResults([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchProducts(search), 200);
    return () => clearTimeout(timer);
  }, [search, searchProducts]);

  const searchCustomers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setCustomerResults([]);
      return;
    }
    try {
      const res = await api.get(`/customers?search=${encodeURIComponent(query)}`);
      setCustomerResults(res.data.data || []);
    } catch {
      setCustomerResults([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchCustomers(customerSearch), 200);
    return () => clearTimeout(timer);
  }, [customerSearch, searchCustomers]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          toast.error(`Only ${product.currentStock} units available`);
          return prev;
        }
        return prev.map((i) =>
          i.productId === product.id
            ? {
                ...i,
                quantity: i.quantity + 1,
                lineTotal:
                  (i.sellingPrice - i.discountAmount / i.quantity) * (i.quantity + 1),
              }
            : i,
        );
      }
      if (product.currentStock === 0) {
        toast.error('Product is out of stock');
        return prev;
      }
      const item: CartItem = {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        sellingPrice: Number(product.sellingPrice),
        costPrice: Number(product.costPrice),
        quantity: 1,
        discountPercent: 0,
        discountAmount: 0,
        lineTotal: Number(product.sellingPrice),
        maxDiscountPercent: Number(product.maxDiscountPercent),
        discountEnabled: product.discountEnabled,
      };
      return [...prev, item];
    });
    setSearch('');
    setSearchResults([]);
    searchRef.current?.focus();
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const newQty = Math.max(0, item.quantity + delta);
          if (newQty === 0) return null;
          const unitPrice = item.sellingPrice * (1 - item.discountPercent / 100);
          return { ...item, quantity: newQty, lineTotal: unitPrice * newQty };
        })
        .filter(Boolean) as CartItem[],
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const applyDiscount = (productId: string, percent: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        if (!item.discountEnabled) {
          toast.error('Discount is not allowed for this product');
          return item;
        }
        if (percent > item.maxDiscountPercent) {
          toast.error(`Maximum discount for this product is ${item.maxDiscountPercent}%`);
          return item;
        }
        const discountAmount = (item.sellingPrice * percent) / 100;
        const unitPrice = item.sellingPrice - discountAmount;
        return {
          ...item,
          discountPercent: percent,
          discountAmount: discountAmount * item.quantity,
          lineTotal: unitPrice * item.quantity,
        };
      }),
    );
  };

  const subtotal = cart.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0);
  const totalDiscount = cart.reduce((sum, i) => sum + i.discountAmount, 0);
  const taxAmount = taxEnabled ? (subtotal - totalDiscount) * (taxRate / 100) : 0;
  const grandTotal = subtotal - totalDiscount + taxAmount;
  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const change = Math.max(0, cashReceivedNum - grandTotal);
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  const holdInvoice = async () => {
    if (cart.length === 0) return;
    const label = prompt('Label for this hold (optional):') ?? undefined;
    try {
      await api.post('/invoices/hold', {
        cartData: { items: cart, customerId: selectedCustomer?.id },
        label,
      });
      toast.success('Invoice held');
      setCart([]);
      setSelectedCustomer(null);
      fetchHeldInvoices();
    } catch {
      toast.error('Failed to hold invoice');
    }
  };

  const resumeHeld = async (heldId: string) => {
    try {
      const res = await api.post(`/invoices/held/${heldId}/resume`);
      const held = res.data.data;
      if (held.cartData?.items) {
        setCart(held.cartData.items);
      }
      setShowHeld(false);
      fetchHeldInvoices();
      toast.success('Invoice resumed');
    } catch {
      toast.error('Failed to resume invoice');
    }
  };

  const processPayment = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (paymentMethod === 'CREDIT' && !selectedCustomer) {
      toast.error('Please select a customer for credit sales');
      return;
    }
    if (paymentMethod === 'CASH' && cashReceivedNum < grandTotal) {
      toast.error('Cash received is less than total amount');
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        customerId: selectedCustomer?.id,
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          discountPercent: i.discountPercent,
        })),
        paymentMethod,
        cashReceived: paymentMethod === 'CASH' ? cashReceivedNum : undefined,
        notes,
      };

      const res = await api.post('/invoices', payload);
      const invoice = res.data.data;

      toast.success(`Invoice ${invoice.invoiceNumber} created!`);
      setCart([]);
      setSelectedCustomer(null);
      setCashReceived('');
      setNotes('');

      router.push(`/invoices/${invoice.id}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const setExactCash = () => setCashReceived(grandTotal.toFixed(2));

  return (
    <div className="-m-4 flex h-[calc(100vh-72px)] gap-0 overflow-hidden md:-m-6">
      {/* Main: search + cart */}
      <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden p-4 md:p-5">
        {/* Search */}
        <div className="shrink-0 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Barcode className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Scan or search products</p>
                <p className="text-xs text-muted-foreground">Press F1 to focus search</p>
              </div>
            </div>
            {heldInvoices.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHeld(true)}
                className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
              >
                <Play className="h-3.5 w-3.5 text-primary" />
                {heldInvoices.length} on hold
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Product name, SKU, or barcode..."
              className="w-full rounded-xl border border-border bg-muted/30 py-3.5 pl-12 pr-12 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <kbd className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground sm:inline">
              F1
            </kbd>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-3 grid max-h-48 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addToCart(product)}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.sku} · Stock {product.currentStock}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-primary">
                    {formatMoney(Number(product.sellingPrice))}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <ShoppingCart className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Cart</h2>
                <p className="text-xs text-muted-foreground">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
            {cart.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={holdInvoice}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Pause className="mr-1 inline h-3.5 w-3.5" />
                  Hold
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCart([]);
                    setSelectedCustomer(null);
                  }}
                  className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {cart.length === 0 ? (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-base font-medium text-foreground">Cart is empty</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Search for products above or scan a barcode to start a sale
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 rounded-xl border border-border bg-background/80 p-3"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-sm text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.sku} · {formatMoney(item.sellingPrice)}/{item.unit}
                      </p>
                      {item.discountEnabled && (
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={item.maxDiscountPercent}
                            value={item.discountPercent}
                            onChange={(e) =>
                              applyDiscount(item.productId, parseFloat(e.target.value) || 0)
                            }
                            className="w-14 rounded-md border border-border bg-card px-2 py-0.5 text-xs text-foreground"
                            placeholder="0"
                          />
                          <span className="text-[10px] text-muted-foreground">
                            % off (max {item.maxDiscountPercent}%)
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="min-w-[72px] text-right">
                      <p className="font-bold text-foreground">{formatMoney(item.lineTotal)}</p>
                      {item.discountAmount > 0 && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          -{formatMoney(item.discountAmount)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout sidebar */}
      <aside className="flex w-full max-w-[380px] shrink-0 flex-col border-l border-border bg-card shadow-xl lg:max-w-[400px]">
        <div className="border-b border-border bg-linear-to-r from-primary/10 via-primary/5 to-transparent px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-foreground">Checkout</h2>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
          {/* Customer */}
          <div className="mb-5">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Customer
            </label>
            {selectedCustomer ? (
              <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{selectedCustomer.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
                  {selectedCustomer.creditBalance > 0 && (
                    <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                      Credit due: {formatMoney(selectedCustomer.creditBalance)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-background hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerSearch(true);
                  }}
                  onFocus={() => setShowCustomerSearch(true)}
                  placeholder="Walk-in or search customer..."
                  className="w-full rounded-xl border border-border bg-muted/30 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {showCustomerSearch && customerResults.length > 0 && (
                  <div className="absolute top-full z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
                    {customerResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setShowCustomerSearch(false);
                          setCustomerSearch('');
                        }}
                        className="w-full border-b border-border px-3 py-2.5 text-left text-sm last:border-0 hover:bg-accent"
                      >
                        <p className="font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="mb-5 space-y-2 rounded-xl border border-border bg-muted/20 p-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal ({itemCount} items)</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount</span>
                <span>-{formatMoney(totalDiscount)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax ({taxRate}%)</span>
                <span>{formatMoney(taxAmount)}</span>
              </div>
            )}
          </div>

          <div className="mb-6 rounded-2xl bg-linear-to-br from-indigo-500 via-indigo-600 to-violet-600 p-5 text-white">
            <p className="text-sm font-medium text-indigo-100">Amount due</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{formatMoney(grandTotal)}</p>
          </div>

          {/* Payment */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payment method
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all',
                  paymentMethod === 'CASH'
                    ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent',
                )}
              >
                <DollarSign className="h-4 w-4" /> Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('CREDIT')}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all',
                  paymentMethod === 'CREDIT'
                    ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent',
                )}
              >
                <CreditCard className="h-4 w-4" /> Credit
              </button>
            </div>
          </div>

          {paymentMethod === 'CASH' && (
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cash received
                </label>
                <button
                  type="button"
                  onClick={setExactCash}
                  disabled={cart.length === 0}
                  className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                >
                  Exact amount
                </button>
              </div>
              <input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-lg font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {cashReceivedNum >= grandTotal && cashReceivedNum > 0 && (
                <div className="mt-2 flex justify-between rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  <span>Change</span>
                  <span>{formatMoney(change)}</span>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'CREDIT' && !selectedCustomer && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Select a customer to use credit billing
            </div>
          )}

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="mb-4 w-full resize-none rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Actions — pinned bottom */}
        <div className="shrink-0 space-y-2 border-t border-border bg-card p-5">
          <button
            type="button"
            onClick={processPayment}
            disabled={isProcessing || cart.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-indigo-600 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:from-indigo-600 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Check className="h-5 w-5" />
                {paymentMethod === 'CASH'
                  ? `Charge ${formatMoney(grandTotal)}`
                  : 'Create credit invoice'}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push('/invoices')}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Printer className="h-4 w-4" />
            View recent invoices
          </button>
        </div>
      </aside>

      {/* Held modal */}
      {showHeld && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-semibold text-foreground">
                Held invoices ({heldInvoices.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowHeld(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto p-4">
              {heldInvoices.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-xl border border-border p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{h.label || 'Unnamed hold'}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.cartData?.items?.length || 0} items ·{' '}
                      {new Date(h.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => resumeHeld(h.id)}
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Resume
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCustomerSearch && customerResults.length > 0 && (
        <div
          className="fixed inset-0 z-10 lg:hidden"
          onClick={() => setShowCustomerSearch(false)}
          aria-hidden
        />
      )}
    </div>
  );
}
