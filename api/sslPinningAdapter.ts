/**
 * Axios adapter that routes requests through react-native-ssl-pinning.
 * Only active in production when cert pins are configured.
 */
import { fetch as pinnedFetch } from 'react-native-ssl-pinning';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '../lib/logger';

const CERT_PINS = [process.env.EXPO_PUBLIC_CERT_PIN_1, process.env.EXPO_PUBLIC_CERT_PIN_2].filter(
  Boolean
) as string[];

// SSL pinning disabled until .cer cert files are bundled in the iOS app
export const SSL_PINNING_ACTIVE = false;

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
