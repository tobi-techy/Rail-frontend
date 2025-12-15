/**
 * Environment configuration with runtime validation
 */

const requiredEnvVars = ['EXPO_PUBLIC_API_URL'] as const;
const optionalEnvVars = ['EXPO_PUBLIC_SENTRY_DSN', 'EXPO_PUBLIC_ENV'] as const;

type RequiredEnv = (typeof requiredEnvVars)[number];
type OptionalEnv = (typeof optionalEnvVars)[number];

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

  return {
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
    EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
    EXPO_PUBLIC_ENV: (process.env.EXPO_PUBLIC_ENV as Env['EXPO_PUBLIC_ENV']) || 'development',
  };
}

export const env = validateEnv();
export const isDev = __DEV__ || env.EXPO_PUBLIC_ENV === 'development';
export const isProd = env.EXPO_PUBLIC_ENV === 'production';
