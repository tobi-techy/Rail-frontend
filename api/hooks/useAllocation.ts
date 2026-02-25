import { useMutation, useQuery } from '@tanstack/react-query';
import { allocationService } from '../services';
import { queryClient, queryKeys } from '../queryClient';
import { useAuthStore } from '../../stores/authStore';
import type { EnableAllocationModeRequest } from '../types';

/**
 * Get allocation balances (spending, stash, invest splits)
 *
 * Optimized for fast UX:
 * - 20s stale time (more aggressive than before)
 * - 50s refetch interval (background updates)
 * - Refetch on window focus and reconnect (keep fresh on app open)
 */
export function useAllocationBalances() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.allocation.balances(),
    queryFn: () => allocationService.getBalances(),
    enabled: isAuthenticated,
    staleTime: 20 * 1000, // 20 seconds - balance-critical, refresh often
    refetchInterval: 50 * 1000, // Refetch every 50 seconds
    refetchOnWindowFocus: true, // Update when app comes to foreground
    refetchOnReconnect: true, // Update when network restored
  });
}

export function useEnableAllocationMode() {
  return useMutation({
    mutationFn: (payload: EnableAllocationModeRequest) => allocationService.enableMode(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allocation.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.station.all });
    },
  });
}

export function useDisableAllocationMode() {
  return useMutation({
    mutationFn: () => allocationService.disableMode(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allocation.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.station.all });
    },
  });
}
