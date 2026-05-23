'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Search, Users, Edit, CreditCard, X } from 'lucide-react';
import api from '@/src/lib/api';
import { useCompanySettings } from '@/src/providers/company-settings-provider';
import type { Customer } from '@/src/types';

export default function CustomersPage() {
  const { formatMoney } = useCompanySettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await api.get(`/customers${params}`);
      setCustomers(res.data.data || []);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(t);
  }, [fetchCustomers]);

  const totalCreditBalance = customers.reduce((sum, c) => sum + Number(c.creditBalance), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {customers.length} customers • Total credit: {formatMoney(totalCreditBalance)}
          </p>
        </div>
        <button onClick={() => { setEditCustomer(null); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone..." className="w-full pl-9 pr-4 py-2 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No customers yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Contact</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Credit Limit</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Balance Due</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{c.name}</div>
                    {c.address && <div className="text-xs text-muted-foreground">{c.address}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{c.phone || '-'}</div>
                    <div className="text-xs">{c.email || ''}</div>
                  </td>
                  <td className="px-4 py-3 text-right">{formatMoney(Number(c.creditLimit))}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={Number(c.creditBalance) > 0 ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-muted-foreground'}>
                      {formatMoney(Number(c.creditBalance))}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditCustomer(c); setShowForm(true); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {Number(c.creditBalance) > 0 && (
                        <button onClick={() => setSelectedCustomer(c)} className="w-7 h-7 rounded-lg flex items-center justify-center text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all" title="Settle credit">
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <CustomerFormModal customer={editCustomer} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchCustomers(); }} />
      )}

      {/* Settle credit modal */}
      {selectedCustomer && (
        <SettleCreditModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} onSaved={() => { setSelectedCustomer(null); fetchCustomers(); }} />
      )}
    </div>
  );
}

function CustomerFormModal({ customer, onClose, onSaved }: { customer: Customer | null; onClose: () => void; onSaved: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    creditLimit: customer?.creditLimit?.toString() || '0',
    notes: customer?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = { ...form, creditLimit: parseFloat(form.creditLimit) };
      if (customer) {
        await api.patch(`/customers/${customer.id}`, payload);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', payload);
        toast.success('Customer added');
      }
      onSaved();
    } catch {
      toast.error('Failed to save customer');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold">{customer ? 'Edit Customer' : 'Add Customer'}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Credit Limit</label>
              <input type="number" min="0" step="0.01" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm hover:bg-secondary/80 transition-all">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-all">
              {isLoading ? 'Saving...' : customer ? 'Update' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SettleCreditModal({ customer, onClose, onSaved }: { customer: Customer; onClose: () => void; onSaved: () => void }) {
  const { formatMoney } = useCompanySettings();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSettle = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) { toast.error('Enter valid amount'); return; }
    if (amountNum > Number(customer.creditBalance)) { toast.error('Amount exceeds balance'); return; }
    setIsLoading(true);
    try {
      await api.post(`/customers/${customer.id}/settle-credit`, { amount: amountNum });
      toast.success('Credit settled');
      onSaved();
    } catch {
      toast.error('Failed to settle credit');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Settle Credit</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="bg-muted rounded-lg p-3 mb-4">
          <p className="text-sm font-medium">{customer.name}</p>
          <p className="text-sm text-orange-600 dark:text-orange-400">Balance due: {formatMoney(Number(customer.creditBalance))}</p>
        </div>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount to settle" max={Number(customer.creditBalance)} className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm hover:bg-secondary/80 transition-all">Cancel</button>
          <button onClick={handleSettle} disabled={isLoading} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-all">
            {isLoading ? 'Processing...' : 'Settle'}
          </button>
        </div>
      </div>
    </div>
  );
}
