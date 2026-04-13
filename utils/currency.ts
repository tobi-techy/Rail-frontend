import type { Currency } from '@/stores/uiStore';

export type FxRates = Record<Currency, number>;

export const DEFAULT_USD_BASE_EXCHANGE_RATES: FxRates = {
  USD: 1,
  EUR: 0.92,
  NGN: 1550,
  GHS: 15.5,
  KES: 129,
  CAD: 1.36,
  USDC: 1,
  USDT: 1,
  EURC: 1.09,
  PYUSD: 1,
};

const CURRENCY_LOCALE: Record<Currency, string> = {
  USD: 'en-US',
  EUR: 'en-IE',
  NGN: 'en-NG',
  GHS: 'en-GH',
  KES: 'en-KE',
  CAD: 'en-CA',
  USDC: 'en-US',
  USDT: 'en-US',
  EURC: 'en-IE',
  PYUSD: 'en-US',
};

export const SUPPORTED_CURRENCIES: Currency[] = ['USD', 'EUR', 'NGN', 'GHS', 'KES', 'CAD', 'USDC', 'USDT', 'EURC', 'PYUSD'];

const LEGACY_CURRENCY_FALLBACK: Record<string, Currency> = {
  GBP: 'EUR',
  NGN: 'USD',
};

const normalizeCurrencyCode = (value?: string | null): string => value?.trim().toUpperCase() ?? '';

export const migrateLegacyCurrency = (
  value?: string | null,
  fallback: Currency = 'USD'
): Currency => {
  const normalized = normalizeCurrencyCode(value);
  if (!normalized) return fallback;
  if (SUPPORTED_CURRENCIES.includes(normalized as Currency)) return normalized as Currency;
  return LEGACY_CURRENCY_FALLBACK[normalized] ?? fallback;
};

export const isSupportedCurrency = (value?: string | null): value is Currency =>
  SUPPORTED_CURRENCIES.includes(normalizeCurrencyCode(value) as Currency);

export const sanitizeFxRates = (
  rawRates?: Partial<Record<string, number>> | null,
  fallback: FxRates = DEFAULT_USD_BASE_EXCHANGE_RATES
): FxRates => {
  const safeRates = { ...fallback };

  if (!rawRates || typeof rawRates !== 'object') return safeRates;

  for (const currency of SUPPORTED_CURRENCIES) {
    const nextRate = rawRates[currency];
    if (typeof nextRate === 'number' && Number.isFinite(nextRate) && nextRate > 0) {
      safeRates[currency] = nextRate;
    }
  }

  // Base currency must always be 1.
  safeRates.USD = 1;
  return safeRates;
};

export const convertFromUsd = (
  amount: number,
  to: Currency,
  rates: FxRates = DEFAULT_USD_BASE_EXCHANGE_RATES
): number => amount * rates[to];

export const convertCurrencyAmount = (
  amount: number,
  from: Currency,
  to: Currency,
  rates: FxRates = DEFAULT_USD_BASE_EXCHANGE_RATES
): number => {
  if (from === to) return amount;
  const usdAmount = amount / rates[from];
  return convertFromUsd(usdAmount, to, rates);
};

const currencyFormatterCache = new Map<string, Intl.NumberFormat>();

export const formatCurrencyAmount = (
  amount: number,
  currency: Currency,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string => {
  const min = options?.minimumFractionDigits ?? 2;
  const max = options?.maximumFractionDigits ?? 2;
  const cacheKey = `${currency}:${min}:${max}`;

// Stablecoins aren't ISO 4217 currencies — map them to their peg for Intl.NumberFormat
const INTL_CURRENCY_CODE: Record<Currency, string> = {
  USD: 'USD',
  EUR: 'EUR',
  NGN: 'NGN',
  GHS: 'GHS',
  KES: 'KES',
  CAD: 'CAD',
  USDC: 'USD',
  USDT: 'USD',
  EURC: 'EUR',
  PYUSD: 'USD',
};

  let formatter = currencyFormatterCache.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.NumberFormat(CURRENCY_LOCALE[currency], {
      style: 'currency',
      currency: INTL_CURRENCY_CODE[currency] || 'USD',
      minimumFractionDigits: min,
      maximumFractionDigits: max,
    });
    currencyFormatterCache.set(cacheKey, formatter);
  }

  return formatter.format(amount);
};

export const formatFxUpdatedAt = (updatedAt?: string | null): string => {
  if (!updatedAt) return 'Rates unavailable';
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return 'Rates unavailable';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};
