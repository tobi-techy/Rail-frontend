// ============= AI Chat Types =============

export interface AIChatRequest {
  message: string;
  history?: AIMessage[];
  conversation_id?: string;
  transaction_context?: {
    type: 'card' | 'withdrawal' | 'deposit' | 'p2p' | string;
    amount: string;
    currency?: string;
    merchant?: string;
    date?: string;
    status?: string;
  };
}

export interface AIMessage {
  id?: string;
  conversation_id?: string;
  role: 'user' | 'assistant';
  content: string;
  token_count?: number;
  estimated_cost_usd?: string;
  model?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface InsightCard {
  type: 'stat_grid' | 'chart' | 'breakdown' | 'progress' | 'highlight' | 'alert';
  title: string;
  subtitle?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  data?: Record<string, any>;
}

export interface PendingAction {
  id: string;
  conversation_id: string;
  user_id: string;
  action:
    | 'transfer_funds'
    | 'set_savings_goal'
    | 'send_report'
    | 'set_budget'
    | 'split_receipt'
    | 'update_financial_profile';
  description: string;
  params: Record<string, any>;
  expires_at: string;
  created_at: string;
}

export interface ToolSourceDoc {
  source_doc: string;
  chunk_index: number;
  similarity: number;
  metadata?: Record<string, any>;
}

export interface ToolCallResult {
  name: string;
  result: Record<string, any> & {
    source_docs?: ToolSourceDoc[];
  };
}

export interface AIChatResponse {
  content: string;
  cards?: InsightCard[] | null;
  tool_calls?: ToolCallResult[];
  tokens_used: number;
  provider?: string;
  conversation_id?: string;
  over_ceiling?: boolean;
  fallback?: boolean;
  pending_action?: PendingAction | null;
}

export interface ActionConfirmResponse {
  status: 'executed' | 'cancelled';
  action?: string;
  description?: string;
}

export interface AIConversation {
  id: string;
  user_id?: string;
  title: string;
  message_count: number;
  total_tokens: number;
  total_estimated_cost_usd: string;
  created_at: string;
  updated_at: string;
}

export interface AIConversationDetail {
  conversation: AIConversation;
  messages: AIMessage[];
}

export interface AIUsage {
  message_count: number;
  voice_seconds: number;
  estimated_cost: string;
  model_calls: Record<string, number>;
  period_start: string;
  over_cost_ceiling: boolean;
}

export interface AISuggestions {
  suggestions: string[];
}

export interface AIWrappedCard {
  type: string;
  title: string;
  content: string;
  data: Record<string, any>;
}

export interface AIQuickInsight {
  type: string;
  insight: string;
  error?: string;
}

export interface FinancialHealth {
  score: number;
  status: string;
  spend_balance: string;
  stash_balance: string;
  total_balance: string;
  monthly_income: string;
  monthly_outflow: string;
  net_flow: string;
  savings_rate_pct: string;
  budget_status: string;
  budget_limit: string;
  budget_remaining: string;
  recommended_actions: string[];
  data_used: string[];
}

export interface CashFlowForecast {
  period: string;
  days_elapsed: number;
  days_remaining: number;
  income_so_far: string;
  spent_so_far: string;
  daily_burn_rate: string;
  safe_daily_spend: string;
  projected_outflow: string;
  projected_net_flow: string;
  projected_end_balance: string;
  confidence: string;
  primary_action: string;
  data_used: string[];
}

export interface FinancialPlan {
  health: FinancialHealth;
  forecast: CashFlowForecast;
  profile: Record<string, any>;
  next_steps: {
    priority: number;
    title: string;
    action: string;
  }[];
  data_used: string[];
}

export interface ActionReceipt {
  id: string;
  conversation_id: string;
  action: string;
  params: Record<string, any>;
  status: string;
  error_message?: string;
  created_at: string;
}

export interface ActionReceiptsResponse {
  receipts: ActionReceipt[];
  count: number;
}

export interface FinancialAdviceCheck {
  code: string;
  severity: 'good' | 'info' | 'warning' | 'critical' | string;
  title: string;
  why: string;
  recommendation: string;
  blocked?: boolean;
  data_used: string[];
  evidence?: Record<string, any>;
}

export interface FinancialAdvice {
  overall_status: string;
  summary: string;
  recommended_next_action: string;
  checks: FinancialAdviceCheck[];
  data_used: string[];
}

export interface FinancialTimelineEvent {
  type: string;
  title: string;
  description: string;
  amount?: string;
  currency?: string;
  source: string;
  severity?: string;
  occurred_at: string;
  data_used: string[];
  metadata?: Record<string, any>;
}

export interface FinancialTimeline {
  events: FinancialTimelineEvent[];
  summary: string;
  data_used: string[];
}

// SSE stream event types
export type AIStreamEvent =
  | { type: 'tool_result'; data: { tool: string } }
  | { type: 'cards'; data: InsightCard[] }
  | { type: 'token'; content: string }
  | { type: 'pending_action'; data: PendingAction }
  | {
      type: 'done';
      data: {
        tokens_used: number;
        provider: string;
        model?: string;
        conversation_id?: string;
        over_ceiling?: boolean;
      };
    }
  | { type: 'error'; content: string };

export interface ChartAnnotation {
  label: string;
  value: string;
  index: number;
  type: 'milestone' | 'peak';
}

// ============= Ambient Nudge Types =============

export interface NudgeResponse {
  show: boolean;
  message?: string;
  severity: 'info' | 'warning' | 'celebration';
  shake: boolean;
}

// ============= Enhanced Nudge Types =============

export interface EnhancedNudgeRequest {
  screen: string;
  amount?: string;
  currency?: string;
  time_of_day?: string;
  day_of_week?: number;
  days_until_payday?: number;
  merchant_hint?: string;
  recent_actions?: string[];
}

export interface NudgeAction {
  type: 'transfer' | 'open_screen' | 'confirm';
  label: string;
  destination: string;
  params?: Record<string, any>;
}

export interface EnhancedNudgeResponse {
  show: boolean;
  message?: string;
  severity: 'info' | 'warning' | 'celebration';
  shake: boolean;
  action?: NudgeAction | null;
  expires_in?: number;
}

// ============= Automation Types =============

export interface Automation {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  trigger_type:
    | 'schedule'
    | 'balance_threshold'
    | 'income_detected'
    | 'spending_spike'
    | 'payday'
    | 'custom';
  trigger_config: Record<string, any>;
  action_type:
    | 'transfer_to_stash'
    | 'transfer_to_spend'
    | 'send_p2p'
    | 'set_budget_alert'
    | 'pause_card'
    | 'resume_card'
    | 'notify'
    | 'custom';
  action_config: Record<string, any>;
  is_active: boolean;
  last_triggered_at?: string;
  trigger_count: number;
  max_triggers_per_day: number;
  cooldown_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAutomationRequest {
  name: string;
  description?: string;
  trigger_type: Automation['trigger_type'];
  trigger_config: Record<string, any>;
  action_type: Automation['action_type'];
  action_config: Record<string, any>;
  max_triggers_per_day?: number;
  cooldown_minutes?: number;
}

export interface AutomationLog {
  id: string;
  automation_id: string;
  user_id: string;
  status: 'success' | 'failed' | 'skipped';
  trigger_data?: Record<string, any>;
  result_data?: Record<string, any>;
  error_message?: string;
  executed_at: string;
}

// ============= Receipt Split Types =============

export interface ReceiptSplitParticipant {
  id: string;
  split_id: string;
  rail_tag: string;
  participant_user_id?: string;
  amount: string;
  status: 'pending' | 'requested' | 'paid' | 'declined' | 'expired';
  reminder_count: number;
  last_reminded_at?: string;
  paid_at?: string;
  created_at: string;
}

export interface ReceiptSplitData {
  id: string;
  receipt_id: string;
  user_id: string;
  split_type: 'equal' | 'custom' | 'by_item';
  total_amount: string;
  your_share: string;
  status: 'pending' | 'partial' | 'collected' | 'expired';
  message?: string;
  expires_at?: string;
  participants: ReceiptSplitParticipant[];
  created_at: string;
  updated_at: string;
}

// ============= Shared Goal Types =============

export interface SharedGoal {
  id: string;
  creator_id: string;
  name: string;
  description?: string;
  target_amount: string;
  current_amount: string;
  currency: string;
  deadline?: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  visibility: 'private' | 'members' | 'public';
  icon_name: string;
  celebration_message?: string;
  members?: GoalMember[];
  member_count?: number;
  created_at: string;
  updated_at: string;
}

export interface GoalMember {
  id: string;
  goal_id: string;
  user_id: string;
  role: 'creator' | 'admin' | 'member';
  target_contribution?: string;
  total_contributed: string;
  status: 'invited' | 'active' | 'left' | 'removed';
  rail_tag?: string;
  username?: string;
  joined_at?: string;
  created_at: string;
}

export interface GoalContribution {
  id: string;
  goal_id: string;
  user_id: string;
  amount: string;
  note?: string;
  source: 'manual' | 'automation' | 'roundup' | 'stash_transfer';
  rail_tag?: string;
  created_at: string;
}

export interface GoalInvite {
  id: string;
  goal_id: string;
  inviter_id: string;
  rail_tag: string;
  invitee_user_id?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  goal_name?: string;
  inviter_tag?: string;
  created_at: string;
  responded_at?: string;
}

export interface CreateSharedGoalRequest {
  name: string;
  description?: string;
  target_amount: string;
  currency?: string;
  deadline?: string;
  visibility?: string;
  icon_name?: string;
}
