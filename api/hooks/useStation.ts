/**
 * Station Hooks
 * React Query hook for home screen data
 */

import { useQuery } from '@tanstack/react-query';
import { stationService } from '../services/station.service';
import { queryKeys } from '../queryClient';

/**
 * Get station (home screen) data: balances, trends, recent activity, alerts.
 *
 * - 30s stale time for balance-critical data
 * - 60s auto-refetch to keep data fresh
 */
export function useStation() {
  return useQuery({
    queryKey: queryKeys.station.home(),
    queryFn: () => stationService.getStation(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      const code = error?.error?.code;
      if (code === 'HTTP_401' || code === 'HTTP_404') return false;
      return failureCount < 1;
    },
  });
}
