import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fundingService } from '../services';
import { queryKeys } from '../queryClient';
import { useAuthStore } from '../../stores/authStore';
import type { InitiateWithdrawalRequest, InitiateFiatWithdrawalRequest } from '../types';

export function useDeposits(limit = 20, offset = 0) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.funding.transactions({ limit, offset, type: 'deposits' }),
    queryFn: () => fundingService.getDeposits(limit, offset),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useWithdrawals(limit = 20, offset = 0) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.funding.transactions({ limit, offset, type: 'withdrawals' }),
    queryFn: () => fundingService.getWithdrawals(limit, offset),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

// Crypto withdrawal (USDC to external Solana wallet)
export function useInitiateWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: InitiateWithdrawalRequest) => fundingService.initiateWithdrawal(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funding'] });
    },
  });
}

// Fiat withdrawal (USDC to bank account)
export function useInitiateFiatWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: InitiateFiatWithdrawalRequest) => fundingService.initiateFiatWithdrawal(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funding'] });
    },
  });
}
