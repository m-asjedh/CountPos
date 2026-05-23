import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Coerce Prisma/API decimals (string) to number for display. */
export function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatCurrency(
  amount: number | string | null | undefined,
  symbol = '$',
  decimals = 2,
): string {
  const n = toNumber(amount);
  return `${symbol}${n.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/** Preview price code mapping for settings (e.g. BL → 12). */
export function buildPriceCodePreview(word: string, digits: string): string {
  const w = word.trim().toUpperCase();
  const d = digits.trim();
  if (!w || !d || w.length !== d.length) return '';

  const map = new Map<string, string>();
  for (let i = 0; i < w.length; i++) map.set(w[i], d[i]);

  const examples: string[] = [];
  if (w.length >= 2) {
    const sample = w.slice(0, 2);
    examples.push(`${sample} → ${sample.split('').map((c) => map.get(c) ?? '?').join('')}`);
  }
  if (w.length >= 4) {
    const sample = w.slice(0, 4);
    examples.push(`${sample} → ${sample.split('').map((c) => map.get(c) ?? '?').join('')}`);
  }

  return examples.join(' · ');
}

export function formatDate(dateString: string, format = 'MM/DD/YYYY'): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', String(year));
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    PARTIALLY_PAID: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    DISCONTINUED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    OUT_OF_STOCK: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
}

export function getInitials(firstName: string, lastName?: string): string {
  const first = firstName?.[0] ?? '';
  const last = lastName?.[0] ?? '';
  return (first + last).toUpperCase();
}

export function truncate(str: string, length = 30): string {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}

export function calculateProfit(sellingPrice: number, costPrice: number, quantity = 1): number {
  return (sellingPrice - costPrice) * quantity;
}

export function calculateMargin(sellingPrice: number, costPrice: number): number {
  if (sellingPrice === 0) return 0;
  return ((sellingPrice - costPrice) / sellingPrice) * 100;
}
