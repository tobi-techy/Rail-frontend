import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../queryClient';
import { investmentService } from '../services/investment.service';
import type { InvestmentPeriod, InvestmentTransactionsParams } from '../types/investment';
import { useAuthStore } from '../../stores/authStore';

export function useInvestmentStash() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.investment.stash(),
    queryFn: () => investmentService.getInvestmentStash(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useInvestmentPositions(params?: { page?: number; page_size?: number }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.investment.positions(params),
    queryFn: () => investmentService.getInvestmentPositions(params),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useInvestmentDistribution(limit = 10) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.investment.distribution(limit),
    queryFn: () => investmentService.getInvestmentDistribution(limit),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useInvestmentTransactions(params?: InvestmentTransactionsParams) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const safeParams: InvestmentTransactionsParams = {
    limit: params?.limit ?? 20,
    offset: params?.offset ?? 0,
    side: params?.side ?? 'all',
    ...(params?.status ? { status: params.status } : {}),
  };

  return useQuery({
    queryKey: queryKeys.investment.transactions(safeParams),
    queryFn: () => investmentService.getInvestmentTransactions(safeParams),
    enabled: isAuthenticated,
    staleTime: 20 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useInvestmentPerformance(period: InvestmentPeriod = '1W') {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.investment.performance(period),
    queryFn: () => investmentService.getInvestmentPerformance(period),
    enabled: isAuthenticated,
    staleTime: 20 * 1000,
    refetchOnWindowFocus: true,
  });
}
