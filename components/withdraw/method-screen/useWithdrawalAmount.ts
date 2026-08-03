import { useCallback, useMemo, useRef, useState } from 'react';
import { useStation } from '@/api/hooks';
import { useUIStore } from '@/stores';
import { usePajRates } from '@/api/hooks/usePaj';
import { useRampQuote } from '@/api/hooks/useRamp';
import {
  formatCurrency,
  formatMaxAmount,
  getAmountCtaError,
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
  /** Fired when a keypress is rejected or clamped (extra decimals, digit cap,
   *  over max) — lets the screen answer with a shake + haptic instead of silence. */
  onBlocked?: () => void;
}

export function useWithdrawalAmount({
  selectedMethod,
  isFundFlow,
  isFiatMethod,
  asset,
  onBlocked,
}: UseWithdrawalAmountOptions) {
  const { data: station } = useStation();
  const storeCurrency = useUIStore((s) => s.currency);
  const { data: pajRatesData } = usePajRates();

  const isNGNAsset = asset === 'NGN';

  // NGN withdrawals execute through the unified ramp (RampHub primary, Paj
  // fallback), so price with the same source: ramp quote first, Paj rate as
  // fallback. Pricing with Paj alone diverges from the executing rate.
  const { data: rampQuote } = useRampQuote('offramp');
  const rampRate = isNGNAsset ? (rampQuote?.rate ?? 0) : 0;
  const ngnRate = rampRate > 0 ? rampRate : (pajRatesData?.offRampRate?.rate ?? 0);

  // Prefer Ramp quote fee (already in the executing provider's native fee);
  // fall back to Paj fee schedule when Ramp quote has no fee.
  const rampFeeUSD = isNGNAsset ? (rampQuote?.fee ?? 0) : 0;
  const railFeeBase = pajRatesData?.railFee ?? 50;
  const stampDuty = pajRatesData?.stampDuty ?? 50;
  const stampDutyAbove = pajRatesData?.stampDutyAbove ?? 10000;
  const minNGN = pajRatesData?.minWithdrawalNGN ?? MIN_NGN_TRANSACTION_AMOUNT;

  const methodCopy = useMemo(
    () => getMethodCopy(selectedMethod, isFundFlow),
    [isFundFlow, selectedMethod]
  );

  const [rawAmount, setRawAmount] = useState('0');

  const usdBalance = useMemo(() => {
    const source =
      selectedMethod === 'asset-buy'
        ? station?.broker_cash
        : selectedMethod === 'asset-sell'
          ? station?.invest_balance
          : station?.spend_balance;
    const parsed = Number.parseFloat(source ?? '');
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : FALLBACK_AVAILABLE_BALANCE;
  }, [selectedMethod, station?.broker_cash, station?.invest_balance, station?.spend_balance]);

  const availableBalance = useMemo(
    () => (isNGNAsset && ngnRate > 0 ? usdBalance * ngnRate : usdBalance),
    [usdBalance, isNGNAsset, ngnRate]
  );

  const withdrawalLimit =
    isNGNAsset && ngnRate > 0 ? LIMITS[selectedMethod] * ngnRate : LIMITS[selectedMethod];

  // The backend holds the USDC equivalent plus a slippage buffer (2%, capped
  // at $50) for NGN withdrawals. Haircut the max by that buffer so "Max" never
  // requests more than the hold check will allow.
  const spendableForMax = useMemo(() => {
    if (!isNGNAsset || ngnRate <= 0) return availableBalance;
    const bufferUSD = Math.min(usdBalance * 0.02, 50);
    return Math.max(0, (usdBalance - bufferUSD) * ngnRate);
  }, [availableBalance, isNGNAsset, ngnRate, usdBalance]);

  const maxWithdrawable = isFundFlow ? withdrawalLimit : Math.min(withdrawalLimit, spendableForMax);

  const numericAmount = useMemo(() => {
    const n = Number.parseFloat(rawAmount);
    return Number.isFinite(n) ? n : 0;
  }, [rawAmount]);

  const feeAmount = useMemo(() => {
    if (numericAmount <= 0) return 0;
    if (isFiatMethod) {
      if (asset === 'NGN') {
        // Ramp quote fee is in USD — use directly.
        if (rampFeeUSD > 0) return rampFeeUSD;
        // Paj fallback: flat rail fee + stamp duty above threshold, converted to USD.
        const feeNGN = numericAmount > stampDutyAbove ? railFeeBase + stampDuty : railFeeBase;
        return ngnRate > 0 ? feeNGN / ngnRate : 0.04;
      }
      return 1.0;
    }
    return 0.1;
  }, [
    numericAmount,
    isFiatMethod,
    asset,
    ngnRate,
    rampFeeUSD,
    railFeeBase,
    stampDuty,
    stampDutyAbove,
  ]);

  const errorInput = useMemo(
    () => ({
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

  const amountError = useMemo(() => getAmountError(errorInput), [errorInput]);
  // Button-sized blocking reason ("Minimum is ₦1,000", "Insufficient balance")
  const ctaError = useMemo(() => getAmountCtaError(errorInput), [errorInput]);

  const canContinue = numericAmount > 0 && !amountError;
  const displayAmount = toDisplayAmount(rawAmount);

  // Latest value in a ref: the blocked-feedback decision reads it without the
  // callback identity churning per keystroke (which would re-render the keypad),
  // while the mutation itself stays a functional update so rapid keypresses
  // can never compute from a stale value and drop a digit.
  const rawAmountRef = useRef(rawAmount);
  rawAmountRef.current = rawAmount;

  const onAmountKeyPress = useCallback(
    (key: string) => {
      const cur = rawAmountRef.current;

      // Feedback: was this keypress rejected or clamped?
      if (key === 'decimal' && cur.includes('.')) onBlocked?.();
      else if (/^\d$/.test(key)) {
        if (cur.includes('.')) {
          if ((cur.split('.')[1] ?? '').length >= 2) onBlocked?.();
        } else {
          const next = (cur === '0' ? key : `${cur}${key}`).replace(/^0+(?=\d)/, '') || '0';
          if (next.length > MAX_INTEGER_DIGITS) onBlocked?.();
          else if (maxWithdrawable > 0 && Number.parseFloat(next) > maxWithdrawable) onBlocked?.();
        }
      }

      // Mutation: pure functional update
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
    [maxWithdrawable, onBlocked]
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
    ctaError,
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
