import type { Transaction, TransactionType, TransactionStatus, WithdrawalMethod } from '@/components/molecules/TransactionItem';
import type { Deposit, Withdrawal } from '@/api/types';

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
    ? addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr
    : w.destination_chain || 'USD';
  return {
    id: w.id,
    type: 'withdraw' as TransactionType,
    title: 'Withdrawal',
    subtitle: shortAddr,
    amount: parseFloat(w.amount) || 0,
    currency: 'USD',
    status: normalizeStatus(w.status),
    createdAt: new Date(w.created_at || w.updated_at || new Date().toISOString()),
    txHash: w.tx_hash,
    withdrawalMethod: method,
  };
};
