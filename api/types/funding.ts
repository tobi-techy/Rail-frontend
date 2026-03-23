// ============= Funding Types =============

export interface VirtualAccount {
  id: string;
  user_id: string;
  bridge_customer_id?: string;
  bridge_account_id?: string;
  account_number: string;
  routing_number: string;
  bank_name?: string;
  bank_address?: string;
  beneficiary_name?: string;
  beneficiary_address?: string;
  payment_rails?: string[];
  status: 'pending' | 'active' | 'closed' | 'failed';
  currency: 'USD' | 'EUR' | 'GBP';
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
  category?: string;
  narration?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface InitiateWithdrawalRequest {
  amount: number | string;
  destination_address: string;
  destination_chain?: string;
  category?: string;
  narration?: string;
}

export interface InitiateFiatWithdrawalRequest {
  amount: number | string;
  currency: 'USD' | 'EUR';
  account_holder_name: string;
  account_number: string;
  routing_number: string;
  category?: string;
  narration?: string;
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
  category?: string;
  narration?: string;
  created_at: string;
}
