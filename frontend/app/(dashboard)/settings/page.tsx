'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Building2, Settings2, Save, KeyRound } from 'lucide-react';
import api from '@/src/lib/api';
import { buildPriceCodePreview } from '@/src/lib/utils';
import { useCompanySettings } from '@/src/providers/company-settings-provider';
import type { CompanySettings } from '@/src/types';

function SettingsInputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function settingsPayload(form: Partial<CompanySettings>) {
  return {
    currency: form.currency,
    currencySymbol: form.currencySymbol,
    taxEnabled: form.taxEnabled,
    taxRate: Number.isFinite(Number(form.taxRate)) ? Number(form.taxRate) : 0,
    taxLabel: form.taxLabel,
    invoicePrefix: form.invoicePrefix,
    lowStockThreshold: form.lowStockThreshold,
    requireApproval: form.requireApproval,
    allowStaffDiscount: form.allowStaffDiscount,
    receiptFooter: form.receiptFooter || null,
    timezone: form.timezone,
    dateFormat: form.dateFormat,
    priceCodeWord: form.priceCodeWord?.trim() || null,
    priceCodeDigits: form.priceCodeDigits?.trim() || null,
  };
}

export default function SettingsPage() {
  const { refreshSettings } = useCompanySettings();
  const [companyForm, setCompanyForm] = useState({ name: '', email: '', phone: '', address: '', website: '' });
  const [settingsForm, setSettingsForm] = useState<Partial<CompanySettings>>({
    currency: 'USD', currencySymbol: '$', taxEnabled: false, taxRate: 0, taxLabel: 'Tax',
    invoicePrefix: 'INV', lowStockThreshold: 10, requireApproval: true, allowStaffDiscount: true,
    receiptFooter: '', timezone: 'UTC', dateFormat: 'MM/DD/YYYY',
    priceCodeWord: '', priceCodeDigits: '',
  });
  const [codePreview, setCodePreview] = useState('');
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
            priceCodeWord: settings.priceCodeWord || '',
            priceCodeDigits: settings.priceCodeDigits || '',
          });
        }
      } catch { /* ignore */ }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setCodePreview(
      buildPriceCodePreview(settingsForm.priceCodeWord || '', settingsForm.priceCodeDigits || ''),
    );
  }, [settingsForm.priceCodeWord, settingsForm.priceCodeDigits]);

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
      const res = await api.patch('/companies/settings', settingsPayload(settingsForm));
      const saved = res.data.data;
      if (saved) {
        setSettingsForm({
          currency: saved.currency,
          currencySymbol: saved.currencySymbol,
          taxEnabled: saved.taxEnabled,
          taxRate: Number(saved.taxRate),
          taxLabel: saved.taxLabel,
          invoicePrefix: saved.invoicePrefix,
          lowStockThreshold: saved.lowStockThreshold,
          requireApproval: saved.requireApproval,
          allowStaffDiscount: saved.allowStaffDiscount,
          receiptFooter: saved.receiptFooter || '',
          timezone: saved.timezone,
          dateFormat: saved.dateFormat,
          priceCodeWord: saved.priceCodeWord || '',
          priceCodeDigits: saved.priceCodeDigits || '',
        });
      }
      await refreshSettings();
      toast.success('Settings saved');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to save settings');
    } finally {
      setIsLoadingSettings(false);
    }
  };

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
            <SettingsInputField label="Company Name" value={companyForm.name} onChange={(v) => setCompanyForm({ ...companyForm, name: v })} placeholder="My Store" />
            <SettingsInputField label="Email" value={companyForm.email} onChange={(v) => setCompanyForm({ ...companyForm, email: v })} type="email" />
            <SettingsInputField label="Phone" value={companyForm.phone} onChange={(v) => setCompanyForm({ ...companyForm, phone: v })} />
            <SettingsInputField label="Website" value={companyForm.website} onChange={(v) => setCompanyForm({ ...companyForm, website: v })} />
          </div>
          <SettingsInputField label="Address" value={companyForm.address} onChange={(v) => setCompanyForm({ ...companyForm, address: v })} />
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
              <SettingsInputField label="Currency Code" value={settingsForm.currency || 'USD'} onChange={(v) => setSettingsForm({ ...settingsForm, currency: v })} placeholder="USD" />
              <SettingsInputField label="Currency Symbol" value={settingsForm.currencySymbol ?? ''} onChange={(v) => setSettingsForm({ ...settingsForm, currencySymbol: v })} placeholder="Rs, $, €" />
              <SettingsInputField label="Invoice Prefix" value={settingsForm.invoicePrefix || 'INV'} onChange={(v) => setSettingsForm({ ...settingsForm, invoicePrefix: v })} placeholder="INV" />
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
                <SettingsInputField label="Tax Rate (%)" value={settingsForm.taxRate ?? 0} type="number" onChange={(v) => setSettingsForm({ ...settingsForm, taxRate: parseFloat(v) })} />
                <SettingsInputField label="Tax Label" value={settingsForm.taxLabel || 'Tax'} onChange={(v) => setSettingsForm({ ...settingsForm, taxLabel: v })} />
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

          <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-medium">Price code words (import)</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Map letters to digits for encoded prices in CSV/XLSX imports. Example: word{' '}
              <span className="font-mono">BLACKSTONE</span> → digits{' '}
              <span className="font-mono">1234567890</span>, so code <span className="font-mono">BL</span> = cost{' '}
              <span className="font-mono">12</span>. Plain numbers like <span className="font-mono">10530/=</span> are
              imported as-is.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Code word (letters)</label>
                <input
                  type="text"
                  value={settingsForm.priceCodeWord || ''}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      priceCodeWord: e.target.value.toUpperCase().replace(/[^A-Z]/g, ''),
                    })
                  }
                  placeholder="BLACKSTONE"
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Maps to (digits)</label>
                <input
                  type="text"
                  value={settingsForm.priceCodeDigits || ''}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      priceCodeDigits: e.target.value.replace(/[^\d]/g, ''),
                    })
                  }
                  placeholder="1234567890"
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            {(settingsForm.priceCodeWord || settingsForm.priceCodeDigits) && (
              <p className="text-xs text-muted-foreground">
                {settingsForm.priceCodeWord?.length === settingsForm.priceCodeDigits?.length ? (
                  <>
                    Length: {settingsForm.priceCodeWord?.length} characters. Preview:{' '}
                    <span className="font-mono text-foreground">{codePreview || 'BL → 12'}</span>
                  </>
                ) : (
                  <span className="text-destructive">
                    Word and digits must be the same length (
                    {settingsForm.priceCodeWord?.length ?? 0} vs {settingsForm.priceCodeDigits?.length ?? 0})
                  </span>
                )}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Include every letter you use in imports (e.g. add X if your sheet uses codes like LXEX). Columns: Uni
              Code, Product name, Quantity, Price, Discount.
            </p>
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
