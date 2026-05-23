'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Building2,
  Settings2,
  Save,
  KeyRound,
  Receipt,
  Shield,
  Coins,
  Percent,
} from 'lucide-react';
import api from '@/src/lib/api';
import { buildPriceCodePreview, cn } from '@/src/lib/utils';
import { useCompanySettings } from '@/src/providers/company-settings-provider';
import type { CompanySettings } from '@/src/types';

type CompanyForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
};

type SettingsFormState = {
  currency: string;
  currencySymbol: string;
  taxEnabled: boolean;
  taxRate: string;
  taxLabel: string;
  invoicePrefix: string;
  lowStockThreshold: string;
  requireApproval: boolean;
  allowStaffDiscount: boolean;
  receiptFooter: string;
  timezone: string;
  dateFormat: string;
  priceCodeWord: string;
  priceCodeDigits: string;
};

const defaultCompany: CompanyForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  website: '',
};

const defaultSettings: SettingsFormState = {
  currency: 'USD',
  currencySymbol: '$',
  taxEnabled: false,
  taxRate: '0',
  taxLabel: 'Tax',
  invoicePrefix: 'INV',
  lowStockThreshold: '10',
  requireApproval: true,
  allowStaffDiscount: true,
  receiptFooter: '',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  priceCodeWord: '',
  priceCodeDigits: '',
};

const SettingsField = memo(function SettingsField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  hint,
  className,
  mono,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  className?: string;
  mono?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
          mono && 'font-mono',
        )}
      />
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
});

function settingsPayload(form: SettingsFormState) {
  return {
    currency: form.currency,
    currencySymbol: form.currencySymbol,
    taxEnabled: form.taxEnabled,
    taxRate: parseFloat(form.taxRate) || 0,
    taxLabel: form.taxLabel,
    invoicePrefix: form.invoicePrefix,
    lowStockThreshold: parseInt(form.lowStockThreshold, 10) || 0,
    requireApproval: form.requireApproval,
    allowStaffDiscount: form.allowStaffDiscount,
    receiptFooter: form.receiptFooter || null,
    timezone: form.timezone,
    dateFormat: form.dateFormat,
    priceCodeWord: form.priceCodeWord.trim() || null,
    priceCodeDigits: form.priceCodeDigits.trim() || null,
  };
}

function mapSettingsFromApi(s: CompanySettings): SettingsFormState {
  return {
    currency: s.currency,
    currencySymbol: s.currencySymbol,
    taxEnabled: s.taxEnabled,
    taxRate: String(s.taxRate ?? 0),
    taxLabel: s.taxLabel,
    invoicePrefix: s.invoicePrefix,
    lowStockThreshold: String(s.lowStockThreshold ?? 10),
    requireApproval: s.requireApproval,
    allowStaffDiscount: s.allowStaffDiscount,
    receiptFooter: s.receiptFooter || '',
    timezone: s.timezone,
    dateFormat: s.dateFormat,
    priceCodeWord: s.priceCodeWord || '',
    priceCodeDigits: s.priceCodeDigits || '',
  };
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/20 px-6 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function ToggleRow({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
      />
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </label>
  );
}

export default function SettingsPage() {
  const { refreshSettings } = useCompanySettings();
  const [companyForm, setCompanyForm] = useState<CompanyForm>(defaultCompany);
  const [settingsForm, setSettingsForm] = useState<SettingsFormState>(defaultSettings);
  const [codePreview, setCodePreview] = useState('');
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const patchCompany = useCallback((field: keyof CompanyForm, value: string) => {
    setCompanyForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const patchSettings = useCallback(
    (field: keyof SettingsFormState, value: string | boolean) => {
      setSettingsForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profileRes, settingsRes] = await Promise.all([
          api.get('/companies/profile'),
          api.get('/companies/settings'),
        ]);
        if (cancelled) return;
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
          setSettingsForm(mapSettingsFromApi(settings));
        }
        setLoaded(true);
      } catch {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setCodePreview(
      buildPriceCodePreview(settingsForm.priceCodeWord, settingsForm.priceCodeDigits),
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
        setSettingsForm(mapSettingsFromApi(saved));
      }
      await refreshSettings();
      toast.success('Settings saved');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response
        ?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to save settings');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  if (!loaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const codeLengthsMatch =
    settingsForm.priceCodeWord.length === settingsForm.priceCodeDigits.length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <div className="rounded-2xl bg-linear-to-br from-indigo-500 via-indigo-600 to-violet-600 p-6 text-white md:p-8">
        <h1 className="text-2xl font-bold md:text-3xl">Store settings</h1>
        <p className="mt-2 max-w-xl text-sm text-indigo-100">
          Company profile, currency, tax, POS rules, and import price codes — all in one place.
        </p>
      </div>

      <SectionCard
        icon={Building2}
        title="Company profile"
        description="Your business details on invoices and reports"
      >
        <form onSubmit={saveCompany} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <SettingsField
              label="Company name"
              value={companyForm.name}
              onChange={(v) => patchCompany('name', v)}
              placeholder="My Store"
            />
            <SettingsField
              label="Email"
              type="email"
              value={companyForm.email}
              onChange={(v) => patchCompany('email', v)}
            />
            <SettingsField
              label="Phone"
              value={companyForm.phone}
              onChange={(v) => patchCompany('phone', v)}
              placeholder="+94 7X XXX XXXX"
            />
            <SettingsField
              label="Website"
              value={companyForm.website}
              onChange={(v) => patchCompany('website', v)}
              placeholder="https://"
            />
          </div>
          <SettingsField
            label="Address"
            value={companyForm.address}
            onChange={(v) => patchCompany('address', v)}
            placeholder="Street, city, country"
          />
          <div className="flex justify-end border-t border-border pt-4">
            <button
              type="submit"
              disabled={isLoadingCompany}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isLoadingCompany ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        icon={Settings2}
        title="Store configuration"
        description="Currency, tax, inventory alerts, and staff permissions"
      >
        <form onSubmit={saveSettings} className="space-y-8">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Currency & invoices</h4>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <SettingsField
                label="Currency code"
                value={settingsForm.currency}
                onChange={(v) => patchSettings('currency', v.toUpperCase())}
                placeholder="LKR"
              />
              <SettingsField
                label="Currency symbol"
                value={settingsForm.currencySymbol}
                onChange={(v) => patchSettings('currencySymbol', v)}
                placeholder="Rs"
              />
              <SettingsField
                label="Invoice prefix"
                value={settingsForm.invoicePrefix}
                onChange={(v) => patchSettings('invoicePrefix', v)}
                placeholder="INV"
              />
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2">
              <Percent className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Tax</h4>
            </div>
            <ToggleRow
              checked={settingsForm.taxEnabled}
              onChange={(v) => patchSettings('taxEnabled', v)}
              title="Enable tax on invoices"
              description="Automatically add tax to POS totals and invoices"
            />
            {settingsForm.taxEnabled && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <SettingsField
                  label="Tax rate (%)"
                  type="text"
                  inputMode="decimal"
                  value={settingsForm.taxRate}
                  onChange={(v) => patchSettings('taxRate', v.replace(/[^\d.]/g, ''))}
                  placeholder="15"
                />
                <SettingsField
                  label="Tax label"
                  value={settingsForm.taxLabel}
                  onChange={(v) => patchSettings('taxLabel', v)}
                  placeholder="VAT"
                />
              </div>
            )}
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Operations</h4>
            </div>
            <div className="space-y-3">
              <ToggleRow
                checked={settingsForm.requireApproval}
                onChange={(v) => patchSettings('requireApproval', v)}
                title="Require approval for staff-created products"
                description="Staff products stay hidden in POS until a manager approves them"
              />
              <ToggleRow
                checked={settingsForm.allowStaffDiscount}
                onChange={(v) => patchSettings('allowStaffDiscount', v)}
                title="Allow staff to apply discounts"
                description="Discounts respect each product's maximum discount limit"
              />
            </div>
            <div className="mt-4 max-w-xs">
              <SettingsField
                label="Low stock alert threshold"
                type="text"
                inputMode="numeric"
                value={settingsForm.lowStockThreshold}
                onChange={(v) => patchSettings('lowStockThreshold', v.replace(/\D/g, ''))}
                hint="Notify when stock falls below this quantity"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-5">
            <div className="mb-4 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Price code words (import)</h4>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Map letters to digits for encoded prices in CSV/XLSX imports. Example:{' '}
              <span className="font-mono text-foreground">BLACKSTONE</span> →{' '}
              <span className="font-mono text-foreground">1234567890</span>, so{' '}
              <span className="font-mono text-foreground">BL</span> decodes to cost{' '}
              <span className="font-mono text-foreground">12</span>.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <SettingsField
                label="Code word (letters)"
                value={settingsForm.priceCodeWord}
                onChange={(v) =>
                  patchSettings('priceCodeWord', v.toUpperCase().replace(/[^A-Z]/g, ''))
                }
                placeholder="BLACKSTONE"
                mono
              />
              <SettingsField
                label="Maps to (digits)"
                value={settingsForm.priceCodeDigits}
                onChange={(v) => patchSettings('priceCodeDigits', v.replace(/[^\d]/g, ''))}
                placeholder="1234567890"
                mono
              />
            </div>
            {(settingsForm.priceCodeWord || settingsForm.priceCodeDigits) && (
              <p className="mt-3 text-xs">
                {codeLengthsMatch ? (
                  <span className="text-muted-foreground">
                    {settingsForm.priceCodeWord.length} characters · Preview:{' '}
                    <span className="font-mono text-foreground">{codePreview || 'BL → 12'}</span>
                  </span>
                ) : (
                  <span className="text-destructive">
                    Word and digits must be the same length (
                    {settingsForm.priceCodeWord.length} vs {settingsForm.priceCodeDigits.length})
                  </span>
                )}
              </p>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              <label className="text-sm font-semibold text-foreground">Receipt footer</label>
            </div>
            <textarea
              value={settingsForm.receiptFooter}
              onChange={(e) => patchSettings('receiptFooter', e.target.value)}
              placeholder="Thank you for your business!"
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <button
              type="submit"
              disabled={isLoadingSettings}
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isLoadingSettings ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
