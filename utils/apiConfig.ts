/**
 * API Configuration and Global Request Handling
 * Centralizes timeout, retry, and error handling configuration
 */

import { logger } from '../lib/logger';

/**
 * Global API request timeout in milliseconds
 * Different operations may override this
 */
export const API_TIMEOUTS = {
  // Short operations (login, validation)
  QUICK: 10000, // 10 seconds

  // Normal operations (CRUD, queries)
  NORMAL: 15000, // 15 seconds

  // Long operations (uploads, complex processing)
  LONG: 30000, // 30 seconds

  // Health checks and background operations
  BACKGROUND: 5000, // 5 seconds
};

/**
 * Retry configuration for different error types
 */
export const RETRY_CONFIG = {
  // Max retry attempts
  MAX_RETRIES: 3,

  // Base delay in milliseconds (will be multiplied exponentially)
  BASE_DELAY: 1000,

  // Exponential backoff multiplier (delay * multiplier^attempt)
  BACKOFF_MULTIPLIER: 2,

  // Maximum delay between retries
  MAX_DELAY: 30000,

  // Jitter percentage (0.1 = 10%)
  JITTER_PERCENTAGE: 0.1,
};

/**
 * Determine if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  const status = error?.status ?? error?.response?.status ?? 0;

  // Retry on:
  // - Network errors (status 0)
  // - 5xx server errors
  // - 429 rate limiting
  return (
    status === 0 ||
    status === 429 ||
    (status >= 500 && status < 600) ||
    error?.code === 'ECONNABORTED' || // Timeout
    error?.code === 'ENOTFOUND' || // DNS error
    error?.code === 'ENETUNREACH' || // Network unreachable
    error?.message?.includes('timeout')
  );
}

/**
 * Calculate delay for retry with exponential backoff and jitter
 */
export function calculateRetryDelay(
  attempt: number,
  baseDelay: number = RETRY_CONFIG.BASE_DELAY,
  multiplier: number = RETRY_CONFIG.BACKOFF_MULTIPLIER,
  maxDelay: number = RETRY_CONFIG.MAX_DELAY,
  jitterPercentage: number = RETRY_CONFIG.JITTER_PERCENTAGE
): number {
  // Exponential backoff: baseDelay * (multiplier ^ attempt)
  const exponentialDelay = baseDelay * Math.pow(multiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter to prevent thundering herd
  const jitterAmount = cappedDelay * jitterPercentage;
  const jitter = (Math.random() - 0.5) * 2 * jitterAmount;

  const finalDelay = Math.max(0, cappedDelay + jitter);

  logger.debug('[RetryConfig] Calculated retry delay', {
    component: 'ApiConfig',
    action: 'calculate-retry-delay',
    attempt,
    exponentialDelay: Math.round(exponentialDelay),
    cappedDelay,
    jitter: Math.round(jitter),
    finalDelay: Math.round(finalDelay),
  });

  return finalDelay;
}

/**
 * Get timeout for specific operation type
 */
export function getTimeoutForOperation(
  operationType: 'quick' | 'normal' | 'long' | 'background' = 'normal'
): number {
  const timeouts = {
    quick: API_TIMEOUTS.QUICK,
    normal: API_TIMEOUTS.NORMAL,
    long: API_TIMEOUTS.LONG,
    background: API_TIMEOUTS.BACKGROUND,
  };

  return timeouts[operationType];
}

/**
 * Configure axios instance with global timeouts
 * Called automatically by API client
 */
export function configureApiGlobalTimeout(axiosInstance: any): void {
  axiosInstance.defaults.timeout = API_TIMEOUTS.NORMAL;

  logger.debug('[ApiConfig] Global timeout configured', {
    component: 'ApiConfig',
    action: 'timeout-configured',
    timeoutMs: API_TIMEOUTS.NORMAL,
  });
}

/**
 * Wrap a request with timeout handling
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName?: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => {
      const error = new Error(`Request timeout after ${timeoutMs}ms`);
      (error as any).code = 'ECONNABORTED';
      (error as any).isTimeout = true;
      reject(error);
    }, timeoutMs)
  );

  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (error) {
    if ((error as any).isTimeout) {
      logger.warn(`[ApiConfig] Operation timeout: ${operationName || 'unknown'}`, {
        component: 'ApiConfig',
        action: 'operation-timeout',
        operationName,
        timeoutMs,
      });
    }
    throw error;
  }
}
