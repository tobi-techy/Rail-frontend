/**
 * Passcode Attempt Rate Limiter
 * Tracks failed attempts and implements exponential backoff
 *
 * SECURITY:
 * - Limits attempts to prevent brute force attacks
 * - Implements lockout period after max attempts
 * - Per-user tracking prevents cross-user attacks
 * - Memory-based (local to app instance)
 */

import { logger } from '@/lib/logger';

interface AttemptRecord {
  attempts: number;
  lastAttemptTime: number;
  lockedUntil?: number;
  resetWindowStart: number;
}

class PasscodeRateLimiter {
  private attemptMap = new Map<string, AttemptRecord>();

  // Configuration - can be adjusted
  private readonly MAX_ATTEMPTS = 3; // Lock after 3 failed attempts
  private readonly LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly RESET_WINDOW = 15 * 60 * 1000; // 15 minutes
  private readonly EXPONENTIAL_BACKOFF_ENABLED = true;

  /**
   * Check if user can attempt passcode verification
   * Returns { canAttempt, remainingTime }
   */
  checkAllowance(userId: string): {
    canAttempt: boolean;
    remainingMs?: number;
    attemptsRemaining: number;
  } {
    const now = Date.now();
    const record = this.attemptMap.get(userId);

    // No record = first attempt
    if (!record) {
      return {
        canAttempt: true,
        attemptsRemaining: this.MAX_ATTEMPTS,
      };
    }

    // Check if locked out
    if (record.lockedUntil && now < record.lockedUntil) {
      const remainingMs = record.lockedUntil - now;
      logger.warn('[PasscodeRateLimiter] User locked out', {
        component: 'PasscodeRateLimiter',
        action: 'locked-out',
        userId,
        remainingSeconds: Math.ceil(remainingMs / 1000),
      });

      return {
        canAttempt: false,
        remainingMs,
        attemptsRemaining: 0,
      };
    }

    // Reset attempts if outside reset window
    if (now - record.resetWindowStart > this.RESET_WINDOW) {
      logger.debug('[PasscodeRateLimiter] Resetting attempts (window expired)', {
        component: 'PasscodeRateLimiter',
        action: 'window-reset',
        userId,
      });

      const newRecord: AttemptRecord = {
        attempts: 0,
        lastAttemptTime: now,
        resetWindowStart: now,
      };
      this.attemptMap.set(userId, newRecord);

      return {
        canAttempt: true,
        attemptsRemaining: this.MAX_ATTEMPTS,
      };
    }

    // Check if max attempts reached
    if (record.attempts >= this.MAX_ATTEMPTS) {
      record.lockedUntil = now + this.LOCKOUT_DURATION;

      logger.warn('[PasscodeRateLimiter] Max attempts reached - locking out', {
        component: 'PasscodeRateLimiter',
        action: 'max-attempts',
        userId,
        lockoutDurationSeconds: Math.ceil(this.LOCKOUT_DURATION / 1000),
      });

      return {
        canAttempt: false,
        remainingMs: this.LOCKOUT_DURATION,
        attemptsRemaining: 0,
      };
    }

    return {
      canAttempt: true,
      attemptsRemaining: this.MAX_ATTEMPTS - record.attempts,
    };
  }

  /**
   * Record a failed attempt
   * Returns delay to wait before next attempt (exponential backoff)
   */
  recordFailedAttempt(userId: string): number {
    const now = Date.now();
    let record = this.attemptMap.get(userId);

    // Initialize new record
    if (!record) {
      record = {
        attempts: 1,
        lastAttemptTime: now,
        resetWindowStart: now,
      };
      this.attemptMap.set(userId, record);

      logger.debug('[PasscodeRateLimiter] First failed attempt', {
        component: 'PasscodeRateLimiter',
        action: 'first-attempt',
        userId,
      });

      return 0; // No delay for first attempt
    }

    // Reset if outside window
    if (now - record.resetWindowStart > this.RESET_WINDOW) {
      record.attempts = 1;
      record.resetWindowStart = now;
      record.lockedUntil = undefined;

      logger.debug('[PasscodeRateLimiter] Reset attempts (new window)', {
        component: 'PasscodeRateLimiter',
        action: 'new-window',
        userId,
      });

      return 0;
    }

    // Increment attempt count
    record.attempts += 1;
    record.lastAttemptTime = now;

    // Calculate exponential backoff delay
    let backoffDelay = 0;
    if (this.EXPONENTIAL_BACKOFF_ENABLED && record.attempts > 1) {
      // 2^(attempts-1) * 500ms = 500ms, 1s, 2s
      backoffDelay = Math.pow(2, record.attempts - 2) * 500;
    }

    logger.debug('[PasscodeRateLimiter] Failed attempt recorded', {
      component: 'PasscodeRateLimiter',
      action: 'failed-attempt',
      userId,
      attempts: record.attempts,
      backoffDelayMs: backoffDelay,
    });

    return backoffDelay;
  }

  /**
   * Record successful attempt - clears record
   */
  recordSuccessfulAttempt(userId: string): void {
    this.attemptMap.delete(userId);

    logger.debug('[PasscodeRateLimiter] Successful attempt - clearing record', {
      component: 'PasscodeRateLimiter',
      action: 'success',
      userId,
    });
  }

  /**
   * Clear all rate limit data (for testing or logout)
   */
  clear(userId?: string): void {
    if (userId) {
      this.attemptMap.delete(userId);
      logger.debug('[PasscodeRateLimiter] Cleared user record', {
        component: 'PasscodeRateLimiter',
        action: 'clear-user',
        userId,
      });
    } else {
      this.attemptMap.clear();
      logger.debug('[PasscodeRateLimiter] Cleared all records', {
        component: 'PasscodeRateLimiter',
        action: 'clear-all',
      });
    }
  }

  /**
   * Get current attempt info for user (for UI display)
   */
  getAttemptInfo(userId: string): {
    attempts: number;
    attemptsRemaining: number;
    isLocked: boolean;
    lockoutRemainingSeconds?: number;
  } {
    const now = Date.now();
    const record = this.attemptMap.get(userId);

    if (!record) {
      return {
        attempts: 0,
        attemptsRemaining: this.MAX_ATTEMPTS,
        isLocked: false,
      };
    }

    // Check if locked
    if (record.lockedUntil && now < record.lockedUntil) {
      return {
        attempts: record.attempts,
        attemptsRemaining: 0,
        isLocked: true,
        lockoutRemainingSeconds: Math.ceil((record.lockedUntil - now) / 1000),
      };
    }

    // Reset if outside window
    if (now - record.resetWindowStart > this.RESET_WINDOW) {
      return {
        attempts: 0,
        attemptsRemaining: this.MAX_ATTEMPTS,
        isLocked: false,
      };
    }

    return {
      attempts: record.attempts,
      attemptsRemaining: Math.max(0, this.MAX_ATTEMPTS - record.attempts),
      isLocked: false,
    };
  }
}

// Export singleton instance
export const passcodeRateLimiter = new PasscodeRateLimiter();

export default passcodeRateLimiter;
