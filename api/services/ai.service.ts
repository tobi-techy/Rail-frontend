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
  ActionReceiptsResponse,
  CashFlowForecast,
  FinancialAdvice,
  FinancialHealth,
  FinancialTimeline,
  FinancialPlan,
  NudgeResponse,
} from '../types/ai';

const BASE = '/v1/ai';

function unwrapData<T>(payload: any): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
}

export const aiService = {
  /** Main chat. Backend returns conversation_id when persistence is available. */
  async chat(req: AIChatRequest): Promise<AIChatResponse> {
    return apiClient.post<AIChatResponse>(`${BASE}/chat`, req, { timeout: 120000 });
  },

  /** SSE streaming chat — uses XHR progressive loading (React Native compatible) */
  streamChat(
    req: AIChatRequest,
    onEvent: (event: AIStreamEvent) => void,
    onDone: () => void,
    onError: (err: string) => void
  ): AbortController {
    const controller = new AbortController();
    const { accessToken, csrfToken } = useAuthStore.getState();
    const baseURL = API_CONFIG.baseURL;

    (async () => {
      try {
        const { generateRequestId } = await import('@/utils/requestId');
        let fingerprint = '';
        try {
          const { getDeviceFingerprint } = await import('@/utils/deviceFingerprint');
          fingerprint = await getDeviceFingerprint();
        } catch {}

        const url = `${baseURL}${BASE}/chat/stream`;
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Accept', 'text/event-stream');
        xhr.setRequestHeader('X-Requested-With', 'RailApp');
        xhr.setRequestHeader('X-Request-ID', generateRequestId());
        if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        if (csrfToken) xhr.setRequestHeader('X-CSRF-Token', csrfToken);
        if (fingerprint) xhr.setRequestHeader('X-Device-Fingerprint', fingerprint);

        let seenBytes = 0;

        const parseSSEChunk = (text: string) => {
          const lines = text.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              onEvent(JSON.parse(payload) as AIStreamEvent);
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
              onDone();
            } else if (xhr.status > 0) {
              onError(`Stream failed: ${xhr.status}`);
            }
          }
        };

        xhr.onerror = () => onError('Stream connection failed');
        xhr.ontimeout = () => onError('Stream timed out');
        xhr.timeout = 120000;

        controller.signal.addEventListener('abort', () => xhr.abort());

        xhr.send(JSON.stringify(req));
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
    return apiClient.post(`${BASE}/conversations/${id}/chat`, { message }, { timeout: 120000 });
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

  async getFinancialHealth(): Promise<FinancialHealth & { error?: string }> {
    const payload = await apiClient.get<any>(`${BASE}/financial-health`, { timeout: 60000 });
    return unwrapData<FinancialHealth & { error?: string }>(payload);
  },

  async getCashFlowForecast(): Promise<{ data: CashFlowForecast }> {
    return apiClient.get(`${BASE}/cash-flow-forecast`);
  },

  async getFinancialPlan(): Promise<FinancialPlan & { error?: string }> {
    const payload = await apiClient.get<any>(`${BASE}/financial-plan`, { timeout: 60000 });
    return unwrapData<FinancialPlan & { error?: string }>(payload);
  },

  async getActionReceipts(): Promise<{ data: ActionReceiptsResponse }> {
    return apiClient.get(`${BASE}/action-receipts`);
  },

  async getFinancialAdvice(params?: {
    intent?: 'overview' | 'transfer' | 'budget' | 'goal' | 'investment' | 'tax' | 'legal';
    amount?: number;
  }): Promise<{ data: FinancialAdvice }> {
    const query = new URLSearchParams();
    if (params?.intent) query.set('intent', params.intent);
    if (typeof params?.amount === 'number' && Number.isFinite(params.amount)) {
      query.set('amount', String(params.amount));
    }
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get(`${BASE}/financial-advice${suffix}`);
  },

  async getFinancialTimeline(params?: {
    days?: number;
    limit?: number;
  }): Promise<{ data: FinancialTimeline }> {
    const query = new URLSearchParams();
    if (typeof params?.days === 'number' && Number.isFinite(params.days)) {
      query.set('days', String(params.days));
    }
    if (typeof params?.limit === 'number' && Number.isFinite(params.limit)) {
      query.set('limit', String(params.limit));
    }
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get(`${BASE}/financial-timeline${suffix}`);
  },

  /** Send an image (base64) for AI analysis (receipt scanning, etc.) */
  async analyzeImage(base64Image: string, message?: string): Promise<{ data: AIChatResponse }> {
    return apiClient.post(
      `${BASE}/chat/image`,
      {
        image: base64Image,
        message: message ?? 'Analyze this image',
      },
      { timeout: 120000 }
    );
  },

  // ── Premium endpoints (pro-only) ──────────────────────────────

  async getWeeklyReport(): Promise<{ data: AIChatResponse }> {
    return apiClient.get(`${BASE}/report/weekly`);
  },

  async simulate(
    depositAmount: number,
    frequency: 'weekly' | 'monthly',
    durationMonths: number
  ): Promise<{ data: any }> {
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

  async sendFeedback(
    messageId: string,
    rating: 'positive' | 'negative',
    comment?: string
  ): Promise<void> {
    return apiClient.post(`${BASE}/feedback`, { message_id: messageId, rating, comment });
  },

  /** Ambient nudge — lightweight contextual nudge from Miriam */
  async getNudge(screen: string, amount?: string, currency?: string): Promise<NudgeResponse> {
    const res = await apiClient.post<NudgeResponse>(`${BASE}/nudge`, { screen, amount, currency });
    return res as NudgeResponse;
  },
};

export default aiService;
