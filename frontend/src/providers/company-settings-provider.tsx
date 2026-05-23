'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api from '@/src/lib/api';
import { formatCurrency } from '@/src/lib/utils';
import type { CompanySettings } from '@/src/types';
import { useAuth } from '@/src/providers/auth-provider';

interface CompanySettingsContextValue {
  settings: CompanySettings | null;
  isLoading: boolean;
  currencySymbol: string;
  currencyCode: string;
  formatMoney: (amount: number | string | null | undefined) => string;
  refreshSettings: () => Promise<void>;
}

const CompanySettingsContext = createContext<CompanySettingsContextValue | undefined>(
  undefined,
);

export function CompanySettingsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await api.get('/companies/settings');
      setSettings(res.data.data ?? null);
    } catch {
      setSettings(null);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setSettings(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    refreshSettings().finally(() => setIsLoading(false));
  }, [isAuthenticated, authLoading, refreshSettings]);

  const currencySymbol = settings?.currencySymbol?.trim() || '$';
  const currencyCode = settings?.currency?.trim() || 'USD';

  const formatMoney = useCallback(
    (amount: number | string | null | undefined) => formatCurrency(amount, currencySymbol),
    [currencySymbol],
  );

  const value = useMemo(
    () => ({
      settings,
      isLoading,
      currencySymbol,
      currencyCode,
      formatMoney,
      refreshSettings,
    }),
    [settings, isLoading, currencySymbol, currencyCode, formatMoney, refreshSettings],
  );

  return (
    <CompanySettingsContext.Provider value={value}>
      {children}
    </CompanySettingsContext.Provider>
  );
}

export function useCompanySettings() {
  const ctx = useContext(CompanySettingsContext);
  if (!ctx) {
    throw new Error('useCompanySettings must be used within CompanySettingsProvider');
  }
  return ctx;
}
