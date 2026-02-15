/**
 * Offline Queue
 * Queues failed mutations when offline and retries on reconnect
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import type { TransformedApiError } from './types';
import apiClient from './client';
import { errorLogger } from '../utils/errorLogger';
import { logger } from '../lib/logger';
import { encryptData, decryptData } from '../utils/encryption';

/**
 * Generate a unique ID using expo-crypto with cryptographically secure fallbacks
 * SECURITY: Uses crypto.getRandomValues() instead of Math.random()
 */
function generateUniqueId(): string {
  try {
    return Crypto.randomUUID();
  } catch {
    // Fallback 1: Use crypto-secure random generation
    try {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);

      // Set version (4) and variant bits
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;

      // Format as UUID string
      const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return [
        hex.substring(0, 8),
        hex.substring(8, 12),
        hex.substring(12, 16),
        hex.substring(16, 20),
        hex.substring(20, 32),
      ].join('-');
    } catch {
      // Fallback 2: Timestamp-based (better than Math.random)
      const now = Date.now().toString(16);
      const counter = Math.floor(performance.now() * 1000) % 0xffffff;
      return `${now.padStart(12, '0')}-0000-4000-8000-000000${counter.toString(16).padStart(6, '0')}`;
    }
  }
}

interface QueuedRequest {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  timestamp: number;
  retryCount?: number;
}

const QUEUE_KEY = 'offline_request_queue';
const MAX_QUEUE_SIZE = 50;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds - SECURITY: Prevents DOS via slow requests
const MIN_TIMEOUT_MS = 3000; // 3 seconds minimum
const MAX_TIMEOUT_MS = 30000; // 30 seconds maximum

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private unsubscribe: (() => void) | null = null;

  async init() {
    try {
      const encrypted = await AsyncStorage.getItem(QUEUE_KEY);
      if (encrypted) {
        try {
          const decrypted = await decryptData(encrypted);
          const parsed = JSON.parse(decrypted);

          // SECURITY: Validate queue items match schema
          if (!Array.isArray(parsed)) {
            throw new Error('Invalid queue format: expected array');
          }

          this.queue = parsed.filter((req: unknown) => {
            // Validate item structure
            if (typeof req !== 'object' || req === null) return false;
            const item = req as Record<string, unknown>;
            if (typeof item.id !== 'string') return false;
            if (typeof item.url !== 'string') return false;
            if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(item.method as string)) return false;
            if (typeof item.timestamp !== 'number' || item.timestamp < 0) return false;
            // Filter expired items
            return Date.now() - item.timestamp < MAX_AGE_MS;
          });

          await this.persist();
          logger.info('[OfflineQueue] Initialized with queued requests', {
            component: 'OfflineQueue',
            action: 'init-with-queue',
            queueLength: this.queue.length,
          });
        } catch (parseError) {
          logger.error(
            '[OfflineQueue] Failed to decrypt/parse queue from storage',
            parseError instanceof Error ? parseError : new Error(String(parseError))
          );
          this.queue = [];
        }
      }
    } catch (error) {
      logger.warn('[OfflineQueue] Failed to restore queue from storage', {
        component: 'OfflineQueue',
        action: 'init-failed',
        error: error instanceof Error ? error.message : String(error),
      });
      this.queue = [];
    }

    // Debounce network state changes to prevent rapid retries
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    this.unsubscribe = NetInfo.addEventListener((state) => {
      if (debounceTimer) clearTimeout(debounceTimer);

      if (state.isConnected) {
        debounceTimer = setTimeout(() => {
          logger.debug('[OfflineQueue] Network connected - processing queue', {
            component: 'OfflineQueue',
            action: 'network-connected',
            queueLength: this.queue.length,
          });
          this.processQueue();
        }, 500); // Debounce 500ms to avoid rapid reconnects
      }
    });
  }

  async add(request: Omit<QueuedRequest, 'id' | 'timestamp'>) {
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      const removed = this.queue.shift();
      logger.warn('[OfflineQueue] Queue full - discarding oldest request', {
        component: 'OfflineQueue',
        action: 'queue-full',
        discardedUrl: removed?.url,
        queueLength: this.queue.length,
      });
    }

    const queuedRequest = {
      ...request,
      id: generateUniqueId(),
      timestamp: Date.now(),
    };

    this.queue.push(queuedRequest);

    try {
      await this.persist();
      logger.debug('[OfflineQueue] Request queued', {
        component: 'OfflineQueue',
        action: 'request-added',
        requestId: queuedRequest.id,
        url: request.url,
        queueLength: this.queue.length,
      });
    } catch (persistError) {
      logger.error(
        '[OfflineQueue] Failed to persist newly added request',
        persistError instanceof Error ? persistError : new Error(String(persistError))
      );
      // Still keep in memory queue, but warn about persistence failure
      throw persistError;
    }
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      logger.debug('[OfflineQueue] Network disconnected - pausing queue processing', {
        component: 'OfflineQueue',
        action: 'queue-paused',
      });
      return;
    }

    this.isProcessing = true;
    logger.info('[OfflineQueue] Starting queue processing', {
      component: 'OfflineQueue',
      action: 'queue-start',
      queueLength: this.queue.length,
    });

    while (this.queue.length > 0) {
      const request = this.queue[0];

      try {
        // SECURITY: Add timeout to prevent queue from blocking on single slow request
        // This prevents DOS attacks where a slow/hanging request blocks the queue
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT_MS)
        );

        await Promise.race([
          apiClient.request({
            url: request.url,
            method: request.method,
            data: request.data,
            timeout: Math.min(REQUEST_TIMEOUT_MS - 1000, 9000), // Slightly less than race timeout
          }),
          timeoutPromise,
        ]);

        this.queue.shift();
        await this.persist();

        logger.info('[OfflineQueue] Request processed successfully', {
          component: 'OfflineQueue',
          action: 'request-success',
          requestId: request.id,
          url: request.url,
        });
      } catch (error) {
        const apiError = error as TransformedApiError | undefined;
        const status = apiError?.status ?? 0;
        const currentRetryCount = request.retryCount ?? 0;
        const errorMsg = error instanceof Error ? error.message : String(error);

        // 4xx client errors - discard request (won't succeed on retry)
        if (status >= 400 && status < 500) {
          this.queue.shift();
          try {
            await this.persist();
            logger.warn('[OfflineQueue] Discarded request due to client error', {
              component: 'OfflineQueue',
              action: 'request-client-error',
              requestId: request.id,
              status,
              url: request.url,
            });
          } catch (persistError) {
            logger.error(
              '[OfflineQueue] Failed to persist after discarding client error',
              persistError instanceof Error ? persistError : new Error(String(persistError))
            );
            break;
          }
          continue;
        }

        // 5xx or network errors - apply retry logic
        if (currentRetryCount >= MAX_RETRIES) {
          // Max retries exceeded - discard the request
          this.queue.shift();
          try {
            await this.persist();
            logger.error('[OfflineQueue] Max retries exceeded - discarding request', {
              component: 'OfflineQueue',
              action: 'max-retries-exceeded',
              requestId: request.id,
              url: request.url,
              retries: currentRetryCount,
            });
          } catch (persistError) {
            errorLogger.logError(persistError, {
              component: 'OfflineQueue',
              action: 'persist-after-max-retries',
              metadata: { requestId: request.id, url: request.url },
            });
          }
          continue;
        }

        // Persist updated retry count BEFORE mutating in-memory queue
        const updatedRequest = { ...request, retryCount: currentRetryCount + 1 };
        const updatedQueue = [...this.queue.slice(1), updatedRequest];
        try {
          // SECURITY: Encrypt queue data before storing
          const encrypted = await encryptData(JSON.stringify(updatedQueue));
          await AsyncStorage.setItem(QUEUE_KEY, encrypted);
          this.queue = updatedQueue;

          logger.warn('[OfflineQueue] Request requeued', {
            component: 'OfflineQueue',
            action: 'request-requeued',
            requestId: request.id,
            url: request.url,
            retryCount: updatedRequest.retryCount,
            status,
            error: errorMsg,
          });
        } catch (persistError) {
          errorLogger.logError(persistError, {
            component: 'OfflineQueue',
            action: 'persist-after-requeue',
            metadata: {
              requestId: request.id,
              url: request.url,
              retryCount: updatedRequest.retryCount,
            },
          });
          break;
        }

        // For network errors (status 0/undefined), stop processing for now
        // but the item is already moved to the back so queue is not blocked
        if (status === 0 || status === undefined) {
          logger.warn('[OfflineQueue] Network error - pausing queue for now', {
            component: 'OfflineQueue',
            action: 'network-error-pause',
            requestId: request.id,
          });
          break;
        }

        // For 5xx errors, continue to process other requests
        continue;
      }
    }

    this.isProcessing = false;
    logger.info('[OfflineQueue] Queue processing completed', {
      component: 'OfflineQueue',
      action: 'queue-complete',
      remainingItems: this.queue.length,
    });
  }

  private async persist() {
    try {
      // SECURITY: Encrypt queue data before storing in AsyncStorage
      const encrypted = await encryptData(JSON.stringify(this.queue));
      await AsyncStorage.setItem(QUEUE_KEY, encrypted);
    } catch (error) {
      // Log persistence errors for monitoring
      logger.error(
        '[OfflineQueue] Failed to persist queue to storage',
        error instanceof Error ? error : new Error(String(error))
      );
      // Re-throw to allow caller to handle
      throw error;
    }
  }

  get length() {
    return this.queue.length;
  }

  destroy() {
    this.unsubscribe?.();
  }
}

export const offlineQueue = new OfflineQueue();

/**
 * Retry with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000 } = options;
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, baseDelay * 2 ** attempt));
      }
    }
  }

  throw lastError!;
}

/**
 * Queue mutation if offline
 */
export async function queueIfOffline(
  request: Omit<QueuedRequest, 'id' | 'timestamp'>,
  executor: () => Promise<unknown>
): Promise<unknown> {
  const state = await NetInfo.fetch();

  if (!state.isConnected) {
    await offlineQueue.add(request);
    return { queued: true };
  }

  return executor();
}
