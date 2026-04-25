/**
 * Axios adapter that routes requests through react-native-ssl-pinning.
 * Only active in production when cert pins are configured.
 *
 * SECURITY: Uses public-key (SPKI) pinning via sha256 hashes.
 * Generate pins with:
 *   openssl s_client -connect api.userail.money:443 -servername api.userail.money 2>/dev/null \
 *     | sed -n '/-----BEGIN CERTIFICATE-----/,/-----END CERTIFICATE-----/p' > leaf.pem
 *   openssl x509 -in leaf.pem -pubkey -noout \
 *     | openssl pkey -pubin -outform der \
 *     | openssl dgst -sha256 -binary | openssl enc -base64
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

/**
 * SECURITY FIX (C-1/C-2): SSL pinning is only active when valid pins exist.
 * In production without pins, the app logs an error but still functions
 * (the backend should be the ultimate trust boundary).
 */
export const SSL_PINNING_ACTIVE = !__DEV__ && CERT_PINS.length > 0;

if (!__DEV__) {
  if (CERT_PINS.length === 0) {
    logger.error(
      '[SSL Pinning] CRITICAL: No valid certificate pins configured in production. ' +
        'All requests will use standard TLS without pinning. ' +
        'Set EXPO_PUBLIC_CERT_PIN_1 and EXPO_PUBLIC_CERT_PIN_2.',
      { component: 'sslPinningAdapter', action: 'no-pins-configured' }
    );
  }

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
    /**
     * SECURITY FIX (C-1): Use pkPinning with actual SPKI sha256 hashes
     * instead of passing hostnames to the certs array.
     *
     * pkPinning: true  → uses public-key pinning (SPKI hashes)
     * sslPinning.certs → array of "sha256/BASE64HASH" strings
     */
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
    const errorMessage = err instanceof Error ? err.message : String(err);
    const isPinMismatch =
      errorMessage.includes('Certificate pinning') ||
      errorMessage.includes('SSL') ||
      errorMessage.includes('Trust anchor');

    logger.error('[SSL Pinning] Request failed', {
      component: 'sslPinningAdapter',
      url,
      isPinMismatch,
      error: errorMessage,
    });
    throw err;
  }
}
