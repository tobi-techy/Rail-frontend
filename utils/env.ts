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
  const missing: string[] = [];

  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0 && !__DEV__) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const localhost = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';

  return {
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || localhost,
    EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
    EXPO_PUBLIC_ENV: (process.env.EXPO_PUBLIC_ENV as Env['EXPO_PUBLIC_ENV']) || 'development',
  };
}

export const env = validateEnv();
export const isDev = __DEV__ || env.EXPO_PUBLIC_ENV === 'development';
export const isProd = env.EXPO_PUBLIC_ENV === 'production';
