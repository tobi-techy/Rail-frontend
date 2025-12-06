/**
 * Portfolio Hooks
 * React Query hooks for portfolio operations with optimized caching
 */

import { useQuery } from '@tanstack/react-query';
import { portfolioService } from '../services/portfolio.service';
import { queryKeys } from '../queryClient';

/**
 * Get portfolio overview with balance, buying power, and performance
 * 
 * Optimizations:
 * - 30s stale time for balance-critical data
 * - 1min automatic refetch to keep data fresh
 * - Prevents unnecessary refetches on window focus
 * 
 * Note: If endpoint returns 404, it means the backend hasn't implemented
 * the portfolio endpoint yet. The UI will show placeholder values.
 */
export function usePortfolioOverview() {
  return useQuery({
    queryKey: queryKeys.portfolio.overview(),
    queryFn: () => portfolioService.getPortfolioOverview(),
    staleTime: 30 * 1000, // 30 seconds - balance data shouldn't be too stale
    refetchInterval: 60 * 1000, // Refetch every minute for fresh data
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    retry: (failureCount, error: any) => {
      const errorCode = error?.error?.code;
      // Don't retry on auth errors (401) or not found (404)
      if (errorCode === 'HTTP_401' || errorCode === 'HTTP_404') {
        return false;
      }
      // Retry once for other errors
      return failureCount < 1;
    },
  });
}
