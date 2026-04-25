import { useCallback, useRef } from 'react';
import { router } from 'expo-router';
import { useInitiateFiatWithdrawal, useInitiateWithdrawal } from '@/api/hooks/useFunding';
import { invalidateQueries, queryClient, queryKeys } from '@/api/queryClient';
import { p2pService } from '@/api/services/p2p.service';
import type { ExtendedWithdrawMethod, FiatCurrency } from './types';

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
  // asset from picker (USD, EUR, NGN, USDC, etc.)
  asset?: string;
  // fiat extras
  fiatCurrency?: FiatCurrency;
  fiatAccountHolderName?: string;
  fiatAccountNumber?: string;
  fiatBic?: string;
  // p2p extras
  p2pNote?: string;
  category?: string;
  narration?: string;
}

export function useWithdrawalSubmit({
  selectedMethod,
  numericAmount,
  destinationInput,
  destinationChain,
  isFundFlow,
  onStartMobileWalletFunding,
  asset,
  fiatCurrency,
  fiatAccountHolderName,
  fiatAccountNumber,
  fiatBic,
  p2pNote,
  category,
  narration,
}: UseWithdrawalSubmitOptions) {
  const { mutate: initiateWithdrawal, isPending: isSubmittingCrypto } = useInitiateWithdrawal();
  const { mutate: initiateFiatWithdrawal, isPending: isSubmittingFiat } =
    useInitiateFiatWithdrawal();

  const isSubmitting = isSubmittingCrypto || isSubmittingFiat;

  // Use refs to store latest values to avoid stale closures
  const optionsRef = useRef({
    selectedMethod,
    numericAmount,
    destinationInput,
    destinationChain,
    isFundFlow,
    onStartMobileWalletFunding,
    asset,
    fiatCurrency,
    fiatAccountHolderName,
    fiatAccountNumber,
    fiatBic,
    p2pNote,
    category,
    narration,
  });
  optionsRef.current = {
    selectedMethod,
    numericAmount,
    destinationInput,
    destinationChain,
    isFundFlow,
    onStartMobileWalletFunding,
    asset,
    fiatCurrency,
    fiatAccountHolderName,
    fiatAccountNumber,
    fiatBic,
    p2pNote,
    category,
    narration,
  };

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
      // Use values from ref to get latest state
      const opts = optionsRef.current;
      const amount = Number(opts.numericAmount.toFixed(2));
      const destination = opts.destinationInput.trim();
      const normalizedCategory = opts.category?.trim();
      const normalizedNarration = opts.narration?.trim();

      const handleSuccess = () => {
        void invalidateAll();
        onSuccess();
      };

      // ── P2P methods ───────────────────────────────────────────────────────
      if (
        opts.selectedMethod === 'p2p' ||
        opts.selectedMethod === 'railtag' ||
        opts.selectedMethod === 'email' ||
        opts.selectedMethod === 'contact'
      ) {
        p2pService
          .send({ identifier: destination, amount: amount.toFixed(2), note: opts.p2pNote })
          .then(() => handleSuccess())
          .catch((err: unknown) => onError(err));
        return;
      }

      if (opts.selectedMethod === 'crypto') {
        initiateWithdrawal(
          {
            amount,
            destination_address: destination,
            destination_chain: opts.destinationChain,
            category: normalizedCategory,
            narration: normalizedNarration,
          },
          { onSuccess: handleSuccess, onError }
        );
        return;
      }

      if (opts.selectedMethod === 'phantom' || opts.selectedMethod === 'solflare') {
        if (opts.isFundFlow) {
          opts.onStartMobileWalletFunding();
          return;
        }
        initiateWithdrawal(
          {
            amount,
            destination_address: destination,
            destination_chain: opts.destinationChain,
            category: normalizedCategory,
            narration: normalizedNarration,
          },
          { onSuccess: handleSuccess, onError }
        );
        return;
      }

      if (opts.selectedMethod === 'asset-buy' || opts.selectedMethod === 'asset-sell') {
        router.push({
          pathname: '/market-asset/trade',
          params: {
            symbol: destination.toUpperCase(),
            side: opts.selectedMethod === 'asset-buy' ? 'buy' : 'sell',
            amount: amount.toFixed(2),
          },
        } as Parameters<typeof router.push>[0]);
        onSuccess();
        return;
      }

      // fiat
      const currency = opts.fiatCurrency ?? 'USD';
      initiateFiatWithdrawal(
        {
          amount,
          currency,
          account_holder_name: (opts.fiatAccountHolderName ?? '').trim(),
          account_number: currency === 'EUR'
            ? '' // EUR uses IBAN only
            : (opts.fiatAccountNumber ?? '').replace(/\D/g, ''),
          routing_number: currency === 'EUR'
            ? destination.replace(/\s/g, '').toUpperCase() // IBAN
            : currency === 'GBP'
              ? destination.replace(/\D/g, '') // sort code
              : destination.replace(/\D/g, ''), // USD routing number
          ...(currency === 'EUR' && opts.fiatBic ? { bic: opts.fiatBic.replace(/\s/g, '').toUpperCase() } : {}),
          category: normalizedCategory,
          narration: normalizedNarration,
        },
        { onSuccess: handleSuccess, onError }
      );
    },
    [initiateFiatWithdrawal, initiateWithdrawal, invalidateAll]
  );

  return { submit, isSubmitting };
}
