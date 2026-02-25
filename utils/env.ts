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

const DEFAULT_REMOTE_API_URL = 'https://api.userail.money/api';
const PHYSICAL_DEVICE_API_URL = process.env.EXPO_PUBLIC_STAGING_API_URL ?? DEFAULT_REMOTE_API_URL;
const SIMULATOR_API_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8080/api' : 'http://localhost:8080/api';

const DEFAULT_API_URLS: Record<NonNullable<Env['EXPO_PUBLIC_ENV']>, string> = {
  development: SIMULATOR_API_URL,
  staging: DEFAULT_REMOTE_API_URL,
  production: DEFAULT_REMOTE_API_URL,
};

function isLocalhostHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
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

function resolveApiUrl(rawApiUrl: string): string {
  if (__DEV__) {
    return resolveDevApiUrl(rawApiUrl);
  }

  try {
    const parsed = new URL(rawApiUrl);
    const normalized = parsed.toString().replace(/\/$/, '');

    if (isPlaceholderHost(parsed.hostname)) {
      return DEFAULT_REMOTE_API_URL;
    }

    if (Device.isDevice && isLocalhostHost(parsed.hostname)) {
      return resolveDeviceFallbackUrl();
    }

    return normalized;
  } catch {
    return normalizeUrl(rawApiUrl) ?? resolveDeviceFallbackUrl();
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
    EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
    EXPO_PUBLIC_ENV: runtimeEnv,
  };
}

export const env = validateEnv();
export const isDev = __DEV__ || env.EXPO_PUBLIC_ENV === 'development';
export const isProd = env.EXPO_PUBLIC_ENV === 'production';
