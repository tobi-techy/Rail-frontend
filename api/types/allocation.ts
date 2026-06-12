// ============= Allocation Types =============

export interface EnableAllocationModeRequest {
  spending_ratio: number;
  stash_ratio: number;
}

export interface AllocationMode {
  user_id: string;
  active: boolean;
  ratio_spending: string;
  ratio_stash: string;
  paused_at?: string | null;
  resumed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AllocationModeResponse {
  message: string;
  mode?: AllocationMode;
}

export interface AllocationBalancesResponse {
  spending_balance: string;
  stash_balance: string;
  invest_balance: string;
  broker_cash: string;
  usdc_balance: string;
  spending_used: string;
  spending_remaining: string;
  total_balance: string;
  mode_active: boolean;
}
