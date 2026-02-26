export type InvestmentPeriod = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
export type InvestmentHealthState = 'ok' | 'degraded';
export type InvestmentTradeSide = 'buy' | 'sell';
export type InvestmentTradeStatus = 'filled' | 'all';

export interface MoneyValue {
  raw: string;
  formatted: string;
}

export interface InvestmentBalanceInfo {
  total: string;
  stash: string;
  invested: string;
  pending_allocation: string;
  left_to_invest: string;
  net_pnl: string;
  net_pnl_percent: number;
  currency: string;
  last_updated: string;
}

export interface InvestmentPerformanceInfo {
  total_gain: string;
  total_gain_percent: number;
  day_change: string;
  day_change_percent: number;
  week_change: string;
  week_change_percent: number;
  month_change: string;
  month_change_percent: number;
}

export interface InvestmentPositionSummary {
  id: string;
  symbol: string;
  name: string;
  type: string;
  quantity: string;
  current_price: string;
  market_value: string;
  cost_basis: string;
  avg_cost: string;
  unrealized_gain: string;
  unrealized_gain_percent: number;
  day_change: string;
  day_change_percent: number;
  portfolio_weight: number;
  logo_url?: string | null;
}

export interface InvestmentPositionDetail {
  id: string;
  symbol: string;
  name: string;
  quantity: string;
  avg_entry_price: MoneyValue;
  current_price: MoneyValue;
  market_value: MoneyValue;
  cost_basis: MoneyValue;
  unrealized_pnl: MoneyValue;
  unrealized_pnl_percent: number;
  portfolio_weight: number;
  logo_url?: string | null;
}

export interface InvestmentDistributionItem {
  symbol: string;
  name: string;
  weight_percent: number;
  value: MoneyValue;
}

export interface InvestmentTradeTransaction {
  id: string;
  type: 'trade';
  side: InvestmentTradeSide;
  status: string;
  symbol: string;
  quantity: string;
  price?: MoneyValue;
  amount: MoneyValue;
  occurred_at: string;
}

export interface InvestmentPerformancePoint {
  date: string;
  value: MoneyValue;
}

export interface InvestmentPerformanceResponse {
  period: InvestmentPeriod;
  return: MoneyValue;
  return_percent: number;
  points: InvestmentPerformancePoint[];
  generated_at: string;
}

export interface InvestmentSummary {
  total_balance: MoneyValue;
  invested_value: MoneyValue;
  buying_power: MoneyValue;
  day_change: MoneyValue;
  day_change_percent: number;
  week_change: MoneyValue;
  week_change_percent: number;
  currency: string;
  last_updated: string;
}

export interface InvestmentDataHealth {
  positions: InvestmentHealthState;
  distribution: InvestmentHealthState;
  transactions: InvestmentHealthState;
  performance: InvestmentHealthState;
}

export interface InvestmentLinks {
  self: string;
  positions: string;
  distribution: string;
  transactions: string;
  baskets: string;
  performance: string;
  withdraw: string;
  edit_allocation: string;
  edit_auto_invest: string;
}

export interface InvestmentStashResponse {
  balance: InvestmentBalanceInfo;
  performance: InvestmentPerformanceInfo;
  positions: {
    page: number;
    page_size: number;
    total_count: number;
    has_more: boolean;
    items: InvestmentPositionSummary[];
  };
  stats: {
    total_deposits: string;
    total_withdrawals: string;
    position_count: number;
    first_investment_at?: string | null;
  };
  auto_invest?: {
    is_enabled: boolean;
    trigger_threshold: string;
    last_triggered_at?: string | null;
    strategy: string;
  };
  summary?: InvestmentSummary;
  holdings_preview: InvestmentPositionDetail[];
  top_performers_preview?: InvestmentPositionDetail[];
  distribution_preview: InvestmentDistributionItem[];
  recent_transactions_preview: InvestmentTradeTransaction[];
  performance_preview?: InvestmentPerformanceResponse;
  data_health: InvestmentDataHealth;
  _links: InvestmentLinks;
}

export interface InvestmentPositionsResponse {
  page: number;
  page_size: number;
  total_count: number;
  has_more: boolean;
  items: InvestmentPositionDetail[];
}

export interface InvestmentDistributionResponse {
  items: InvestmentDistributionItem[];
  top_1_weight_percent: number;
  top_3_weight_percent: number;
  hhi: number;
  generated_at: string;
}

export interface InvestmentTransactionsParams {
  limit?: number;
  offset?: number;
  side?: 'all' | InvestmentTradeSide;
  status?: InvestmentTradeStatus;
}

export interface InvestmentTransactionsResponse {
  items: InvestmentTradeTransaction[];
  limit: number;
  offset: number;
  has_more: boolean;
  next_offset?: number;
}
