import { useMutation, useQuery } from '@tanstack/react-query';
import { p2pService } from '../services/p2p.service';
import type { P2PTransfer } from '../services/p2p.service';

export function useP2PTransfers() {
  return useQuery({
    queryKey: ['p2p', 'transfers'],
    queryFn: () => p2pService.getTransfers(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useSetRailTag() {
  return useMutation({
    mutationFn: (railTag: string) => p2pService.setRailTag(railTag),
  });
}

export function useCheckRailTag() {
  return useMutation({
    mutationFn: (railTag: string) => p2pService.checkRailTag(railTag),
  });
}
