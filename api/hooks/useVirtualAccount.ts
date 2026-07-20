import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryClient';
import { virtualAccountService } from '../services/virtualAccount.service';
import { useAuthStore } from '../../stores/authStore';
import type { ProvisionNgnAccountRequest } from '../types/funding';

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
  return useQuery({
    queryKey: queryKeys.virtualAccount.ngn(),
    queryFn: () => virtualAccountService.getNgnVirtualAccount(),
    enabled: isAuthenticated && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProvisionNgnVirtualAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: ProvisionNgnAccountRequest) =>
      virtualAccountService.provisionNgnVirtualAccount(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.virtualAccount.ngn() });
      qc.invalidateQueries({ queryKey: queryKeys.user.kycStatus() });
    },
  });
}
