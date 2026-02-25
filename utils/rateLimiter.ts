/**
 * Rate Limiter
 * SECURITY: Implements client-side rate limiting to prevent accidental or malicious request floods.
 * Login and password-reset limiters are persisted to SecureStore so they survive app restarts.
 */

import { secureStorage } from './secureStorage';
import { logger } from '../lib/logger';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

// NOTE: Client-side rate limiting is a UX safeguard only.
// Server-side rate limiting is the authoritative defence against brute force.
// The device suffix scopes the key to this install so a reinstall resets the counter —
// acceptable since the server enforces the real limit.
async function getDeviceSuffix(): Promise<string> {
  try {
    const id =
      Platform.OS === 'ios'
        ? await Application.getIosIdForVendorAsync()
        : Application.getAndroidId();
    return id ? `_${id.slice(0, 8)}` : '';
  } catch {
    return '';
  }
}

// ── In-memory limiter (non-critical endpoints) ────────────────────────────────

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

  isAllowed(key: string, maxRequests?: number, windowMs?: number): boolean {
    const now = Date.now();
    const window = windowMs || this.defaultWindowMs;
    const max = maxRequests || this.defaultMaxRequests;
    const bucket = this.buckets.get(key);
    if (!bucket || now > bucket.resetTime) {
      this.buckets.set(key, { count: 1, resetTime: now + window });
      return true;
    }
    if (bucket.count >= max) return false;
    bucket.count++;
    return true;
  }

  getRemaining(key: string, maxRequests?: number): number {
    const max = maxRequests || this.defaultMaxRequests;
    const bucket = this.buckets.get(key);
    if (!bucket || Date.now() > bucket.resetTime) return max;
    return Math.max(0, max - bucket.count);
  }

  getResetTime(key: string): number {
    const bucket = this.buckets.get(key);
    if (!bucket) return 0;
    return Math.max(0, bucket.resetTime - Date.now());
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }

  clear(): void {
    this.buckets.clear();
  }
}

// ── Persistent limiter (login / password reset) ───────────────────────────────

interface PersistedBucket {
  count: number;
  resetTime: number;
}

class PersistentRateLimiter {
  private cache: Map<string, PersistedBucket> = new Map();

  constructor(
    private readonly windowMs: number,
    private readonly maxRequests: number,
    private readonly storagePrefix: string
  ) {}

  private storageKey(key: string) {
    return `${this.storagePrefix}${key}`;
  }

  private async storageKeyAsync(key: string): Promise<string> {
    const suffix = await getDeviceSuffix();
    return `${this.storagePrefix}${key}${suffix}`;
  }

  private async load(key: string): Promise<PersistedBucket | null> {
    try {
      const raw = await secureStorage.getItem(await this.storageKeyAsync(key));
      if (!raw) return null;
      return JSON.parse(raw) as PersistedBucket;
    } catch {
      return null;
    }
  }

  private async save(key: string, bucket: PersistedBucket): Promise<void> {
    try {
      await secureStorage.setItem(await this.storageKeyAsync(key), JSON.stringify(bucket));
    } catch (e) {
      logger.warn('[PersistentRateLimiter] Failed to persist bucket', { key });
    }
  }

  private async getBucket(key: string): Promise<PersistedBucket | null> {
    if (this.cache.has(key)) return this.cache.get(key)!;
    const stored = await this.load(key);
    if (stored) this.cache.set(key, stored);
    return stored;
  }

  async isAllowed(key: string): Promise<boolean> {
    const now = Date.now();
    let bucket = await this.getBucket(key);

    if (!bucket || now > bucket.resetTime) {
      bucket = { count: 1, resetTime: now + this.windowMs };
      this.cache.set(key, bucket);
      await this.save(key, bucket);
      return true;
    }

    if (bucket.count >= this.maxRequests) return false;

    bucket.count++;
    this.cache.set(key, bucket);
    await this.save(key, bucket);
    return true;
  }

  async getResetTime(key: string): Promise<number> {
    const bucket = await this.getBucket(key);
    if (!bucket) return 0;
    return Math.max(0, bucket.resetTime - Date.now());
  }

  async reset(key: string): Promise<void> {
    this.cache.delete(key);
    try {
      await secureStorage.deleteItem(await this.storageKeyAsync(key));
    } catch {}
  }
}

// ── Exports ───────────────────────────────────────────────────────────────────

export const apiRateLimiter = new RateLimiter(60000, 100);
export const fileUploadRateLimiter = new RateLimiter(60000, 10);

export const loginRateLimiter = new PersistentRateLimiter(300000, 5, 'rl_login_');
export const passwordResetRateLimiter = new PersistentRateLimiter(3600000, 3, 'rl_pwreset_');
