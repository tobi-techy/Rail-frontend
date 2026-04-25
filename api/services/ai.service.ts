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

  /** SSE streaming chat — uses fetch ReadableStream for real token-by-token streaming */
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
        // SECURITY FIX (R5-L1): Include CSRF token, request ID, and device fingerprint
        // to match the protections applied by the Axios interceptor.
        // NOTE: SSL pinning cannot be applied to raw fetch — this is a documented accepted risk.
        const { generateRequestId } = await import('@/utils/requestId');
        let fingerprint = '';
        try {
          const { getDeviceFingerprint } = await import('@/utils/deviceFingerprint');
          fingerprint = await getDeviceFingerprint();
        } catch {}

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          'X-Requested-With': 'RailApp',
          'X-Request-ID': generateRequestId(),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
          ...(fingerprint ? { 'X-Device-Fingerprint': fingerprint } : {}),
        };

        const resp = await fetch(`${baseURL}${BASE}/chat/stream`, {
          method: 'POST',
          headers,
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
            try {
              onEvent(JSON.parse(payload) as AIStreamEvent);
            } catch {}
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
    return apiClient.post(`${BASE}/chat/image`, {
      image: base64Image,
      message: message ?? 'Analyze this image',
    }, { timeout: 120000 });
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
