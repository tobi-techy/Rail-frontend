export interface SpendingBalance {
  spending_balance: string;
  spending_balance_formatted?: string;
  available: string;
  pending: string;
  pending_formatted?: string;
  currency: string;
  last_updated: string;
}

export interface SpendingAllocation {
  active: boolean;
  spending_ratio: number;
  stash_ratio: number;
  total_received: string;
  total_received_formatted?: string;
  spending_allocated?: string;
  stash_allocated?: string;
  unallocated?: string;
  last_allocation_at: string | null;
  last_allocation_amount: string | null;
}

export interface SpendingCard {
  id: string;
  type: string;
  network: string;
  status: string;
  last_four: string;
  is_frozen: boolean;
  created_at: string;
}

export interface SpendingSummary {
  this_month_total: string;
  this_month_total_formatted?: string;
  transaction_count: number;
  daily_average: string;
  daily_average_formatted?: string;
  trend: 'up' | 'down' | 'stable';
  trend_change_percent: number;
}

export interface SpendingCategory {
  name: string;
  amount: string;
  amount_formatted?: string;
  percent: number;
}

export interface SpendingRoundUps {
  is_enabled: boolean;
  multiplier: number;
  total_accumulated: string;
  transaction_count: number;
  next_investment_at: string | null;
}

export interface SpendingLimitDetail {
  limit: string;
  used: string;
  remaining: string;
  used_percent?: number;
  resets_at?: string | null;
}

export interface SpendingLimits {
  daily: SpendingLimitDetail;
  monthly: SpendingLimitDetail;
  per_transaction: string;
  minimum_transaction?: string;
  daily_transactions_remaining: number;
}

export interface PendingAuthorization {
  id: string;
  merchant_name: string;
  amount: string;
  amount_formatted?: string;
  currency: string;
  authorized_at: string;
  expires_at: string;
  category?: string;
}

export interface SpendingTransaction {
  id: string;
  type: string;
  amount: string;
  amount_formatted?: string;
  direction?: 'debit' | 'credit';
  currency: string;
  description: string;
  merchant?: {
    name: string;
    logo_url: string | null;
    category: string;
    category_icon?: string | null;
  } | null;
  status: string;
  created_at: string;
  pending_settlement: boolean;
  refund_status: string | null;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface SpendingStashResponse {
  balance: SpendingBalance;
  card?: SpendingCard | null;
  spending_summary?: SpendingSummary | null;
  chart_data: ChartDataPoint[];
  top_categories: SpendingCategory[];
  round_ups?: SpendingRoundUps | null;
  limits: SpendingLimits;
  pending_authorizations: PendingAuthorization[];
  recent_transactions: {
    items: SpendingTransaction[];
    has_more: boolean;
    next_cursor: string | null;
  };
}
