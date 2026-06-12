import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { roundupService } from '../services/roundup.service';
import { useAuthStore } from '../../stores/authStore';

const KEY = ['roundups', 'settings'];

export function useRoundupSettings() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: KEY,
    queryFn: () => roundupService.getSettings(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useUpdateRoundupSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => roundupService.updateSettings({ enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
