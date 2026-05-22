'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, User, X, Pause, Play,
  DollarSign, CreditCard, Printer, Check, Barcode, AlertCircle,
} from 'lucide-react';
import api from '@/src/lib/api';
import { formatCurrency } from '@/src/lib/utils';
import type { Product, Customer, CartItem } from '@/src/types';

interface HeldInvoice {
  id: string;
  label?: string;
  cartData: { items: CartItem[]; customerId?: string };
  createdAt: string;
}

export default function BillingPage() {
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
  const [showCheckout, setShowCheckout] = useState(false);
  const [heldInvoices, setHeldInvoices] = useState<HeldInvoice[]>([]);
  const [showHeld, setShowHeld] = useState(false);
  const [settings] = useState({ currency: '$', taxEnabled: false, taxRate: 0 });

  useEffect(() => {
    searchRef.current?.focus();
    fetchHeldInvoices();
  }, []);

  const fetchHeldInvoices = async () => {
    try {
      const res = await api.get('/invoices/held');
      setHeldInvoices(res.data.data || []);
    } catch { /* ignore */ }
  };

  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/products/pos-search?q=${encodeURIComponent(query)}`);
      setSearchResults(res.data.data || []);
    } catch { setSearchResults([]); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchProducts(search), 200);
    return () => clearTimeout(timer);
  }, [search, searchProducts]);

  const searchCustomers = useCallback(async (query: string) => {
    if (!query.trim()) { setCustomerResults([]); return; }
    try {
      const res = await api.get(`/customers?search=${encodeURIComponent(query)}`);
      setCustomerResults(res.data.data || []);
    } catch { setCustomerResults([]); }
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
            ? { ...i, quantity: i.quantity + 1, lineTotal: (i.sellingPrice - i.discountAmount / i.quantity) * (i.quantity + 1) }
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
        return { ...item, discountPercent: percent, discountAmount: discountAmount * item.quantity, lineTotal: unitPrice * item.quantity };
      }),
    );
  };

  const subtotal = cart.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0);
  const totalDiscount = cart.reduce((sum, i) => sum + i.discountAmount, 0);
  const taxAmount = settings.taxEnabled ? (subtotal - totalDiscount) * (settings.taxRate / 100) : 0;
  const grandTotal = subtotal - totalDiscount + taxAmount;
  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const change = Math.max(0, cashReceivedNum - grandTotal);

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
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
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
      setShowCheckout(false);

      router.push(`/invoices/${invoice.id}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem-3rem)] gap-4">
      {/* Left: Product search */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Search bar */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name, SKU, or scan barcode... (F1)"
              className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
            <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="mt-2 border border-border rounded-lg overflow-hidden">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors text-left border-b border-border last:border-0"
                >
                  <div>
                    <div className="font-medium text-sm text-foreground">{product.name}</div>
                    <div className="text-xs text-muted-foreground">{product.sku} • {product.unit}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm text-foreground">{formatCurrency(Number(product.sellingPrice))}</div>
                    <div className={`text-xs ${product.currentStock <= 5 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                      Stock: {product.currentStock}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="bg-card border border-border rounded-xl flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Cart ({cart.length} items)</span>
            </div>
            <div className="flex items-center gap-2">
              {heldInvoices.length > 0 && (
                <button onClick={() => setShowHeld(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Play className="w-3 h-3" /> {heldInvoices.length} held
                </button>
              )}
              {cart.length > 0 && (
                <>
                  <button onClick={holdInvoice} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Pause className="w-3 h-3" /> Hold
                  </button>
                  <button onClick={() => { setCart([]); setSelectedCustomer(null); }} className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors">
                    <X className="w-3 h-3" /> Clear
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">Cart is empty</p>
                <p className="text-muted-foreground/60 text-xs mt-1">Search for products above to start a sale</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {cart.map((item) => (
                  <div key={item.productId} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku} • {formatCurrency(item.sellingPrice)}/{item.unit}</p>
                      {item.discountEnabled && (
                        <div className="flex items-center gap-1 mt-1">
                          <input
                            type="number"
                            min={0}
                            max={item.maxDiscountPercent}
                            value={item.discountPercent}
                            onChange={(e) => applyDiscount(item.productId, parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-0.5 text-xs border border-input rounded bg-background text-foreground"
                            placeholder="0"
                          />
                          <span className="text-xs text-muted-foreground">% disc (max {item.maxDiscountPercent}%)</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQuantity(item.productId, -1)} className="w-6 h-6 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, 1)} className="w-6 h-6 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-right min-w-[70px]">
                      <p className="font-semibold text-sm">{formatCurrency(item.lineTotal)}</p>
                      {item.discountAmount > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400">-{formatCurrency(item.discountAmount)}</p>
                      )}
                    </div>
                    <button onClick={() => removeItem(item.productId)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Checkout panel */}
      <div className="w-80 flex flex-col gap-4">
        {/* Customer */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-sm">Customer</span>
            {selectedCustomer && (
              <button onClick={() => setSelectedCustomer(null)} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {selectedCustomer ? (
            <div className="flex items-start gap-3 p-2 bg-primary/5 rounded-lg">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{selectedCustomer.name}</p>
                <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
                {selectedCustomer.creditBalance > 0 && (
                  <p className="text-xs text-orange-500">Credit due: {formatCurrency(selectedCustomer.creditBalance)}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerSearch(true); }}
                onFocus={() => setShowCustomerSearch(true)}
                placeholder="Search customer..."
                className="w-full pl-8 py-2 text-sm border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {showCustomerSearch && customerResults.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-popover border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                  {customerResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCustomer(c); setShowCustomerSearch(false); setCustomerSearch(''); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors border-b border-border last:border-0"
                    >
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.phone}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="bg-card border border-border rounded-xl p-4 flex-1">
          <h3 className="font-semibold text-sm mb-4">Order Summary</h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount</span>
                <span>-{formatCurrency(totalDiscount)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax ({settings.taxRate}%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Payment Method</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all ${paymentMethod === 'CASH' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:bg-accent'}`}
              >
                <DollarSign className="w-4 h-4" /> Cash
              </button>
              <button
                onClick={() => setPaymentMethod('CREDIT')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all ${paymentMethod === 'CREDIT' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:bg-accent'}`}
              >
                <CreditCard className="w-4 h-4" /> Credit
              </button>
            </div>
          </div>

          {paymentMethod === 'CASH' && (
            <div className="mt-3">
              <label className="text-xs font-medium text-muted-foreground">Cash Received</label>
              <input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder={grandTotal.toFixed(2)}
                className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {cashReceivedNum >= grandTotal && cashReceivedNum > 0 && (
                <div className="mt-2 flex justify-between text-sm font-medium text-green-600 dark:text-green-400">
                  <span>Change</span>
                  <span>{formatCurrency(change)}</span>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'CREDIT' && !selectedCustomer && (
            <div className="mt-3 flex items-center gap-2 text-xs text-orange-500 bg-orange-50 dark:bg-orange-950/30 rounded-lg p-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              Select a customer above to use credit
            </div>
          )}

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full mt-3 px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={processPayment}
            disabled={isProcessing || cart.length === 0}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                {paymentMethod === 'CASH' ? `Charge ${formatCurrency(grandTotal)}` : 'Create Credit Invoice'}
              </>
            )}
          </button>
          <button
            onClick={() => setShowCheckout(!showCheckout)}
            className="w-full py-2 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/80 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Printer className="w-4 h-4" /> Print Preview
          </button>
        </div>
      </div>

      {/* Held invoices modal */}
      {showHeld && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-semibold">Held Invoices ({heldInvoices.length})</h3>
              <button onClick={() => setShowHeld(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {heldInvoices.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{h.label || 'Unnamed hold'}</p>
                    <p className="text-xs text-muted-foreground">{h.cartData?.items?.length || 0} items • {new Date(h.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <button onClick={() => resumeHeld(h.id)} className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-lg font-medium hover:bg-primary/90 transition-all">
                    Resume
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
