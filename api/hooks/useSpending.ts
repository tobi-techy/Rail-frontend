import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../queryClient';
import { spendingService } from '../services/spending.service';
import { useAuthStore } from '../../stores/authStore';

export function useSpendingStash() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.spending.stash(),
    queryFn: () => spendingService.getSpendingStash(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}
