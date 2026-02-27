/**
 * Axios adapter that routes requests through react-native-ssl-pinning.
 * Only active in production when cert pins are configured.
 */
import { fetch as pinnedFetch } from 'react-native-ssl-pinning';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '../lib/logger';

function normalizePin(pin?: string): string | null {
  if (!pin) return null;

  const trimmed = pin.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('sha256/') || trimmed.startsWith('sha1/')) {
    return trimmed;
  }

  // Backward compatibility: envs historically stored raw base64 SHA-256 hashes.
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)) {
    return `sha256/${trimmed}`;
  }

  return null;
}

const RAW_CERT_PINS = [process.env.EXPO_PUBLIC_CERT_PIN_1, process.env.EXPO_PUBLIC_CERT_PIN_2];
const CERT_PINS = RAW_CERT_PINS.map(normalizePin).filter(Boolean) as string[];

export const SSL_PINNING_ACTIVE = !__DEV__ && CERT_PINS.length > 0;

if (!__DEV__) {
  RAW_CERT_PINS.forEach((pin, index) => {
    if (pin && !normalizePin(pin)) {
      logger.warn('[SSL Pinning] Ignoring invalid certificate pin format', {
        component: 'sslPinningAdapter',
        pinIndex: index + 1,
      });
    }
  });
}

export async function sslPinningAdapter(config: AxiosRequestConfig): Promise<AxiosResponse> {
  const url = config.baseURL
    ? `${config.baseURL.replace(/\/$/, '')}/${(config.url ?? '').replace(/^\//, '')}`
    : (config.url ?? '');

  const method = (config.method?.toUpperCase() ?? 'GET') as 'GET' | 'POST' | 'PUT' | 'DELETE';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(config.headers as Record<string, string>),
  };

  const body =
    config.data !== null && config.data !== undefined
      ? typeof config.data === 'string'
        ? config.data
        : JSON.stringify(config.data)
      : undefined;

  try {
    const response = await pinnedFetch(url, {
      method,
      headers,
      body,
      pkPinning: true,
      sslPinning: { certs: CERT_PINS },
      timeoutInterval: config.timeout ?? 30000,
    });

    const text = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return {
      data,
      status: response.status,
      statusText: String(response.status),
      headers: response.headers,
      config,
      request: {},
    } as AxiosResponse;
  } catch (err: unknown) {
    logger.error('[SSL Pinning] Request failed', {
      component: 'sslPinningAdapter',
      url,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
