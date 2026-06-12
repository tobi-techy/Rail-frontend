import { useState, useCallback } from 'react';
import { useAnalytics, ANALYTICS_EVENTS } from '@/utils/analytics';
import apiClient from '@/api/client';
import { getDefaultWithdrawalChain } from '@/utils/chains';

interface UseMWAWithdrawalOptions {
  enabled: boolean;
  numericAmount: number;
  onSuccess: () => void;
  category?: string;
  narration?: string;
}

export function useMWAWithdrawal({
  enabled,
  numericAmount,
  onSuccess,
  category,
  narration,
}: UseMWAWithdrawalOptions) {
  const { track } = useAnalytics();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [withdrawalId, setWithdrawalId] = useState('');

  const startWithdrawal = useCallback(async () => {
    if (!enabled) return;
    setError('');
    setIsConnecting(true);

    try {
      // Step 1: Open MWA wallet picker (Seed Vault on Seeker, Phantom/Solflare elsewhere)
      const { connectMobileWalletForWithdrawal } = await import('@/services/solanaWithdrawal');
      const { destinationAddress } = await connectMobileWalletForWithdrawal();

      setIsConnecting(false);
      setIsSubmitting(true);

      // Step 2: Ask backend to send USDC to that address
      const response = await apiClient.post<{ id: string }>('/v1/withdrawals/crypto', {
        amount: numericAmount.toFixed(2),
        destination_address: destinationAddress,
        destination_chain: getDefaultWithdrawalChain(),
        category: category?.trim() || undefined,
        narration: narration?.trim() || undefined,
      });

      setWithdrawalId(response.id ?? '');
      track(ANALYTICS_EVENTS.DEPOSIT_COMPLETED, {
        method: 'mwa-withdraw',
        amount: numericAmount,
        destination: destinationAddress,
      });

      onSuccess();
    } catch (err: any) {
      const msg =
        err?.message?.toLowerCase().includes('cancel') ||
        err?.message?.toLowerCase().includes('reject')
          ? 'Wallet connection cancelled.'
          : err?.message || 'Withdrawal failed. Please try again.';
      setError(msg);
    } finally {
      setIsConnecting(false);
      setIsSubmitting(false);
    }
  }, [category, enabled, narration, numericAmount, onSuccess, track]);

  const reset = useCallback(() => {
    setError('');
    setWithdrawalId('');
  }, []);

  return {
    isConnecting,
    isSubmitting,
    isLoading: isConnecting || isSubmitting,
    error,
    withdrawalId,
    startWithdrawal,
    reset,
  };
}
