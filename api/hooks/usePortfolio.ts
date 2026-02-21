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
 * Optimizations for fast UX:
 * - 15s stale time (aggressive refresh for balance-critical data)
 * - 50s automatic refetch (more frequent than before)
 * - Refetch on window focus (update when user opens app)
 * - Refetch on reconnect (update when connection restored)
 * - Shows cached data immediately (no zero/loading flash)
 *
 * Note: If endpoint returns 404, it means the backend hasn't implemented
 * the portfolio endpoint yet. The UI will show placeholder values.
 */
export function usePortfolioOverview() {
  return useQuery({
    queryKey: queryKeys.portfolio.overview(),
    queryFn: () => portfolioService.getPortfolioOverview(),
    staleTime: 15 * 1000, // 15 seconds - fast refresh for balance visibility
    refetchInterval: 50 * 1000, // Refetch every 50 seconds (more frequent)
    refetchOnWindowFocus: true, // Update when user brings app to foreground
    refetchOnReconnect: true, // Update when network connection restored
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
