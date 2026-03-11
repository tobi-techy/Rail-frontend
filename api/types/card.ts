export type CardStatus = 'pending' | 'active' | 'frozen' | 'cancelled';
export type CardType = 'virtual' | 'physical';
export type CardTransactionType = 'authorization' | 'capture' | 'refund' | 'reversal';
export type CardTransactionStatus = 'pending' | 'completed' | 'declined' | 'reversed';

export interface CardBalanceEntry {
  amount: string;
  currency: string;
}

export interface CardBalances {
  hold: CardBalanceEntry;
  available: CardBalanceEntry;
}

export interface CardFundingInstructions {
  chain: string;
  address: string;
  currency: string;
}

export interface CardFreezeEntry {
  initiator: string;
  reason: string;
  created_at: string;
}

export interface CardDetails {
  id: string;
  type: CardType;
  status: CardStatus;
  last_4: string;
  expiry: string;
  card_image_url?: string | null;
  currency: string;
  created_at: string;
  balances?: CardBalances | null;
  funding_instructions?: CardFundingInstructions | null;
  freezes?: CardFreezeEntry[] | null;
}

export interface CardListResponse {
  cards: CardDetails[];
  total: number;
}

export interface CreateCardRequest {
  type: CardType;
}

export interface CreateCardResponse {
  card: CardDetails & {
    bridge_card_id: string;
    chain: string;
    wallet_address: string;
  };
  message: string;
}

export interface CardTransaction {
  id: string;
  card_id: string;
  user_id: string;
  bridge_trans_id: string;
  type: CardTransactionType;
  amount: string;
  currency: string;
  merchant_name?: string | null;
  merchant_category?: string | null;
  status: CardTransactionStatus;
  decline_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CardTransactionListResponse {
  transactions: CardTransaction[];
  total: number;
  has_more: boolean;
}
