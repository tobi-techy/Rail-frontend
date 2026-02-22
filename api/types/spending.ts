export interface SpendingBalance {
  available: string;
  pending: string;
  currency: string;
  last_updated: string;
}

export interface SpendingAllocation {
  active: boolean;
  spending_ratio: number;
  stash_ratio: number;
  total_received: string;
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
  transaction_count: number;
  daily_average: string;
  trend: 'up' | 'down';
  trend_change_percent: number;
}

export interface SpendingCategory {
  name: string;
  amount: string;
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
}

export interface SpendingLimits {
  daily: SpendingLimitDetail;
  monthly: SpendingLimitDetail;
  per_transaction: string;
  daily_transactions_remaining: number;
}

export interface PendingAuthorization {
  id: string;
  merchant_name: string;
  amount: string;
  currency: string;
  authorized_at: string;
  expires_at: string;
  category: string;
}

export interface SpendingTransaction {
  id: string;
  type: string;
  amount: string;
  currency: string;
  description: string;
  merchant: {
    name: string;
    logo_url: string | null;
    category: string;
    category_icon: string;
  };
  status: string;
  created_at: string;
  pending_settlement: boolean;
  refund_status: string | null;
}

export interface SpendingStashResponse {
  balance: SpendingBalance;
  allocation: SpendingAllocation;
  card: SpendingCard;
  spending_summary: SpendingSummary;
  top_categories: SpendingCategory[];
  round_ups: SpendingRoundUps;
  limits: SpendingLimits;
  pending_authorizations: PendingAuthorization[];
  recent_transactions: {
    items: SpendingTransaction[];
    has_more: boolean;
    next_cursor: string | null;
  };
}
