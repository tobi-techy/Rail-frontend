import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../queryClient';
import { virtualAccountService } from '../services/virtualAccount.service';
import { useAuthStore } from '../../stores/authStore';

export function useVirtualAccounts(enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.virtualAccount.list(),
    queryFn: () => virtualAccountService.getVirtualAccounts(),
    enabled: isAuthenticated && enabled,
    staleTime: 5 * 60 * 1000,
  });
}
