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
  FinancialAudit,
  FinancialHealth,
  FinancialTimeline,
  FinancialPlan,
  NudgeResponse,
  EnhancedNudgeRequest,
  EnhancedNudgeResponse,
  Automation,
  CreateAutomationRequest,
  AutomationLog,
  CreateFinancialObligationRequest,
  FinancialObligation,
  MoneyAcrossBordersReport,
  MoneyOperatingPlan,
  StageOperatingPlanActionRequest,
  StageOperatingPlanActionResponse,
  ReceiptSplitData,
  SharedGoal,
  GoalContribution,
  GoalInvite,
  GoalMember,
  CreateSharedGoalRequest,
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
              settle(onDone);
            } else if (xhr.status === 0) {
              if (seenBytes > 0) {
                settle(onDone);
              } else {
                settle(() => onError('Stream connection failed'));
              }
            } else {
              // If we already received streamed data, treat as success
              // (backend may close connection after streaming completes)
              if (seenBytes > 0) {
                settle(onDone);
              } else {
                settle(() => onError(`Stream failed: ${xhr.status}`));
              }
            }
          }
        };

        xhr.onerror = () => {
          if (seenBytes > 0) {
            settle(onDone);
          } else {
            settle(() => onError('Stream connection failed'));
          }
        };
        xhr.ontimeout = () => settle(() => onError('Stream timed out'));
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

  async createVoiceSessionToken(): Promise<{ token: string; expires_at: string }> {
    const payload = await apiClient.post<any>(`${BASE}/voice/session-token`);
    return unwrapData<{ token: string; expires_at: string }>(payload);
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

  async getFinancialAudit(params?: {
    period?:
      | 'last_90_days'
      | 'last_6_months'
      | 'last_12_months'
      | 'this_month'
      | 'last_month'
      | 'last_7_days'
      | 'last_30_days';
    intensity?: 'gentle' | 'direct' | 'hard';
  }): Promise<FinancialAudit & { error?: string }> {
    const query = new URLSearchParams();
    if (params?.period) query.set('period', params.period);
    if (params?.intensity) query.set('intensity', params.intensity);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const payload = await apiClient.get<any>(`${BASE}/financial-audit${suffix}`, {
      timeout: 60000,
    });
    return unwrapData<FinancialAudit & { error?: string }>(payload);
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

  async getOperatingPlan(): Promise<MoneyOperatingPlan & { error?: string }> {
    const payload = await apiClient.get<any>(`${BASE}/operating-plan`, { timeout: 60000 });
    return unwrapData<MoneyOperatingPlan & { error?: string }>(payload);
  },

  async stageOperatingPlanAction(
    req: StageOperatingPlanActionRequest
  ): Promise<StageOperatingPlanActionResponse> {
    const payload = await apiClient.post<any>(`${BASE}/operating-plan/actions`, req);
    return unwrapData<StageOperatingPlanActionResponse>(payload);
  },

  async getMoneyAcrossBordersReport(): Promise<MoneyAcrossBordersReport & { error?: string }> {
    const payload = await apiClient.get<any>(`${BASE}/money-across-borders-report`, {
      timeout: 60000,
    });
    return unwrapData<MoneyAcrossBordersReport & { error?: string }>(payload);
  },

  /** Send an image (base64) for AI analysis (receipt scanning, etc.) */
  async analyzeImage(
    base64Image: string,
    message?: string,
    conversationId?: string
  ): Promise<{ data: AIChatResponse }> {
    return apiClient.post(
      `${BASE}/chat/image`,
      {
        image: base64Image,
        message: message ?? 'Analyze this image',
        conversation_id: conversationId ?? '',
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

  /** Enhanced nudge — multi-modal context-aware nudge with actions */
  async getEnhancedNudge(req: EnhancedNudgeRequest): Promise<EnhancedNudgeResponse> {
    const res = await apiClient.post<EnhancedNudgeResponse>(`${BASE}/nudge/enhanced`, req);
    return res as EnhancedNudgeResponse;
  },

  // ── Automations ────────────────────────────────────────────────

  async createAutomation(req: CreateAutomationRequest): Promise<{ data: Automation }> {
    return apiClient.post(`${BASE}/automations`, req);
  },

  async listAutomations(): Promise<{ data: Automation[] }> {
    return apiClient.get(`${BASE}/automations`);
  },

  async getAutomation(id: string): Promise<{ data: Automation }> {
    return apiClient.get(`${BASE}/automations/${id}`);
  },

  async updateAutomation(
    id: string,
    req: Partial<CreateAutomationRequest> & { is_active?: boolean }
  ): Promise<{ data: Automation }> {
    return apiClient.patch(`${BASE}/automations/${id}`, req);
  },

  async deleteAutomation(id: string): Promise<void> {
    return apiClient.delete(`${BASE}/automations/${id}`);
  },

  async getAutomationLogs(): Promise<{ data: AutomationLog[] }> {
    return apiClient.get(`${BASE}/automations/logs`);
  },

  // ── Manual Financial Obligations ──────────────────────────────

  async createFinancialObligation(
    req: CreateFinancialObligationRequest
  ): Promise<{ data: FinancialObligation }> {
    return apiClient.post('/v1/financial-obligations', req);
  },

  async listFinancialObligations(params?: {
    status?: string;
    type?: string;
  }): Promise<{ data: FinancialObligation[] }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.type) query.set('type', params.type);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get(`/v1/financial-obligations${suffix}`);
  },

  async getFinancialObligation(id: string): Promise<{ data: FinancialObligation }> {
    return apiClient.get(`/v1/financial-obligations/${id}`);
  },

  async updateFinancialObligation(
    id: string,
    req: Partial<CreateFinancialObligationRequest>
  ): Promise<{ data: FinancialObligation }> {
    return apiClient.patch(`/v1/financial-obligations/${id}`, req);
  },

  async deleteFinancialObligation(id: string): Promise<void> {
    return apiClient.delete(`/v1/financial-obligations/${id}`);
  },

  // ── Receipt Split Tracking ─────────────────────────────────────

  async listSplits(status?: string): Promise<{ data: ReceiptSplitData[] }> {
    const query = status ? `?status=${status}` : '';
    return apiClient.get(`${BASE}/receipts/splits${query}`);
  },

  async getSplit(id: string): Promise<{ data: ReceiptSplitData }> {
    return apiClient.get(`${BASE}/receipts/splits/${id}`);
  },

  async sendSplitReminder(splitId: string): Promise<{ reminded: number }> {
    return apiClient.post(`${BASE}/receipts/splits/${splitId}/remind`);
  },

  async markParticipantPaid(splitId: string, participantId: string): Promise<void> {
    return apiClient.post(`${BASE}/receipts/splits/${splitId}/participants/${participantId}/paid`);
  },

  // ── Shared Goals ───────────────────────────────────────────────

  async createSharedGoal(req: CreateSharedGoalRequest): Promise<{ data: SharedGoal }> {
    return apiClient.post('/v1/goals/shared', req);
  },

  async listSharedGoals(): Promise<{ data: SharedGoal[] }> {
    return apiClient.get('/v1/goals/shared');
  },

  async getSharedGoal(id: string): Promise<{ data: SharedGoal }> {
    return apiClient.get(`/v1/goals/shared/${id}`);
  },

  async contributeToGoal(
    goalId: string,
    req: { amount: string; note?: string; source?: string }
  ): Promise<{ data: GoalContribution }> {
    return apiClient.post(`/v1/goals/shared/${goalId}/contribute`, req);
  },

  async inviteToGoal(
    goalId: string,
    tags: string[],
    message?: string
  ): Promise<{ data: GoalInvite[] }> {
    return apiClient.post(`/v1/goals/shared/${goalId}/invite`, { tags, message });
  },

  async getGoalInvites(): Promise<{ data: GoalInvite[] }> {
    return apiClient.get('/v1/goals/shared/invites');
  },

  async respondToGoalInvite(inviteId: string, accept: boolean): Promise<void> {
    return apiClient.post(`/v1/goals/shared/invites/${inviteId}/respond`, { accept });
  },

  async getGoalLeaderboard(goalId: string): Promise<{ data: GoalMember[] }> {
    return apiClient.get(`/v1/goals/shared/${goalId}/leaderboard`);
  },

  async getGoalContributions(goalId: string): Promise<{ data: GoalContribution[] }> {
    return apiClient.get(`/v1/goals/shared/${goalId}/contributions`);
  },

  async leaveGoal(goalId: string): Promise<void> {
    return apiClient.post(`/v1/goals/shared/${goalId}/leave`);
  },
};

export default aiService;
