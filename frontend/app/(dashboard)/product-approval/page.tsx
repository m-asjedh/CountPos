'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Package, Eye, Clock } from 'lucide-react';
import api from '@/src/lib/api';
import { formatCurrency } from '@/src/lib/utils';
import type { Product } from '@/src/types';

export default function ProductApprovalPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/products/pending-approvals');
      setProducts(res.data.data || []);
    } catch {
      toast.error('Failed to load pending approvals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const approveProduct = async (productId: string, name: string) => {
    try {
      await api.post(`/products/${productId}/approve`, { notes: 'Approved' });
      toast.success(`"${name}" approved`);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch {
      toast.error('Failed to approve');
    }
  };

  const rejectProduct = async () => {
    if (!selectedProduct) return;
    try {
      await api.post(`/products/${selectedProduct.id}/reject`, { reason: rejectReason });
      toast.success(`"${selectedProduct.name}" rejected`);
      setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedProduct(null);
    } catch {
      toast.error('Failed to reject');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Product Approvals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review products created by staff
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground">Loading...</div>
      ) : products.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="font-medium text-foreground">All caught up!</p>
          <p className="text-sm text-muted-foreground mt-1">No products pending approval</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">{product.name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                      <span>SKU: {product.sku}</span>
                      {product.barcode && <span>Barcode: {product.barcode}</span>}
                      {product.category && <span>Category: {product.category.name}</span>}
                      <span>Cost: {formatCurrency(Number(product.costPrice))}</span>
                      <span>Price: {formatCurrency(Number(product.sellingPrice))}</span>
                      <span>Stock: {product.openingStock} {product.unit}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      Created by {product.createdBy?.firstName} {product.createdBy?.lastName} • {new Date(product.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => approveProduct(product.id, product.name)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button
                  onClick={() => { setSelectedProduct(product); setShowRejectModal(true); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-destructive text-white rounded-lg text-sm font-medium hover:bg-destructive/90 transition-all"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {showRejectModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl p-6">
            <h3 className="font-semibold text-lg mb-2">Reject Product</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Rejecting &quot;{selectedProduct.name}&quot;. Staff will be notified.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowRejectModal(false); setRejectReason(''); }} className="flex-1 py-2.5 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm hover:bg-secondary/80 transition-all">
                Cancel
              </button>
              <button onClick={rejectProduct} className="flex-1 py-2.5 bg-destructive text-white rounded-lg font-medium text-sm hover:bg-destructive/90 transition-all">
                Reject Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
