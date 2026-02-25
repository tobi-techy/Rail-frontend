/**
 * Passcode Attempt Rate Limiter
 * Tracks failed attempts and implements exponential backoff
 *
 * SECURITY:
 * - Limits attempts to prevent brute force attacks
 * - Implements lockout period after max attempts
 * - Per-user tracking prevents cross-user attacks
 * - Persisted to SecureStore so lockouts survive app restarts
 */

import { logger } from '@/lib/logger';
import { secureStorage } from '@/utils/secureStorage';

interface AttemptRecord {
  attempts: number;
  lastAttemptTime: number;
  lockedUntil?: number;
  resetWindowStart: number;
}

const STORAGE_KEY_PREFIX = 'passcode_rate_limit_';

class PasscodeRateLimiter {
  private attemptMap = new Map<string, AttemptRecord>();

  private readonly MAX_ATTEMPTS = 3;
  private readonly LOCKOUT_DURATION = 5 * 60 * 1000;
  private readonly RESET_WINDOW = 15 * 60 * 1000;
  private readonly EXPONENTIAL_BACKOFF_ENABLED = true;

  private async load(userId: string): Promise<AttemptRecord | null> {
    try {
      const raw = await secureStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
      if (!raw) return null;
      return JSON.parse(raw) as AttemptRecord;
    } catch {
      return null;
    }
  }

  private async save(userId: string, record: AttemptRecord): Promise<void> {
    try {
      await secureStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(record));
    } catch (e) {
      logger.warn('[PasscodeRateLimiter] Failed to persist record', { userId });
    }
  }

  private async delete(userId: string): Promise<void> {
    try {
      await secureStorage.deleteItem(`${STORAGE_KEY_PREFIX}${userId}`);
    } catch {}
    this.attemptMap.delete(userId);
  }

  private async getRecord(userId: string): Promise<AttemptRecord | null> {
    if (this.attemptMap.has(userId)) return this.attemptMap.get(userId)!;
    const stored = await this.load(userId);
    if (stored) this.attemptMap.set(userId, stored);
    return stored;
  }

  async checkAllowance(userId: string): Promise<{
    canAttempt: boolean;
    remainingMs?: number;
    attemptsRemaining: number;
  }> {
    const now = Date.now();
    const record = await this.getRecord(userId);

    if (!record) return { canAttempt: true, attemptsRemaining: this.MAX_ATTEMPTS };

    if (record.lockedUntil && now < record.lockedUntil) {
      return { canAttempt: false, remainingMs: record.lockedUntil - now, attemptsRemaining: 0 };
    }

    if (now - record.resetWindowStart > this.RESET_WINDOW) {
      await this.delete(userId);
      return { canAttempt: true, attemptsRemaining: this.MAX_ATTEMPTS };
    }

    if (record.attempts >= this.MAX_ATTEMPTS) {
      record.lockedUntil = now + this.LOCKOUT_DURATION;
      this.attemptMap.set(userId, record);
      await this.save(userId, record);
      return { canAttempt: false, remainingMs: this.LOCKOUT_DURATION, attemptsRemaining: 0 };
    }

    return { canAttempt: true, attemptsRemaining: this.MAX_ATTEMPTS - record.attempts };
  }

  async recordFailedAttempt(userId: string): Promise<number> {
    const now = Date.now();
    let record = await this.getRecord(userId);

    if (!record || now - record.resetWindowStart > this.RESET_WINDOW) {
      record = { attempts: 1, lastAttemptTime: now, resetWindowStart: now };
      this.attemptMap.set(userId, record);
      await this.save(userId, record);
      return 0;
    }

    record.attempts += 1;
    record.lastAttemptTime = now;
    this.attemptMap.set(userId, record);
    await this.save(userId, record);

    let backoffDelay = 0;
    if (this.EXPONENTIAL_BACKOFF_ENABLED && record.attempts > 1) {
      backoffDelay = Math.pow(2, record.attempts - 2) * 500;
    }
    return backoffDelay;
  }

  async recordSuccessfulAttempt(userId: string): Promise<void> {
    await this.delete(userId);
  }

  async clear(userId?: string): Promise<void> {
    if (userId) {
      await this.delete(userId);
    } else {
      const keys = [...this.attemptMap.keys()];
      await Promise.all(keys.map((k) => this.delete(k)));
    }
  }

  async getAttemptInfo(userId: string): Promise<{
    attempts: number;
    attemptsRemaining: number;
    isLocked: boolean;
    lockoutRemainingSeconds?: number;
  }> {
    const now = Date.now();
    const record = await this.getRecord(userId);

    if (!record) return { attempts: 0, attemptsRemaining: this.MAX_ATTEMPTS, isLocked: false };

    if (record.lockedUntil && now < record.lockedUntil) {
      return {
        attempts: record.attempts,
        attemptsRemaining: 0,
        isLocked: true,
        lockoutRemainingSeconds: Math.ceil((record.lockedUntil - now) / 1000),
      };
    }

    if (now - record.resetWindowStart > this.RESET_WINDOW) {
      return { attempts: 0, attemptsRemaining: this.MAX_ATTEMPTS, isLocked: false };
    }

    return {
      attempts: record.attempts,
      attemptsRemaining: Math.max(0, this.MAX_ATTEMPTS - record.attempts),
      isLocked: false,
    };
  }
}

export const passcodeRateLimiter = new PasscodeRateLimiter();
export default passcodeRateLimiter;
