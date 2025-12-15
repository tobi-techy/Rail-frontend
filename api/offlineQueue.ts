import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetInfo } from '@react-native-community/netinfo';

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

  async init() {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored).filter(
          (req: QueuedRequest) => Date.now() - req.timestamp < MAX_AGE_MS
        );
      }
    } catch {
      this.queue = [];
    }
  }

  async add(request: Omit<QueuedRequest, 'id' | 'timestamp'>) {
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      this.queue.shift(); // Remove oldest
    }

    const queuedRequest: QueuedRequest = {
      ...request,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
    };

    this.queue.push(queuedRequest);
    await this.persist();
  }

  async process(executor: (req: QueuedRequest) => Promise<void>) {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const request = this.queue[0];
      try {
        await executor(request);
        this.queue.shift();
        await this.persist();
      } catch {
        break; // Stop processing on failure
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
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
