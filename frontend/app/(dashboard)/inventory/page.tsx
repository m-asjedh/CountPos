'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, PackageX, Clock, X, Plus } from 'lucide-react';
import api from '@/src/lib/api';
import type { Product } from '@/src/types';

interface Alert {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  lowStockThreshold?: number;
  expiryDate?: string;
}

export default function InventoryPage() {
  const [alerts, setAlerts] = useState<{ lowStock: Alert[]; outOfStock: Alert[]; nearExpiry: Alert[]; expired: Alert[] }>({ lowStock: [], outOfStock: [], nearExpiry: [], expired: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<Alert | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/inventory/alerts');
      setAlerts(res.data.data);
    } catch {
      toast.error('Failed to load inventory alerts');
    } finally {
      setIsLoading(false);
    }
  };

  const AlertSection = ({ title, items, icon: Icon, color, emptyMsg }: { title: string; items: Alert[]; icon: React.ElementType; color: string; emptyMsg: string }) => (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className={`flex items-center gap-2 px-5 py-4 border-b border-border`}>
        <Icon className={`w-4 h-4 ${color}`} />
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold ${items.length > 0 ? color.replace('text-', 'bg-').replace('500', '100') + ' ' + color : 'bg-muted text-muted-foreground'}`}>
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">{emptyMsg}</div>
      ) : (
        <div className="divide-y divide-border">
          {items.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.sku}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${color}`}>
                  {item.currentStock !== undefined ? `${item.currentStock} left` : ''}
                  {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : ''}
                </p>
                <button
                  onClick={() => { setAdjustProduct(item); setShowAdjustModal(true); }}
                  className="text-xs text-primary hover:underline"
                >
                  Adjust stock
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor stock levels and alerts</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground">Loading inventory data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AlertSection title="Low Stock" items={alerts.lowStock} icon={AlertTriangle} color="text-yellow-500" emptyMsg="No low stock items" />
          <AlertSection title="Out of Stock" items={alerts.outOfStock} icon={PackageX} color="text-red-500" emptyMsg="No out-of-stock items" />
          <AlertSection title="Near Expiry (30 days)" items={alerts.nearExpiry} icon={Clock} color="text-orange-500" emptyMsg="No near-expiry items" />
          <AlertSection title="Expired" items={alerts.expired} icon={X} color="text-red-600" emptyMsg="No expired items" />
        </div>
      )}

      {/* Adjust Modal */}
      {showAdjustModal && adjustProduct && (
        <StockAdjustModal
          product={adjustProduct}
          onClose={() => { setShowAdjustModal(false); setAdjustProduct(null); }}
          onSaved={() => { setShowAdjustModal(false); setAdjustProduct(null); fetchAlerts(); }}
        />
      )}
    </div>
  );
}

function StockAdjustModal({ product, onClose, onSaved }: { product: Alert; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState('STOCK_IN');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/inventory/adjust', {
        productId: product.id,
        type,
        quantity: parseInt(quantity),
        reason,
      });
      toast.success('Stock adjusted');
      onSaved();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold">Adjust Stock</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm font-medium">{product.name}</p>
            <p className="text-xs text-muted-foreground">Current stock: {product.currentStock}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Adjustment Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm">
              <option value="STOCK_IN">Stock In</option>
              <option value="STOCK_OUT">Stock Out</option>
              <option value="ADJUSTMENT">Manual Adjustment</option>
              <option value="DAMAGED">Damaged</option>
              <option value="EXPIRED">Expired</option>
              <option value="LOST">Lost</option>
              <option value="RETURN">Return</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantity *</label>
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional reason" className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm hover:bg-secondary/80 transition-all">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-all">
              {isLoading ? 'Saving...' : 'Adjust'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
