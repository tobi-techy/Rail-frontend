/**
 * AI Chat API Service
 * Handles all AI chat endpoints — conversations, streaming, suggestions, wrapped
 */

import apiClient from '../client';
import { API_CONFIG } from '../config';
import { useAuthStore } from '@/stores/authStore';
import type {
  AIChatRequest,
  AIChatResponse,
  AIConversation,
  AIConversationDetail,
  AIUsage,
  AISuggestions,
  AIWrappedCard,
  AIQuickInsight,
  AIStreamEvent,
  ActionConfirmResponse,
} from '../types/ai';

const BASE = '/v1/ai';

export const aiService = {
  /** One-shot chat (no conversation persistence) */
  async chat(req: AIChatRequest): Promise<AIChatResponse> {
    return apiClient.post<AIChatResponse>(`${BASE}/chat`, req);
  },

  /** SSE streaming chat — uses fetch ReadableStream for real token-by-token streaming */
  streamChat(
    req: AIChatRequest,
    onEvent: (event: AIStreamEvent) => void,
    onDone: () => void,
    onError: (err: string) => void
  ): AbortController {
    const controller = new AbortController();
    const { accessToken } = useAuthStore.getState();
    const baseURL = API_CONFIG.baseURL;

    (async () => {
      try {
        const resp = await fetch(`${baseURL}${BASE}/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(req),
          signal: controller.signal,
        });

        if (!resp.ok) {
          onError(`Stream failed: ${resp.status}`);
          return;
        }

        const reader = resp.body?.getReader();
        if (!reader) {
          onError('ReadableStream not supported');
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              onEvent(JSON.parse(payload) as AIStreamEvent);
            } catch {}
          }
        }

        // Process remaining buffer
        if (buffer.startsWith('data: ')) {
          const payload = buffer.slice(6).trim();
          if (payload && payload !== '[DONE]') {
            try { onEvent(JSON.parse(payload) as AIStreamEvent); } catch {}
          }
        }

        onDone();
      } catch (e: any) {
        if (e?.name !== 'AbortError') onError(e?.message ?? 'Stream failed');
      }
    })();
    return controller;
  },

  // ── Conversations ──────────────────────────────────────────────

  async createConversation(title: string): Promise<{ data: AIConversation }> {
    return apiClient.post(`${BASE}/conversations`, { title });
  },

  async listConversations(limit = 20, offset = 0): Promise<{ data: AIConversation[] }> {
    return apiClient.get(`${BASE}/conversations?limit=${limit}&offset=${offset}`);
  },

  async getConversation(
    id: string,
    limit = 50,
    offset = 0
  ): Promise<{ data: AIConversationDetail }> {
    return apiClient.get(`${BASE}/conversations/${id}?limit=${limit}&offset=${offset}`);
  },

  async chatInConversation(id: string, message: string): Promise<{ data: AIChatResponse }> {
    return apiClient.post(`${BASE}/conversations/${id}/chat`, { message });
  },

  async deleteConversation(id: string): Promise<void> {
    return apiClient.delete(`${BASE}/conversations/${id}`);
  },

  async confirmAction(conversationId: string): Promise<{ data: ActionConfirmResponse }> {
    return apiClient.post(`${BASE}/conversations/${conversationId}/confirm`);
  },

  async cancelAction(conversationId: string): Promise<{ data: ActionConfirmResponse }> {
    return apiClient.post(`${BASE}/conversations/${conversationId}/cancel`);
  },

  // ── Utility endpoints ──────────────────────────────────────────

  async getUsage(): Promise<{ data: AIUsage }> {
    return apiClient.get(`${BASE}/usage`);
  },

  async getSuggestions(): Promise<AISuggestions> {
    return apiClient.get(`${BASE}/suggestions`);
  },

  async getWrapped(): Promise<{ cards: AIWrappedCard[] }> {
    return apiClient.get(`${BASE}/wrapped`);
  },

  async getQuickInsight(type: 'performance' | 'top_mover' | 'streak'): Promise<AIQuickInsight> {
    return apiClient.get(`${BASE}/quick-insight?type=${type}`);
  },

  /** Send an image (base64) for AI analysis (receipt scanning, etc.) */
  async analyzeImage(base64Image: string, message?: string): Promise<{ data: AIChatResponse }> {
    return apiClient.post(`${BASE}/chat/image`, {
      image: base64Image,
      message: message ?? 'Analyze this image',
    });
  },

  // ── Premium endpoints (pro-only) ──────────────────────────────

  async getWeeklyReport(): Promise<{ data: AIChatResponse }> {
    return apiClient.get(`${BASE}/report/weekly`);
  },

  async simulate(depositAmount: number, frequency: 'weekly' | 'monthly', durationMonths: number): Promise<{ data: any }> {
    return apiClient.post(`${BASE}/simulate`, {
      deposit_amount: depositAmount,
      deposit_frequency: frequency,
      duration_months: durationMonths,
    });
  },

  async getTaxSummary(year = '2026'): Promise<{ data: AIChatResponse }> {
    return apiClient.get(`${BASE}/tax-summary?year=${year}`);
  },

  async generateChallenge(): Promise<{ data: AIChatResponse }> {
    return apiClient.post(`${BASE}/challenge/generate`);
  },

  async getGoalProgress(): Promise<{ data: AIChatResponse }> {
    return apiClient.get(`${BASE}/goals/progress`);
  },
};

export default aiService;
