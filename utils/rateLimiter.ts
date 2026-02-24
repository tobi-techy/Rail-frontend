/**
 * Rate Limiter
 * SECURITY: Implements client-side rate limiting to prevent accidental or malicious request floods
 */

interface RateLimitBucket {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private buckets: Map<string, RateLimitBucket> = new Map();
  private readonly defaultWindowMs: number;
  private readonly defaultMaxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.defaultWindowMs = windowMs;
    this.defaultMaxRequests = maxRequests;
  }

  /**
   * Check if request is allowed under rate limit
   * @param key Unique identifier (e.g., endpoint URL)
   * @param maxRequests Max requests per window (uses default if not specified)
   * @param windowMs Window duration in milliseconds (uses default if not specified)
   * @returns true if request is allowed, false if rate limited
   */
  isAllowed(key: string, maxRequests?: number, windowMs?: number): boolean {
    const now = Date.now();
    const window = windowMs || this.defaultWindowMs;
    const max = maxRequests || this.defaultMaxRequests;

    let bucket = this.buckets.get(key);

    // Create new bucket if doesn't exist or window has expired
    if (!bucket || now > bucket.resetTime) {
      bucket = {
        count: 1,
        resetTime: now + window,
      };
      this.buckets.set(key, bucket);
      return true;
    }

    // Check if limit exceeded
    if (bucket.count >= max) {
      return false;
    }

    // Increment counter
    bucket.count++;
    return true;
  }

  /**
   * Get remaining requests in current window
   */
  getRemaining(key: string, maxRequests?: number): number {
    const max = maxRequests || this.defaultMaxRequests;
    const bucket = this.buckets.get(key);

    if (!bucket || Date.now() > bucket.resetTime) {
      return max;
    }

    return Math.max(0, max - bucket.count);
  }

  /**
   * Get time until next window reset
   */
  getResetTime(key: string): number {
    const bucket = this.buckets.get(key);
    if (!bucket) return 0;
    return Math.max(0, bucket.resetTime - Date.now());
  }

  /**
   * Reset a specific bucket
   */
  reset(key: string): void {
    this.buckets.delete(key);
  }

  /**
   * Clear all buckets
   */
  clear(): void {
    this.buckets.clear();
  }
}

// Global rate limiters for different request types
export const apiRateLimiter = new RateLimiter(60000, 100); // 100 requests per minute
export const loginRateLimiter = new RateLimiter(300000, 5); // 5 login attempts per 5 minutes
export const passwordResetRateLimiter = new RateLimiter(3600000, 3); // 3 resets per hour
export const fileUploadRateLimiter = new RateLimiter(60000, 10); // 10 uploads per minute
