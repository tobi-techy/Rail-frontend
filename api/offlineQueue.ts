/**
 * Offline Queue
 * Queues failed mutations when offline and retries on reconnect
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import type { TransformedApiError } from './types';
import apiClient from './client';

interface QueuedRequest {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  timestamp: number;
}

const QUEUE_KEY = 'offline_request_queue';
const MAX_QUEUE_SIZE = 50;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private unsubscribe: (() => void) | null = null;

  async init() {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored).filter(
          (req: QueuedRequest) => Date.now() - req.timestamp < MAX_AGE_MS
        );
        await this.persist();
      }
    } catch {
      this.queue = [];
    }

    this.unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) this.processQueue();
    });
  }

  async add(request: Omit<QueuedRequest, 'id' | 'timestamp'>) {
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      this.queue.shift();
    }

    this.queue.push({
      ...request,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    });

    await this.persist();
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const request = this.queue[0];
      try {
        await apiClient.request({
          url: request.url,
          method: request.method,
          data: request.data,
        });
        this.queue.shift();
        await this.persist();
      } catch (error) {
        const apiError = error as TransformedApiError | undefined;
        const status = apiError?.status ?? 0;

        // 4xx client errors - discard request (won't succeed on retry)
        if (status >= 400 && status < 500) {
          this.queue.shift();
          await this.persist();
          continue;
        }

        // 5xx or network errors - stop processing, retry later
        break;
      }
    }

    this.isProcessing = false;
  }

  private async persist() {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch {
      // Silent fail
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
