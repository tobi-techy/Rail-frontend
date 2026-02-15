import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

/**
 * Environment configuration with runtime validation
 */

const requiredEnvVars = ['EXPO_PUBLIC_API_URL'] as const;
// const optionalEnvVars = ['EXPO_PUBLIC_SENTRY_DSN', 'EXPO_PUBLIC_ENV'] as const;

// type RequiredEnv = (typeof requiredEnvVars)[number];
// type OptionalEnv = (typeof optionalEnvVars)[number];

interface Env {
  EXPO_PUBLIC_API_URL: string;
  EXPO_PUBLIC_SENTRY_DSN?: string;
  EXPO_PUBLIC_ENV?: 'development' | 'staging' | 'production';
}

const DEFAULT_API_URLS: Record<NonNullable<Env['EXPO_PUBLIC_ENV']>, string> = {
  development: Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080',
  staging: 'https://rail-backend-service-production.up.railway.app/api',
  production: 'https://api.userail.money/api',
};

function getExpoHost(): string | null {
  const constants = Constants as any;
  const hostUri =
    constants?.expoConfig?.hostUri ||
    constants?.manifest2?.extra?.expoClient?.hostUri ||
    constants?.manifest?.debuggerHost;

  if (!hostUri || typeof hostUri !== 'string') {
    return null;
  }

  const host = hostUri.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return null;
  }

  return host;
}

function resolveApiUrl(rawApiUrl: string): string {
  try {
    const parsed = new URL(rawApiUrl);
    const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

    if (__DEV__ && Device.isDevice && isLocalhost) {
      const expoHost = getExpoHost();
      if (expoHost) {
        parsed.hostname = expoHost;
        return parsed.toString().replace(/\/$/, '');
      }
    }

    return rawApiUrl;
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
