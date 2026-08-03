/**
 * AI Chat API Service
 * Handles all AI chat endpoints — conversations, streaming, suggestions, wrapped
 */

import { fetch as expoFetch } from 'expo/fetch';
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
  PendingAction,
  CashFlowForecast,
  FinancialAdvice,
  FinancialAudit,
  FinancialHealth,
  FinancialTimeline,
  FinancialPlan,
  NudgeResponse,
  EnhancedNudgeRequest,
  EnhancedNudgeResponse,
  ProactiveOpener,
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
  StatementSummary,
  MiriamHealthSummary,
  MiriamHealthScore,
  MiriamPredictionSummary,
  MiriamDecisionReceipt,
  MiriamMandate,
  CreateMiriamMandateRequest,
  MiriamMandateSuggestion,
  MiriamMoneyState,
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

    // expo/fetch exposes a real ReadableStream body, so tokens arrive
    // incrementally (true iMessage-style streaming). RN's XMLHttpRequest does
    // not reliably deliver partial responseText and re-slicing it is O(n²) on
    // long replies — that was the source of the lag and "random" failures.
    (async () => {
      let sawData = false;
      try {
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
        };
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
        if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
        if (fingerprint) headers['X-Device-Fingerprint'] = fingerprint;

        const res = await expoFetch(`${baseURL}${BASE}/chat/stream`, {
          method: 'POST',
          headers,
          body: JSON.stringify(req),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          onError(`Stream failed: ${res.status}`);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // SSE events are separated by a blank line; an event may span chunks,
        // so we keep a buffer and only emit complete events.
        const drain = () => {
          let sep: number;
          while ((sep = buffer.indexOf('\n\n')) !== -1) {
            const block = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            for (const line of block.split('\n')) {
              if (!line.startsWith('data:')) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === '[DONE]') continue;
              sawData = true;
              try {
                onEvent(JSON.parse(payload) as AIStreamEvent);
              } catch {}
            }
          }
        };

        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          drain();
        }
        // Flush any trailing event not terminated by a blank line.
        buffer += decoder.decode();
        if (buffer.length > 0) {
          buffer += '\n\n';
          drain();
        }
        onDone();
      } catch (e: any) {
        // User-initiated stop: keep whatever streamed so far.
        if (e?.name === 'AbortError') {
          onDone();
          return;
        }
        if (sawData) onDone();
        else onError(e?.message ?? 'Stream connection failed');
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

  /**
   * Fetch the action Miriam staged in a conversation but hasn't executed yet.
   * Used by the authorize deep-link screen to render exactly what's about to
   * happen before the user approves it with Face ID / passcode.
   */
  async getPendingAction(
    conversationId: string
  ): Promise<{ pending_action: PendingAction | null }> {
    const payload = await apiClient.get<any>(`${BASE}/conversations/${conversationId}/pending`);
    const data = unwrapData<{ pending_action: PendingAction | null }>(payload);
    return { pending_action: data?.pending_action ?? null };
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

  async getProactiveOpener(): Promise<ProactiveOpener> {
    return apiClient.get(`${BASE}/proactive-opener`);
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
    const body: Record<string, any> = {
      image: base64Image,
      message: message ?? 'Analyze this image',
    };
    if (conversationId) {
      body.conversation_id = conversationId;
    }
    return apiClient.post(`${BASE}/chat/image`, body, { timeout: 120000 });
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

  // ── Support session (ElevenLabs) ─────────────────────────────

  async getSupportSignedUrl(): Promise<{
    signed_url: string;
    agent_id: string;
    dynamic_variables: Record<string, string>;
  }> {
    const payload = await apiClient.post<any>(`${BASE}/support/signed-url`);
    return unwrapData<{
      signed_url: string;
      agent_id: string;
      dynamic_variables: Record<string, string>;
    }>(payload);
  },

  // ── Voice session (ElevenLabs) ───────────────────────────────

  async getVoiceSignedUrl(): Promise<{
    signed_url: string;
    agent_id: string;
    dynamic_variables: Record<string, unknown>;
  }> {
    const payload = await apiClient.post<any>(`${BASE}/voice/signed-url`);
    return unwrapData<{
      signed_url: string;
      agent_id: string;
      dynamic_variables: Record<string, unknown>;
    }>(payload);
  },

  async getProactiveInsight(): Promise<{ insight: string }> {
    const payload = await apiClient.get<any>(`${BASE}/voice/proactive-insight`);
    return unwrapData<{ insight: string }>(payload);
  },

  async executeVoiceTool(params: {
    tool_name: string;
    tool_call_id?: string;
    parameters: Record<string, unknown>;
  }): Promise<{ result: unknown; is_error?: boolean }> {
    const payload = await apiClient.post<any>(`${BASE}/voice/execute-tool`, params, {
      timeout: 30000,
    });
    return unwrapData<{ result: unknown; is_error?: boolean }>(payload);
  },

  // Creates a pending money action from voice so the app can show a confirm
  // card (with biometric) instead of executing immediately. Confirm/cancel then
  // reuse the existing conversation confirm/cancel endpoints.
  async prepareVoiceAction(params: {
    conversation_id?: string;
    action: string;
    params: Record<string, unknown>;
  }): Promise<{ pending_action?: PendingAction; conversation_id?: string; error?: string }> {
    const payload = await apiClient.post<any>(`${BASE}/voice/prepare-action`, params, {
      timeout: 15000,
    });
    return unwrapData<{
      pending_action?: PendingAction;
      conversation_id?: string;
      error?: string;
    }>(payload);
  },

  // ── Bank Statement Upload ──────────────────────────────────

  async uploadStatement(
    fileUri: string,
    bankName: string,
    fileName?: string
  ): Promise<{ data: { upload_id: string; status: string; message: string } }> {
    const formData = new FormData();

    // Detect content type from extension or default to PDF
    const name = fileName || fileUri.split('/').pop() || 'statement.pdf';
    const ext = name.split('.').pop()?.toLowerCase();
    let type = 'application/pdf';
    if (ext === 'jpg' || ext === 'jpeg') type = 'image/jpeg';
    else if (ext === 'png') type = 'image/png';
    else if (ext === 'heic') type = 'image/heic';

    formData.append('file', {
      uri: fileUri,
      type,
      name,
    } as any);
    formData.append('bank_name', bankName);
    return apiClient.post(`${BASE}/v2/statement/upload`, formData, {
      timeout: 60000,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async getStatementStatus(uploadId: string): Promise<{
    data: {
      upload_id: string;
      status: string;
      bank_name?: string;
      transaction_count: number;
      error_message?: string;
      period_start?: string;
      period_end?: string;
      summary?: StatementSummary;
    };
  }> {
    return apiClient.get(`${BASE}/statement/${uploadId}/status`, { timeout: 15000 });
  },

  async listStatements(): Promise<{
    data: {
      statements: {
        id: string;
        bank_name: string;
        status: string;
        transaction_count: number;
        created_at: string;
        period_start?: string;
        period_end?: string;
      }[];
    };
  }> {
    return apiClient.get(`${BASE}/statements`);
  },

  async deleteStatement(uploadId: string): Promise<{ data: { deleted: boolean } }> {
    return apiClient.delete(`${BASE}/statement/${uploadId}`);
  },

  // ── Miriam Intelligence ──────────────────────────────────────────────────

  async getMiriamState(): Promise<{ data: MiriamMoneyState }> {
    return apiClient.get(`${BASE}/miriam/state`);
  },

  async getMiriamHealthScore(): Promise<{ data: MiriamHealthSummary }> {
    return apiClient.get(`${BASE}/miriam/health-score`);
  },

  async getMiriamHealthScoreTrend(limit = 30): Promise<{ data: MiriamHealthScore[] }> {
    return apiClient.get(`${BASE}/miriam/health-score/trend?limit=${limit}`);
  },

  async getMiriamPredictions(): Promise<{ data: MiriamPredictionSummary }> {
    return apiClient.get(`${BASE}/miriam/predictions`);
  },

  async getMiriamReceipts(limit = 50): Promise<{ data: MiriamDecisionReceipt[] }> {
    return apiClient.get(`${BASE}/miriam/receipts?limit=${limit}`);
  },

  async recordMiriamFeedback(
    receiptId: string,
    signal: 'positive' | 'negative' | 'neutral'
  ): Promise<{ recorded: boolean }> {
    return apiClient.post(`${BASE}/miriam/receipts/${receiptId}/feedback`, { signal });
  },

  async getMiriamMandates(): Promise<{ data: MiriamMandate[] }> {
    return apiClient.get(`${BASE}/miriam/mandates`);
  },

  async createMiriamMandate(req: CreateMiriamMandateRequest): Promise<{ data: MiriamMandate }> {
    return apiClient.post(`${BASE}/miriam/mandates`, req);
  },

  async updateMiriamMandateStatus(
    id: string,
    status: 'active' | 'paused' | 'expired'
  ): Promise<{ updated: boolean }> {
    return apiClient.patch(`${BASE}/miriam/mandates/${id}/status`, { status });
  },

  async getMiriamSuggestions(): Promise<{ data: MiriamMandateSuggestion[] }> {
    return apiClient.get(`${BASE}/miriam/suggestions`);
  },

  async acceptMiriamSuggestion(id: string): Promise<{ data: MiriamMandate }> {
    return apiClient.post(`${BASE}/miriam/suggestions/${id}/accept`, {});
  },

  async dismissMiriamSuggestion(id: string): Promise<{ dismissed: boolean }> {
    return apiClient.post(`${BASE}/miriam/suggestions/${id}/dismiss`, {});
  },
};

export default aiService;
