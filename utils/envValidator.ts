/**
 * Environment Variable Validator
 * Validates critical environment variables on app startup
 * Ensures production safety and proper configuration
 */

import { logger } from '../lib/logger';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate all critical environment variables
 * MUST be called on app startup before any API calls
 */
export function validateEnvironmentVariables(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = !__DEV__;

  // CRITICAL: Production must have API URL
  if (isProduction && !process.env.EXPO_PUBLIC_API_URL) {
    errors.push('EXPO_PUBLIC_API_URL not set - API calls will fail in production');
  }

  // CRITICAL: Production must have SSL pinning configured
  if (isProduction) {
    const hasSslPinning = process.env.EXPO_PUBLIC_SSL_PINNING_ENABLED !== 'false';
    const hasPin1 = !!process.env.EXPO_PUBLIC_CERT_PIN_1;
    const hasPin2 = !!process.env.EXPO_PUBLIC_CERT_PIN_2;

    if (hasSslPinning && (!hasPin1 || !hasPin2)) {
      errors.push(
        'SSL Pinning enabled but certificate pins not configured. Set EXPO_PUBLIC_CERT_PIN_1 and EXPO_PUBLIC_CERT_PIN_2'
      );
    }

    if (!hasSslPinning && process.env.EXPO_PUBLIC_SSL_PINNING_ENABLED === 'false') {
      warnings.push(
        'WARNING: SSL Pinning disabled in production. This reduces security against MITM attacks.'
      );
    }
  }

  // CRITICAL: Production should have Sentry configured for error tracking
  if (isProduction && !process.env.EXPO_PUBLIC_SENTRY_DSN) {
    warnings.push('EXPO_PUBLIC_SENTRY_DSN not set - error tracking disabled in production');
  }

  // Log results
  if (errors.length > 0 || warnings.length > 0) {
    logger.warn('Environment validation results', {
      component: 'EnvValidator',
      action: 'validation-complete',
      isProduction,
      errorCount: errors.length,
      warningCount: warnings.length,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } else {
    logger.info('Environment variables validated successfully', {
      component: 'EnvValidator',
      action: 'validation-complete',
      isProduction,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get validated API URL with fallback warning
 */
export function getValidatedApiUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;

  if (!url) {
    logger.warn('API URL not configured, using fallback', {
      component: 'EnvValidator',
      action: 'api-url-fallback',
      isDev: __DEV__,
    });
    return 'http://localhost:3000'; // Safe default for dev only
  }

  return url;
}

/**
 * Validate that SSL pinning is properly configured
 * Returns true only if pins are actually configured
 */
export function isSslPinningProperlyConfigured(): boolean {
  if (__DEV__) return false; // Disabled in dev

  const enabled = process.env.EXPO_PUBLIC_SSL_PINNING_ENABLED !== 'false';
  const pin1 = !!process.env.EXPO_PUBLIC_CERT_PIN_1;
  const pin2 = !!process.env.EXPO_PUBLIC_CERT_PIN_2;

  return enabled && pin1 && pin2;
}

/**
 * Get all resolved environment configuration
 * Useful for debugging environment issues
 */
export function getResolvedConfig() {
  return {
    isDevelopment: __DEV__,
    isProduction: !__DEV__,
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    sslPinningEnabled: process.env.EXPO_PUBLIC_SSL_PINNING_ENABLED !== 'false',
    hasCertPin1: !!process.env.EXPO_PUBLIC_CERT_PIN_1,
    hasCertPin2: !!process.env.EXPO_PUBLIC_CERT_PIN_2,
    sentryDsnConfigured: !!process.env.EXPO_PUBLIC_SENTRY_DSN,
    nodeEnv: process.env.NODE_ENV,
    appVersion: process.env.EXPO_PUBLIC_APP_VERSION,
  };
}
