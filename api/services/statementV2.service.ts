/**
 * Statement Upload V2 API Service
 * Handles the V2 bank statement pipeline with SSE progress streaming.
 */

import apiClient from '../client';
import { API_CONFIG } from '../config';
import { useAuthStore } from '@/stores/authStore';
import type { StatementSummary } from '../types/ai';

const BASE = '/v1/ai';

// ── Types ────────────────────────────────────────────────────────

export interface StatementUploadResponse {
  upload_id: string;
  status: string;
  bank_name: string;
  content_type: string;
  file_size: number;
  message: string;
}

export interface StatementProgressEvent {
  stage: string;
  progress: number;
  message: string;
}

export interface StatementStatusResponse {
  upload_id: string;
  status: string;
  bank_name: string;
  transaction_count: number;
  period_start?: string;
  period_end?: string;
  summary?: StatementSummary;
  error_message?: string;
}

export interface StatementTransaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  type: string;
  category?: string;
  balance?: string;
}

export interface StatementTransactionsResponse {
  transactions: StatementTransaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface StatementListItem {
  id: string;
  bank_name: string;
  status: string;
  transaction_count: number;
  created_at: string;
  period_start?: string;
  period_end?: string;
}

// ── Service ──────────────────────────────────────────────────────

export const statementV2Service = {
  async upload(
    fileUri: string,
    bankName: string,
    fileName?: string
  ): Promise<{ data: StatementUploadResponse }> {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: 'application/pdf',
      name: fileName || 'statement.pdf',
    } as any);
    formData.append('bank_name', bankName);
    return apiClient.post(`${BASE}/v2/statement/upload`, formData, {
      timeout: 60000,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Subscribe to SSE progress for an upload. Uses XHR progressive loading
   * (same pattern as ai.service streamChat) for React Native compatibility.
   */
  streamProgress(
    uploadId: string,
    onProgress: (event: StatementProgressEvent) => void,
    onDone: () => void,
    onError: (err: string) => void
  ): AbortController {
    const controller = new AbortController();
    const { accessToken, csrfToken } = useAuthStore.getState();
    const baseURL = API_CONFIG.baseURL;
    const url = `${baseURL}${BASE}/v2/statement/${uploadId}/progress`;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.setRequestHeader('Accept', 'text/event-stream');
    xhr.setRequestHeader('X-Requested-With', 'RailApp');
    if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    if (csrfToken) xhr.setRequestHeader('X-CSRF-Token', csrfToken);

    let seenBytes = 0;
    let settled = false;

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const parseSSEChunk = (text: string) => {
      const lines = text.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === '[DONE]') {
          settle(onDone);
          continue;
        }
        try {
          onProgress(JSON.parse(payload) as StatementProgressEvent);
        } catch {}
      }
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState >= 3 && xhr.responseText) {
        const newText = xhr.responseText.slice(seenBytes);
        seenBytes = xhr.responseText.length;
        if (newText) parseSSEChunk(newText);
      }
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          settle(onDone);
        } else if (xhr.status === 0 && seenBytes > 0) {
          settle(onDone);
        } else if (seenBytes > 0) {
          settle(onDone);
        } else {
          settle(() => onError(`Progress stream failed: ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      if (seenBytes > 0) settle(onDone);
      else settle(() => onError('Progress stream connection failed'));
    };
    xhr.ontimeout = () => settle(() => onError('Progress stream timed out'));
    xhr.timeout = 300000;

    controller.signal.addEventListener('abort', () => xhr.abort());
    xhr.send();

    return controller;
  },

  async getStatus(uploadId: string): Promise<{ data: StatementStatusResponse }> {
    return apiClient.get(`${BASE}/statement/${uploadId}/status`, { timeout: 15000 });
  },

  async getTransactions(
    uploadId: string,
    limit = 50,
    offset = 0
  ): Promise<{ data: StatementTransactionsResponse }> {
    return apiClient.get(`${BASE}/statement/${uploadId}/transactions`, {
      params: { limit, offset },
    });
  },

  async list(): Promise<{
    data: { statements: StatementListItem[]; limit: number; offset: number };
  }> {
    return apiClient.get(`${BASE}/statements`);
  },

  async delete(uploadId: string): Promise<{ data: { deleted: boolean } }> {
    return apiClient.delete(`${BASE}/statement/${uploadId}`);
  },
};

export default statementV2Service;
