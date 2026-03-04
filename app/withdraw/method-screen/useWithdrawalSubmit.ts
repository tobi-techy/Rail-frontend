import { useCallback } from 'react';
import { router } from 'expo-router';
import { useInitiateFiatWithdrawal, useInitiateWithdrawal } from '@/api/hooks/useFunding';
import { invalidateQueries, queryClient, queryKeys } from '@/api/queryClient';
import { p2pService } from '@/api/services/p2p.service';
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
  // fiat extras
  fiatAccountHolderName?: string;
  fiatAccountNumber?: string;
  // p2p extras
  p2pNote?: string;
}

export function useWithdrawalSubmit({
  selectedMethod,
  numericAmount,
  destinationInput,
  destinationChain,
  isFundFlow,
  onStartMobileWalletFunding,
  fiatAccountHolderName,
  fiatAccountNumber,
  p2pNote,
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

      // ── P2P methods ───────────────────────────────────────────────────────
      if (
        selectedMethod === 'p2p' ||
        selectedMethod === 'railtag' ||
        selectedMethod === 'email' ||
        selectedMethod === 'contact'
      ) {
        p2pService
          .send({ identifier: destination, amount: amount.toFixed(2), note: p2pNote })
          .then(() => handleSuccess())
          .catch((err: unknown) => onError(err));
        return;
      }

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
        {
          amount,
          currency: 'USD',
          account_holder_name: (fiatAccountHolderName ?? '').trim(),
          account_number: (fiatAccountNumber ?? '').replace(/\D/g, ''),
          routing_number: destination.replace(/\D/g, ''),
        },
        { onSuccess: handleSuccess, onError }
      );
    },
    [
      destinationInput,
      destinationChain,
      fiatAccountHolderName,
      fiatAccountNumber,
      initiateFiatWithdrawal,
      initiateWithdrawal,
      invalidateAll,
      isFundFlow,
      numericAmount,
      onStartMobileWalletFunding,
      p2pNote,
      selectedMethod,
    ]
  );

  return { submit, isSubmitting };
}
