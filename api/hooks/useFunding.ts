import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fundingService } from '../services';
import { queryKeys } from '../queryClient';
import { useAuthStore } from '../../stores/authStore';
import { toNumber } from '@/utils/market';
import type {
  InitiateWithdrawalRequest,
  InitiateFiatWithdrawalRequest,
  StationResponse,
} from '../types';

const toMoneyString = (value: number): string => Math.max(0, value).toFixed(2);

const applyOptimisticStationWithdrawal = (
  queryClient: ReturnType<typeof useQueryClient>,
  amount: number
) => {
  if (!Number.isFinite(amount) || amount <= 0) return;

  queryClient.setQueryData(queryKeys.station.home(), (prev: StationResponse | undefined) => {
    if (!prev) return prev;

    const nextSpendBalance = toNumber(prev.spend_balance) - amount;
    const nextTotalBalance = toNumber(prev.total_balance) - amount;
    const nextPendingAmount = toNumber(prev.pending_amount) + amount;

    return {
      ...prev,
      spend_balance: toMoneyString(nextSpendBalance),
      total_balance: toMoneyString(nextTotalBalance),
      pending_amount: toMoneyString(nextPendingAmount),
      pending_transactions_count: Math.max(0, (prev.pending_transactions_count ?? 0) + 1),
    };
  });
};

async function refreshPostWithdrawalQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.funding.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.station.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.allocation.all }),
  ]);

  await Promise.all([
    queryClient.refetchQueries({ queryKey: queryKeys.station.home(), type: 'active' }),
    queryClient.refetchQueries({ queryKey: queryKeys.funding.all, type: 'active' }),
    queryClient.refetchQueries({ queryKey: queryKeys.wallet.all, type: 'active' }),
  ]);
}

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
    onSuccess: async (_data, variables) => {
      applyOptimisticStationWithdrawal(queryClient, Number(variables?.amount || 0));
      await refreshPostWithdrawalQueries(queryClient);
    },
  });
}

// Fiat withdrawal (USDC to bank account)
export function useInitiateFiatWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: InitiateFiatWithdrawalRequest) => fundingService.initiateFiatWithdrawal(req),
    onSuccess: async (_data, variables) => {
      applyOptimisticStationWithdrawal(queryClient, Number(variables?.amount || 0));
      await refreshPostWithdrawalQueries(queryClient);
    },
  });
}
