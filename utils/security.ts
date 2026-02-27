import { RateLimiter as BaseRateLimiter } from './rateLimiter';

/**
 * Rate limiter for sensitive operations.
 * Wraps the shared RateLimiter with the legacy check/reset/getRemainingTime API.
 */
class RateLimiter {
  private base = new BaseRateLimiter();

  check(key: string, maxAttempts: number, windowMs: number): boolean {
    return this.base.isAllowed(key, maxAttempts, windowMs);
  }

  reset(key: string) {
    this.base.reset(key);
  }

  getRemainingTime(key: string): number {
    return this.base.getResetTime(key);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Sensitive operation rate limits
 */
export const RATE_LIMITS = {
  LOGIN: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 min
  PASSCODE: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  TRANSFER: { maxAttempts: 10, windowMs: 60 * 1000 }, // 10 per minute
  OTP_REQUEST: { maxAttempts: 3, windowMs: 60 * 1000 }, // 3 per minute
} as const;

/**
 * Mask sensitive data for logging
 */
export const maskSensitiveData = (data: Record<string, unknown>): Record<string, unknown> => {
  const sensitiveKeys = ['password', 'passcode', 'token', 'secret', 'pin', 'ssn', 'cardNumber'];
  const masked = { ...data };

  for (const key of Object.keys(masked)) {
    if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
      masked[key] = '***REDACTED***';
    }
  }

  return masked;
};

/**
 * Validate that a string doesn't contain potential injection attacks.
 * Used at form submission sites to sanitize user input.
 */
export const isSafeInput = (input: string): boolean => {
  const dangerousPatterns = [/<script/i, /javascript:/i, /on\w+=/i, /data:/i, /vbscript:/i];
  return !dangerousPatterns.some((pattern) => pattern.test(input));
};

/**
 * Certificate pinning configuration (for native implementation)
 * Note: Actual pinning requires native module setup
 */
export const CERTIFICATE_PINS = {
  // Add your API domain certificate pins here
  // 'api.yourdomain.com': ['sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='],
} as const;
