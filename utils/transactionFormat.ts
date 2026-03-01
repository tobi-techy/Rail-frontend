import type { TransactionType } from '@/components/molecules/TransactionItem';

const fmt = (abs: number) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: abs % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(abs);

/** Full transaction amount with sign prefix and currency suffix. */
export const formatTransactionAmount = (
  amount: number,
  type: TransactionType,
  currency = 'NGN'
): { text: string; isCredit: boolean } => {
  const isCredit = type === 'receive' || type === 'deposit';
  const abs = Math.abs(amount);
  return { text: `${isCredit ? '+' : '-'}${fmt(abs)} ${currency}`, isCredit };
};

/** Plain absolute amount string (no sign, no currency). */
export const formatAbsAmount = (amount: number): string => fmt(Math.abs(amount));
