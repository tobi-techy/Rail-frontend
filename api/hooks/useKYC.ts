import { useQuery } from '@tanstack/react-query';
import { kycService } from '../services';
import { queryKeys } from '../queryClient';
import { useAuthStore } from '../../stores/authStore';

export function useBridgeKYCLink(enabled: boolean = true) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.user.kycBridgeLink(),
    queryFn: () => kycService.getBridgeKYCLink(),
    enabled: isAuthenticated && enabled,
    staleTime: 60 * 1000,
  });
}

export function useKYCStatus(enabled = true) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.user.kycStatus(),
    queryFn: () => kycService.getKYCStatus(),
    enabled: isAuthenticated && enabled,
    staleTime: 30 * 1000,
  });
}
