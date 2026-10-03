export type CurrencyCode = 'USD' | 'KHR';

export function formatMoney(
  value: number | string | null | undefined,
  opts?: { currency?: CurrencyCode; locale?: string },
): string {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return '$0';
  const currency = opts?.currency ?? 'USD';
  const locale = opts?.locale ?? 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: num % 1 === 0 ? 0 : 2,
  }).format(num);
}

export function formatNumber(
  value: number | string | null | undefined,
  opts?: { locale?: string },
): string {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return '0';
  const locale = opts?.locale ?? 'en-US';
  return new Intl.NumberFormat(locale, {
    notation: Math.abs(num) >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(num);
}

export function formatDate(
  value: string | Date | null | undefined,
  opts?: { locale?: string; withTime?: boolean },
): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(opts?.locale ?? 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(opts?.withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}
