import { useCallback, useMemo, useState } from 'react';
import { useStation } from '@/api/hooks';
import { useUIStore } from '@/stores';
import { usePajRates } from '@/api/hooks/usePaj';
import {
  formatCurrency,
  formatMaxAmount,
  getAmountError,
  normalizeAmount,
  toDisplayAmount,
} from './utils';
import type { ExtendedWithdrawMethod } from './types';
import { FALLBACK_AVAILABLE_BALANCE, LIMITS, MAX_INTEGER_DIGITS, getMethodCopy } from './constants';
import {
  MIN_CRYPTO_TRANSACTION_AMOUNT_USD,
  MIN_EUR_TRANSACTION_AMOUNT,
  MIN_NGN_TRANSACTION_AMOUNT,
} from '@/constants/transactionLimits';

interface UseWithdrawalAmountOptions {
  selectedMethod: ExtendedWithdrawMethod;
  isFundFlow: boolean;
  isFiatMethod: boolean;
  asset?: string;
}

export function useWithdrawalAmount({
  selectedMethod,
  isFundFlow,
  isFiatMethod,
  asset,
}: UseWithdrawalAmountOptions) {
  const { data: station } = useStation();
  const storeCurrency = useUIStore((s) => s.currency);
  const { data: pajRatesData } = usePajRates();

  const isNGNAsset = asset === 'NGN';
  const ngnRate = pajRatesData?.offRampRate?.rate ?? 0;
  const railFeeBase = pajRatesData?.railFee ?? 50;
  const stampDuty = pajRatesData?.stampDuty ?? 50;
  const stampDutyAbove = pajRatesData?.stampDutyAbove ?? 10000;
  const minNGN = pajRatesData?.minWithdrawalNGN ?? MIN_NGN_TRANSACTION_AMOUNT;

  const methodCopy = useMemo(
    () => getMethodCopy(selectedMethod, isFundFlow),
    [isFundFlow, selectedMethod]
  );

  const [rawAmount, setRawAmount] = useState('0');

  const availableBalance = useMemo(() => {
    const source =
      selectedMethod === 'asset-buy'
        ? station?.broker_cash
        : selectedMethod === 'asset-sell'
          ? station?.invest_balance
          : station?.spend_balance;
    const parsed = Number.parseFloat(source ?? '');
    const usdBalance = Number.isFinite(parsed) && parsed >= 0 ? parsed : FALLBACK_AVAILABLE_BALANCE;
    return isNGNAsset && ngnRate > 0 ? usdBalance * ngnRate : usdBalance;
  }, [
    selectedMethod,
    station?.broker_cash,
    station?.invest_balance,
    station?.spend_balance,
    isNGNAsset,
    ngnRate,
  ]);

  const withdrawalLimit =
    isNGNAsset && ngnRate > 0 ? LIMITS[selectedMethod] * ngnRate : LIMITS[selectedMethod];
  const maxWithdrawable = isFundFlow
    ? withdrawalLimit
    : Math.min(withdrawalLimit, availableBalance);

  const numericAmount = useMemo(() => {
    const n = Number.parseFloat(rawAmount);
    return Number.isFinite(n) ? n : 0;
  }, [rawAmount]);

  const feeAmount = useMemo(() => {
    if (numericAmount <= 0) return 0;
    if (isFiatMethod) {
      if (asset === 'NGN') {
        const feeNGN = numericAmount > stampDutyAbove ? railFeeBase + stampDuty : railFeeBase;
        return ngnRate > 0 ? feeNGN / ngnRate : 0.04;
      }
      return 1.0;
    }
    return 0.1;
  }, [numericAmount, isFiatMethod, asset, ngnRate, railFeeBase, stampDuty, stampDutyAbove]);

  const amountError = useMemo(
    () =>
      getAmountError({
        availableBalance,
        isFundFlow,
        limitLabel: methodCopy.limitLabel,
        numericAmount,
        withdrawalLimit,
        feeAmount,
        currencySymbol: isNGNAsset ? '₦' : asset === 'EUR' ? '€' : '$',
        minAmount: isNGNAsset
          ? minNGN
          : asset === 'EUR'
            ? MIN_EUR_TRANSACTION_AMOUNT
            : MIN_CRYPTO_TRANSACTION_AMOUNT_USD,
        minAmountLabel: isFundFlow ? 'funding' : 'withdrawal',
      }),
    [
      availableBalance,
      isFundFlow,
      methodCopy.limitLabel,
      numericAmount,
      withdrawalLimit,
      feeAmount,
      isNGNAsset,
      asset,
      minNGN,
    ]
  );

  const canContinue = numericAmount > 0 && !amountError;
  const displayAmount = toDisplayAmount(rawAmount);

  const onAmountKeyPress = useCallback(
    (key: string) => {
      setRawAmount((current) => {
        if (key === 'backspace')
          return current === '0' ? current : normalizeAmount(current.slice(0, -1));
        if (key === 'decimal') return current.includes('.') ? current : `${current}.`;
        if (!/^\d$/.test(key)) return current;
        if (current.includes('.')) {
          const [int, dec = ''] = current.split('.');
          return dec.length >= 2 ? current : `${int}.${dec}${key}`;
        }
        const next = (current === '0' ? key : `${current}${key}`).replace(/^0+(?=\d)/, '') || '0';
        if (next.length > MAX_INTEGER_DIGITS) return current;
        if (maxWithdrawable > 0 && Number.parseFloat(next) > maxWithdrawable)
          return formatMaxAmount(maxWithdrawable);
        return next;
      });
    },
    [maxWithdrawable]
  );

  const onMaxPress = useCallback(() => {
    setRawAmount(formatMaxAmount(maxWithdrawable));
  }, [maxWithdrawable]);

  const resetAmount = useCallback(() => setRawAmount('0'), []);

  return {
    rawAmount,
    numericAmount,
    displayAmount,
    feeAmount,
    amountError,
    availableBalance,
    withdrawalLimit,
    maxWithdrawable,
    canContinue,
    isNGNAsset,
    storeCurrency,
    methodCopy,
    onAmountKeyPress,
    onMaxPress,
    resetAmount,
    formatCurrency,
  };
}
