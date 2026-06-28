// ============= Unified Activity Feed Types =============

export type ActivityType =
  | 'deposit'
  | 'withdrawal'
  | 'naira_fund'
  | 'naira_withdraw'
  | 'p2p_send'
  | 'p2p_receive'
  | 'investment'
  | 'card_payment'
  | 'allocation';

export type ActivityStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type ActivityDirection = 'in' | 'out';

export interface ActivityCurrencyPair {
  primary: string; // e.g. "USDC", "NGN"
  secondary?: string; // e.g. "USDC" when primary is "NGN"
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  direction: ActivityDirection;
  status: ActivityStatus;
  title: string;
  subtitle?: string;
  amount: string;
  currency: ActivityCurrencyPair;
  fiatAmount?: string;
  feeAmount?: string;
  chain?: string;
  txHash?: string;
  destination?: string;
  receiverName?: string;
  bankName?: string;
  accountNumber?: string;
  rate?: string;
  tokenAmount?: string;
  fee?: string;
  narration?: string;
  sourceId: string;
  sourceType: string;
  groupId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ActivityFeedResponse {
  items: ActivityItem[];
  nextCursor?: string;
  hasMore: boolean;
}
