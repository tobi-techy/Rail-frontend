import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { kycService } from '../services';
import { queryKeys } from '../queryClient';
import { useAuthStore } from '../../stores/authStore';
import { getTierCapabilities, type TierNextStep } from '../types/kyc';
import type { StartDiditSessionRequest, KycStatus, SubmitKYCRequest } from '../types';

export function useKYCStatus(enabled = true) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.user.kycStatus(),
    queryFn: () => kycService.getKYCStatus(),
    enabled: isAuthenticated && enabled,
    // Active verification transitions are handled by useKycStatusPolling; mutations
    // invalidate this key. 5 min staleTime stops a refetch on every mount/focus.
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Capability-driven view of KYC status. Drive UI off `capabilities` (and the
 * BVN/NIN flags), never off inferred tier math. `nextStep` is the single unlock
 * action the user should take next.
 */
export function useTierCapabilities(enabled = true) {
  const { data: status, isLoading, refetch } = useKYCStatus(enabled);

  return useMemo(() => {
    const capabilities = getTierCapabilities(status);
    const tier = capabilities.tier;
    const bvnVerified = status?.bvn_verified ?? false;
    const ninVerified = status?.nin_verified ?? false;

    return {
      status,
      isLoading,
      refetch,
      capabilities,
      tier,
      tierName: status?.kyc_tier_name,
      bvnVerified,
      ninVerified,
      /** Next step to reach the named NGN account (Tier 2). */
      ngnNextStep: (capabilities.can_receive_ngn ? null : 'NGN_BVN_NIN') as TierNextStep,
      /** Next step to reach USD / cards / investing (Tier 3). */
      advancedNextStep: (capabilities.can_use_card ? null : 'BRIDGE_KYC') as TierNextStep,
    };
  }, [status, isLoading, refetch]);
}

export function useStartDiditSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StartDiditSessionRequest) => kycService.startDiditSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.kycStatus() });
    },
  });
}

export function useSubmitKYC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmitKYCRequest) => kycService.submitKYC(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.kycStatus() });
    },
  });
}

const TERMINAL_STATUSES: KycStatus[] = ['approved', 'rejected', 'expired'];
// Verification-status poll (active only while the user is on the KYC screen).
// Push notifications drive the real completion signal, so these are fallbacks —
// kept modest to limit Redis cost during the wait.
const FAST_INTERVAL = 12_000;
const SLOW_INTERVAL = 45_000;
const SLOW_THRESHOLD = 2 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Polls /kyc/status with adaptive interval:
 * - 8s for first 2 minutes
 * - 30s after that
 * Stops on terminal status or when disabled.
 */
export function useKycStatusPolling(
  enabled: boolean,
  onTerminal?: (status: KycStatus) => void,
  opts?: {
    timeoutMs?: number;
    onTimeout?: () => void;
    resetKey?: number;
  }
) {
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const onTimeout = opts?.onTimeout;
  const resetKey = opts?.resetKey ?? 0;
  const startedAt = useRef(Date.now());
  const timedOutRef = useRef(false);
  const terminalStateRef = useRef<KycStatus | null>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Reset timer when polling starts/restarts
  useEffect(() => {
    if (!enabled) return;
    startedAt.current = Date.now();
    timedOutRef.current = false;
  }, [enabled, resetKey]);

  // Auto-timeout polling and switch to manual refresh UX.
  useEffect(() => {
    if (!enabled || timeoutMs <= 0) return;

    const timerId = setTimeout(() => {
      timedOutRef.current = true;
      onTimeout?.();
    }, timeoutMs);

    return () => clearTimeout(timerId);
  }, [enabled, timeoutMs, onTimeout, resetKey]);

  const getInterval = useCallback((): number | false => {
    if (!enabled || timedOutRef.current) return false;
    const elapsed = Date.now() - startedAt.current;
    return elapsed > SLOW_THRESHOLD ? SLOW_INTERVAL : FAST_INTERVAL;
  }, [enabled]);

  const query = useQuery({
    queryKey: queryKeys.user.kycStatus(),
    queryFn: () => kycService.getKYCStatus(),
    enabled: isAuthenticated && enabled,
    refetchInterval: getInterval,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });

  useEffect(() => {
    const status = query.data?.status;
    if (!status) return;

    if (TERMINAL_STATUSES.includes(status)) {
      if (terminalStateRef.current !== status) {
        terminalStateRef.current = status;
        onTerminal?.(status);
      }
      return;
    }

    // Reset guard once status returns to non-terminal.
    terminalStateRef.current = null;
  }, [query.data?.status, onTerminal]);

  return query;
}

// Legacy hook — kept for backward compat
export function useBridgeKYCLink(enabled = true) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.user.kycBridgeLink(),
    queryFn: () => kycService.getBridgeKYCLink(),
    enabled: isAuthenticated && enabled,
    staleTime: 60 * 1000,
  });
}
