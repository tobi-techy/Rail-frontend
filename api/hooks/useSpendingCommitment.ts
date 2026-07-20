/**
 * Daily Spending Limit (commitment device) hooks.
 *
 * Read the current cap + today's usage, and mutate it. Raising the cap or
 * turning it off is fee-gated by the server (409 → confirm → retry). The
 * mutations resolve to a discriminated result so screens can branch on
 * needsFeeConfirm / insufficientFunds without try/catch.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { spendingCommitmentService } from '../services/spendingCommitment.service';
import { queryKeys } from '../queryClient';
import type { CommitmentMutationResult, CommitmentStatus } from '../types/spendingCommitment';
import { useAuthStore } from '../../stores/authStore';

export function useSpendingCommitment() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<CommitmentStatus>({
    queryKey: queryKeys.spendingCommitment.status(),
    queryFn: () => spendingCommitmentService.get(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useSetSpendingCommitment() {
  const queryClient = useQueryClient();
  return useMutation<CommitmentMutationResult, unknown, { cents: number; confirmFee?: boolean }>({
    mutationFn: ({ cents, confirmFee }) => spendingCommitmentService.set(cents, confirmFee),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.setQueryData(queryKeys.spendingCommitment.status(), result.status);
      }
    },
  });
}

export function useClearSpendingCommitment() {
  const queryClient = useQueryClient();
  return useMutation<CommitmentMutationResult, unknown, { confirmFee: boolean }>({
    mutationFn: ({ confirmFee }) => spendingCommitmentService.clear(confirmFee),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.setQueryData(queryKeys.spendingCommitment.status(), result.status);
      }
    },
  });
}
