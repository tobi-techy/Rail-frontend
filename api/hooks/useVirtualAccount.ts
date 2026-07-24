import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export function useCreateVirtualAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (currency: 'USD' | 'EUR' | 'GBP' | 'NGN') =>
      virtualAccountService.createVirtualAccount(currency),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.virtualAccount.list() });
    },
  });
}

export function useNgnVirtualAccount(enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const query = useQuery({
    queryKey: queryKeys.virtualAccount.ngn(),
    queryFn: () => virtualAccountService.getNgnVirtualAccount(),
    enabled: isAuthenticated && enabled,
    staleTime: 30 * 1000,
    // Poll every 5s while the account is pending (provisioning in-flight).
    // Once active/failed/closed, stop polling (refetchInterval returns false).
    refetchInterval: (query) => {
      const status = query.state.data?.virtual_account?.status;
      if (status === 'pending') return 5_000;
      return false;
    },
  });
  return query;
}

export function useAutoProvisionNgn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => virtualAccountService.autoProvisionNgn(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.virtualAccount.ngn() });
      qc.invalidateQueries({ queryKey: queryKeys.user.kycStatus() });
    },
  });
}
