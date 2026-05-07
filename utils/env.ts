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

type RuntimeEnv = NonNullable<Env['EXPO_PUBLIC_ENV']>;

const DEFAULT_REMOTE_API_URL = 'https://api.userail.money/api';
const DEFAULT_STAGING_API_URL = 'https://api-staging.userail.money/api';
const PHYSICAL_DEVICE_API_URL = process.env.EXPO_PUBLIC_STAGING_API_URL ?? DEFAULT_STAGING_API_URL;
const SIMULATOR_API_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8080/api' : 'http://localhost:8080/api';

const DEFAULT_API_URLS: Record<RuntimeEnv, string> = {
  development: SIMULATOR_API_URL,
  staging: DEFAULT_STAGING_API_URL,
  production: DEFAULT_REMOTE_API_URL,
};

const VALID_ENVS = new Set<RuntimeEnv>(['development', 'staging', 'production']);

function isLocalhostHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function isStagingHost(hostname: string): boolean {
  return hostname === 'api-staging.userail.money';
}

function isPlaceholderHost(hostname: string): boolean {
  return hostname === 'api.yourapp.com' || hostname === 'yourapp.com' || hostname === 'example.com';
}

function normalizeUrl(input?: string): string | null {
  if (!input) return null;
  try {
    return new URL(input).toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function resolveDeviceFallbackUrl(): string {
  return normalizeUrl(PHYSICAL_DEVICE_API_URL) ?? DEFAULT_REMOTE_API_URL;
}

function resolveDevApiUrl(rawApiUrl: string): string {
  const normalizedCandidate = normalizeUrl(rawApiUrl);

  if (!Device.isDevice) {
    // Simulators/emulators should keep localhost defaults for local backend testing.
    return normalizedCandidate ?? SIMULATOR_API_URL;
  }

  if (normalizedCandidate) {
    const parsed = new URL(normalizedCandidate);
    if (!isLocalhostHost(parsed.hostname) && !isPlaceholderHost(parsed.hostname)) {
      return normalizedCandidate;
    }
  }

  // Physical devices cannot resolve localhost and should avoid placeholder hosts.
  return resolveDeviceFallbackUrl();
}

function resolveReleaseApiUrl(rawApiUrl: string): string {
  const normalizedCandidate = normalizeUrl(rawApiUrl);

  if (!normalizedCandidate) {
    return DEFAULT_REMOTE_API_URL;
  }

  const parsed = new URL(normalizedCandidate);
  if (
    isPlaceholderHost(parsed.hostname) ||
    isLocalhostHost(parsed.hostname) ||
    isStagingHost(parsed.hostname)
  ) {
    return DEFAULT_REMOTE_API_URL;
  }

  return normalizedCandidate;
}

function resolveApiUrl(rawApiUrl: string): string {
  if (__DEV__) {
    return resolveDevApiUrl(rawApiUrl);
  }

  return resolveReleaseApiUrl(rawApiUrl);
}

function resolveRuntimeEnv(): RuntimeEnv {
  const configuredEnv = process.env.EXPO_PUBLIC_ENV;
  const fallbackEnv: RuntimeEnv = __DEV__ ? 'development' : 'production';
  const runtimeEnv = VALID_ENVS.has(configuredEnv as RuntimeEnv)
    ? (configuredEnv as RuntimeEnv)
    : fallbackEnv;

  // Staging is only valid for development bundles. A TestFlight/App Store build
  // must not inherit a local .env or update-time staging environment.
  if (!__DEV__ && runtimeEnv !== 'production') {
    return 'production';
  }

  return runtimeEnv;
}

function validateEnv(): Env {
  const runtimeEnv = resolveRuntimeEnv();

  // In release builds (including TestFlight), env vars can be missing depending on build path.
  // Use deterministic fallback URLs by environment.
  const rawApiUrl = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URLS[runtimeEnv];
  const apiUrl = resolveApiUrl(rawApiUrl);

  if (!apiUrl && !__DEV__) {
    console.warn('EXPO_PUBLIC_API_URL not set, using fallback');
  }

  return {
    EXPO_PUBLIC_API_URL: apiUrl || DEFAULT_API_URLS[runtimeEnv],
    EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
    EXPO_PUBLIC_ENV: runtimeEnv,
  };
}

export const env = validateEnv();
if (__DEV__) {
  console.log('[Rail ENV]', env.EXPO_PUBLIC_ENV, '→', env.EXPO_PUBLIC_API_URL);
}
export const isDev = __DEV__ || env.EXPO_PUBLIC_ENV === 'development';
export const isProd = env.EXPO_PUBLIC_ENV === 'production';
