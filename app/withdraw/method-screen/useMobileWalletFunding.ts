import { useState, useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useDeposits } from '@/api/hooks/useFunding';
import { useWalletAddresses } from '@/api/hooks/useWallet';
import { invalidateQueries, queryClient, queryKeys } from '@/api/queryClient';
import { ANALYTICS_EVENTS, useAnalytics } from '@/utils/analytics';
import { SOLANA_TESTNET_CHAIN } from '@/utils/chains';
import type { Deposit } from '@/api/types';
import { FUNDING_POLL_INTERVAL_MS, FUNDING_POLL_TIMEOUT_MS } from './constants';
import type { ExtendedWithdrawMethod as WithdrawMethod } from './types';

interface UseMobileWalletFundingOptions {
  enabled: boolean;
  selectedMethod: WithdrawMethod;
  numericAmount: number;
  spendBalance: string | undefined;
  onConfirmed: () => void;
  onTimedOut: () => void;
}

export function useMobileWalletFunding({
  enabled,
  selectedMethod,
  numericAmount,
  spendBalance,
  onConfirmed,
  onTimedOut,
}: UseMobileWalletFundingOptions) {
  const { track } = useAnalytics();
  const { refetch: refetchWalletAddress } = useWalletAddresses(SOLANA_TESTNET_CHAIN);
  const deposits = useDeposits(30, 0);

  const [fundingError, setFundingError] = useState('');
  const [fundingSignature, setFundingSignature] = useState('');
  const [isFundingPending, setIsFundingPending] = useState(false);
  const [fundingTimedOut, setFundingTimedOut] = useState(false);
  const [fundingConfirmed, setFundingConfirmed] = useState(false);
  const [isLaunchingWallet, setIsLaunchingWallet] = useState(false);
  const [fundingStartMs, setFundingStartMs] = useState<number | null>(null);
  const [fundingBaselineBalance, setFundingBaselineBalance] = useState<number | null>(null);

  const hasDepositWithSignature = useCallback((entries: Deposit[] | undefined, sig: string) => {
    if (!entries?.length || !sig.trim()) return false;
    const target = sig.trim().toLowerCase();
    return entries.some((e) => String(e.tx_hash || '').toLowerCase() === target);
  }, []);

  const checkFundingConfirmation = useCallback(async () => {
    if (!isFundingPending || !fundingStartMs) return;

    if (Date.now() - fundingStartMs > FUNDING_POLL_TIMEOUT_MS) {
      setIsFundingPending(false);
      setFundingTimedOut(true);
      onTimedOut();
      track('deposit_failed', {
        wallet: selectedMethod,
        amount: Number(numericAmount.toFixed(2)),
        signature: fundingSignature || undefined,
        reason: 'poll_timeout',
      });
      return;
    }

    const [depositsResult, stationResult] = (await Promise.all([
      deposits.refetch(),
      invalidateQueries.funding(),
      invalidateQueries.station(),
    ])) as [Awaited<ReturnType<typeof deposits.refetch>>, ...unknown[]];

    const signatureConfirmed = hasDepositWithSignature(
      depositsResult.data?.deposits,
      fundingSignature
    );
    const latestSpend = Number.parseFloat(
      (stationResult as { data?: { spend_balance?: string } })?.data?.spend_balance ?? ''
    );
    const baseline = fundingBaselineBalance ?? 0;
    const balanceConfirmed =
      Number.isFinite(latestSpend) &&
      latestSpend >= baseline + Number(numericAmount.toFixed(2)) - 0.01;

    if (!signatureConfirmed && !balanceConfirmed) return;

    setIsFundingPending(false);
    setFundingTimedOut(false);
    setFundingConfirmed(true);
    onConfirmed();
    track(ANALYTICS_EVENTS.DEPOSIT_COMPLETED, {
      wallet: selectedMethod,
      amount: Number(numericAmount.toFixed(2)),
      signature: fundingSignature || undefined,
      confirmation: signatureConfirmed ? 'tx_hash' : 'balance_delta',
    });
    void Promise.all([
      queryClient.refetchQueries({ queryKey: queryKeys.station.home(), type: 'active' }),
      queryClient.refetchQueries({ queryKey: queryKeys.funding.all, type: 'active' }),
      queryClient.refetchQueries({ queryKey: queryKeys.wallet.all, type: 'active' }),
    ]);
  }, [
    deposits,
    fundingBaselineBalance,
    fundingSignature,
    fundingStartMs,
    hasDepositWithSignature,
    isFundingPending,
    numericAmount,
    onConfirmed,
    onTimedOut,
    selectedMethod,
    track,
  ]);

  // Poll on interval
  useEffect(() => {
    if (!isFundingPending) return;
    const t = setInterval(() => void checkFundingConfirmation(), FUNDING_POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [checkFundingConfirmation, isFundingPending]);

  // Poll on app foreground
  useEffect(() => {
    if (!isFundingPending) return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void checkFundingConfirmation();
    });
    return () => sub.remove();
  }, [checkFundingConfirmation, isFundingPending]);

  const startFunding = useCallback(
    async (onDone: () => void) => {
      if (!enabled) return;
      setFundingError('');
      setFundingTimedOut(false);
      setFundingConfirmed(false);
      setIsLaunchingWallet(true);

      try {
        const walletResult = await refetchWalletAddress();
        const recipientOwnerAddress = walletResult.data?.address?.trim();
        if (!recipientOwnerAddress)
          throw new Error('Unable to load your Rail wallet address. Please try again.');

        const amount = Number(numericAmount.toFixed(2));
        const baseline = Number.parseFloat(spendBalance ?? '');
        setFundingBaselineBalance(Number.isFinite(baseline) ? baseline : 0);

        track(ANALYTICS_EVENTS.DEPOSIT_INITIATED, { wallet: selectedMethod, amount });

        const { startMobileWalletFunding } = await import('@/services/solanaFunding');
        const result = await startMobileWalletFunding({
          wallet: selectedMethod as 'phantom' | 'solflare',
          amountUsd: amount,
          recipientOwnerAddress,
        });

        setIsFundingPending(true);
        setFundingSignature(result.signature);
        setFundingStartMs(Date.now());
        onDone();
      } catch (err: unknown) {
        const e = err as { code?: string; category?: string; message?: string };
        setFundingError(e?.message || 'Funding failed. Please try again.');
        track('deposit_failed', {
          wallet: selectedMethod,
          amount: Number(numericAmount.toFixed(2)),
          reason: String(e?.code || e?.category || 'UNKNOWN'),
        });
      } finally {
        setIsLaunchingWallet(false);
      }
    },
    [enabled, numericAmount, refetchWalletAddress, selectedMethod, spendBalance, track]
  );

  const reset = useCallback(() => {
    setFundingError('');
    setFundingSignature('');
    setIsFundingPending(false);
    setFundingTimedOut(false);
    setFundingConfirmed(false);
    setFundingStartMs(null);
    setFundingBaselineBalance(null);
  }, []);

  return {
    fundingError,
    fundingSignature,
    isFundingPending,
    fundingTimedOut,
    fundingConfirmed,
    isLaunchingWallet,
    startFunding,
    reset,
  };
}
