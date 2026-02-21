import { useMutation, useQuery } from '@tanstack/react-query';
import { allocationService } from '../services';
import { queryClient, queryKeys } from '../queryClient';
import { useAuthStore } from '../../stores/authStore';
import type { EnableAllocationModeRequest } from '../types';

export function useAllocationBalances() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.allocation.balances(),
    queryFn: () => allocationService.getBalances(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
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
