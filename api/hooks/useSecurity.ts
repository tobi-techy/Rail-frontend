import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { securityService } from '../services/security.service';
import { useAuthStore } from '../../stores/authStore';
import type { AddWhitelistRequest, MFAChallengeRequest, MFAVerifyRequest } from '../types/security';

const securityKeys = {
  all: ['security'] as const,
  whitelist: () => [...securityKeys.all, 'whitelist'] as const,
};

export function useWhitelist() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: securityKeys.whitelist(),
    queryFn: () => securityService.getWhitelist(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useAddWhitelistAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: AddWhitelistRequest) => securityService.addWhitelistAddress(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: securityKeys.whitelist() });
    },
  });
}

export function useRemoveWhitelistAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => securityService.removeWhitelistAddress(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: securityKeys.whitelist() });
    },
  });
}

export function useRequestMFAChallenge() {
  return useMutation({
    mutationFn: (req: MFAChallengeRequest) => securityService.requestMFAChallenge(req),
  });
}

export function useVerifyMFAChallenge() {
  return useMutation({
    mutationFn: (req: MFAVerifyRequest) => securityService.verifyMFAChallenge(req),
  });
}
