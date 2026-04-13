// ============= AI Chat Types =============

export interface AIChatRequest {
  message: string;
  history?: AIMessage[];
}

export interface AIMessage {
  id?: string;
  conversation_id?: string;
  role: 'user' | 'assistant';
  content: string;
  token_count?: number;
  model?: string;
  created_at?: string;
}

export interface InsightCard {
  type: 'stat_grid' | 'chart' | 'breakdown' | 'progress' | 'highlight' | 'alert';
  title: string;
  subtitle?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  data?: Record<string, any>;
}

export interface AIChatResponse {
  content: string;
  cards?: InsightCard[] | null;
  tool_calls?: { name: string; result: Record<string, any> }[];
  tokens_used: number;
  provider?: string;
  over_ceiling?: boolean;
  fallback?: boolean;
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
}

// SSE stream event types
export type AIStreamEvent =
  | { type: 'tool_result'; data: { tool: string } }
  | { type: 'cards'; data: InsightCard[] }
  | { type: 'token'; content: string }
  | { type: 'done'; data: { tokens_used: number; provider: string } }
  | { type: 'error'; content: string };
