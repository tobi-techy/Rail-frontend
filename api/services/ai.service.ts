/**
 * AI Chat API Service
 * Handles all AI chat endpoints — conversations, streaming, suggestions, wrapped
 */

import apiClient from '../client';
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
} from '../types/ai';

const BASE = '/v1/ai';

export const aiService = {
  /** One-shot chat (no conversation persistence) */
  async chat(req: AIChatRequest): Promise<AIChatResponse> {
    return apiClient.post<AIChatResponse>(`${BASE}/chat`, req);
  },

  /** SSE streaming chat — returns an AbortController so caller can cancel */
  streamChat(
    req: AIChatRequest,
    onEvent: (event: AIStreamEvent) => void,
    onDone: () => void,
    onError: (err: string) => void
  ): AbortController {
    const controller = new AbortController();
    // Fire-and-forget async IIFE
    (async () => {
      try {
        const resp = await apiClient.post<any>(`${BASE}/chat/stream`, req, {
          responseType: 'text',
          signal: controller.signal,
          headers: { Accept: 'text/event-stream' },
          // @ts-ignore — axios adapter may not support streaming natively; fallback to full text
        });
        const text = typeof resp === 'string' ? resp : JSON.stringify(resp);
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6)) as AIStreamEvent;
            onEvent(event);
          } catch {}
        }
        onDone();
      } catch (e: any) {
        if (e?.name !== 'CanceledError') onError(e?.message ?? 'Stream failed');
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
};

export default aiService;
