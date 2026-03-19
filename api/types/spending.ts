export interface SpendingBalance {
  available: string;
  currency: string;
  last_updated: string;
}

export interface SpendingSummary {
  this_month_total: string;
  last_month_total: string;
  daily_average: string;
  trend: 'up' | 'down' | 'stable';
  trend_change_percent: number;
  transaction_count: number;
}

export interface SpendingCategory {
  name: string;
  amount: string;
  percent: number;
}

export interface MonthlyChartBar {
  month: string;
  card: number;
  p2p: number;
  withdrawals: number;
  total: number;
}

export interface SpendingRoundUps {
  is_enabled: boolean;
  total_accumulated: string;
  transaction_count: number;
}

export interface SpendingStashResponse {
  balance: SpendingBalance;
  spending_summary: SpendingSummary;
  top_categories: SpendingCategory[];
  monthly_chart: MonthlyChartBar[];
  round_ups?: SpendingRoundUps | null;
}
