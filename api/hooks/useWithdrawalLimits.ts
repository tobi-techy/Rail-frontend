import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../queryClient';
import apiClient from '../client';
import { useAuthStore } from '../../stores/authStore';
import { WITHDRAWAL_LIMITS } from '@/lib/constants';

interface WithdrawalLimitsResponse {
  daily_limit: number;
  daily_used: number;
  withdrawals_today: number;
  max_withdrawals_per_day: number;
}

async function fetchWithdrawalLimits(): Promise<WithdrawalLimitsResponse> {
  return apiClient.get<WithdrawalLimitsResponse>('/v1/limits/withdrawals');
}

export function useWithdrawalLimits() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: [...queryKeys.funding.all, 'withdrawal-limits'] as const,
    queryFn: fetchWithdrawalLimits,
    enabled: isAuthenticated,
    staleTime: 60_000,
    retry: false,
    // Fallback to hardcoded limits if endpoint doesn't exist yet
    placeholderData: {
      daily_limit: WITHDRAWAL_LIMITS.dailyMaxNew,
      daily_used: 0,
      withdrawals_today: 0,
      max_withdrawals_per_day: WITHDRAWAL_LIMITS.maxPerDay,
    },
  });
}
