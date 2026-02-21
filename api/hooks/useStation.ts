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
 * Optimized for fast UX:
 * - 10s stale time (very aggressive for balance visibility)
 * - 40s auto-refetch (more frequent than before)
 * - Refetch on window focus (update when user opens app)
 * - Refetch on reconnect (update when connection restored)
 * - Shows cached balance immediately on load (no zero flash)
 */
export function useStation() {
  return useQuery({
    queryKey: queryKeys.station.home(),
    queryFn: () => stationService.getStation(),
    staleTime: 10 * 1000, // 10 seconds - aggressive cache for balance visibility
    refetchInterval: 40 * 1000, // Refetch every 40 seconds (more frequent)
    refetchOnWindowFocus: true, // Update when user brings app to foreground
    refetchOnReconnect: true, // Update when network connection restored
    retry: (failureCount, error: any) => {
      const code = error?.error?.code;
      if (code === 'HTTP_401' || code === 'HTTP_404') return false;
      return failureCount < 1;
    },
  });
}
