import { useMemo } from 'react';
import { formatCurrency } from './utils';

interface UseAmountNudgeOptions {
  numericAmount: number;
  amountError: string;
  availableBalance: number;
  maxWithdrawable: number;
  feeAmount: number;
  isFundFlow: boolean;
  isNGNAsset: boolean;
  limitLabel: string;
}

export function useAmountNudge({
  numericAmount,
  amountError,
  availableBalance,
  maxWithdrawable,
  feeAmount,
  isFundFlow,
  isNGNAsset,
  limitLabel,
}: UseAmountNudgeOptions) {
  const hint = useMemo(() => {
    const issue = amountError ? ` Current validation issue: ${amountError}` : '';
    return [
      `${isFundFlow ? 'funding' : 'withdrawal'} amount entry`,
      `available balance ${isNGNAsset ? 'NGN' : 'USD'} ${formatCurrency(availableBalance)}`,
      `method limit ${isNGNAsset ? 'NGN' : 'USD'} ${formatCurrency(maxWithdrawable)}`,
      `estimated fee ${isNGNAsset ? 'NGN' : 'USD'} ${formatCurrency(feeAmount)}`,
      issue,
    ]
      .filter(Boolean)
      .join('; ');
  }, [amountError, availableBalance, feeAmount, isFundFlow, isNGNAsset, maxWithdrawable]);

  const actions = useMemo(
    () => [
      'typing_withdrawal_amount',
      amountError ? 'amount_has_validation_error' : 'amount_valid',
      numericAmount >= maxWithdrawable * 0.8 ? 'near_withdrawal_limit' : 'within_withdrawal_limit',
    ],
    [amountError, maxWithdrawable, numericAmount]
  );

  const fallbackNudge = useMemo(() => {
    if (numericAmount <= 0) return null;
    if (amountError) {
      return {
        show: true,
        message: amountError,
        severity: 'warning' as const,
        shake: false,
        expires_in: 10,
      };
    }
    if (maxWithdrawable > 0 && numericAmount >= maxWithdrawable * 0.8) {
      return {
        show: true,
        message: `That is close to your ${limitLabel.toLowerCase()}. Keep enough room for fees and anything due next.`,
        severity: 'warning' as const,
        shake: false,
        expires_in: 10,
      };
    }
    return {
      show: true,
      message: `I am watching this ${isFundFlow ? 'funding' : 'withdrawal'} as you type. Current amount: ${isNGNAsset ? '₦' : '$'}${formatCurrency(numericAmount)}.`,
      severity: 'info' as const,
      shake: false,
      expires_in: 8,
    };
  }, [amountError, isFundFlow, isNGNAsset, maxWithdrawable, limitLabel, numericAmount]);

  return { hint, actions, fallbackNudge };
}
