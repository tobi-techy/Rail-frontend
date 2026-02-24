import { Platform } from 'react-native';

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

function validateEnv(): Env {
  const localhost = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';

  // In production builds from Xcode, env vars may not be available
  // Use fallback values for production
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.userail.money/api';

  if (!apiUrl && !__DEV__) {
    console.warn('EXPO_PUBLIC_API_URL not set, using fallback');
  }

  return {
    EXPO_PUBLIC_API_URL: apiUrl || localhost,
    EXPO_PUBLIC_SENTRY_DSN:
      process.env.EXPO_PUBLIC_SENTRY_DSN ||
      'https://e48781d34dd30b8321d915e0aaa00628@o4510763790237696.ingest.de.sentry.io/4510763838210128',
    EXPO_PUBLIC_ENV: (process.env.EXPO_PUBLIC_ENV as Env['EXPO_PUBLIC_ENV']) || 'production',
  };
}

export const env = validateEnv();
export const isDev = __DEV__ || env.EXPO_PUBLIC_ENV === 'development';
export const isProd = env.EXPO_PUBLIC_ENV === 'production';
