// ============= Station (Home Screen) Types =============

export type SystemStatus = 'active' | 'allocating' | 'paused';

export interface BalanceTrend {
  day_change: string;
  week_change: string;
  month_change: string;
}

export interface BalanceTrends {
  spend: BalanceTrend;
  invest: BalanceTrend;
}

export interface ActivityItem {
  id: string;
  type: string;
  amount: string;
  description: string;
  created_at: string;
}

export interface StationResponse {
  total_balance: string;
  spend_balance: string;
  invest_balance: string;
  currency: string;
  currency_locale: string;
  pending_amount: string;
  pending_transactions_count: number;
  system_status: SystemStatus;
  account_nickname?: string;
  balance_trends?: BalanceTrends;
  recent_activity: ActivityItem[];
  unread_alert_count: number;
}
