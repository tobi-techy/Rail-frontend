import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_USD_BASE_EXCHANGE_RATES, sanitizeFxRates, type FxRates } from '@/utils/currency';

const FX_RATES_CACHE_KEY = 'fx-rates-cache-v1';
const FX_PROVIDER_URL = 'https://open.er-api.com/v6/latest/USD';
const FX_CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours
const FX_FETCH_TIMEOUT_MS = 3500;

type CachedFxRatesPayload = {
  rates: FxRates;
  updatedAt: string;
};

export const getFallbackFxRates = (): FxRates => ({ ...DEFAULT_USD_BASE_EXCHANGE_RATES });

const isFresh = (updatedAt: string, maxAgeMs: number): boolean => {
  const time = new Date(updatedAt).getTime();
  if (!Number.isFinite(time)) return false;
  return Date.now() - time < maxAgeMs;
};

export const readCachedFxRates = async (): Promise<CachedFxRatesPayload | null> => {
  try {
    const raw = await AsyncStorage.getItem(FX_RATES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedFxRatesPayload> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.updatedAt !== 'string') return null;

    return {
      rates: sanitizeFxRates(parsed.rates as any),
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
};

const saveCachedFxRates = async (payload: CachedFxRatesPayload): Promise<void> => {
  try {
    await AsyncStorage.setItem(FX_RATES_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Best-effort cache write.
  }
};

const fetchWithTimeout = async (url: string, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

export const fetchLiveFxRates = async (): Promise<CachedFxRatesPayload> => {
  const response = await fetchWithTimeout(FX_PROVIDER_URL, FX_FETCH_TIMEOUT_MS);
  if (!response.ok) {
    throw new Error(`FX provider request failed (${response.status})`);
  }

  const data = await response.json();
  const rates = sanitizeFxRates(data?.rates);
  const updatedAt =
    typeof data?.time_last_update_utc === 'string'
      ? new Date(data.time_last_update_utc).toISOString()
      : new Date().toISOString();

  const payload = { rates, updatedAt };
  await saveCachedFxRates(payload);
  return payload;
};

export const getBestAvailableFxRates = async (options?: {
  forceRefresh?: boolean;
  maxAgeMs?: number;
}): Promise<CachedFxRatesPayload> => {
  const maxAgeMs = options?.maxAgeMs ?? FX_CACHE_TTL_MS;
  const cached = await readCachedFxRates();

  if (!options?.forceRefresh && cached && isFresh(cached.updatedAt, maxAgeMs)) {
    return cached;
  }

  try {
    return await fetchLiveFxRates();
  } catch {
    if (cached) return cached;
    return {
      rates: getFallbackFxRates(),
      updatedAt: new Date().toISOString(),
    };
  }
};
