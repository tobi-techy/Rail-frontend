// ============= Funding Types =============

export interface VirtualAccount {
  id: string;
  user_id: string;
  account_number: string;
  routing_number: string;
  status: 'pending' | 'active' | 'closed' | 'failed';
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVirtualAccountResponse {
  virtual_account: VirtualAccount;
  message: string;
}

// ============= Deposit Types (GET /v1/deposits) =============

export interface Deposit {
  id: string;
  type: 'crypto' | 'fiat';
  chain?: string;
  tx_hash?: string;
  amount: string;
  status: string;
  currency: string;
  confirmed_at?: string;
  created_at: string;
}

export interface DepositsResponse {
  deposits: Deposit[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// ============= Withdrawal Types (GET/POST /v1/withdrawals) =============

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: string;
  destination_chain: string;
  destination_address: string;
  status: string;
  tx_hash?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface InitiateWithdrawalRequest {
  amount: number;
  destination_address: string;
  destination_chain?: string;
}

export interface InitiateFiatWithdrawalRequest {
  amount: number;
  currency: 'USD' | 'EUR';
  routing_number: string;
}

export interface InitiateWithdrawalResponse {
  withdrawal_id: string;
  status: string;
  message: string;
}

// ============= Unified Transaction (for history display) =============

export interface UnifiedTransaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  status: string;
  amount: string;
  currency: string;
  chain?: string;
  tx_hash?: string;
  destination_address?: string;
  created_at: string;
}
