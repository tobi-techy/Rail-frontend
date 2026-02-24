import { Platform } from 'react-native';
import * as Device from 'expo-device';

/**
 * Environment configuration with runtime validation
 */

interface Env {
  EXPO_PUBLIC_API_URL: string;
  EXPO_PUBLIC_SENTRY_DSN?: string;
  EXPO_PUBLIC_ENV?: 'development' | 'staging' | 'production';
}

const PHYSICAL_DEVICE_API_URL = 'https://rail-backend-service-production.up.railway.app/api';
const SIMULATOR_API_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8080/api' : 'http://localhost:8080/api';

const DEFAULT_API_URLS: Record<NonNullable<Env['EXPO_PUBLIC_ENV']>, string> = {
  development: SIMULATOR_API_URL,
  staging: 'https://rail-backend-service-production.up.railway.app/api',
  production: 'https://api.userail.money/api',
};

function resolveApiUrl(rawApiUrl: string): string {
  if (__DEV__) {
    return Device.isDevice ? PHYSICAL_DEVICE_API_URL : SIMULATOR_API_URL;
  }

  try {
    const parsed = new URL(rawApiUrl);
    const isLocalhost =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '::1';

    if (Device.isDevice && isLocalhost) {
      return PHYSICAL_DEVICE_API_URL;
    }

    return parsed.toString().replace(/\/$/, '');
  } catch {
    return rawApiUrl;
  }
}

function validateEnv(): Env {
  const fallbackEnv: NonNullable<Env['EXPO_PUBLIC_ENV']> = __DEV__ ? 'development' : 'staging';
  const runtimeEnv =
    (process.env.EXPO_PUBLIC_ENV as Env['EXPO_PUBLIC_ENV']) || fallbackEnv || 'development';

  // In release builds (including TestFlight), env vars can be missing depending on build path.
  // Use deterministic fallback URLs by environment.
  const rawApiUrl = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URLS[runtimeEnv];
  const apiUrl = resolveApiUrl(rawApiUrl);

  if (!apiUrl && !__DEV__) {
    console.warn('EXPO_PUBLIC_API_URL not set, using fallback');
  }

  return {
    EXPO_PUBLIC_API_URL: apiUrl || DEFAULT_API_URLS.development,
    EXPO_PUBLIC_SENTRY_DSN:
      process.env.EXPO_PUBLIC_SENTRY_DSN ||
      'https://e48781d34dd30b8321d915e0aaa00628@o4510763790237696.ingest.de.sentry.io/4510763838210128',
    EXPO_PUBLIC_ENV: runtimeEnv,
  };
}

export const env = validateEnv();
export const isDev = __DEV__ || env.EXPO_PUBLIC_ENV === 'development';
export const isProd = env.EXPO_PUBLIC_ENV === 'production';
