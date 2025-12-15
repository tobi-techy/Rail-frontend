import { Platform } from 'react-native';

/**
 * Rate limiter for sensitive operations
 */
class RateLimiter {
  private attempts: Map<string, { count: number; resetAt: number }> = new Map();

  check(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now > record.resetAt) {
      this.attempts.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (record.count >= maxAttempts) {
      return false;
    }

    record.count++;
    return true;
  }

  reset(key: string) {
    this.attempts.delete(key);
  }

  getRemainingTime(key: string): number {
    const record = this.attempts.get(key);
    if (!record) return 0;
    return Math.max(0, record.resetAt - Date.now());
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
 * Validate that a string doesn't contain potential injection attacks
 */
export const isSafeInput = (input: string): boolean => {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /data:/i,
    /vbscript:/i,
  ];

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
