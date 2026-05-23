'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Plus, Search, Package, Filter, Download, Upload,
  Edit, Trash2, Eye, CheckCircle, Clock, XCircle, RefreshCw,
} from 'lucide-react';
import api from '@/src/lib/api';
import { getStatusColor } from '@/src/lib/utils';
import { useCompanySettings } from '@/src/providers/company-settings-provider';
import type { Product, Category, Supplier } from '@/src/types';
import { useAuth } from '@/src/providers/auth-provider';

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Pending', value: 'PENDING_APPROVAL' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
];

export default function ProductsPage() {
  const { formatMoney } = useCompanySettings();
  const { user } = useAuth();
  const isAdmin = user && ['OWNER', 'ADMIN', 'MANAGER'].includes(user.role);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('categoryId', categoryFilter);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, categoryFilter, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [catRes, supRes] = await Promise.all([
          api.get('/categories'),
          api.get('/suppliers'),
        ]);
        setCategories(catRes.data.data || []);
        setSuppliers(supRes.data.data || []);
      } catch { /* ignore */ }
    };
    fetchMeta();
  }, []);

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This action is irreversible.`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'PENDING_APPROVAL': return <Clock className="w-3.5 h-3.5" />;
      case 'REJECTED': return <XCircle className="w-3.5 h-3.5" />;
      case 'OUT_OF_STOCK': return <Package className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} products total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <label className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer transition-all">
                <Upload className="w-4 h-4" />
                Import CSV / Excel
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                      const res = await api.post('/products/import/csv', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                      });
                      const { created, skipped, errors } = res.data.data;
                      toast.success(`Imported ${created} product(s)${skipped ? `, ${skipped} skipped` : ''}`);
                      if (errors?.length) {
                        toast.warning(errors.slice(0, 3).join(' · ') + (errors.length > 3 ? '…' : ''));
                      }
                      fetchProducts();
                    } catch (err: unknown) {
                      const msg =
                        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
                          ?.message;
                      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Import failed');
                    }
                    e.target.value = '';
                  }}
                />
              </label>
              <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                <Download className="w-4 h-4" /> Export
              </button>
            </>
          )}
          <button
            onClick={() => { setEditProduct(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <button onClick={fetchProducts} className="px-3 py-2 border border-input bg-background rounded-lg text-sm hover:bg-accent transition-all">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No products found</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Add your first product to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Cost</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Price</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Stock</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{product.name}</div>
                      {product.brand && <div className="text-xs text-muted-foreground">{product.brand}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{product.sku}</td>
                    <td className="px-4 py-3 text-muted-foreground">{product.category?.name || '-'}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatMoney(Number(product.costPrice))}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatMoney(Number(product.sellingPrice))}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${product.currentStock === 0 ? 'text-destructive' : product.currentStock <= product.lowStockThreshold ? 'text-orange-500' : 'text-foreground'}`}>
                        {product.currentStock}
                      </span>
                      <span className="text-xs text-muted-foreground"> {product.unit}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.approvalStatus)}`}>
                        {statusIcon(product.approvalStatus)}
                        {product.approvalStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditProduct(product); setShowForm(true); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => deleteProduct(product.id, product.name)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-border rounded-lg text-sm disabled:opacity-50 hover:bg-accent transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * 20 >= total}
                className="px-3 py-1.5 border border-border rounded-lg text-sm disabled:opacity-50 hover:bg-accent transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <ProductFormModal
          product={editProduct}
          categories={categories}
          suppliers={suppliers}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchProducts(); }}
        />
      )}
    </div>
  );
}

function ProductFormModal({
  product,
  categories,
  suppliers,
  onClose,
  onSaved,
}: {
  product: Product | null;
  categories: Category[];
  suppliers: Supplier[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    brand: product?.brand || '',
    description: product?.description || '',
    unit: product?.unit || 'pcs',
    categoryId: product?.categoryId || '',
    supplierId: product?.supplierId || '',
    costPrice: product?.costPrice?.toString() || '',
    sellingPrice: product?.sellingPrice?.toString() || '',
    discountEnabled: product?.discountEnabled || false,
    maxDiscountPercent: product?.maxDiscountPercent?.toString() || '0',
    openingStock: product?.openingStock?.toString() || '0',
    reorderLevel: product?.reorderLevel?.toString() || '0',
    lowStockThreshold: product?.lowStockThreshold?.toString() || '5',
    shelfNumber: product?.shelfNumber || '',
    shelfRow: product?.shelfRow || '',
    rackNumber: product?.rackNumber || '',
    expiryDate: product?.expiryDate ? product.expiryDate.split('T')[0] : '',
    batchNumber: product?.batchNumber || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        ...form,
        costPrice: parseFloat(form.costPrice),
        sellingPrice: parseFloat(form.sellingPrice),
        maxDiscountPercent: parseFloat(form.maxDiscountPercent),
        openingStock: parseInt(form.openingStock),
        reorderLevel: parseInt(form.reorderLevel),
        lowStockThreshold: parseInt(form.lowStockThreshold),
        expiryDate: form.expiryDate || undefined,
        categoryId: form.categoryId || undefined,
        supplierId: form.supplierId || undefined,
      };

      if (product) {
        await api.patch(`/products/${product.id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/products', payload);
        toast.success('Product created');
      }
      onSaved();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="font-semibold text-lg">{product ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Basic info */}
          <div>
            <h4 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wide">Basic Information</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Coca Cola 500ml" className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SKU *</label>
                <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required placeholder="PROD-001" className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Barcode</label>
                <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="123456789" className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Supplier</label>
                <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">No supplier</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Brand</label>
                <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Brand name" className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'pack', 'dozen', 'bottle', 'can', 'bag'].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h4 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wide">Pricing</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Cost Price *</label>
                <input type="number" step="0.01" min="0" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} required placeholder="0.00" className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Selling Price *</label>
                <input type="number" step="0.01" min="0" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} required placeholder="0.00" className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="flex flex-col justify-end pb-2">
                {form.costPrice && form.sellingPrice && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Margin: </span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {(((parseFloat(form.sellingPrice) - parseFloat(form.costPrice)) / parseFloat(form.sellingPrice)) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.discountEnabled} onChange={(e) => setForm({ ...form, discountEnabled: e.target.checked })} className="rounded" />
                <span className="text-sm">Enable discount</span>
              </label>
              {form.discountEnabled && (
                <div className="flex-1">
                  <input type="number" min="0" max="100" value={form.maxDiscountPercent} onChange={(e) => setForm({ ...form, maxDiscountPercent: e.target.value })} placeholder="Max discount %" className="w-full px-3 py-1.5 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              )}
            </div>
          </div>

          {/* Inventory */}
          <div>
            <h4 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wide">Inventory</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Opening Stock</label>
                <input type="number" min="0" value={form.openingStock} onChange={(e) => setForm({ ...form, openingStock: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reorder Level</label>
                <input type="number" min="0" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Low Stock Alert</label>
                <input type="number" min="0" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Shelf #</label>
                <input value={form.shelfNumber} onChange={(e) => setForm({ ...form, shelfNumber: e.target.value })} placeholder="A1" className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Shelf Row</label>
                <input value={form.shelfRow} onChange={(e) => setForm({ ...form, shelfRow: e.target.value })} placeholder="Row 3" className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expiry Date</label>
                <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-all text-sm">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-all text-sm">
              {isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
