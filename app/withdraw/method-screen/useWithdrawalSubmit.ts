import { useCallback } from 'react';
import { router } from 'expo-router';
import { useInitiateFiatWithdrawal, useInitiateWithdrawal } from '@/api/hooks/useFunding';
import { invalidateQueries, queryClient, queryKeys } from '@/api/queryClient';
import type { ExtendedWithdrawMethod } from './types';

interface SubmitCallbacks {
  onSuccess: () => void;
  onError: (err: unknown) => void;
}

interface UseWithdrawalSubmitOptions {
  selectedMethod: ExtendedWithdrawMethod;
  numericAmount: number;
  destinationInput: string;
  destinationChain?: string;
  isFundFlow: boolean;
  onStartMobileWalletFunding: () => void;
}

export function useWithdrawalSubmit({
  selectedMethod,
  numericAmount,
  destinationInput,
  destinationChain,
  isFundFlow,
  onStartMobileWalletFunding,
}: UseWithdrawalSubmitOptions) {
  const { mutate: initiateWithdrawal, isPending: isSubmittingCrypto } = useInitiateWithdrawal();
  const { mutate: initiateFiatWithdrawal, isPending: isSubmittingFiat } =
    useInitiateFiatWithdrawal();

  const isSubmitting = isSubmittingCrypto || isSubmittingFiat;

  const invalidateAll = useCallback(
    () =>
      Promise.all([
        invalidateQueries.station(),
        invalidateQueries.funding(),
        invalidateQueries.allocation(),
        invalidateQueries.wallet(),
        queryClient.refetchQueries({ queryKey: queryKeys.station.home(), type: 'active' }),
        queryClient.refetchQueries({ queryKey: queryKeys.funding.all, type: 'active' }),
      ]),
    []
  );

  const submit = useCallback(
    ({ onSuccess, onError }: SubmitCallbacks) => {
      const amount = Number(numericAmount.toFixed(2));
      const destination = destinationInput.trim();

      const handleSuccess = () => {
        void invalidateAll();
        onSuccess();
      };

      if (selectedMethod === 'crypto') {
        initiateWithdrawal(
          { amount, destination_address: destination, destination_chain: destinationChain },
          { onSuccess: handleSuccess, onError }
        );
        return;
      }

      if (selectedMethod === 'phantom' || selectedMethod === 'solflare') {
        if (isFundFlow) {
          onStartMobileWalletFunding();
          return;
        }
        initiateWithdrawal(
          { amount, destination_address: destination, destination_chain: destinationChain },
          { onSuccess: handleSuccess, onError }
        );
        return;
      }

      if (selectedMethod === 'asset-buy' || selectedMethod === 'asset-sell') {
        router.push({
          pathname: '/market-asset/trade',
          params: {
            symbol: destination.toUpperCase(),
            side: selectedMethod === 'asset-buy' ? 'buy' : 'sell',
            amount: amount.toFixed(2),
          },
        } as Parameters<typeof router.push>[0]);
        onSuccess();
        return;
      }

      // fiat
      initiateFiatWithdrawal(
        { amount, currency: 'USD', routing_number: destination.replace(/\D/g, '') },
        { onSuccess: handleSuccess, onError }
      );
    },
    [
      destinationInput,
      destinationChain,
      initiateFiatWithdrawal,
      initiateWithdrawal,
      invalidateAll,
      isFundFlow,
      numericAmount,
      onStartMobileWalletFunding,
      selectedMethod,
    ]
  );

  return { submit, isSubmitting };
}
