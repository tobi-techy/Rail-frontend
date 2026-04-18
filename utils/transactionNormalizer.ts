import type {
  Transaction,
  TransactionType,
  TransactionStatus,
  WithdrawalMethod,
} from '@/components/molecules/TransactionItem';
import type { Deposit, Withdrawal } from '@/api/types';
import type { P2PTransfer } from '@/api/services/p2p.service';
import type { PajOrderStatus } from '@/api/types/paj';

export type WithdrawalListResponse = Withdrawal[] | { withdrawals?: Withdrawal[] } | undefined;

export const STATUS_MAP: Record<string, TransactionStatus> = {
  completed: 'completed',
  confirmed: 'completed',
  success: 'completed',
  pending: 'pending',
  processing: 'pending',
  initiated: 'pending',
  awaiting_confirmation: 'pending',
  alpaca_debited: 'pending',
  bridge_processing: 'pending',
  onchain_transfer: 'pending',
  on_chain_transfer: 'pending',
  failed: 'failed',
  rejected: 'failed',
  cancelled: 'failed',
  canceled: 'failed',
  error: 'failed',
  reversed: 'failed',
  timeout: 'failed',
};

export const normalizeStatus = (s?: string): TransactionStatus =>
  STATUS_MAP[(s || '').toLowerCase().trim()] ?? 'pending';

export const inferWithdrawalMethod = (chain?: string, _address?: string): WithdrawalMethod => {
  const c = (chain ?? '').toLowerCase();
  if (!c || c === 'fiat' || c === 'bank' || c === 'usd') return 'fiat';
  if (c === 'card') return 'card';
  if (c === 'p2p' || c === 'email' || c === 'railtag') return 'p2p';
  return 'crypto';
};

export const normalizeWithdrawals = (data: WithdrawalListResponse): Withdrawal[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.withdrawals ?? [];
};

export const depositToTransaction = (d: Deposit): Transaction => ({
  id: d.id,
  type: 'deposit' as TransactionType,
  title: 'Deposit',
  subtitle: d.chain ? `${d.currency} · ${d.chain}` : d.currency,
  amount: parseFloat(d.amount) || 0,
  currency: d.currency,
  status: normalizeStatus(d.status),
  createdAt: new Date(d.created_at),
  txHash: d.tx_hash,
});

export const withdrawalToTransaction = (w: Withdrawal): Transaction => {
  const method = inferWithdrawalMethod(w.destination_chain, w.destination_address);
  const addr = w.destination_address;
  const shortAddr = addr
    ? addr.length > 12
      ? `${addr.slice(0, 6)}…${addr.slice(-4)}`
      : addr
    : w.destination_chain || 'USD';
  return {
    id: w.id,
    type: 'withdraw' as TransactionType,
    title: 'Withdrawal',
    subtitle: shortAddr,
    amount: parseFloat(w.amount) || 0,
    currency: 'USD',
    status: normalizeStatus(w.status),
    createdAt: new Date(w.created_at || w.updated_at || '1970-01-01T00:00:00Z'),
    txHash: w.tx_hash,
    withdrawalMethod: method,
  };
};

export const p2pToTransaction = (t: P2PTransfer): Transaction => ({
  id: t.id,
  type: 'withdraw' as TransactionType,
  title: t.status === 'completed' || t.status === 'claimed' ? 'Sent' : 'P2P Transfer',
  subtitle: t.recipientIdentifier,
  amount: parseFloat(t.amount) || 0,
  currency: t.currency || 'USD',
  status: normalizeStatus(t.status === 'claimed' ? 'completed' : t.status),
  createdAt: new Date(t.createdAt || '1970-01-01T00:00:00Z'),
  withdrawalMethod: 'p2p' as WithdrawalMethod,
});

export const pajOrderToTransaction = (o: PajOrderStatus & { orderType?: string; createdAt?: string; tokenAmount?: number; bankAccountNumber?: string }): Transaction => {
  const isOfframp = o.type === 'OFF_RAMP' || o.orderType === 'offramp';
  const statusMap: Record<string, string> = { INIT: 'pending', PAID: 'pending', COMPLETED: 'completed', FAILED: 'failed' };
  return {
    id: o.orderId,
    type: (isOfframp ? 'withdraw' : 'deposit') as TransactionType,
    title: isOfframp ? 'NGN Withdrawal' : 'NGN Deposit',
    subtitle: isOfframp
      ? `₦${o.fiatAmount?.toLocaleString() ?? '0'} · PajCash`
      : `₦${o.fiatAmount?.toLocaleString() ?? '0'} · PajCash`,
    amount: o.amount || o.tokenAmount || 0,
    currency: 'USD',
    status: normalizeStatus(statusMap[o.status] ?? o.status),
    createdAt: new Date(o.createdAt || Date.now()),
    withdrawalMethod: isOfframp ? ('fiat' as WithdrawalMethod) : undefined,
  };
};
