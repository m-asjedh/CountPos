'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Building2, Settings2, Save } from 'lucide-react';
import api from '@/src/lib/api';
import type { CompanySettings } from '@/src/types';

export default function SettingsPage() {
  const [companyForm, setCompanyForm] = useState({ name: '', email: '', phone: '', address: '', website: '' });
  const [settingsForm, setSettingsForm] = useState<Partial<CompanySettings>>({
    currency: 'USD', currencySymbol: '$', taxEnabled: false, taxRate: 0, taxLabel: 'Tax',
    invoicePrefix: 'INV', lowStockThreshold: 10, requireApproval: true, allowStaffDiscount: true,
    receiptFooter: '', timezone: 'UTC', dateFormat: 'MM/DD/YYYY',
  });
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, settingsRes] = await Promise.all([
          api.get('/companies/profile'),
          api.get('/companies/settings'),
        ]);
        const company = profileRes.data.data;
        setCompanyForm({
          name: company.name || '',
          email: company.email || '',
          phone: company.phone || '',
          address: company.address || '',
          website: company.website || '',
        });
        const settings = settingsRes.data.data;
        if (settings) {
          setSettingsForm({
            currency: settings.currency,
            currencySymbol: settings.currencySymbol,
            taxEnabled: settings.taxEnabled,
            taxRate: Number(settings.taxRate),
            taxLabel: settings.taxLabel,
            invoicePrefix: settings.invoicePrefix,
            lowStockThreshold: settings.lowStockThreshold,
            requireApproval: settings.requireApproval,
            allowStaffDiscount: settings.allowStaffDiscount,
            receiptFooter: settings.receiptFooter || '',
            timezone: settings.timezone,
            dateFormat: settings.dateFormat,
          });
        }
      } catch { /* ignore */ }
    };
    fetchData();
  }, []);

  const saveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingCompany(true);
    try {
      await api.patch('/companies/profile', companyForm);
      toast.success('Company profile saved');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setIsLoadingCompany(false);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingSettings(true);
    try {
      await api.patch('/companies/settings', settingsForm);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const InputField = ({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your store configuration</p>
      </div>

      {/* Company Profile */}
      <div className="bg-card border border-border rounded-xl">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Building2 className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Company Profile</h3>
        </div>
        <form onSubmit={saveCompany} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Company Name" value={companyForm.name} onChange={(v) => setCompanyForm({ ...companyForm, name: v })} placeholder="My Store" />
            <InputField label="Email" value={companyForm.email} onChange={(v) => setCompanyForm({ ...companyForm, email: v })} type="email" />
            <InputField label="Phone" value={companyForm.phone} onChange={(v) => setCompanyForm({ ...companyForm, phone: v })} />
            <InputField label="Website" value={companyForm.website} onChange={(v) => setCompanyForm({ ...companyForm, website: v })} />
          </div>
          <InputField label="Address" value={companyForm.address} onChange={(v) => setCompanyForm({ ...companyForm, address: v })} />
          <div className="flex justify-end">
            <button type="submit" disabled={isLoadingCompany} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all">
              <Save className="w-4 h-4" /> {isLoadingCompany ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Store Settings */}
      <div className="bg-card border border-border rounded-xl">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Settings2 className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Store Settings</h3>
        </div>
        <form onSubmit={saveSettings} className="p-5 space-y-5">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Currency</h4>
            <div className="grid grid-cols-3 gap-4">
              <InputField label="Currency Code" value={settingsForm.currency || 'USD'} onChange={(v) => setSettingsForm({ ...settingsForm, currency: v })} placeholder="USD" />
              <InputField label="Currency Symbol" value={settingsForm.currencySymbol || '$'} onChange={(v) => setSettingsForm({ ...settingsForm, currencySymbol: v })} placeholder="$" />
              <InputField label="Invoice Prefix" value={settingsForm.invoicePrefix || 'INV'} onChange={(v) => setSettingsForm({ ...settingsForm, invoicePrefix: v })} placeholder="INV" />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Tax</h4>
            <div className="flex items-center gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={settingsForm.taxEnabled} onChange={(e) => setSettingsForm({ ...settingsForm, taxEnabled: e.target.checked })} className="rounded" />
                <span className="text-sm">Enable tax on invoices</span>
              </label>
            </div>
            {settingsForm.taxEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Tax Rate (%)" value={settingsForm.taxRate ?? 0} type="number" onChange={(v) => setSettingsForm({ ...settingsForm, taxRate: parseFloat(v) })} />
                <InputField label="Tax Label" value={settingsForm.taxLabel || 'Tax'} onChange={(v) => setSettingsForm({ ...settingsForm, taxLabel: v })} />
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Operations</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={settingsForm.requireApproval} onChange={(e) => setSettingsForm({ ...settingsForm, requireApproval: e.target.checked })} className="rounded" />
                <div>
                  <p className="text-sm font-medium">Require approval for staff-created products</p>
                  <p className="text-xs text-muted-foreground">Products created by staff won&apos;t be visible in POS until approved</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={settingsForm.allowStaffDiscount} onChange={(e) => setSettingsForm({ ...settingsForm, allowStaffDiscount: e.target.checked })} className="rounded" />
                <div>
                  <p className="text-sm font-medium">Allow staff to apply discounts</p>
                  <p className="text-xs text-muted-foreground">Staff can apply discounts within the configured product limits</p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Low Stock Alert Threshold</label>
            <input type="number" min="0" value={settingsForm.lowStockThreshold ?? 10} onChange={(e) => setSettingsForm({ ...settingsForm, lowStockThreshold: parseInt(e.target.value) })} className="w-32 px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <p className="text-xs text-muted-foreground mt-1">Alert when stock falls below this number</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Receipt Footer</label>
            <textarea value={settingsForm.receiptFooter || ''} onChange={(e) => setSettingsForm({ ...settingsForm, receiptFooter: e.target.value })} placeholder="Thank you for your business!" rows={2} className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={isLoadingSettings} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all">
              <Save className="w-4 h-4" /> {isLoadingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
