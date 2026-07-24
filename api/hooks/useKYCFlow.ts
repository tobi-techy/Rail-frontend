import { useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useKYCStatus, useTierCapabilities } from './useKYC';
import { useNgnVirtualAccount, useAutoProvisionNgn } from './useVirtualAccount';
import { queryKeys } from '../queryClient';
import type { KYCStatusResponse, TierCapabilities } from '../types/kyc';
import type { NgnVirtualAccount } from '../types/funding';

export interface KYCFlowState {
  /** Raw KYC status from server. Undefined while loading. */
  kycStatus: KYCStatusResponse | undefined;
  /** Derived tier capabilities. Always valid (defaults to tier 0). */
  capabilities: TierCapabilities;
  /** Current tier number (0-3). */
  tier: number;
  /** Whether the KYC status query is still loading. */
  isStatusLoading: boolean;

  // NGN account
  /** NGN virtual account data. Null if not provisioned. */
  ngnAccount: NgnVirtualAccount | null;
  /** Whether the NGN account query is in flight. */
  isNgnLoading: boolean;
  /** Error from the NGN account query. */
  ngnError: Error | null;
  /** Whether an NGN account exists. */
  hasNgnAccount: boolean;

  // Capability shortcuts
  canReceiveNgn: boolean;
  canUseCard: boolean;
  canInvest: boolean;
  canDepositCrypto: boolean;
  canDepositFiatUsd: boolean;

  // Verification shortcuts
  bvnVerified: boolean;
  ninVerified: boolean;
  isFullyVerified: boolean;
  hasBegunVerification: boolean;

  // Mutations
  autoProvisionNgn: () => Promise<NgnVirtualAccount | undefined>;

  // Utilities
  /** Invalidate all KYC + NGN queries. Call after mutations complete. */
  refetchAll: () => Promise<void>;
  /** Whether the entire flow is still initializing. */
  isInitializing: boolean;
}

/**
 * Single hook that consolidates KYC status, tier capabilities, and NGN account
 * data. Use this instead of calling useKYCStatus + useTierCapabilities +
 * useNgnVirtualAccount separately — it shares one query cache and exposes
 * derived state so screens don't re-derive the same booleans.
 *
 * @param enabled - Set to false to skip NGN account fetch (e.g. for non-NGN screens).
 */
export function useKYCFlow(enabled = true): KYCFlowState {
  const queryClient = useQueryClient();

  const { data: kycStatus, isLoading: isStatusLoading } = useKYCStatus();

  const { capabilities, tier, bvnVerified, ninVerified } = useTierCapabilities();

  const {
    data: ngnResponse,
    isLoading: isNgnLoading,
    error: ngnError,
  } = useNgnVirtualAccount(enabled);

  const autoProvisionMutation = useAutoProvisionNgn();

  const ngnAccount = ngnResponse?.virtual_account ?? null;
  const hasNgnAccount = !!ngnAccount;

  const isFullyVerified = capabilities.tier >= 3;
  const hasBegunVerification = !!(
    kycStatus?.has_submitted ||
    kycStatus?.bvn_verified ||
    kycStatus?.nin_verified
  );

  const autoProvisionNgn = useCallback(async (): Promise<NgnVirtualAccount | undefined> => {
    const result = await autoProvisionMutation.mutateAsync(undefined);
    return result?.virtual_account;
  }, [autoProvisionMutation]);

  const refetchAll = useCallback(async () => {
    // Invalidate triggers a refetch for each query, so we don't need separate refetch() calls
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.user.kycStatus() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.virtualAccount.ngn() }),
    ]);
  }, [queryClient]);

  const isInitializing = isStatusLoading && !kycStatus;

  return useMemo(
    () => ({
      kycStatus,
      capabilities,
      tier,
      isStatusLoading,
      ngnAccount,
      isNgnLoading,
      ngnError: ngnError as Error | null,
      hasNgnAccount,
      canReceiveNgn: capabilities.can_receive_ngn,
      canUseCard: capabilities.can_use_card,
      canInvest: capabilities.can_invest,
      canDepositCrypto: capabilities.can_deposit_crypto,
      canDepositFiatUsd: capabilities.can_deposit_fiat_usd,
      bvnVerified,
      ninVerified,
      isFullyVerified,
      hasBegunVerification,
      autoProvisionNgn,
      refetchAll,
      isInitializing,
    }),
    [
      kycStatus,
      capabilities,
      tier,
      isStatusLoading,
      ngnAccount,
      isNgnLoading,
      ngnError,
      hasNgnAccount,
      bvnVerified,
      ninVerified,
      isFullyVerified,
      hasBegunVerification,
      autoProvisionNgn,
      refetchAll,
      isInitializing,
    ]
  );
}
